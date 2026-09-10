const NOTION_VERSION = "2022-06-28";

export type ExistingLeadRecord = {
  id: string;
  url: string;
  name: string;
  pipelineStage: string | null;
  dncScrubDate: string | null;
};

/**
 * Looks up existing Clients / Leads records at an address, so callers can
 * avoid re-spending Tracerfy credits on a property already researched.
 * Returns [] (never throws) if Notion isn't configured or the query fails --
 * callers should treat that as "no existing record found," not an error,
 * so a missing Notion setup never blocks a lookup.
 */
export async function queryLeadsByAddress(fullAddress: string): Promise<ExistingLeadRecord[]> {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_LEADS_DATABASE_ID;
  if (!apiKey || !databaseId) return [];

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: { property: "Address", rich_text: { equals: fullAddress } },
        page_size: 20,
      }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const pages: any[] = data.results ?? [];

    return pages.map((p) => ({
      id: p.id,
      url: p.url,
      name: p.properties?.Name?.title?.map((t: any) => t.plain_text).join("") ?? "(untitled)",
      pipelineStage: p.properties?.["Pipeline Stage"]?.select?.name ?? null,
      dncScrubDate: p.properties?.["DNC Scrub Date"]?.date?.start ?? null,
    }));
  } catch {
    return [];
  }
}
