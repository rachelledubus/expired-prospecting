import { NextResponse } from "next/server";
import { getToday, setDueDate, TodaySetupError } from "@/lib/today";
import { planShift, type Move } from "@/lib/today-shift";

export const dynamic = "force-dynamic";

const json = (status: number, message: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, message, ...extra }, { status });

/**
 * Restart the current task at the current time and shift the rest of today's schedule.
 * Behind the portal login (middleware). Writes only Due Date, only on tasks that Notion's own
 * Schedule view returned, and only with NOTION_TODAY_EDIT_API_KEY.
 */
export async function POST(request: Request) {
  // Same-origin only: the portal cookie is SameSite=Lax, and this adds a second check.
  const origin = request.headers.get("origin");
  const hosts = [request.headers.get("host"), request.headers.get("x-forwarded-host")].filter(Boolean);
  let originHost = "";
  try { originHost = origin ? new URL(origin).host : ""; } catch { /* invalid origin */ }
  if (!originHost || !hosts.includes(originHost)) return json(403, "This request did not come from the portal page.");

  const editKey = process.env.NOTION_TODAY_EDIT_API_KEY;
  if (!editKey) {
    return json(501, "Restart time is not set up yet. It needs the NOTION_TODAY_EDIT_API_KEY setting in Netlify. See docs/today-dashboard.md.");
  }

  const body = await request.json().catch(() => null);
  const taskId = body && typeof body.taskId === "string" ? body.taskId : "";
  if (!taskId) return json(400, "No task was given.");

  let data;
  try {
    data = await getToday();
  } catch (err) {
    return json(502, err instanceof TodaySetupError ? err.message : "Could not read today's schedule from Notion.");
  }

  const plan = planShift(data.schedule, taskId, Date.now());
  if (!plan.ok) return json(409, plan.message);

  // Apply one by one. If any write fails, put the ones already changed back.
  const done: Move[] = [];
  for (const m of plan.moves) {
    try {
      await setDueDate(editKey, m.id, { start: m.toStart, end: m.toEnd });
      done.push(m);
    } catch (err) {
      const failed: string[] = [];
      for (const d of done.reverse()) {
        try { await setDueDate(editKey, d.id, { start: d.fromStart, end: d.fromEnd }); } catch { failed.push(d.title); }
      }
      const reason = (err as { status?: number }).status === 403 || (err as { status?: number }).status === 404
        ? "Notion would not let this connection edit the Tasks database. Add the edit connection to the Tasks database in Notion."
        : "Notion did not accept the change.";
      return json(502, `${reason} ${failed.length ? `These could not be put back and need a look in Notion: ${failed.join(", ")}.` : "Nothing was changed."}`);
    }
  }
  const others = plan.moves.filter((m) => m.id !== plan.anchorId);
  return NextResponse.json({ ok: true, deltaMin: plan.deltaMin, moved: plan.moves.length, others: others.length,
    pushed: others.map((m) => ({ title: m.title, shiftMin: m.shiftMin })), leftFixed: plan.leftFixed, conflicts: plan.conflicts });
}
