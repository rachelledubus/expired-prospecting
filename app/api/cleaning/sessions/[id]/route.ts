import { NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/cleaning-system";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const fail = (code: number, message: string) => NextResponse.json({ ok: false, message }, { status: code });
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try { const session = await getSession(params.id); return session ? NextResponse.json({ ok: true, session }, { headers: { "Cache-Control": "no-store" } }) : fail(404, "Session not found."); }
  catch { return fail(503, "Saved cleaning progress is temporarily unavailable."); }
}
export async function POST(request: Request, { params }: { params: { id: string } }) {
  let originHost = "";
  try { originHost = new URL(request.headers.get("origin") || "").host; } catch {}
  if (!originHost || ![request.headers.get("host"), request.headers.get("x-forwarded-host")].includes(originHost)) return fail(403, "Request must come from your portal.");
  const body = await request.json().catch(() => null);
  if (!body || !["resolve", "skip", "sync"].includes(body.action)) return fail(400, "Unknown action.");
  if (body.action !== "sync" && typeof body.taskId !== "string") return fail(400, "Choose a task.");
  if (body.action === "resolve" && body.resolution !== null && body.resolution !== "done" && body.resolution !== "not-needed") return fail(400, "Choose Done or Not Needed.");
  try { return NextResponse.json({ ok: true, ...(await updateSession(params.id, body.action, body.taskId, body.resolution)) }); }
  catch (err) { return fail(409, err instanceof Error ? err.message : "Your changes weren't saved."); }
}
