import type { ExpiredPropertyPayload } from "./mls-intake";

const NOTION_VERSION = "2022-06-28";

export const KNOWN_CITIES = [
  "SW Ranches",
  "Miramar",
  "Plantation",
  "Davie",
  "Pembroke Pines",
  "Cooper City",
  "Weston",
  "Hollywood",
];

export type WatchlistRow = {
  address: string;
  city: string;
  zip: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  yearBuilt?: number;
  originalPrice?: number;
  currentPrice?: number;
  dom?: number;
  priceChanges?: number;
  listingStatus?: string;
};

export type ExistingPropertyRecord = {
  id: string;
  url: string;
  listingStatus: string | null;
  originalPrice: number | null;
  finalPrice: number | null;
  priceChanges: number | null;
  dom: number | null;
  researchStatus: string | null;
  ownerIds: string[];
  mailerTier: string | null;
};

export type ExpiredPropertySyncInput = ExpiredPropertyPayload & {
  mailingAddress?: string;
  crmPageIds?: string[];
};

export type ExpiredPropertySyncResult = {
  action: "created" | "updated";
  id: string;
  url: string;
  mailerTier: string | null;
  premiumMailerEligible: boolean | null;
};

const notionHeaders = () => ({
  Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
  "Notion-Version": NOTION_VERSION,
  "Content-Type": "application/json",
});

function formulaText(property: any): string | null {
  const formula = property?.formula;
  if (!formula) return null;
  if (formula.type === "string") return formula.string ?? null;
  if (formula.type === "number" && formula.number != null) return String(formula.number);
  if (formula.type === "boolean" && formula.boolean != null) return String(formula.boolean);
  return null;
}

async function readMailerTier(pageId: string, pageData?: any): Promise<string | null> {
  const immediate = formulaText(pageData?.properties?.["Mailer Tier"]);
  if (immediate) return immediate;
  try {
    const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      headers: notionHeaders(),
    });
    if (!res.ok) return null;
    const page = await res.json();
    return formulaText(page?.properties?.["Mailer Tier"]);
  } catch {
    return null;
  }
}

function normalizeStreetAddress(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[.,]/g, " ")
    .replace(/\bSOUTHWEST\b/g, "SW")
    .replace(/\bSOUTHEAST\b/g, "SE")
    .replace(/\bNORTHWEST\b/g, "NW")
    .replace(/\bNORTHEAST\b/g, "NE")
    .replace(/\bAVENUE\b/g, "AVE")
    .replace(/\bSTREET\b/g, "ST")
    .replace(/\bTERRACE\b/g, "TER")
    .replace(/\bCOURT\b/g, "CT")
    .replace(/\bDRIVE\b/g, "DR")
    .replace(/\bROAD\b/g, "RD")
    .replace(/\bPLACE\b/g, "PL")
    .replace(/\bBOULEVARD\b/g, "BLVD")
    .replace(/\bLANE\b/g, "LN")
    .replace(/\bCIRCLE\b/g, "CIR")
    .replace(/\bTRAIL\b/g, "TRL")
    .replace(/\bHIGHWAY\b/g, "HWY")
    .replace(/\bPARKWAY\b/g, "PKWY")
    .replace(/\bMANOR\b/g, "MNR")
    .replace(/\s+/g, " ")
    .trim();
}

function pageTitle(page: any) {
  return (
    page?.properties?.["Property Address"]?.title
      ?.map((part: any) => part?.plain_text ?? part?.text?.content ?? "")
      .join("") ?? ""
  );
}

function existingPropertyFromPage(page: any): ExistingPropertyRecord {
  return {
    id: page.id,
    url: page.url,
    listingStatus: page.properties?.["Listing Status"]?.select?.name ?? null,
    originalPrice: page.properties?.["Original List Price"]?.number ?? null,
    finalPrice: page.properties?.["Final List Price"]?.number ?? null,
    priceChanges: page.properties?.["Number of Price Changes"]?.number ?? null,
    dom: page.properties?.DOM?.number ?? null,
    researchStatus: page.properties?.["Research Status"]?.status?.name ?? null,
    ownerIds: page.properties?.["Owner / CRM Contact"]?.relation?.map((r: any) => r.id) ?? [],
    mailerTier: formulaText(page.properties?.["Mailer Tier"]),
  };
}

/**
 * Finds an existing Property Research page by street address. It tries an
 * exact title match first, then falls back to normalized address matching so
 * harmless Matrix formatting differences such as "Ave" vs "Avenue" do not
 * create duplicate property records.
 */
export async function queryPropertyByAddress(address: string): Promise<ExistingPropertyRecord | null> {
  const databaseId = process.env.NOTION_PROPERTY_RESEARCH_DATABASE_ID;
  if (!process.env.NOTION_API_KEY || !databaseId) return null;

  try {
    const exactRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: notionHeaders(),
      body: JSON.stringify({
        filter: { property: "Property Address", title: { equals: address } },
        page_size: 5,
      }),
    });
    if (!exactRes.ok) return null;
    const exactData = await exactRes.json();
    const exactPage = exactData.results?.[0];
    if (exactPage) return existingPropertyFromPage(exactPage);

    const houseNumber = address.trim().match(/^\d+[A-Z]?/i)?.[0];
    if (!houseNumber) return null;

    const candidatesRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: notionHeaders(),
      body: JSON.stringify({
        filter: { property: "Property Address", title: { starts_with: houseNumber } },
        page_size: 100,
      }),
    });
    if (!candidatesRes.ok) return null;
    const candidatesData = await candidatesRes.json();
    const target = normalizeStreetAddress(address);
    const matchedPage = (candidatesData.results ?? []).find(
      (candidate: any) => normalizeStreetAddress(pageTitle(candidate)) === target
    );
    if (!matchedPage) return null;

    return existingPropertyFromPage(matchedPage);
  } catch {
    return null;
  }
}

function buildProperties(row: WatchlistRow) {
  const properties: Record<string, unknown> = {
    "Property Address": { title: [{ text: { content: row.address } }] },
    ZIP: { rich_text: [{ text: { content: row.zip } }] },
    "Listing Status": { select: { name: row.listingStatus || "Active" } },
    Source: { select: { name: "MLS Pull" } },
  };
  if (KNOWN_CITIES.includes(row.city)) properties.City = { select: { name: row.city } };
  if (row.beds !== undefined) properties.Beds = { number: row.beds };
  if (row.baths !== undefined) properties.Baths = { number: row.baths };
  if (row.sqft !== undefined) properties["Sq Ft"] = { number: row.sqft };
  if (row.yearBuilt !== undefined) properties["Year Built"] = { number: row.yearBuilt };
  if (row.originalPrice !== undefined) properties["Original List Price"] = { number: row.originalPrice };
  if (row.currentPrice !== undefined) properties["Final List Price"] = { number: row.currentPrice };
  if (row.dom !== undefined) properties.DOM = { number: row.dom };
  if (row.priceChanges !== undefined) properties["Number of Price Changes"] = { number: row.priceChanges };
  return properties;
}

function normalizePropertyType(value?: string) {
  const v = value?.trim().toLowerCase();
  if (!v) return null;
  if (v.includes("single family") || v.includes("not attached") || v.includes("detached")) return "Single Family";
  if (v.includes("townhouse") || v.includes("townhome")) return "Townhouse";
  if (v.includes("condo")) return "Condo";
  if (v.includes("multi-family") || v.includes("multifamily")) return "Multi-Family";
  if (v.includes("land")) return "Land";
  return null;
}

function normalizeHoaCadence(value?: string) {
  const v = value?.trim().toLowerCase();
  if (!v) return null;
  if (v.includes("month")) return "Monthly";
  if (v.includes("quarter")) return "Quarterly";
  if (v.includes("annual") || v.includes("year")) return "Annual";
  return null;
}

function buildExpiredProperties(row: ExpiredPropertySyncInput, existingOwnerIds: string[] = []) {
  const properties: Record<string, unknown> = {
    "Property Address": { title: [{ text: { content: row.address } }] },
    ZIP: { rich_text: [{ text: { content: row.zip } }] },
    "Listing Status": { select: { name: "Expired" } },
    Source: { select: { name: "MLS Pull" } },
  };

  if (KNOWN_CITIES.includes(row.city)) properties.City = { select: { name: row.city } };
  if (row.dateOffMarket) properties["Date Off Market"] = { date: { start: row.dateOffMarket } };
  if (row.originalPrice !== undefined) properties["Original List Price"] = { number: row.originalPrice };
  if (row.finalPrice !== undefined) properties["Final List Price"] = { number: row.finalPrice };
  if (row.dom !== undefined) properties.DOM = { number: row.dom };
  if (row.beds !== undefined) properties.Beds = { number: row.beds };
  if (row.baths !== undefined) properties.Baths = { number: row.baths };
  if (row.sqft !== undefined) properties["Sq Ft"] = { number: row.sqft };
  if (row.yearBuilt !== undefined) properties["Year Built"] = { number: row.yearBuilt };
  if (row.hoaAmount !== undefined) {
    properties["HOA Amount"] = { number: row.hoaAmount };
    properties["HOA?"] = { checkbox: row.hoaAmount > 0 };
  }
  const hoaCadence = normalizeHoaCadence(row.hoaCadence);
  if (hoaCadence) properties["HOA Cadence"] = { select: { name: hoaCadence } };
  const propertyType = normalizePropertyType(row.propertyType);
  if (propertyType) properties["Property Type"] = { select: { name: propertyType } };
  if (row.mailingAddress) properties["Mailing Address"] = { rich_text: [{ text: { content: row.mailingAddress.slice(0, 2000) } }] };

  const ownerIds = Array.from(new Set([...existingOwnerIds, ...(row.crmPageIds ?? [])].filter(Boolean)));
  if (ownerIds.length) properties["Owner / CRM Contact"] = { relation: ownerIds.map((id) => ({ id })) };

  return properties;
}

/**
 * Upserts an expired Property Research row from the Matrix export and links
 * every CRM owner passed in. Existing manual analysis/research fields are
 * preserved; only objective MLS facts, mailing address, and the owner relation
 * are refreshed. The Mailer Tier formula remains the source of truth for
 * premium-vs-standard classification.
 */
export async function upsertExpiredProperty(
  row: ExpiredPropertySyncInput
): Promise<ExpiredPropertySyncResult | { error: string }> {
  const databaseId = process.env.NOTION_PROPERTY_RESEARCH_DATABASE_ID;
  if (!process.env.NOTION_API_KEY || !databaseId) {
    return { error: "Notion Property Research is not configured on the server." };
  }

  const existing = await queryPropertyByAddress(row.address);
  const properties = buildExpiredProperties(row, existing?.ownerIds ?? []);

  let pageData: any;
  let action: "created" | "updated";

  if (existing) {
    const patchRes = await fetch(`https://api.notion.com/v1/pages/${existing.id}`, {
      method: "PATCH",
      headers: notionHeaders(),
      body: JSON.stringify({ properties }),
    });
    pageData = await patchRes.json();
    if (!patchRes.ok) return { error: pageData?.message ?? "Notion Property Research update failed." };
    action = "updated";
  } else {
    const createRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: notionHeaders(),
      body: JSON.stringify({
        parent: { type: "database_id", database_id: databaseId },
        properties: { ...properties, "Research Status": { status: { name: "Not started" } } },
      }),
    });
    pageData = await createRes.json();
    if (!createRes.ok) return { error: pageData?.message ?? "Notion Property Research write failed." };
    action = "created";
  }

  const pageId = pageData.id ?? existing?.id;
  const mailerTier = pageId ? await readMailerTier(pageId, pageData) : null;
  return {
    action,
    id: pageId,
    url: pageData.url ?? existing?.url ?? "",
    mailerTier,
    premiumMailerEligible: mailerTier ? /premium/i.test(mailerTier) : null,
  };
}

/**
 * Creates or refreshes a Property Research entry for a watchlist row
 * (Price Reduction / Stale Listing). Never touches Research Status, Owner /
 * CRM Contact, Campaign, Comparable Sales, or the manual analysis fields
 * (Realistic High/Low, Observation / Call Reason) on an existing record --
 * those belong to the deliberate research workflow, not a bulk log import.
 * Research Status is only set to "Not started" when creating a brand-new
 * entry.
 */
export async function upsertWatchlistProperty(
  row: WatchlistRow
): Promise<{ action: "created" | "updated"; url: string } | { error: string }> {
  const databaseId = process.env.NOTION_PROPERTY_RESEARCH_DATABASE_ID;
  if (!process.env.NOTION_API_KEY || !databaseId) {
    return { error: "Notion Property Research is not configured on the server." };
  }

  const existing = await queryPropertyByAddress(row.address);
  const properties = buildProperties(row);

  if (existing) {
    const patchRes = await fetch(`https://api.notion.com/v1/pages/${existing.id}`, {
      method: "PATCH",
      headers: notionHeaders(),
      body: JSON.stringify({ properties }),
    });
    const patchData = await patchRes.json();
    if (!patchRes.ok) return { error: patchData?.message ?? "Notion update failed." };
    return { action: "updated", url: patchData.url };
  }

  const createRes = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: notionHeaders(),
    body: JSON.stringify({
      parent: { type: "database_id", database_id: databaseId },
      properties: { ...properties, "Research Status": { status: { name: "Not started" } } },
    }),
  });
  const createData = await createRes.json();
  if (!createRes.ok) return { error: createData?.message ?? "Notion write failed." };
  return { action: "created", url: createData.url };
}
