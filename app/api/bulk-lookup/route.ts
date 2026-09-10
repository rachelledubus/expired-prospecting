import { NextResponse } from "next/server";
import type { LookupResult } from "@/lib/tracerfy";
import { queryLeadsByAddress, type ExistingLeadRecord } from "@/lib/notion";

type Row = { address: string; city: string; state: string; zip: string };
type BulkResult = LookupResult & { rowError?: string; alreadyInCrm?: ExistingLeadRecord[] };

export async function POST(request: Request) {
  const { rows, forceAll } = (await request.json()) as { rows: Row[]; forceAll?: boolean };

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

  // This portal is intentionally scoped to the South Florida prospecting area.
  // Matrix exports use a column named "St" for listing status (A, CS, etc.) and
  // may omit a normal state column, so never trust the imported state value.
  // Force FL here before CRM duplicate checks or paid Tracerfy requests.
  const results: BulkResult[] = [];

  // Tracerfy's trace/lookup endpoint only accepts one address object per
  // request (its docs describe array/batch support, but the live API's own
  // OpenAPI schema shows a single flat object with no array variant — this
  // was confirmed directly against the endpoint, not assumed). So we call it
  // once per row, sequentially. Its rate limit is 500 items/minute, well
  // above what a manual CSV import needs.
  for (const row of rows) {
    const normalizedRow = { ...row, state: "FL" };
    const fullAddress = `${normalizedRow.address}, ${normalizedRow.city}, ${normalizedRow.state} ${normalizedRow.zip}`;

    if (!forceAll) {
      const existing = await queryLeadsByAddress(fullAddress);
      if (existing.length > 0) {
        results.push({
          address: normalizedRow.address,
          city: normalizedRow.city,
          state: normalizedRow.state,
          zip: normalizedRow.zip,
          hit: false,
          persons_count: 0,
          credits_deducted: 0,
          persons: [],
          alreadyInCrm: existing,
        });
        continue;
      }
    }

    const tracerfyRes = await fetch(`${base}/trace/lookup/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address: normalizedRow.address,
        city: normalizedRow.city,
        state: normalizedRow.state,
        zip: normalizedRow.zip,
        find_owner: true,
      }),
    });

    if (!tracerfyRes.ok) {
      const rawText = await tracerfyRes.text();
      results.push({
        address: normalizedRow.address,
        city: normalizedRow.city,
        state: normalizedRow.state,
        zip: normalizedRow.zip,
        hit: false,
        persons_count: 0,
        credits_deducted: 0,
        persons: [],
        rowError: `Tracerfy error (${tracerfyRes.status}): ${rawText.slice(0, 300)}`,
      });
      continue;
    }

    const data: LookupResult = await tracerfyRes.json();
    results.push(data);
  }

  return NextResponse.json({ results });
}
