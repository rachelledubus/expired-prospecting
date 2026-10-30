import { NextResponse } from "next/server";
import { applyPatch, findGame, loadProgress, parsePatch } from "@/lib/games-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (status: number, message: string) => NextResponse.json({ ok: false, message }, { status });

/** Read one game's saved progress. Behind the portal login (middleware). */
export async function GET(request: Request) {
  const game = findGame(new URL(request.url).searchParams.get("game"));
  if (!game) return json(404, "That game is not in the list.");
  try {
    const progress = await loadProgress(game);
    return NextResponse.json({ ok: true, progress }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Games progress read failed", error);
    return json(500, "Saved progress is unavailable right now.");
  }
}

/**
 * Save changes to one game's progress: boxes checked or cleared, text fields, or a reset.
 * Behind the portal login (middleware), same-origin only, and limited to boxes that exist in the checklist.
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const hosts = [request.headers.get("host"), request.headers.get("x-forwarded-host")].filter(Boolean);
  let originHost = "";
  try {
    originHost = origin ? new URL(origin).host : "";
  } catch {
    /* invalid origin */
  }
  if (!originHost || !hosts.includes(originHost)) return json(403, "This request did not come from the portal page.");

  const body = await request.json().catch(() => null);
  const game = findGame(body?.game);
  if (!game) return json(404, "That game is not in the list.");

  const patch = parsePatch(game, body?.patch);
  if (typeof patch === "string") return json(400, patch);

  try {
    const progress = await applyPatch(game, patch);
    return NextResponse.json({ ok: true, progress });
  } catch (error) {
    console.error("Games progress save failed", error);
    return json(500, "Could not save progress. Nothing was changed.");
  }
}
