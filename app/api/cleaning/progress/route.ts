import { NextResponse } from "next/server";
import { loadDeepCleanProgress, saveDeepCleanCheck } from "@/lib/deep-clean-store";
import { ALL_CLEAN_IDS } from "@/lib/deep-clean-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const fail = (status: number, message: string) => NextResponse.json({ ok: false, message }, { status });

export async function GET() {
  try {
    const progress = await loadDeepCleanProgress();
    return NextResponse.json({ ok: true, progress }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Deep clean progress read failed", error);
    return fail(500, "Saved cleaning progress is unavailable.");
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const hosts = [request.headers.get("host"), request.headers.get("x-forwarded-host")].filter(Boolean);
  let originHost = "";
  try { originHost = origin ? new URL(origin).host : ""; } catch { /* invalid */ }
  if (!originHost || !hosts.includes(originHost)) return fail(403, "This request must come from your portal.");
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string" || !ALL_CLEAN_IDS.has(body.id) || typeof body.done !== "boolean") {
    return fail(400, "Invalid cleaning task update.");
  }
  try {
    const progress = await saveDeepCleanCheck(body.id, body.done);
    return NextResponse.json({ ok: true, progress });
  } catch (error) {
    console.error("Deep clean progress write failed", error);
    return fail(500, "Your checkmark could not be saved.");
  }
}
