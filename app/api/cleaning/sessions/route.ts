import { NextResponse } from "next/server";
import { getSessions, getTemplate, startSession } from "@/lib/cleaning-system";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const fail = (code: number, message: string) => NextResponse.json({ ok: false, message }, { status: code });
function sameOrigin(request: Request) {
  try { const origin = new URL(request.headers.get("origin") || ""); return [request.headers.get("host"), request.headers.get("x-forwarded-host")].includes(origin.host); }
  catch { return false; }
}
export async function GET() {
  try { return NextResponse.json({ ok: true, sessions: await getSessions() }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return fail(503, "Cleaning history is currently unavailable. Existing progress was not changed."); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail(403, "Request must come from your portal.");
  const body = await request.json().catch(() => null);
  if (!body || typeof body.templateId !== "string" || !getTemplate(body.templateId) || typeof body.startFresh !== "boolean") return fail(400, "Choose a valid cleaning routine.");
  try { return NextResponse.json({ ok: true, session: await startSession(body.templateId, body.startFresh) }); }
  catch (err) { return fail(503, err instanceof Error ? err.message : "Could not start cleaning."); }
}
