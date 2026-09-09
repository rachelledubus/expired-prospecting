import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

const NOTION_VERSION = "2022-06-28";
const SIGNATURE_TOLERANCE_SECONDS = 300;

type KitSubscriber = {
  id: number;
  first_name?: string | null;
  email_address: string;
  state?: string;
  created_at?: string;
  fields?: Record<string, string | null | undefined>;
};

type KitForm = {
  id: number;
  name?: string;
};

type KitEvent = {
  id: string;
  type: string;
  created: string;
  data?: {
    subscriber?: KitSubscriber;
    form?: KitForm;
  };
};

type KitDelivery = {
  delivery_id?: number;
  events?: KitEvent[];
};

function validKitSignature(rawBody: string, header: string | null, secret: string): boolean {
  const parts = (header ?? "").split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  if (!timestamp) return false;

  const signedAt = Number(timestamp);
  if (!Number.isFinite(signedAt)) return false;
  if (Math.abs(Date.now() / 1000 - signedAt) > SIGNATURE_TOLERANCE_SECONDS) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected);

  return parts
    .filter((part) => part.startsWith("v1="))
    .some((part) => {
      const candidateBuffer = Buffer.from(part.slice(3));
      return (
        candidateBuffer.length === expectedBuffer.length &&
        timingSafeEqual(candidateBuffer, expectedBuffer)
      );
    });
}

function normalizedField(
  fields: Record<string, string | null | undefined> | undefined,
  aliases: string[]
): string | null {
  if (!fields) return null;
  const wanted = aliases.map((key) => key.toLowerCase().replace(/[^a-z0-9]/g, ""));

  for (const [key, value] of Object.entries(fields)) {
    if (!value) continue;
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (wanted.includes(normalizedKey)) return value.trim();
  }
  return null;
}

function isAffirmative(value: string | null): boolean {
  if (!value) return false;
  return ["yes", "true", "1", "agreed", "agree", "consent", "consented"].includes(
    value.trim().toLowerCase()
  );
}

function richText(content: string) {
  return { rich_text: [{ text: { content: content.slice(0, 2000) } }] };
}

function plainText(property: any): string {
  return property?.rich_text?.map((part: any) => part.plain_text ?? "").join("") ?? "";
}

function appendComplianceNote(existing: string, note: string): string {
  const combined = [existing.trim(), note.trim()].filter(Boolean).join("\n\n");
  return combined.length <= 2000 ? combined : combined.slice(combined.length - 2000);
}

async function processOptInEvent(
  event: KitEvent,
  expectedFormId: string,
  notionApiKey: string,
  notionDatabaseId: string
) {
  if (event.type !== "subscriber.subscribed_to_form") {
    return { skipped: true, reason: "unrelated_event" };
  }

  const subscriber = event.data?.subscriber;
  const form = event.data?.form;
  if (!subscriber?.id || !subscriber.email_address || !form?.id) {
    return { skipped: true, reason: "malformed_event" };
  }
  if (String(form.id) !== expectedFormId) {
    return { skipped: true, reason: "different_form" };
  }

  const fields = subscriber.fields ?? {};
  const propertyAddress = normalizedField(fields, [
    "Property Address",
    "property_address",
    "Expired Property Address",
  ]);
  const mailingAddress = normalizedField(fields, [
    "Mailing Address",
    "mailing_address",
    "Send Report To",
    "Report Mailing Address",
  ]);
  const phone = normalizedField(fields, ["Phone", "Phone Number", "phone_number"]);
  const phoneTextPermission = isAffirmative(
    normalizedField(fields, [
      "Phone/Text Follow-Up Permission",
      "phone_text_follow_up_permission",
      "Phone Follow-Up Permission",
    ])
  );

  const consentScope = phoneTextPermission
    ? "email + requested physical mail fulfillment + phone/text follow-up explicitly captured"
    : "email + requested physical mail fulfillment; no phone/text permission inferred";
  const inboundNote = [
    `Kit opt-in event ${event.id}: Expired Listing Private Property Analysis Report.`,
    `Form ${form.id}${form.name ? ` (${form.name})` : ""}; subscriber ${subscriber.id}; event ${event.created}.`,
    `Consent scope: ${consentScope}.`,
    "Fulfillment requested: personalized physical report kit by mail.",
    propertyAddress ? `Submitted property: ${propertyAddress}.` : "Property address missing — fulfillment needs manual resolution.",
    mailingAddress
      ? `Submitted mailing address: ${mailingAddress}.`
      : "No separate mailing address supplied — verify where to send before fulfillment.",
    phone ? `Submitted phone: ${phone}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const notionHeaders = {
    Authorization: `Bearer ${notionApiKey}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };

  const queryRes = await fetch(`https://api.notion.com/v1/databases/${notionDatabaseId}/query`, {
    method: "POST",
    headers: notionHeaders,
    body: JSON.stringify({
      filter: { property: "Email", email: { equals: subscriber.email_address } },
      page_size: 10,
    }),
  });
  const queryData = await queryRes.json();
  if (!queryRes.ok) throw new Error(queryData?.message ?? "Notion lookup failed.");

  const existingPage = queryData.results?.[0];
  const desiredChannels = new Set<string>(["Email", "Direct Mail"]);
  if (phone && phoneTextPermission) {
    desiredChannels.add("Call");
    desiredChannels.add("Text");
  }

  const requestedRouting = propertyAddress ? "Queued" : "Exception";

  if (existingPage) {
    const existingCompliance = plainText(existingPage.properties?.["Compliance Notes"]);
    if (existingCompliance.includes(`Kit opt-in event ${event.id}:`)) {
      return { skipped: true, reason: "duplicate_event", url: existingPage.url };
    }

    const existingChannels =
      existingPage.properties?.["Prospecting Channel"]?.multi_select?.map(
        (option: { name: string }) => option.name
      ) ?? [];
    for (const channel of existingChannels) desiredChannels.add(channel);

    const properties: Record<string, unknown> = {
      "Permission to Follow Up": { select: { name: "Yes" } },
      "Prospecting Channel": {
        multi_select: Array.from(desiredChannels).map((name) => ({ name })),
      },
      "Compliance Notes": richText(appendComplianceNote(existingCompliance, inboundNote)),
    };

    const currentPhone = existingPage.properties?.Phone?.phone_number;
    const currentAddress = plainText(existingPage.properties?.Address);
    const currentMailingAddress = plainText(existingPage.properties?.["Mailing Address"]);
    const currentRouting = existingPage.properties?.["Mailing Kit Routing"]?.select?.name;
    const currentRoutedAt = existingPage.properties?.["Mailing Kit Routed At"]?.date?.start;

    if (phone && !currentPhone) properties.Phone = { phone_number: phone };
    if (propertyAddress && !currentAddress) properties.Address = richText(propertyAddress);
    if (mailingAddress && !currentMailingAddress) {
      properties["Mailing Address"] = richText(mailingAddress);
    }

    // Never downgrade a completed/suppressed/exception workflow. A fresh request
    // only opens the fulfillment queue when the record is not already in a
    // meaningful mailing state.
    if (!currentRouting || currentRouting === "Not Evaluated") {
      properties["Mailing Kit Routing"] = { select: { name: requestedRouting } };
      if (!currentRoutedAt) {
        properties["Mailing Kit Routed At"] = { date: { start: event.created } };
      }
    }

    const updateRes = await fetch(`https://api.notion.com/v1/pages/${existingPage.id}`, {
      method: "PATCH",
      headers: notionHeaders,
      body: JSON.stringify({ properties }),
    });
    const updateData = await updateRes.json();
    if (!updateRes.ok) throw new Error(updateData?.message ?? "Notion update failed.");

    return { action: "updated", url: updateData.url, fulfillment: requestedRouting };
  }

  const name = subscriber.first_name?.trim() || subscriber.email_address.split("@")[0];
  const createProperties: Record<string, unknown> = {
    Name: { title: [{ text: { content: name } }] },
    Email: { email: subscriber.email_address },
    Source: { select: { name: "Website" } },
    "Lead Type": { select: { name: "Expired Listing" } },
    "Service Need": { select: { name: "Expired Seller" } },
    "Pipeline Stage": { select: { name: "New" } },
    "Permission to Follow Up": { select: { name: "Yes" } },
    "Prospecting Channel": {
      multi_select: Array.from(desiredChannels).map((name) => ({ name })),
    },
    "Mailing Kit Routing": { select: { name: requestedRouting } },
    "Mailing Kit Routed At": { date: { start: event.created } },
    "Compliance Notes": richText(inboundNote),
  };
  if (propertyAddress) createProperties.Address = richText(propertyAddress);
  if (mailingAddress) createProperties["Mailing Address"] = richText(mailingAddress);
  if (phone) createProperties.Phone = { phone_number: phone };

  const createRes = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: notionHeaders,
    body: JSON.stringify({
      parent: { type: "database_id", database_id: notionDatabaseId },
      properties: createProperties,
    }),
  });
  const createData = await createRes.json();
  if (!createRes.ok) throw new Error(createData?.message ?? "Notion create failed.");

  return { action: "created", url: createData.url, fulfillment: requestedRouting };
}

export async function POST(request: Request) {
  const webhookSecret = process.env.KIT_EXPIRED_WEBHOOK_SECRET;
  const expectedFormId = process.env.KIT_EXPIRED_FORM_ID;
  const notionApiKey = process.env.NOTION_API_KEY;
  const notionDatabaseId = process.env.NOTION_LEADS_DATABASE_ID;

  if (!webhookSecret || !expectedFormId || !notionApiKey || !notionDatabaseId) {
    return NextResponse.json({ error: "Inbound opt-in integration is not configured." }, { status: 500 });
  }

  const rawBody = await request.text();
  if (!validKitSignature(rawBody, request.headers.get("X-Kit-Signature"), webhookSecret)) {
    return NextResponse.json({ error: "Invalid Kit signature." }, { status: 401 });
  }

  let delivery: KitDelivery;
  try {
    delivery = JSON.parse(rawBody) as KitDelivery;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  try {
    const results = [];
    for (const event of delivery.events ?? []) {
      results.push(
        await processOptInEvent(event, expectedFormId, notionApiKey, notionDatabaseId)
      );
    }
    return NextResponse.json({ ok: true, delivery_id: delivery.delivery_id, results });
  } catch (error) {
    console.error("Kit expired opt-in webhook failed", error);
    return NextResponse.json({ error: "CRM handoff failed." }, { status: 500 });
  }
}
