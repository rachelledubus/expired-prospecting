import { NextResponse } from "next/server";
import {
  outreachEligibility,
  dncStatus,
  bestPhone,
  bestEmail,
  formatPhone,
  type Person,
} from "@/lib/tracerfy";

const NOTION_VERSION = "2022-06-28";

export async function POST(request: Request) {
  const { person, address, city, state, zip, requestId, timestamp } = (await request.json()) as {
    person: Person;
    address: string;
    city: string;
    state: string;
    zip: string;
    requestId?: string;
    timestamp?: string;
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

  const complianceNotes = [
    `Tracerfy lookup${requestId ? ` ${requestId}` : ""} at ${timestamp ?? new Date().toISOString()}.`,
    person.litigator ? "LITIGATOR — do not contact." : null,
    person.deceased ? "Marked deceased by Tracerfy." : null,
  ]
    .filter(Boolean)
    .join(" ");

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

  // Fields that reflect a fresh compliance/contact check -- safe to overwrite
  // on a re-push without disturbing anything the record's owner has since
  // set (Pipeline Stage, Next Action, Call Notes, etc.).
  const refreshableProperties: Record<string, unknown> = {
    "DNC Status": { select: { name: dncStatus(person) } },
    "Outreach Eligibility": {
      multi_select: outreachEligibility(person).map((n) => ({ name: n })),
    },
    "DNC Scrub Date": { date: { start: scrubDate } },
    "Compliance Notes": { rich_text: [{ text: { content: complianceNotes.slice(0, 2000) } }] },
    "All Phones": { rich_text: [{ text: { content: allPhones.slice(0, 2000) } }] },
    "All Emails": { rich_text: [{ text: { content: allEmails.slice(0, 2000) } }] },
  };
  if (phone) refreshableProperties.Phone = { phone_number: phone };
  if (email) refreshableProperties.Email = { email };

  // Look for an existing lead at this address with this name before
  // creating a new page, so re-pushing the same match updates it in place
  // instead of duplicating it.
  const queryRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: "POST",
    headers: notionHeaders,
    body: JSON.stringify({
      filter: {
        and: [
          { property: "Address", rich_text: { equals: fullAddress } },
          { property: "Name", title: { equals: name } },
        ],
      },
      page_size: 1,
    }),
  });

  const queryData = await queryRes.json();

  if (!queryRes.ok) {
    return NextResponse.json(
      { error: queryData?.message ?? "Notion lookup failed." },
      { status: queryRes.status }
    );
  }

  const existingPage = queryData.results?.[0];

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

    return NextResponse.json({ ok: true, url: updateData.url, action: "updated" });
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

  return NextResponse.json({ ok: true, url: createData.url, action: "created" });
}
