import { NextResponse } from "next/server";
import {
  outreachEligibility,
  dncStatus,
  bestPhone,
  bestEmail,
  formatPhone,
  type Person,
} from "@/lib/tracerfy";
import { queryPropertyByAddress } from "@/lib/propertyResearch";

const NOTION_VERSION = "2022-06-28";

export async function POST(request: Request) {
  const { person, address, city, state, zip, requestId, timestamp, sourceSearch } =
    (await request.json()) as {
      person: Person;
      address: string;
      city: string;
      state: string;
      zip: string;
      requestId?: string;
      timestamp?: string;
      sourceSearch?: string;
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

  // If this property was previously logged as a price reduction or stale
  // listing (via the Watchlist import), surface that history here -- it's
  // useful call context ("this has been sitting/reducing for a while before
  // it even expired") that would otherwise require checking a second
  // database by hand.
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

  // Recommended first-touch channel, using the CRM's existing Prospecting
  // Channel field. Only applied when CREATING a new record -- never on an
  // update, since that field is also where manually-logged touch history
  // lives, and overwriting it would erase that.
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

  // Look up everything already in Notion at this address -- both to find an
  // exact Name match to update in place, and to flag any OTHER record at the
  // same address under a different name (e.g. a pre-existing combined
  // household record like "Ricardo & Sandra Castro" that a per-person
  // Tracerfy match under "Ricardo Castro" wouldn't otherwise catch). We never
  // auto-merge those -- just surface them in "Possible Other Names" so it's
  // a one-glance manual decision, not a silent duplicate.
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
    "Possible Other Names": { rich_text: [{ text: { content: possibleOtherNames.slice(0, 2000) } }] },
  };
  if (phone) refreshableProperties.Phone = { phone_number: phone };
  if (email) refreshableProperties.Email = { email };

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

    return NextResponse.json({
      ok: true,
      url: updateData.url,
      action: "updated",
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

  return NextResponse.json({
    ok: true,
    url: createData.url,
    action: "created",
    otherRecordsAtAddress: otherRecords.length,
  });
}
