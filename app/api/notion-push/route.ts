import { NextResponse } from "next/server";
import { outreachEligibility, dncStatus, bestPhone, bestEmail, type Person } from "@/lib/tracerfy";

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

  const phone = bestPhone(person);
  const email = bestEmail(person);
  const scrubDate = new Date().toISOString().slice(0, 10);

  const complianceNotes = [
    `Tracerfy lookup${requestId ? ` ${requestId}` : ""} at ${timestamp ?? new Date().toISOString()}.`,
    person.litigator ? "LITIGATOR — do not contact." : null,
    person.deceased ? "Marked deceased by Tracerfy." : null,
    person.phones?.length
      ? `Phones checked: ${person.phones
          .map((p) => `${p.number} (${p.dnc ? "DNC" : "clear"}${p.tcpa ? ", TCPA flag" : ""})`)
          .join("; ")}`
      : "No phones returned.",
  ]
    .filter(Boolean)
    .join(" ");

  const properties: Record<string, unknown> = {
    Name: { title: [{ text: { content: person.full_name || "Unknown" } }] },
    Address: { rich_text: [{ text: { content: `${address}, ${city}, ${state} ${zip}` } }] },
    Source: { select: { name: "MLS Pull" } },
    "Lead Type": { select: { name: "Expired Listing" } },
    "Service Need": { select: { name: "Expired Seller" } },
    "Pipeline Stage": { select: { name: "New" } },
    "DNC Status": { select: { name: dncStatus(person) } },
    "Outreach Eligibility": {
      multi_select: outreachEligibility(person).map((name) => ({ name })),
    },
    "DNC Scrub Date": { date: { start: scrubDate } },
    "Compliance Notes": { rich_text: [{ text: { content: complianceNotes.slice(0, 2000) } }] },
  };

  if (phone) properties.Phone = { phone_number: phone };
  if (email) properties.Email = { email };

  const notionRes = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { type: "database_id", database_id: databaseId },
      properties,
    }),
  });

  const data = await notionRes.json();

  if (!notionRes.ok) {
    return NextResponse.json(
      { error: data?.message ?? "Notion write failed." },
      { status: notionRes.status }
    );
  }

  return NextResponse.json({ ok: true, url: data.url });
}
