import { NextResponse } from "next/server";
import { config, notion, readBool, readText, TodaySetupError } from "@/lib/today";

export const dynamic = "force-dynamic";

const ID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
const PREVIOUS_STATUSES = new Set(["Schedule", "Hold", "Do Next", "Inbox", "Waiting for", "Scheduled", "In progress"]);
const json = (status: number, message: string) =>
  NextResponse.json({ ok: false, message }, { status });

/**
 * Mark a task done in Notion (or undo a completion made from Today).
 * The portal session is checked by middleware, edits are same-origin, and only
 * a page in the known Tasks data source with a Status property may be edited.
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const hosts = [request.headers.get("host"), request.headers.get("x-forwarded-host")].filter(Boolean);
  let originHost = "";
  try { originHost = origin ? new URL(origin).host : ""; } catch { /* invalid origin */ }
  if (!originHost || !hosts.includes(originHost)) return json(403, "This request did not come from the portal page.");

  const key = process.env.NOTION_TODAY_EDIT_API_KEY;
  if (!key) return json(501, "Marking tasks done requires the Today edit connection in Netlify.");

  const body = await request.json().catch(() => null);
  const taskId = typeof body?.taskId === "string" ? body.taskId : "";
  const mode = body?.mode;
  if (!ID.test(taskId) || (mode !== "complete" && mode !== "undo")) return json(400, "Choose a valid task and action.");
  if (mode === "undo" && !PREVIOUS_STATUSES.has(body?.previousStatus)) return json(400, "That previous status cannot be restored.");

  try {
    const cfg = config();
    const page = await notion(`/v1/pages/${taskId}`, { key });
    const parent = page.parent?.data_source_id ?? page.parent?.database_id ?? null;
    if (parent !== cfg.tasksDataSourceId || page.properties?.Status?.type !== "status" || page.archived || readBool(page.properties?.Archive)) {
      throw new TodaySetupError("This item cannot be changed because it is not an active task.");
    }
    const current = readText(page.properties.Status);
    if (mode === "complete") {
      if (current === "Done") return NextResponse.json({ ok: true, status: "Done", previousStatus: null });
      if (!PREVIOUS_STATUSES.has(current)) return json(409, "This task has a status that should be changed in Notion.");
      await notion(`/v1/pages/${taskId}`, { method: "PATCH", key,
        body: { properties: { Status: { status: { name: "Done" } } } } });
      return NextResponse.json({ ok: true, status: "Done", previousStatus: current });
    }
    if (current !== "Done") return json(409, "The task status changed since you finished it. Refresh to see the latest value.");
    await notion(`/v1/pages/${taskId}`, { method: "PATCH", key,
      body: { properties: { Status: { status: { name: body.previousStatus } } } } });
    return NextResponse.json({ ok: true, status: body.previousStatus });
  } catch (err) {
    if (err instanceof TodaySetupError) return json(409, err.message);
    const status = (err as { status?: number }).status;
    return json(502, status === 403 || status === 404
      ? 'Notion would not let the edit connection update that task. Add "Today (edit times)" to the Tasks database.'
      : "Notion could not save the change. Your task remains unchanged.");
  }
}
