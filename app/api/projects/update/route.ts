import { NextResponse } from "next/server";
import { checkProjectEdit, updateProject } from "@/lib/projects";
import { TodaySetupError } from "@/lib/today";

export const dynamic = "force-dynamic";

const json = (status: number, message: string) => NextResponse.json({ ok: false, message }, { status });

/**
 * Change one field on one project: moved today, next action, status, or due date. Behind the portal login
 * (middleware), same-origin only, edit key only, and limited to pages in the Projects database.
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const hosts = [request.headers.get("host"), request.headers.get("x-forwarded-host")].filter(Boolean);
  let originHost = "";
  try { originHost = origin ? new URL(origin).host : ""; } catch { /* invalid origin */ }
  if (!originHost || !hosts.includes(originHost)) return json(403, "This request did not come from the portal page.");

  const editKey = process.env.NOTION_TODAY_EDIT_API_KEY;
  if (!editKey) return json(501, "Editing projects needs the NOTION_TODAY_EDIT_API_KEY setting in Netlify. See docs/today-dashboard.md.");

  const body = await request.json().catch(() => null);
  const projectId = body && typeof body.projectId === "string" ? body.projectId : "";
  if (!projectId) return json(400, "No project was given.");
  const problem = checkProjectEdit(body.edit);
  if (problem) return json(400, problem);

  try {
    const result = await updateProject(editKey, projectId, body.edit);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof TodaySetupError) return json(409, err.message);
    const status = (err as { status?: number }).status;
    return json(502, status === 403 || status === 404
      ? "Notion would not let the edit connection change that project. In Notion, open the Projects database (This Week), choose ••• then Connections, and add \"Today (edit times)\"."
      : "Notion did not accept the change. Nothing was changed.");
  }
}
