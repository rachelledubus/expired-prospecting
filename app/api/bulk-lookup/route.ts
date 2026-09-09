import { NextResponse } from "next/server";
import type { LookupResult } from "@/lib/tracerfy";

const BATCH_SIZE = 15;

type Row = { address: string; city: string; state: string; zip: string };

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function POST(request: Request) {
  const { rows } = (await request.json()) as { rows: Row[] };

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows to look up." }, { status: 400 });
  }

  const base = process.env.TRACERFY_API_BASE;
  const key = process.env.TRACERFY_API_KEY;

  if (!base || !key) {
    return NextResponse.json(
      { error: "Tracerfy API is not configured on the server." },
      { status: 500 }
    );
  }

  const batches = chunk(rows, BATCH_SIZE);
  const results: LookupResult[] = [];

  for (const batch of batches) {
    const tracerfyRes = await fetch(`${base}/trace/lookup/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        batch.map((row) => ({
          address: row.address,
          city: row.city,
          state: row.state,
          zip: row.zip,
          find_owner: true,
        }))
      ),
    });

    if (!tracerfyRes.ok) {
      const errorBody = await tracerfyRes.json().catch(() => null);
      return NextResponse.json(
        {
          error: errorBody?.error ?? `Tracerfy batch lookup failed (${tracerfyRes.status}).`,
          completed: results,
        },
        { status: tracerfyRes.status }
      );
    }

    const batchResults: LookupResult[] = await tracerfyRes.json();
    results.push(...batchResults);
  }

  return NextResponse.json({ results });
}
