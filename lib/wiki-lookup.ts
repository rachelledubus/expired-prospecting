// Looks an item up on the Stardew Valley wiki and pulls out where to get it, the season, the time and the weather.
//
// It reads the wiki's own search and its page source, then strips the wiki markup. It does not summarize or guess: every
// line shown comes straight from the wiki page, and each result links back to it. Only stardewvalleywiki.com is read by
// the server. The mod wikis (Ridgeside, East Scarp, Stardew Valley Expanded) do not allow automated reading, so for those
// the page only gives links that open their own search.

export type LookupFact = { label: string; value: string };
export type LookupHit = { title: string; url: string; facts: LookupFact[]; text: string[] };
export type LookupLink = { label: string; url: string };
export type LookupResult = { query: string; hits: LookupHit[]; links: LookupLink[] };

export type FetchLike = (url: string, init?: Record<string, unknown>) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

const WIKI = "https://stardewvalleywiki.com";
const API = `${WIKI}/mediawiki/api.php`;
const MAX_HITS = 3;
const MAX_TEXT_LINES = 4;
const MAX_LINE = 600;

/** The search words, tidied. Returns null when there is nothing worth searching. */
export function cleanQuery(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const q = raw.replace(/[^\p{L}\p{N} '’.\-()]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  return q.length >= 2 ? q : null;
}

export function lookupLinks(query: string): LookupLink[] {
  const q = encodeURIComponent(query);
  return [
    { label: "Ridgeside wiki", url: `https://ridgesidevillage.wiki.gg/wiki/Special:Search?search=${q}` },
    { label: "East Scarp wiki", url: `https://eastscarp.wiki.gg/wiki/Special:Search?search=${q}` },
    { label: "Stardew Valley Expanded wiki", url: `https://stardew-valley-expanded.fandom.com/wiki/Special:Search?query=${q}` },
    { label: "Search the web", url: `https://duckduckgo.com/?q=${encodeURIComponent(`stardew valley ${query}`)}` },
  ];
}

/* ---------- Wiki markup to plain text ---------- */

const arg = (body: string, n: number) => body.split("|")[n]?.trim() ?? "";

/** Turn one template, like {{Season|Summer}}, into text. Unknown templates are dropped. */
function template(body: string): string {
  const name = arg(body, 0).toLowerCase();
  if (name === "season" || name === "name") return arg(body, 1);
  if (name === "tprice" || name === "price" || name === "gold") {
    const n = arg(body, 1);
    return /^[\d,]+$/.test(n) ? `${n}g` : "";
  }
  return "";
}

export function cleanWiki(input: string): string {
  let s = input;
  s = s.replace(/<!--[\s\S]*?-->/g, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "").replace(/<ref[^>]*\/>/gi, "");
  // Items listed back to back, like two seed names, need a separator.
  s = s.replace(/(\{\{\s*Name\|[^{}]*\}\})(?=\{\{\s*Name\|)/gi, "$1, ");
  // Templates, innermost first.
  for (let i = 0; i < 6 && /\{\{[^{}]*\}\}/.test(s); i += 1) s = s.replace(/\{\{([^{}]*)\}\}/g, (_, body: string) => template(body));
  s = s.replace(/\[\[(?:File|Image|Category):[^\]]*\]\]/gi, "");
  s = s.replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, "$2").replace(/\[\[([^\]]*)\]\]/g, "$1");
  s = s.replace(/\[https?:\/\/\S+ ([^\]]+)\]/g, "$1").replace(/\[https?:\/\/\S+\]/g, "");
  s = s.replace(/'{2,}/g, "");
  s = s.replace(/<\/li>\s*<li>/gi, "; ").replace(/<\/?(ul|ol|li)[^>]*>/gi, "").replace(/<br\s*\/?>/gi, "; ");
  s = s.replace(/<[^>]+>/g, "");
  s = s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'");
  s = s.replace(/\s*;\s*;\s*/g, "; ").replace(/^[\s;]+|[\s;]+$/g, "").replace(/\s+/g, " ");
  return s.trim();
}

/** The fields of the first {{Infobox ...}} on a page, keyed by lower-case name. */
export function parseInfobox(wikitext: string): { fields: Record<string, string>; endsAt: number } {
  const start = wikitext.search(/\{\{\s*Infobox/i);
  if (start < 0) return { fields: {}, endsAt: 0 };
  let depth = 0;
  let end = -1;
  for (let i = start; i < wikitext.length - 1; i += 1) {
    const two = wikitext.slice(i, i + 2);
    if (two === "{{") { depth += 1; i += 1; }
    else if (two === "}}") { depth -= 1; i += 1; if (depth === 0) { end = i + 1; break; } }
  }
  if (end < 0) return { fields: {}, endsAt: 0 };
  const inner = wikitext.slice(start + 2, end - 2);
  const fields: Record<string, string> = {};
  let key = "";
  let depthT = 0;
  let depthL = 0;
  let buf = "";
  const flush = () => { if (key) fields[key] = buf.trim(); };
  const lines = inner.split("\n").slice(1); // the first line is the template name
  for (const line of lines) {
    const m = depthT === 0 && depthL === 0 ? line.match(/^\s*\|\s*([A-Za-z0-9_ -]+?)\s*=(.*)$/) : null;
    if (m) { flush(); key = m[1].toLowerCase(); buf = m[2]; } else { buf += `\n${line}`; }
    depthT += (line.match(/\{\{/g)?.length ?? 0) - (line.match(/\}\}/g)?.length ?? 0);
    depthL += (line.match(/\[\[/g)?.length ?? 0) - (line.match(/\]\]/g)?.length ?? 0);
  }
  flush();
  return { fields, endsAt: end };
}

const FACTS: [string, string][] = [
  ["location", "Where"],
  ["source", "Source"],
  ["season", "Season"],
  ["time", "Time"],
  ["weather", "Weather"],
  ["seed", "Seeds"],
  ["growth", "Grows in"],
];

export function parsePage(title: string, wikitext: string): LookupHit {
  const { fields, endsAt } = parseInfobox(wikitext);
  const facts: LookupFact[] = [];
  for (const [key, label] of FACTS) {
    const value = fields[key] ? cleanWiki(fields[key]) : "";
    if (value) facts.push({ label, value: value.slice(0, MAX_LINE) });
  }
  // The text after the infobox, up to the first heading: the part that says how to get it.
  const rest = wikitext.slice(endsAt).split(/\n==/)[0];
  const text: string[] = [];
  for (const raw of rest.split("\n")) {
    const line = raw.replace(/^[*#:]+\s*/, "");
    if (!raw.trim() || /^\{\{|^\[\[(File|Image):/i.test(raw.trim())) continue;
    const clean = cleanWiki(line);
    if (clean.length >= 12) text.push(clean.length > MAX_LINE ? `${clean.slice(0, MAX_LINE - 1).trimEnd()}…` : clean);
    if (text.length >= MAX_TEXT_LINES) break;
  }
  return { title, url: `${WIKI}/${encodeURIComponent(title.replace(/ /g, "_"))}`, facts, text };
}

/* ---------- Fetching ---------- */

async function getJson(fetchImpl: FetchLike, url: string): Promise<unknown> {
  const res = await fetchImpl(url, {
    headers: { "User-Agent": "RachellesPortal/1.0 (personal Stardew lookup)", Accept: "application/json" },
    signal: AbortSignal.timeout(7000),
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`The wiki answered with status ${res.status}.`);
  return res.json();
}

type SearchHit = { title?: string };

export async function lookup(query: string, fetchImpl: FetchLike = fetch as unknown as FetchLike): Promise<LookupResult> {
  const searchUrl = `${API}?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=0&srlimit=6&format=json&formatversion=2`;
  const data = (await getJson(fetchImpl, searchUrl)) as { query?: { search?: SearchHit[] } };
  let titles = (data.query?.search ?? []).map((h) => h.title).filter((t): t is string => typeof t === "string");
  // A page named exactly what was typed goes first.
  const exact = titles.findIndex((t) => t.toLowerCase() === query.toLowerCase());
  if (exact > 0) titles = [titles[exact], ...titles.filter((_, i) => i !== exact)];
  titles = titles.slice(0, MAX_HITS);

  const hits = await Promise.all(
    titles.map(async (title) => {
      const pageUrl = `${API}?action=parse&page=${encodeURIComponent(title)}&prop=wikitext&section=0&redirects=1&format=json&formatversion=2`;
      const page = (await getJson(fetchImpl, pageUrl)) as { parse?: { wikitext?: string | { "*"?: string } } };
      const raw = page.parse?.wikitext;
      const wikitext = typeof raw === "string" ? raw : (raw?.["*"] ?? "");
      return parsePage(title, wikitext);
    }),
  );
  return { query, hits, links: lookupLinks(query) };
}
