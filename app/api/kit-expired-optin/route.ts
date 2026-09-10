import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { ensureRequestedProperty } from "@/lib/propertyResearch";

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
  return combined.length <= 2000 ? combined : combined.slice(combined.length - 2000);
}

function pendingPrefix(formId: string, subscriberId: number) {
  return `Pending Kit expired-report request | form ${formId} | subscriber ${subscriberId}`;
}

function consumedPrefix(formId: string, subscriberId: number) {
  return `Consumed Kit expired-report request | form ${formId} | subscriber ${subscriberId}`;
}

function eventMarker(eventId: string) {
  return `Kit report event ${eventId}`;
}

function submittedAddresses(subscriber: KitSubscriber) {
  const fields = subscriber.fields ?? {};
  const propertyAddress = normalizedField(fields, [
    "Property Address",
    "property_address",
    "Expired Property Address",
  ]);
  const separateMailingAddress = normalizedField(fields, [
    "Mailing Address",
    "mailing_address",
    "Send Report To",
    "Report Mailing Address",
  ]);

  return {
    propertyAddress,
    separateMailingAddress,
    // The form label says "Mailing Address (if different from the property)".
    // Blank therefore intentionally means "send it to the property address."
    effectiveMailingAddress: separateMailingAddress || propertyAddress,
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

async function patchCrmPage(
  pageId: string,
  properties: Record<string, unknown>,
  notionApiKey: string
) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: notionHeaders(notionApiKey),
    body: JSON.stringify({ properties }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "Notion update failed.");
  return data;
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
  const marker = pendingPrefix(expectedFormId, subscriber.id);
  const pendingNote = [
    `${marker}.`,
    `${eventMarker(event.id)}; form ${form.id}${form.name ? ` (${form.name})` : ""}; event ${event.created}.`,
    `Subscriber state: ${subscriber.state ?? "unknown"}.`,
    "UNCONFIRMED — do not contact and do not fulfill the physical report yet.",
  ].join(" ");

  if (existingPage) {
    const existingCompliance = plainText(existingPage.properties?.["Compliance Notes"]);
    if (existingCompliance.includes(eventMarker(event.id))) {
      return { skipped: true, reason: "duplicate_pending_event", url: existingPage.url };
    }

    const updateData = await patchCrmPage(
      existingPage.id,
      {
        "Compliance Notes": richText(appendComplianceNote(existingCompliance, pendingNote)),
      },
      notionApiKey
    );
    return { action: "pending_existing", url: updateData.url };
  }

  // A brand-new unconfirmed signup exists only as a durable confirmation
  // correlation record. It is intentionally kept out of every active queue.
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
  let existingPage = await findCrmPageByEmail(
    subscriber.email_address,
    notionApiKey,
    notionDatabaseId
  );
  const pending = pendingPrefix(expectedFormId, subscriber.id);
  let existingCompliance = plainText(existingPage?.properties?.["Compliance Notes"]);

  // Kit retries the same event when an endpoint does not acknowledge it. Event
  // UUIDs are the idempotency key; unlike a subscriber/form marker, they still
  // allow the same homeowner to make a genuine second request later.
  if (existingCompliance.includes(eventMarker(event.id))) {
    return { skipped: true, reason: "duplicate_event", url: existingPage?.url };
  }

  if (options.requirePending) {
    if (!existingPage) return { skipped: true, reason: "activation_without_pending_request" };
    if (!existingCompliance.includes(pending)) {
      return { skipped: true, reason: "activation_unrelated_to_report_form", url: existingPage.url };
    }
  }

  const { propertyAddress, separateMailingAddress, effectiveMailingAddress } =
    submittedAddresses(subscriber);

  const desiredChannels = new Set<string>(["Email", "Direct Mail"]);
  const existingChannels =
    existingPage?.properties?.["Prospecting Channel"]?.multi_select?.map(
      (option: { name: string }) => option.name
    ) ?? [];
  for (const channel of existingChannels) desiredChannels.add(channel);

  const currentPipeline = existingPage?.properties?.["Pipeline Stage"]?.select?.name;
  const currentAddress = plainText(existingPage?.properties?.Address);
  const currentMailingAddress = plainText(existingPage?.properties?.["Mailing Address"]);

  const baseProperties: Record<string, unknown> = {
    "Permission to Follow Up": { select: { name: "Yes" } },
    "Prospecting Channel": {
      multi_select: Array.from(desiredChannels).map((name) => ({ name })),
    },
  };
  if (currentPipeline === "Archived") {
    baseProperties["Pipeline Stage"] = { select: { name: "New" } };
  }
  if (propertyAddress && !currentAddress) {
    baseProperties.Address = richText(propertyAddress);
  }
  if (effectiveMailingAddress && !currentMailingAddress) {
    baseProperties["Mailing Address"] = richText(effectiveMailingAddress);
  }

  let crmPage: any;
  if (existingPage) {
    crmPage = await patchCrmPage(existingPage.id, baseProperties, notionApiKey);
  } else {
    const name = subscriber.first_name?.trim() || subscriber.email_address.split("@")[0];
    const createProperties: Record<string, unknown> = {
      Name: { title: [{ text: { content: name } }] },
      Email: { email: subscriber.email_address },
      Source: { select: { name: "Website" } },
      "Lead Type": { select: { name: "Expired Listing" } },
      "Service Need": { select: { name: "Expired Seller" } },
      "Pipeline Stage": { select: { name: "New" } },
      ...baseProperties,
    };
    if (propertyAddress) createProperties.Address = richText(propertyAddress);
    if (effectiveMailingAddress) {
      createProperties["Mailing Address"] = richText(effectiveMailingAddress);
    }

    const createRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: notionHeaders(notionApiKey),
      body: JSON.stringify({
        parent: { type: "database_id", database_id: notionDatabaseId },
        properties: createProperties,
      }),
    });
    crmPage = await createRes.json();
    if (!createRes.ok) throw new Error(crmPage?.message ?? "Notion confirmed create failed.");
    existingCompliance = "";
  }

  let propertyResult:
    | { action: "created" | "linked" | "existing"; id: string; url: string }
    | null = null;
  if (propertyAddress && effectiveMailingAddress) {
    const ensured = await ensureRequestedProperty(
      propertyAddress,
      effectiveMailingAddress,
      crmPage.id
    );
    if ("error" in ensured) throw new Error(ensured.error);
    propertyResult = ensured;
  }

  const eligibility =
    existingPage?.properties?.["Outreach Eligibility"]?.multi_select?.map(
      (option: { name: string }) => option.name
    ) ?? [];
  const callDisposition = existingPage?.properties?.["Call Disposition"]?.select?.name;
  const currentRouting = existingPage?.properties?.["Mailing Kit Routing"]?.select?.name;
  const hardSuppressed =
    eligibility.includes("Litigator") ||
    eligibility.includes("None") ||
    callDisposition === "Do Not Contact" ||
    currentRouting === "Suppressed";

  let nextRouting = currentRouting ?? null;
  if (hardSuppressed) {
    nextRouting = "Suppressed";
  } else if (!currentRouting || currentRouting === "Not Evaluated" || currentRouting === "Complete") {
    // "Not Evaluated" is the handoff state. The native requested-report
    // automation owns task creation, Routed At, Next Action, and Queued.
    nextRouting = "Not Evaluated";
  }

  // Consume the pending correlation marker after a successful activation so a
  // later unrelated re-activation cannot resurrect an old report request.
  let complianceBase = existingCompliance;
  if (options.requirePending) {
    complianceBase = complianceBase.replace(
      pending,
      consumedPrefix(expectedFormId, subscriber.id)
    );
  }

  const confirmationNote = [
    `Confirmed Kit expired-report request | form ${expectedFormId} | subscriber ${subscriber.id} | event ${event.id}.`,
    `${eventMarker(event.id)}; event ${event.created}.`,
    options.form
      ? `Subscriber was already active when joining form ${options.form.id}${options.form.name ? ` (${options.form.name})` : ""}.`
      : "Subscriber activated after double-opt-in confirmation.",
    "Consent scope from this launch form: Email + requested physical mail fulfillment only; no phone/text permission is collected.",
    propertyAddress
      ? `Requested property: ${propertyAddress}.`
      : "Property address missing — routing must remain unresolved.",
    separateMailingAddress
      ? `Separate mailing address supplied: ${separateMailingAddress}.`
      : effectiveMailingAddress
        ? `Mailing address defaults to the property address per the form wording: ${effectiveMailingAddress}.`
        : "Mailing address missing — routing must remain unresolved.",
    propertyResult ? `Property Research: ${propertyResult.url}.` : null,
    hardSuppressed ? "Existing CRM suppression blocks automatic fulfillment; review manually." : null,
  ]
    .filter(Boolean)
    .join(" ");

  const finalProperties: Record<string, unknown> = {
    "Compliance Notes": richText(appendComplianceNote(complianceBase, confirmationNote)),
  };
  if (nextRouting && nextRouting !== currentRouting) {
    finalProperties["Mailing Kit Routing"] = { select: { name: nextRouting } };
  }

  const finalPage = await patchCrmPage(crmPage.id, finalProperties, notionApiKey);

  return {
    action: existingPage ? "confirmed_updated" : "confirmed_created",
    url: finalPage.url,
    property: propertyResult?.url ?? null,
    routing: nextRouting,
    awaitingNativeQueue: nextRouting === "Not Evaluated",
  };
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

    // Already-active subscribers have a confirmed email, so their explicit form
    // submission can be treated as a confirmed request immediately.
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
