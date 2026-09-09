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

function richText(content: string) {
  return { rich_text: [{ text: { content: content.slice(0, 2000) } }] };
}

function plainText(property: any): string {
  return property?.rich_text?.map((part: any) => part.plain_text ?? "").join("") ?? "";
}

function appendComplianceNote(existing: string, note: string): string {
  const combined = [existing.trim(), note.trim()].filter(Boolean).join("\n\n");
  // Preserve the newest event evidence if older notes have already reached
  // Notion's 2,000-character limit for a single rich-text value.
  return combined.length <= 2000 ? combined : combined.slice(combined.length - 2000);
}

function pendingMarker(formId: string, subscriberId: number) {
  return `Pending Kit expired-report request | form ${formId} | subscriber ${subscriberId}`;
}

function confirmedMarker(formId: string, subscriberId: number) {
  return `Confirmed Kit expired-report request | form ${formId} | subscriber ${subscriberId}`;
}

function submittedAddresses(subscriber: KitSubscriber) {
  const fields = subscriber.fields ?? {};
  return {
    propertyAddress: normalizedField(fields, [
      "Property Address",
      "property_address",
      "Expired Property Address",
    ]),
    mailingAddress: normalizedField(fields, [
      "Mailing Address",
      "mailing_address",
      "Send Report To",
      "Report Mailing Address",
    ]),
  };
}

function notionHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

async function findCrmPageByEmail(
  email: string,
  notionApiKey: string,
  notionDatabaseId: string
): Promise<any | null> {
  const queryRes = await fetch(`https://api.notion.com/v1/databases/${notionDatabaseId}/query`, {
    method: "POST",
    headers: notionHeaders(notionApiKey),
    body: JSON.stringify({
      filter: { property: "Email", email: { equals: email } },
      page_size: 10,
    }),
  });
  const queryData = await queryRes.json();
  if (!queryRes.ok) throw new Error(queryData?.message ?? "Notion lookup failed.");
  return queryData.results?.[0] ?? null;
}

async function recordPendingRequest(
  event: KitEvent,
  subscriber: KitSubscriber,
  form: KitForm,
  expectedFormId: string,
  notionApiKey: string,
  notionDatabaseId: string
) {
  const existingPage = await findCrmPageByEmail(
    subscriber.email_address,
    notionApiKey,
    notionDatabaseId
  );
  const marker = pendingMarker(expectedFormId, subscriber.id);
  const pendingNote = [
    `${marker}.`,
    `Kit form event ${event.id}; form ${form.id}${form.name ? ` (${form.name})` : ""}; event ${event.created}.`,
    `Subscriber state: ${subscriber.state ?? "unknown"}.`,
    "UNCONFIRMED — do not contact and do not fulfill the physical report yet.",
  ].join(" ");

  if (existingPage) {
    const existingCompliance = plainText(existingPage.properties?.["Compliance Notes"]);
    if (existingCompliance.includes(`Kit form event ${event.id};`)) {
      return { skipped: true, reason: "duplicate_pending_event", url: existingPage.url };
    }

    const updateRes = await fetch(`https://api.notion.com/v1/pages/${existingPage.id}`, {
      method: "PATCH",
      headers: notionHeaders(notionApiKey),
      body: JSON.stringify({
        properties: {
          "Compliance Notes": richText(appendComplianceNote(existingCompliance, pendingNote)),
        },
      }),
    });
    const updateData = await updateRes.json();
    if (!updateRes.ok) throw new Error(updateData?.message ?? "Notion pending update failed.");
    return { action: "pending_existing", url: updateData.url };
  }

  // A brand-new unconfirmed signup is kept out of active work queues. It exists
  // only as the durable correlation record needed for subscriber.activated.
  const name = subscriber.first_name?.trim() || subscriber.email_address.split("@")[0];
  const createRes = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: notionHeaders(notionApiKey),
    body: JSON.stringify({
      parent: { type: "database_id", database_id: notionDatabaseId },
      properties: {
        Name: { title: [{ text: { content: name } }] },
        Email: { email: subscriber.email_address },
        Source: { select: { name: "Website" } },
        "Lead Type": { select: { name: "Expired Listing" } },
        "Service Need": { select: { name: "Expired Seller" } },
        "Pipeline Stage": { select: { name: "Archived" } },
        "Permission to Follow Up": { select: { name: "Unknown" } },
        "Compliance Notes": richText(pendingNote),
      },
    }),
  });
  const createData = await createRes.json();
  if (!createRes.ok) throw new Error(createData?.message ?? "Notion pending create failed.");

  return { action: "pending_created", url: createData.url };
}

async function finalizeConfirmedRequest(
  event: KitEvent,
  subscriber: KitSubscriber,
  expectedFormId: string,
  notionApiKey: string,
  notionDatabaseId: string,
  options: { requirePending: boolean; form?: KitForm }
) {
  const existingPage = await findCrmPageByEmail(
    subscriber.email_address,
    notionApiKey,
    notionDatabaseId
  );
  const pending = pendingMarker(expectedFormId, subscriber.id);
  const confirmed = confirmedMarker(expectedFormId, subscriber.id);

  if (options.requirePending) {
    if (!existingPage) return { skipped: true, reason: "activation_without_pending_request" };
    const existingCompliance = plainText(existingPage.properties?.["Compliance Notes"]);
    if (!existingCompliance.includes(pending)) {
      return { skipped: true, reason: "activation_unrelated_to_report_form", url: existingPage.url };
    }
  }

  const { propertyAddress, mailingAddress } = submittedAddresses(subscriber);
  const requestedRouting = propertyAddress ? "Queued" : "Exception";
  const confirmationNote = [
    `${confirmed}.`,
    `Kit confirmation event ${event.id}; event ${event.created}.`,
    options.form
      ? `Confirmed/active while joining form ${options.form.id}${options.form.name ? ` (${options.form.name})` : ""}.`
      : "Subscriber transitioned to active after double opt-in confirmation.",
    "Consent scope from this launch form: Email + requested physical mail fulfillment only; no phone/text permission is collected by this form.",
    "Fulfillment requested: personalized physical report kit by mail.",
    propertyAddress
      ? `Submitted property: ${propertyAddress}.`
      : "Property address missing — fulfillment needs manual resolution.",
    mailingAddress
      ? `Submitted mailing address: ${mailingAddress}.`
      : "No separate mailing address supplied — verify where to send before fulfillment.",
  ]
    .filter(Boolean)
    .join(" ");

  if (existingPage) {
    const existingCompliance = plainText(existingPage.properties?.["Compliance Notes"]);
    if (existingCompliance.includes(confirmed)) {
      return { skipped: true, reason: "request_already_confirmed", url: existingPage.url };
    }

    const desiredChannels = new Set<string>(["Email", "Direct Mail"]);
    const existingChannels =
      existingPage.properties?.["Prospecting Channel"]?.multi_select?.map(
        (option: { name: string }) => option.name
      ) ?? [];
    for (const channel of existingChannels) desiredChannels.add(channel);

    const currentAddress = plainText(existingPage.properties?.Address);
    const currentMailingAddress = plainText(existingPage.properties?.["Mailing Address"]);
    const currentRouting = existingPage.properties?.["Mailing Kit Routing"]?.select?.name;
    const currentRoutedAt = existingPage.properties?.["Mailing Kit Routed At"]?.date?.start;
    const currentPipeline = existingPage.properties?.["Pipeline Stage"]?.select?.name;

    const properties: Record<string, unknown> = {
      "Permission to Follow Up": { select: { name: "Yes" } },
      "Prospecting Channel": {
        multi_select: Array.from(desiredChannels).map((name) => ({ name })),
      },
      "Compliance Notes": richText(appendComplianceNote(existingCompliance, confirmationNote)),
    };

    // A fresh confirmed inbound request reopens an archived relationship, but
    // otherwise never overwrites the user's live pipeline stage.
    if (currentPipeline === "Archived") {
      properties["Pipeline Stage"] = { select: { name: "New" } };
    }
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
      headers: notionHeaders(notionApiKey),
      body: JSON.stringify({ properties }),
    });
    const updateData = await updateRes.json();
    if (!updateRes.ok) throw new Error(updateData?.message ?? "Notion confirmed update failed.");

    return { action: "confirmed_updated", url: updateData.url, fulfillment: requestedRouting };
  }

  // This path is for an already-active Kit subscriber who submits the report
  // form. Their email is already confirmed, so no pending CRM row is necessary.
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
      multi_select: [{ name: "Email" }, { name: "Direct Mail" }],
    },
    "Mailing Kit Routing": { select: { name: requestedRouting } },
    "Mailing Kit Routed At": { date: { start: event.created } },
    "Compliance Notes": richText(confirmationNote),
  };
  if (propertyAddress) createProperties.Address = richText(propertyAddress);
  if (mailingAddress) createProperties["Mailing Address"] = richText(mailingAddress);

  const createRes = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: notionHeaders(notionApiKey),
    body: JSON.stringify({
      parent: { type: "database_id", database_id: notionDatabaseId },
      properties: createProperties,
    }),
  });
  const createData = await createRes.json();
  if (!createRes.ok) throw new Error(createData?.message ?? "Notion confirmed create failed.");

  return { action: "confirmed_created", url: createData.url, fulfillment: requestedRouting };
}

async function processEvent(
  event: KitEvent,
  expectedFormId: string,
  notionApiKey: string,
  notionDatabaseId: string
) {
  const subscriber = event.data?.subscriber;
  if (!subscriber?.id || !subscriber.email_address) {
    return { skipped: true, reason: "malformed_subscriber_event" };
  }

  if (event.type === "subscriber.subscribed_to_form") {
    const form = event.data?.form;
    if (!form?.id) return { skipped: true, reason: "missing_form" };
    if (String(form.id) !== expectedFormId) {
      return { skipped: true, reason: "different_form" };
    }

    // For an already-active subscriber, the address is already confirmed and
    // the form submission itself is an explicit report request. New double-
    // opt-in signups arrive inactive and are held until subscriber.activated.
    if (subscriber.state === "active") {
      return finalizeConfirmedRequest(
        event,
        subscriber,
        expectedFormId,
        notionApiKey,
        notionDatabaseId,
        { requirePending: false, form }
      );
    }

    return recordPendingRequest(
      event,
      subscriber,
      form,
      expectedFormId,
      notionApiKey,
      notionDatabaseId
    );
  }

  if (event.type === "subscriber.activated") {
    if (subscriber.state !== "active") {
      return { skipped: true, reason: "activation_event_not_active" };
    }
    return finalizeConfirmedRequest(
      event,
      subscriber,
      expectedFormId,
      notionApiKey,
      notionDatabaseId,
      { requirePending: true }
    );
  }

  return { skipped: true, reason: "unrelated_event" };
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
      results.push(await processEvent(event, expectedFormId, notionApiKey, notionDatabaseId));
    }
    return NextResponse.json({ ok: true, delivery_id: delivery.delivery_id, results });
  } catch (error) {
    console.error("Kit expired opt-in webhook failed", error);
    return NextResponse.json({ error: "CRM handoff failed." }, { status: 500 });
  }
}
