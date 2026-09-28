import { NextRequest, NextResponse } from "next/server";
import type { MarketSnapshot } from "@/lib/mls-intake";

function isSnapshot(value: unknown): value is MarketSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<MarketSnapshot>;
  return snapshot.version === 1 &&
    typeof snapshot.generatedAt === "string" &&
    typeof snapshot.scope === "string" &&
    Array.isArray(snapshot.areas) &&
    snapshot.areas.length > 0;
}

export async function POST(request: NextRequest) {
  const publishUrl = process.env.MARKET_PUBLISH_URL;
  const publishSecret = process.env.MARKET_PUBLISH_SECRET;

  if (!publishUrl || !publishSecret) {
    return NextResponse.json(
      { ok: false, error: "Market publishing is not configured yet." },
      { status: 503 }
    );
  }

  let body: { snapshot?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  if (!isSnapshot(body.snapshot)) {
    return NextResponse.json({ ok: false, error: "Invalid market snapshot." }, { status: 400 });
  }

  const upstream = await fetch(publishUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publishSecret}`,
    },
    body: JSON.stringify(body.snapshot),
    cache: "no-store",
  });

  const responseBody = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return NextResponse.json(
      { ok: false, error: responseBody?.error ?? `Public-site publish failed (${upstream.status}).` },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, publishedAt: body.snapshot.generatedAt });
}
