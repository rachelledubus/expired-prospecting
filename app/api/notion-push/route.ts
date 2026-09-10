import { NextResponse } from "next/server";
import {
  outreachEligibility,
  dncStatus,
  bestPhone,
  bestEmail,
  formatPhone,
  type Person,
} from "@/lib/tracerfy";
import { queryPropertyByAddress, upsertExpiredProperty } from "@/lib/propertyResearch";
import type { ExpiredPropertyPayload } from "@/lib/mls-intake";

const NOTION_VERSION = "2022-06-28";

function mailingAddress(person: Person) {
  const mailing = person.mailing_address;
  if (!mailing?.street) return null;
  return [
    mailing.street,
    mailing.city,
    [mailing.state, mailing.zip].filter(Boolean).join(" "),
  ].filter(Boolean).join(", ");
}

export async function POST(request: Request) {
  const { person, address, city, state, zip, requestId, timestamp, sourceSearch, property } =
    (await request.json()) as {
      person: Person;
      address: string;
      city: string;
      state: string;
      zip: string;
      requestId?: string;
      timestamp?: string;
      sourceSearch?: string;
      property?: ExpiredPropertyPayload;
    };

  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_LEADS_DATABASE_ID;

  if (!apiKey || !databaseId) {
    return NextResponse.json(
      { error: "Notion is not configured on the server." },
      { status: 500 }
    );
  }

  const notionHeaders = {
    Authorization: `Bearer ${apiKey}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };

  const fullAddress = `${address}, ${city}, ${state} ${zip}`;
  const name = person.full_name || "Unknown";
  const phone = bestPhone(person);
  const email = bestEmail(person);
  const scrubDate = new Date().toISOString().slice(0, 10);
  const ownerMailingAddress = mailingAddress(person);

  // Preserve useful history if this property was previously tracked as a
  // price reduction or stale listing. The same record will be refreshed to
  // Expired and linked to this CRM owner later in this request.
  const priorResearch = await queryPropertyByAddress(address);
  const priorResearchNote =
    priorResearch &&
    (priorResearch.originalPrice != null || priorResearch.priceChanges != null || priorResearch.dom != null)
      ? `Previously tracked in Property Research (${priorResearch.listingStatus ?? "status unknown"}): ${
          priorResearch.originalPrice != null ? `started at $${priorResearch.originalPrice.toLocaleString()}` : ""
        }${
          priorResearch.finalPrice != null ? `, last list $${priorResearch.finalPrice.toLocaleString()}` : ""
        }${priorResearch.priceChanges != null ? `, ${priorResearch.priceChanges} price change(s)` : ""}${
          priorResearch.dom != null ? `, ${priorResearch.dom} DOM` : ""
        } — see ${priorResearch.url}.`
      : null;

  const complianceNotes = [
    `Tracerfy lookup${requestId ? ` ${requestId}` : ""} at ${timestamp ?? new Date().toISOString()}.`,
    person.litigator ? "LITIGATOR — do not contact." : null,
    person.deceased ? "Marked deceased by Tracerfy." : null,
    sourceSearch ? `Sourced from MLS saved search: ${sourceSearch}.` : null,
    priorResearchNote,
  ]
    .filter(Boolean)
    .join(" ");

  const eligibility = outreachEligibility(person);
  const recommendedChannel = eligibility.includes("Call")
    ? "Call"
    : eligibility.includes("Mail")
      ? "Direct Mail"
      : null;

  const allPhones = person.phones?.length
    ? person.phones
        .map(
          (p) =>
            `${formatPhone(p.number)} · ${p.type}${p.dnc ? " · DNC" : ""}${p.tcpa ? " · TCPA" : ""}`
        )
        .join("\n")
    : "None returned.";

  const allEmails = person.emails?.length
    ? person.emails.map((e) => e.email).join("\n")
    : "None returned.";

  const queryRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: "POST",
    headers: notionHeaders,
    body: JSON.stringify({
      filter: { property: "Address", rich_text: { equals: fullAddress } },
      page_size: 20,
    }),
  });

  const queryData = await queryRes.json();

  if (!queryRes.ok) {
    return NextResponse.json(
      { error: queryData?.message ?? "Notion lookup failed." },
      { status: queryRes.status }
    );
  }

  const getTitle = (page: any): string =>
    page.properties?.Name?.title?.map((t: any) => t.plain_text).join("") ?? "";
  const getSource = (page: any): string | null => page.properties?.Source?.select?.name ?? null;

  const allAtAddress: any[] = queryData.results ?? [];
  const existingPage = allAtAddress.find((p) => getTitle(p) === name);
  const otherRecords = allAtAddress.filter((p) => getTitle(p) !== name);

  const possibleOtherNames = otherRecords
    .map((p) => `${getTitle(p) || "(untitled)"} — ${p.url}${getSource(p) ? ` (${getSource(p)})` : ""}`)
    .join("\n");

  const refreshableProperties: Record<string, unknown> = {
    "DNC Status": { select: { name: dncStatus(person) } },
    "Outreach Eligibility": {
      multi_select: eligibility.map((n) => ({ name: n })),
    },
    "Tracerfy Property Owner": { checkbox: Boolean(person.property_owner) },
    "DNC Scrub Date": { date: { start: scrubDate } },
    "Compliance Notes": { rich_text: [{ text: { content: complianceNotes.slice(0, 2000) } }] },
    "All Phones": { rich_text: [{ text: { content: allPhones.slice(0, 2000) } }] },
    "All Emails": { rich_text: [{ text: { content: allEmails.slice(0, 2000) } }] },
    "Possible Other Names": { rich_text: [{ text: { content: possibleOtherNames.slice(0, 2000) } }] },
  };
  if (phone) refreshableProperties.Phone = { phone_number: phone };
  if (email) refreshableProperties.Email = { email };
  if (ownerMailingAddress) {
    refreshableProperties["Mailing Address"] = {
      rich_text: [{ text: { content: ownerMailingAddress.slice(0, 2000) } }],
    };
  }

  async function syncPropertyAndPremium(crmPageId: string) {
    const propertySync = await upsertExpiredProperty({
      ...(property ?? {
        address,
        city,
        zip,
        listingStatus: "Expired" as const,
      }),
      address,
      city,
      zip,
      listingStatus: "Expired",
      ...(ownerMailingAddress ? { mailingAddress: ownerMailingAddress } : {}),
      crmPageIds: [crmPageId],
    });

    if ("error" in propertySync) return propertySync;

    // Work mode's native Notion automation intentionally uses this editable
    // checkbox as a trigger. Make it deterministic: Property Research's
    // Mailer Tier formula decides, and the portal mirrors that result here.
    if (propertySync.premiumMailerEligible !== null) {
      const premiumRes = await fetch(`https://api.notion.com/v1/pages/${crmPageId}`, {
        method: "PATCH",
        headers: notionHeaders,
        body: JSON.stringify({
          properties: {
            "Premium Mailer Eligible": { checkbox: propertySync.premiumMailerEligible },
          },
        }),
      });
      const premiumData = await premiumRes.json();
      if (!premiumRes.ok) {
        return { error: premiumData?.message ?? "CRM premium-mailer sync failed." };
      }
    }

    return propertySync;
  }

  if (existingPage) {
    const updateRes = await fetch(`https://api.notion.com/v1/pages/${existingPage.id}`, {
      method: "PATCH",
      headers: notionHeaders,
      body: JSON.stringify({ properties: refreshableProperties }),
    });
    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      return NextResponse.json(
        { error: updateData?.message ?? "Notion update failed." },
        { status: updateRes.status }
      );
    }

    const propertySync = await syncPropertyAndPremium(existingPage.id);
    if ("error" in propertySync) {
      return NextResponse.json(
        { error: propertySync.error, partial: true, crmAction: "updated", crmUrl: updateData.url },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      url: updateData.url,
      action: "updated",
      property: propertySync,
      otherRecordsAtAddress: otherRecords.length,
    });
  }

  const createRes = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: notionHeaders,
    body: JSON.stringify({
      parent: { type: "database_id", database_id: databaseId },
      properties: {
        Name: { title: [{ text: { content: name } }] },
        Address: { rich_text: [{ text: { content: fullAddress } }] },
        Source: { select: { name: "MLS Pull" } },
        "Lead Type": { select: { name: "Expired Listing" } },
        "Service Need": { select: { name: "Expired Seller" } },
        "Pipeline Stage": { select: { name: "New" } },
        ...(recommendedChannel
          ? { "Prospecting Channel": { multi_select: [{ name: recommendedChannel }] } }
          : {}),
        ...refreshableProperties,
      },
    }),
  });

  const createData = await createRes.json();

  if (!createRes.ok) {
    return NextResponse.json(
      { error: createData?.message ?? "Notion write failed." },
      { status: createRes.status }
    );
  }

  const propertySync = await syncPropertyAndPremium(createData.id);
  if ("error" in propertySync) {
    return NextResponse.json(
      { error: propertySync.error, partial: true, crmAction: "created", crmUrl: createData.url },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    url: createData.url,
    action: "created",
    property: propertySync,
    otherRecordsAtAddress: otherRecords.length,
  });
}
