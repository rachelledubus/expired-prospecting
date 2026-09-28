import { getDeployStore, getStore } from "@netlify/blobs";
import { NextRequest, NextResponse } from "next/server";
import type { MarketSnapshot } from "@/lib/mls-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function store() {
  return process.env.CONTEXT === "production"
    ? getStore("market-snapshots", { consistency: "strong" })
    : getDeployStore("market-snapshots");
}

function isMarketSnapshot(value: unknown): value is MarketSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<MarketSnapshot>;
  return snapshot.version === 1 &&
    typeof snapshot.generatedAt === "string" &&
    typeof snapshot.scope === "string" &&
    Array.isArray(snapshot.areas) &&
    snapshot.areas.length > 0 &&
    snapshot.areas.every((area) =>
      area &&
      typeof area.name === "string" &&
      typeof area.slug === "string" &&
      typeof area.activeListings === "number" &&
      typeof area.closedSales === "number"
    );
}

export async function GET() {
  try {
    const snapshot = await store().get("latest", { type: "json" }) as MarketSnapshot | null;
    return NextResponse.json(
      snapshot ? { ok: true, snapshot } : { ok: true, snapshot: null },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Market snapshot read failed", error);
    return NextResponse.json({ ok: false, error: "Market snapshot unavailable." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let snapshot: unknown;
  try {
    const body = await request.json();
    snapshot = body?.snapshot;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  if (!isMarketSnapshot(snapshot)) {
    return NextResponse.json({ ok: false, error: "Invalid market snapshot." }, { status: 400 });
  }

  try {
    const s = store();
    await s.setJSON("latest", snapshot);
    await s.setJSON(`history/${snapshot.generatedAt.slice(0, 10)}`, snapshot);
    return NextResponse.json({ ok: true, publishedAt: snapshot.generatedAt });
  } catch (error) {
    console.error("Market snapshot save failed", error);
    return NextResponse.json({ ok: false, error: "Could not save market snapshot." }, { status: 500 });
  }
}
