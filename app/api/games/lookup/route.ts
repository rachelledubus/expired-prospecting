import { NextResponse } from "next/server";
import { cleanQuery, lookup, lookupLinks } from "@/lib/wiki-lookup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Look an item up on the Stardew Valley wiki. Behind the portal login (middleware).
 * The server only ever reads stardewvalleywiki.com, and the search words are cleaned first.
 */
export async function GET(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ ok: false, message: "This request did not come from the portal page." }, { status: 403 });
  }
  const query = cleanQuery(new URL(request.url).searchParams.get("q"));
  if (!query) return NextResponse.json({ ok: false, message: "Type at least two letters to look something up." }, { status: 400 });
  try {
    const result = await lookup(query);
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "private, max-age=3600" } });
  } catch (error) {
    console.error("Wiki lookup failed", error);
    return NextResponse.json(
      { ok: false, message: "The wiki did not answer. Try again in a moment, or use the links below.", links: lookupLinks(query) },
      { status: 502 },
    );
  }
}
