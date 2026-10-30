import { NextResponse } from "next/server";
import { setHabitDone, TodaySetupError } from "@/lib/today";

export const dynamic = "force-dynamic";

const json = (status: number, message: string) => NextResponse.json({ ok: false, message }, { status });

/**
 * Check or uncheck one habit in Notion (its Checkbox). Behind the portal login (middleware),
 * same-origin only, edit key only, and limited to pages in the Habits + Routines database.
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const hosts = [request.headers.get("host"), request.headers.get("x-forwarded-host")].filter(Boolean);
  let originHost = "";
  try { originHost = origin ? new URL(origin).host : ""; } catch { /* invalid origin */ }
  if (!originHost || !hosts.includes(originHost)) return json(403, "This request did not come from the portal page.");

  const editKey = process.env.NOTION_TODAY_EDIT_API_KEY;
  if (!editKey) return json(501, "Checking habits off needs the NOTION_TODAY_EDIT_API_KEY setting in Netlify. See docs/today-dashboard.md.");

  const body = await request.json().catch(() => null);
  const habitId = body && typeof body.habitId === "string" ? body.habitId : "";
  if (!habitId || typeof body.done !== "boolean") return json(400, "No habit was given.");

  try {
    await setHabitDone(editKey, habitId, body.done);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof TodaySetupError) return json(409, err.message);
    const status = (err as { status?: number }).status;
    return json(502, status === 403 || status === 404
      ? "Notion would not let the edit connection change that habit. Add the \"Today (edit times)\" connection to the Habits + Routines database."
      : "Notion did not accept the change. Nothing was changed.");
  }
}
