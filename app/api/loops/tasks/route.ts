import { NextResponse } from "next/server";
import { applyBulk, checkApply, checkRestore, restoreBulk } from "@/lib/loops";
import { TodaySetupError } from "@/lib/today";

export const dynamic = "force-dynamic";

const json = (status: number, message: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, message, ...extra }, { status });

const NO_ACCESS =
  "Notion would not let the edit connection change those tasks. Add the \"Today (edit times)\" connection to the Tasks database.";

/**
 * Change a small batch of past-due tasks (the page sends big selections in batches), or put a batch back.
 * Behind the portal login (middleware), same-origin only, edit key only. Apply only touches tasks that are still
 * past due, not Done and not archived. Restore only touches Tasks rows. Nothing is created or deleted.
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const hosts = [request.headers.get("host"), request.headers.get("x-forwarded-host")].filter(Boolean);
  let originHost = "";
  try { originHost = origin ? new URL(origin).host : ""; } catch { /* invalid origin */ }
  if (!originHost || !hosts.includes(originHost)) return json(403, "This request did not come from the portal page.");

  const editKey = process.env.NOTION_TODAY_EDIT_API_KEY;
  if (!editKey) return json(501, "Changing tasks needs the NOTION_TODAY_EDIT_API_KEY setting in Netlify. See docs/today-dashboard.md.");

  const body = await request.json().catch(() => null);
  if (!body || (body.mode !== "apply" && body.mode !== "restore")) return json(400, "No change was given.");

  try {
    if (body.mode === "apply") {
      const problem = checkApply(body);
      if (problem) return json(400, problem);
      const r = await applyBulk(editKey, body.action, body.ids);
      if (r.changed.length === 0 && r.failed > 0) {
        return json(502, r.lastStatus === 403 || r.lastStatus === 404 ? NO_ACCESS : "Notion did not accept the change. Nothing was changed.");
      }
      return NextResponse.json({ ok: true, ...r });
    }
    const problem = checkRestore(body);
    if (problem) return json(400, problem);
    const r = await restoreBulk(editKey, body.items);
    if (r.restored === 0 && r.failed > 0) {
      return json(502, r.lastStatus === 403 || r.lastStatus === 404 ? NO_ACCESS : "Notion did not accept the change. Nothing was changed.");
    }
    return NextResponse.json({ ok: true, ...r });
  } catch (err) {
    if (err instanceof TodaySetupError) return json(409, err.message);
    return json(502, "Notion did not answer. Nothing more was changed.");
  }
}
