import { NextResponse } from "next/server";
import { captureItems, checkCapture, checkFix, checkIds, checkRestore, dropItems, fixItem, restoreItems } from "@/lib/inbox";
import { TodaySetupError } from "@/lib/today";

export const dynamic = "force-dynamic";

const json = (status: number, message: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, message, ...extra }, { status });

const NO_ACCESS =
  "Notion would not let the edit connection do that. In Notion's integration settings (notion.so/profile/integrations), open \"Today (edit times)\" " +
  "and, under Capabilities, turn on \"Insert content\" and \"Update content\". Also make sure the Tasks database is shared with it.";

const NOT_MINE = "That item was not added from this page, so it was left alone.";

/**
 * Adds items to the Inbox, changes the ones this page added, or removes them (with undo).
 * Behind the portal login (middleware), same-origin only, edit key only. It only ever creates rows in the Tasks
 * database, and only changes or archives rows whose Captured Context starts with the portal marker.
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const hosts = [request.headers.get("host"), request.headers.get("x-forwarded-host")].filter(Boolean);
  let originHost = "";
  try { originHost = origin ? new URL(origin).host : ""; } catch { /* invalid origin */ }
  if (!originHost || !hosts.includes(originHost)) return json(403, "This request did not come from the portal page.");

  const editKey = process.env.NOTION_TODAY_EDIT_API_KEY;
  if (!editKey) return json(501, "Adding to the Inbox needs the NOTION_TODAY_EDIT_API_KEY setting in Netlify. See docs/today-dashboard.md.");

  const body = await request.json().catch(() => null);
  const mode = body?.mode;
  if (!["capture", "fix", "drop", "restore"].includes(mode)) return json(400, "No change was given.");

  try {
    if (mode === "capture") {
      const problem = checkCapture(body);
      if (problem) return json(400, problem);
      const r = await captureItems(editKey, body.text);
      if (r.created.length === 0 && r.failed > 0) {
        return json(502, r.lastStatus === 403 || r.lastStatus === 404 ? NO_ACCESS : "Notion did not accept the items. Nothing was added.");
      }
      return NextResponse.json({ ok: true, ...r });
    }
    if (mode === "fix") {
      const problem = checkFix(body);
      if (problem) return json(400, problem);
      const r = await fixItem(editKey, { id: body.id, type: body.type, project: body.project, due: body.due, task: body.task });
      return NextResponse.json({ ok: true, ...r });
    }
    if (mode === "drop") {
      const problem = checkIds(body);
      if (problem) return json(400, problem);
      const r = await dropItems(editKey, body.ids);
      if (r.dropped.length === 0 && r.refused > 0 && r.failed === 0) return json(409, NOT_MINE);
      if (r.dropped.length === 0 && r.failed > 0) {
        return json(502, r.lastStatus === 403 || r.lastStatus === 404 ? NO_ACCESS : "Notion did not accept the change. Nothing was changed.");
      }
      return NextResponse.json({ ok: true, ...r });
    }
    const problem = checkRestore(body);
    if (problem) return json(400, problem);
    const r = await restoreItems(editKey, body.items);
    if (r.restored === 0 && r.refused > 0 && r.failed === 0) return json(409, NOT_MINE);
    if (r.restored === 0 && r.failed > 0) {
      return json(502, r.lastStatus === 403 || r.lastStatus === 404 ? NO_ACCESS : "Notion did not accept the change. Nothing was changed.");
    }
    return NextResponse.json({ ok: true, ...r });
  } catch (err) {
    if (err instanceof TodaySetupError) return json(409, err.message);
    const status = (err as { status?: number }).status;
    if (status === 403 || status === 404) return json(502, NO_ACCESS);
    return json(502, "Notion did not answer. Nothing more was changed.");
  }
}
