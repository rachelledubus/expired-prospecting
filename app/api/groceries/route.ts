import { NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";
import { starterPlan, validateGroceryPlan } from "@/lib/grocery-plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const store = () => getStore({ name: "weekly-groceries", consistency: "strong" });
const key = "household-plan-v1";
const fail = (status: number, message: string) => NextResponse.json({ ok: false, message }, { status, headers: { "Cache-Control": "no-store" } });

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const sourceHost = new URL(origin).host;
    return [request.headers.get("host"), request.headers.get("x-forwarded-host")].includes(sourceHost);
  } catch { return false; }
}

export async function GET() {
  try {
    const record = await store().getWithMetadata(key, { type: "json" });
    if (!record) return NextResponse.json({ ok: true, plan: starterPlan(), etag: null }, { headers: { "Cache-Control": "no-store" } });
    const plan = validateGroceryPlan(record.data);
    if (!plan) return fail(503, "Your saved plan needs attention. It was not overwritten.");
    return NextResponse.json({ ok: true, plan, etag: record.etag }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Grocery plan read failed", error);
    return fail(503, "Saved groceries are temporarily unavailable. Try refreshing.");
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail(403, "Request must come from this portal.");
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 150000) return fail(413, "The plan is too large.");
    body = JSON.parse(raw);
  } catch { return fail(400, "Could not read grocery changes."); }
  if (!body || typeof body !== "object") return fail(400, "Invalid grocery plan.");
  const data = body as { plan?: unknown; etag?: unknown };
  const plan = validateGroceryPlan(data.plan);
  if (!plan || (data.etag !== null && typeof data.etag !== "string")) return fail(400, "Please check the food and package amounts.");
  try {
    const result = await store().setJSON(key, plan, data.etag === null ? { onlyIfNew: true } : { onlyIfMatch: data.etag as string });
    if (!result.modified) return fail(409, "This plan changed in another tab or device. Copy any unsaved edits, then refresh.");
    return NextResponse.json({ ok: true, etag: result.etag }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Grocery plan save failed", error);
    return fail(503, "Could not save right now. Your edits are still on this screen.");
  }
}
