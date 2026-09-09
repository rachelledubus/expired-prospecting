import { NextResponse } from "next/server";
import { upsertWatchlistProperty, type WatchlistRow } from "@/lib/propertyResearch";

export async function POST(request: Request) {
  const { rows } = (await request.json()) as { rows: WatchlistRow[] };

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows to import." }, { status: 400 });
  }

  const results: { address: string; action?: "created" | "updated"; url?: string; error?: string }[] = [];

  for (const row of rows) {
    const outcome = await upsertWatchlistProperty(row);
    if ("error" in outcome) {
      results.push({ address: row.address, error: outcome.error });
    } else {
      results.push({ address: row.address, action: outcome.action, url: outcome.url });
    }
  }

  return NextResponse.json({ results });
}
