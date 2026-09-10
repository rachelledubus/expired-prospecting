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
  mailingAddress: string | null;
  ownerContactIds: string[];
};

const notionHeaders = () => ({
  Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
  "Notion-Version": NOTION_VERSION,
  "Content-Type": "application/json",
});

/** Finds an existing Property Research page by exact street/property address (its title). */
export async function queryPropertyByAddress(address: string): Promise<ExistingPropertyRecord | null> {
  const databaseId = process.env.NOTION_PROPERTY_RESEARCH_DATABASE_ID;
  if (!process.env.NOTION_API_KEY || !databaseId) return null;

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: notionHeaders(),
      body: JSON.stringify({
        filter: { property: "Property Address", title: { equals: address } },
        page_size: 1,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const page = data.results?.[0];
    if (!page) return null;

    return {
      id: page.id,
      url: page.url,
      listingStatus: page.properties?.["Listing Status"]?.select?.name ?? null,
      originalPrice: page.properties?.["Original List Price"]?.number ?? null,
      finalPrice: page.properties?.["Final List Price"]?.number ?? null,
      priceChanges: page.properties?.["Number of Price Changes"]?.number ?? null,
      dom: page.properties?.DOM?.number ?? null,
      researchStatus: page.properties?.["Research Status"]?.status?.name ?? null,
      mailingAddress:
        page.properties?.["Mailing Address"]?.rich_text
          ?.map((part: any) => part.plain_text ?? "")
          .join("") || null,
      ownerContactIds:
        page.properties?.["Owner / CRM Contact"]?.relation?.map((item: any) => item.id) ?? [],
    };
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
  if (KNOWN_CITIES.includes(row.city)) {
    properties.City = { select: { name: row.city } };
  }
  if (row.beds !== undefined) properties.Beds = { number: row.beds };
  if (row.baths !== undefined) properties.Baths = { number: row.baths };
  if (row.sqft !== undefined) properties["Sq Ft"] = { number: row.sqft };
  if (row.yearBuilt !== undefined) properties["Year Built"] = { number: row.yearBuilt };
  if (row.originalPrice !== undefined) properties["Original List Price"] = { number: row.originalPrice };
  if (row.currentPrice !== undefined) properties["Final List Price"] = { number: row.currentPrice };
  if (row.dom !== undefined) properties.DOM = { number: row.dom };
  if (row.priceChanges !== undefined)
    properties["Number of Price Changes"] = { number: row.priceChanges };
  return properties;
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

/**
 * Ensures a confirmed website report request has a real Property Research
 * record and a two-way CRM relation before any mailing automation can run.
 *
 * This intentionally creates only the minimum research shell. It does not
 * invent MLS facts, listing status, prices, DOM, comps, or analysis. A new
 * request starts at Research Status = Not started; the deliberate research
 * workflow must verify that the listing is actually Expired before the report
 * can pass its quality gate.
 */
export async function ensureRequestedProperty(
  address: string,
  mailingAddress: string,
  crmPageId: string
): Promise<
  | { action: "created" | "linked" | "existing"; id: string; url: string }
  | { error: string }
> {
  const databaseId = process.env.NOTION_PROPERTY_RESEARCH_DATABASE_ID;
  if (!process.env.NOTION_API_KEY || !databaseId) {
    return { error: "Notion Property Research is not configured on the server." };
  }

  const existing = await queryPropertyByAddress(address);
  if (existing) {
    const ownerIds = new Set(existing.ownerContactIds);
    ownerIds.add(crmPageId);

    const properties: Record<string, unknown> = {};
    if (!existing.ownerContactIds.includes(crmPageId)) {
      properties["Owner / CRM Contact"] = {
        relation: Array.from(ownerIds).map((id) => ({ id })),
      };
    }
    if (!existing.mailingAddress && mailingAddress) {
      properties["Mailing Address"] = {
        rich_text: [{ text: { content: mailingAddress.slice(0, 2000) } }],
      };
    }

    if (Object.keys(properties).length === 0) {
      return { action: "existing", id: existing.id, url: existing.url };
    }

    const patchRes = await fetch(`https://api.notion.com/v1/pages/${existing.id}`, {
      method: "PATCH",
      headers: notionHeaders(),
      body: JSON.stringify({ properties }),
    });
    const patchData = await patchRes.json();
    if (!patchRes.ok) return { error: patchData?.message ?? "Property Research link failed." };

    return { action: "linked", id: existing.id, url: patchData.url ?? existing.url };
  }

  const createRes = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: notionHeaders(),
    body: JSON.stringify({
      parent: { type: "database_id", database_id: databaseId },
      properties: {
        "Property Address": { title: [{ text: { content: address.slice(0, 2000) } }] },
        "Research Status": { status: { name: "Not started" } },
        "Owner / CRM Contact": { relation: [{ id: crmPageId }] },
        ...(mailingAddress
          ? {
              "Mailing Address": {
                rich_text: [{ text: { content: mailingAddress.slice(0, 2000) } }],
              },
            }
          : {}),
      },
    }),
  });
  const createData = await createRes.json();
  if (!createRes.ok) return { error: createData?.message ?? "Property Research create failed." };

  return { action: "created", id: createData.id, url: createData.url };
}
