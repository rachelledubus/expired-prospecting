import { NextResponse } from "next/server";
import { queryLeadsByAddress } from "@/lib/notion";

export async function POST(request: Request) {
  const body = await request.json();
  const { address, city, state, zip, force } = body;

  if (!address || !city || !state || !zip) {
    return NextResponse.json(
      { error: "Address, city, state, and zip are all required." },
      { status: 400 }
    );
  }

  const fullAddress = `${address}, ${city}, ${state} ${zip}`;

  if (!force) {
    const existingRecords = await queryLeadsByAddress(fullAddress);
    if (existingRecords.length > 0) {
      return NextResponse.json({ existingRecords });
    }
  }

  const base = process.env.TRACERFY_API_BASE;
  const key = process.env.TRACERFY_API_KEY;

  if (!base || !key) {
    return NextResponse.json(
      { error: "Tracerfy API is not configured on the server." },
      { status: 500 }
    );
  }

  const tracerfyRes = await fetch(`${base}/trace/lookup/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ address, city, state, zip, find_owner: true }),
  });

  const data = await tracerfyRes.json();

  if (!tracerfyRes.ok) {
    return NextResponse.json(
      { error: data?.error ?? "Tracerfy lookup failed." },
      { status: tracerfyRes.status }
    );
  }

  return NextResponse.json(data);
}
