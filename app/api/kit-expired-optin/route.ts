import { NextResponse } from "next/server";

const NOTION_VERSION = "2022-06-28";
const KIT_API_BASE = "https://api.kit.com/v4";

type KitSubscriber = {
  id: number;
  first_name?: string | null;
  email_address: string;
  state?: string;
  created_at?: string;
  fields?: Record<string, string | null | undefined>;
};

type KitWebhookPayload = {
  subscriber?: KitSubscriber;
};

type KitFormSubscription = KitSubscriber & {
  added_at?: string;
  referrer?: string | null;
};

function normalizedField(
  fields: Record<string, string | null | undefined> | undefined,
  aliases: string[]
): string | null {
  if (!fields) return null;

  const normalizedAliases = aliases.map((key) => key.toLowerCase().replace(/[^a-z0-9]/g, ""));
  for (const [key, value] of Object.entries(fields)) {
    if (!value) continue;
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normalizedAliases.includes(normalizedKey)) return value.trim();
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

function appendComplianceNote(existing: string, note: string): string {
  const combined = [existing.trim(), note.trim()].filter(Boolean).join("\n\n");
  // Notion limits a single text object to 2,000 characters. Preserve the newest
  // opt-in evidence even if an old compliance note is already very long.
  return combined.length <= 2000 ? combined : combined.slice(combined.length - 2000);
}

async function verifyKitSubscription(
  subscriber: KitSubscriber,
  apiKey: string,
  formId: string
): Promise<KitFormSubscription | null> {
  const subscriberRes = await fetch(`${KIT_API_BASE}/subscribers/${subscriber.id}`, {
    headers: { "X-Kit-Api-Key": apiKey },
    cache: "no-store",
  });

  if (!subscriberRes.ok) return null;
  const subscriberData = await subscriberRes.json();
  const verified = subscriberData?.subscriber as KitSubscriber | undefined;
  if (!verified || verified.email_address?.toLowerCase() !== subscriber.email_address.toLowerCase()) {
    return null;
  }

  // Kit's webhook payload does not include the triggering form id and its v3
  // webhook docs do not document a request signature. Verify that this exact
  // subscriber was actually added to the configured report form recently.
  const addedAfter = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const formUrl = new URL(`${KIT_API_BASE}/forms/${formId}/subscribers`);
  formUrl.searchParams.set("status", "all");
  formUrl.searchParams.set("per_page", "1000");
  formUrl.searchParams.set("added_after", addedAfter);

  const formRes = await fetch(formUrl, {
    headers: { "X-Kit-Api-Key": apiKey },
    cache: "no-store",
  });
  if (!formRes.ok) return null;

  const formData = await formRes.json();
  const subscriptions = (formData?.subscribers ?? []) as KitFormSubscription[];
  return subscriptions.find((item) => item.id === subscriber.id) ?? null;
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const expectedToken = process.env.KIT_EXPIRED_WEBHOOK_TOKEN;
  const suppliedToken = requestUrl.searchParams.get("token");

  if (!expectedToken || !suppliedToken || suppliedToken !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized webhook." }, { status: 401 });
  }

  const kitApiKey = process.env.KIT_API_KEY;
  const formId = process.env.KIT_EXPIRED_FORM_ID;
  const notionApiKey = process.env.NOTION_API_KEY;
  const notionDatabaseId = process.env.NOTION_LEADS_DATABASE_ID;

  if (!kitApiKey || !formId || !notionApiKey || !notionDatabaseId) {
    return NextResponse.json(
      { error: "Kit/Notion inbound integration is not fully configured." },
      { status: 500 }
    );
  }

  let payload: KitWebhookPayload;
  try {
    payload = (await request.json()) as KitWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const subscriber = payload.subscriber;
  if (!subscriber?.id || !subscriber.email_address) {
    return NextResponse.json({ error: "Missing Kit subscriber." }, { status: 400 });
  }

  const verifiedSubscription = await verifyKitSubscription(subscriber, kitApiKey, formId);
  if (!verifiedSubscription) {
    return NextResponse.json(
      { error: "Subscriber could not be verified against the configured Kit form." },
      { status: 401 }
    );
  }

  const fields = {
    ...(subscriber.fields ?? {}),
    ...(verifiedSubscription.fields ?? {}),
  };
  const propertyAddress = normalizedField(fields, [
    "Property Address",
    "property_address",
    "Expired Property Address",
  ]);
  const phone = normalizedField(fields, ["Phone", "Phone Number", "phone_number"]);
  const phoneTextPermission = isAffirmative(
    normalizedField(fields, [
      "Phone/Text Follow-Up Permission",
      "phone_text_follow_up_permission",
      "Phone Follow-Up Permission",
    ])
  );

  const now = new Date().toISOString();
  const optedInAt = verifiedSubscription.added_at ?? subscriber.created_at ?? now;
  const referrer = verifiedSubscription.referrer ?? "Kit landing page";
  const consentScope = phoneTextPermission
    ? "email + phone/text follow-up explicitly captured"
    : "email follow-up for the requested report; no phone/text permission inferred";
  const inboundNote = [
    `Inbound opt-in: Expired Listing Private Property Analysis Report (Kit form ${formId}).`,
    `Kit subscriber ${subscriber.id}; form added at ${optedInAt}; webhook received ${now}.`,
    `Consent scope: ${consentScope}.`,
    propertyAddress ? `Submitted property: ${propertyAddress}.` : null,
    phone ? `Submitted phone: ${phone}.` : null,
    `Referrer: ${referrer}.`,
  ]
    .filter(Boolean)
    .join(" ");

  const notionHeaders = {
    Authorization: `Bearer ${notionApiKey}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };

  // Email is the safest deterministic dedupe key for an inbound Kit subscriber.
  // Do not auto-merge by property address; an address can legitimately have
  // multiple decision-makers and the existing portal intentionally avoids
  // guessing identity from address alone.
  const queryRes = await fetch(
    `https://api.notion.com/v1/databases/${notionDatabaseId}/query`,
    {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({
        filter: { property: "Email", email: { equals: subscriber.email_address } },
        page_size: 10,
      }),
    }
  );
  const queryData = await queryRes.json();
  if (!queryRes.ok) {
    return NextResponse.json(
      { error: queryData?.message ?? "Notion lookup failed." },
      { status: queryRes.status }
    );
  }

  const existingPage = queryData.results?.[0];
  const desiredChannels = new Set<string>(["Email"]);
  if (phone && phoneTextPermission) {
    desiredChannels.add("Call");
    desiredChannels.add("Text");
  }

  if (existingPage) {
    const existingChannels =
      existingPage.properties?.["Prospecting Channel"]?.multi_select?.map(
        (option: { name: string }) => option.name
      ) ?? [];
    for (const channel of existingChannels) desiredChannels.add(channel);

    const existingCompliance =
      existingPage.properties?.["Compliance Notes"]?.rich_text
        ?.map((part: { plain_text?: string }) => part.plain_text ?? "")
        .join("") ?? "";

    const properties: Record<string, unknown> = {
      "Permission to Follow Up": { select: { name: "Yes" } },
      "Prospecting Channel": {
        multi_select: Array.from(desiredChannels).map((name) => ({ name })),
      },
      "Compliance Notes": richText(appendComplianceNote(existingCompliance, inboundNote)),
    };

    const currentPhone = existingPage.properties?.Phone?.phone_number;
    const currentAddress = existingPage.properties?.Address?.rich_text
      ?.map((part: { plain_text?: string }) => part.plain_text ?? "")
      .join("");
    if (phone && !currentPhone) properties.Phone = { phone_number: phone };
    if (propertyAddress && !currentAddress) properties.Address = richText(propertyAddress);

    const updateRes = await fetch(`https://api.notion.com/v1/pages/${existingPage.id}`, {
      method: "PATCH",
      headers: notionHeaders,
      body: JSON.stringify({ properties }),
    });
    const updateData = await updateRes.json();
    if (!updateRes.ok) {
      return NextResponse.json(
        { error: updateData?.message ?? "Notion update failed." },
        { status: updateRes.status }
      );
    }

    return NextResponse.json({ ok: true, action: "updated", url: updateData.url });
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
      multi_select: Array.from(desiredChannels).map((channel) => ({ name: channel })),
    },
    "Compliance Notes": richText(inboundNote),
  };
  if (propertyAddress) createProperties.Address = richText(propertyAddress);
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
  if (!createRes.ok) {
    return NextResponse.json(
      { error: createData?.message ?? "Notion create failed." },
      { status: createRes.status }
    );
  }

  return NextResponse.json({ ok: true, action: "created", url: createData.url });
}
