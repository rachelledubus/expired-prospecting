import { getProjects } from "@/lib/projects";
import {
  CAPTURE_TYPES, ROUTE_FOR, sortLine, splitLines, type CaptureType, type ProjectRef, type Sorted,
} from "@/lib/inbox-sort";
import {
  config, etDate, explain, mapLimit, notion, readDate, readText, TodaySetupError,
} from "@/lib/today";

/** Every row the portal creates starts its Captured Context with this. It is how the portal knows a row is its own. */
export const CAPTURE_PREFIX = "Portal capture: ";
export const MAX_LINES = 10;
export const MAX_LINE_CHARS = 300;
const RECENT_DAYS = 3;

export type InboxItem = {
  id: string;
  url: string;
  title: string;
  original: string;
  type: string | null;
  route: string | null;
  projectId: string | null;
  projectName: string | null;
  due: string | null;
  status: string;
  /** True for rows captured here. Only these can be changed from the page. */
  mine: boolean;
  /** Sorted for her and filed as a normal task. */
  filed: boolean;
};

export type InboxData = {
  fetchedAt: string;
  today: string;
  canEdit: boolean;
  projects: ProjectRef[];
  filed: InboxItem[];
  needs: InboxItem[];
  needsMore: boolean;
  warnings: string[];
};

// ---------- reading ----------

function relationIds(prop: any): string[] {
  return prop?.type === "relation" && Array.isArray(prop.relation) ? prop.relation.map((r: any) => String(r.id)) : [];
}

const bare = (id: string) => id.replace(/-/g, "").toLowerCase();

function toItem(page: any, names: Map<string, string>): InboxItem {
  const p = page.properties ?? {};
  const context = readText(p["Captured Context"]);
  const mine = context.startsWith(CAPTURE_PREFIX);
  const rel = relationIds(p["Project"])[0] ?? null;
  return {
    id: page.id,
    url: page.url,
    title: readText(p["Task"]) || "(untitled)",
    original: mine ? context.slice(CAPTURE_PREFIX.length) : context,
    type: readText(p["Capture Type"]) || null,
    route: readText(p["Route Destination"]) || null,
    projectId: rel,
    projectName: rel ? names.get(bare(rel)) ?? null : null,
    due: readDate(p["Due Date"]).start?.slice(0, 10) ?? null,
    status: readText(p["Status"]) || "",
    mine,
    filed: readText(p["Intake State"]) === "Routed",
  };
}

export async function getInbox(): Promise<InboxData> {
  const cfg = config();
  const now = new Date();
  const warnings: string[] = [];
  const cutoff = new Date(now.getTime() - RECENT_DAYS * 86400000).toISOString();

  const query = (filter: unknown, size: number) =>
    notion(`/v1/data_sources/${cfg.tasksDataSourceId}/query`, {
      method: "POST",
      body: { filter, sorts: [{ timestamp: "created_time", direction: "descending" }], page_size: size },
    });

  const [pj, a, b] = await Promise.allSettled([
    getProjects(),
    query(
      {
        and: [
          { property: "Archive", checkbox: { equals: false } },
          { property: "Captured Context", rich_text: { starts_with: CAPTURE_PREFIX } },
          { property: "Intake State", select: { equals: "Routed" } },
          { timestamp: "created_time", created_time: { on_or_after: cutoff } },
        ],
      },
      30,
    ),
    query(
      {
        and: [
          { property: "Archive", checkbox: { equals: false } },
          { property: "Intake State", select: { equals: "Inbox" } },
          { property: "Status", status: { does_not_equal: "Done" } },
        ],
      },
      50,
    ),
  ]);

  if (a.status === "rejected" && b.status === "rejected") throw explain(b.reason, "the Inbox");

  let projects: ProjectRef[] = [];
  const names = new Map<string, string>();
  if (pj.status === "fulfilled") {
    projects = [...pj.value.active, ...pj.value.someday].map((p) => ({ id: p.id, name: p.name }));
    for (const p of projects) names.set(bare(p.id), p.name);
  } else warnings.push("Projects could not be read, so items cannot be matched to a project right now.");

  const filed = a.status === "fulfilled" ? (a.value.results ?? []).map((r: any) => toItem(r, names)) : [];
  if (a.status === "rejected") warnings.push(explain(a.reason, "recently sorted items").message);
  const needs = b.status === "fulfilled" ? (b.value.results ?? []).map((r: any) => toItem(r, names)) : [];
  if (b.status === "rejected") warnings.push(explain(b.reason, "items that need a look").message);

  return {
    fetchedAt: now.toISOString(),
    today: etDate(now),
    canEdit: Boolean(cfg.editKey),
    projects,
    filed,
    needs,
    needsMore: b.status === "fulfilled" && Boolean(b.value.has_more),
    warnings,
  };
}

// ---------- adding ----------

function propsFor(s: Sorted): Record<string, unknown> {
  const props: Record<string, unknown> = {
    Task: { title: [{ type: "text", text: { content: s.title.slice(0, 1900) } }] },
    Status: { status: { name: s.sorted ? (s.due ? "Scheduled" : "Schedule") : "Inbox" } },
    "Intake State": { select: { name: s.sorted ? "Routed" : "Inbox" } },
    "Capture Type": { select: { name: s.type } },
    "Captured Context": { rich_text: [{ type: "text", text: { content: (CAPTURE_PREFIX + s.original).slice(0, 1900) } }] },
  };
  if (s.route) props["Route Destination"] = { select: { name: s.route } };
  if (s.projectId) props["Project"] = { relation: [{ id: s.projectId }] };
  if (s.due) props["Due Date"] = { date: { start: s.due, end: null } };
  return props;
}

export function checkCapture(body: any): string | null {
  if (typeof body?.text !== "string") return "Nothing was typed.";
  const lines = splitLines(body.text);
  if (lines.length === 0) return "Nothing was typed.";
  if (lines.length > MAX_LINES) return `Add up to ${MAX_LINES} items at a time. This has ${lines.length}.`;
  if (lines.some((l) => l.length > MAX_LINE_CHARS)) return `Keep each item under ${MAX_LINE_CHARS} characters. Put longer notes on their own line breaks.`;
  return null;
}

export type Created = InboxItem & { why: string[] };

export async function captureItems(key: string, text: string): Promise<{ created: Created[]; failed: number; lastStatus?: number }> {
  const cfg = config();
  const today = etDate(new Date());
  let projects: ProjectRef[] = [];
  try {
    const pj = await getProjects();
    projects = pj.active.map((p) => ({ id: p.id, name: p.name }));
  } catch {
    // Without projects the items are still saved. They just are not matched to a project.
  }
  const sorted = splitLines(text).map((l) => sortLine(l, today, projects));
  const created: Created[] = [];
  let failed = 0;
  let lastStatus: number | undefined;
  // One at a time, in order, so the Inbox keeps the order she typed them in.
  await mapLimit(sorted, 1, async (s) => {
    try {
      const page = await notion("/v1/pages", {
        method: "POST",
        key,
        body: { parent: { type: "data_source_id", data_source_id: cfg.tasksDataSourceId }, properties: propsFor(s) },
      });
      created.push({
        id: page.id, url: page.url, title: s.title, original: s.original, type: s.type, route: s.route,
        projectId: s.projectId, projectName: s.projectName, due: s.due,
        status: s.sorted ? (s.due ? "Scheduled" : "Schedule") : "Inbox", mine: true, filed: s.sorted, why: s.why,
      });
    } catch (err) {
      failed += 1;
      lastStatus = (err as { status?: number }).status;
    }
  });
  return { created, failed, lastStatus };
}

// ---------- changing and undoing ----------

const ID = /^[0-9a-f-]{32,36}$/i;
const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** Reads a page and refuses anything that is not a Task row the portal created. */
async function readMine(key: string, id: string): Promise<any> {
  const cfg = config();
  const page = await notion(`/v1/pages/${id}`, { key });
  const parent: string | null = page.parent?.data_source_id ?? page.parent?.database_id ?? null;
  const context = readText(page.properties?.["Captured Context"]);
  if (parent === null || parent !== cfg.tasksDataSourceId || !context.startsWith(CAPTURE_PREFIX)) {
    throw new TodaySetupError("That item was not added from this page, so it was left alone.");
  }
  return page;
}

export type Fix = { id: string; type?: CaptureType; project?: string | null; due?: string | null; task?: boolean };

export function checkFix(body: any): string | null {
  if (!body || typeof body.id !== "string" || !ID.test(body.id)) return "An item id was not valid.";
  if (body.type !== undefined && !CAPTURE_TYPES.includes(body.type)) return "That is not a type this page can set.";
  if (body.project !== undefined && body.project !== null && (typeof body.project !== "string" || !ID.test(body.project))) return "A project id was not valid.";
  if (body.due !== undefined && body.due !== null) {
    if (typeof body.due !== "string" || !YMD.test(body.due) || Number.isNaN(Date.parse(`${body.due}T00:00:00Z`))) return "That date is not valid.";
  }
  if (body.task !== undefined && typeof body.task !== "boolean") return "That choice was not valid.";
  if (body.type === undefined && body.project === undefined && body.due === undefined && !body.task) return "Nothing to change.";
  return null;
}

export async function fixItem(key: string, fix: Fix): Promise<{ item: InboxItem }> {
  const page = await readMine(key, fix.id);
  const p = page.properties ?? {};
  const names = new Map<string, string>();
  if (fix.project) {
    const pj = await getProjects();
    const all = [...pj.active, ...pj.someday];
    const hit = all.find((x) => bare(x.id) === bare(fix.project!));
    if (!hit) throw new TodaySetupError("That project was not found, so nothing was changed.");
    names.set(bare(hit.id), hit.name);
  }

  const props: Record<string, unknown> = {};
  const curType = (readText(p["Capture Type"]) || "Task") as CaptureType;
  const type: CaptureType = fix.task ? "Task" : fix.type ?? curType;
  if (fix.type !== undefined || fix.task) {
    props["Capture Type"] = { select: { name: type } };
    const route = ROUTE_FOR[type];
    props["Route Destination"] = { select: route ? { name: route } : null };
  }
  if (fix.project !== undefined) props["Project"] = { relation: fix.project ? [{ id: fix.project }] : [] };
  const curDue = readDate(p["Due Date"]).start?.slice(0, 10) ?? null;
  const due = fix.due !== undefined ? fix.due : curDue;
  if (fix.due !== undefined) props["Due Date"] = { date: fix.due ? { start: fix.due, end: null } : null };

  // A task is filed as a normal task. Anything else waits in the Inbox for a proper home.
  const curStatus = readText(p["Status"]);
  const movable = ["Inbox", "Schedule", "Scheduled"].includes(curStatus);
  if (type === "Task") {
    props["Intake State"] = { select: { name: "Routed" } };
    if (movable) props["Status"] = { status: { name: due ? "Scheduled" : "Schedule" } };
  } else {
    props["Intake State"] = { select: { name: "Inbox" } };
    if (movable) props["Status"] = { status: { name: "Inbox" } };
  }

  const updated = await notion(`/v1/pages/${fix.id}`, { method: "PATCH", key, body: { properties: props } });
  return { item: toItem(updated, names) };
}

export type Prev = { id: string; intake: "Inbox" | "Routed"; status: string };

const PREV_STATUSES = ["Inbox", "Schedule", "Scheduled", "Do Next", "Hold", "Waiting for", "In progress"];

export function checkIds(body: any): string | null {
  if (!Array.isArray(body?.ids) || body.ids.length === 0) return "No items were chosen.";
  if (body.ids.length > MAX_LINES) return `Send at most ${MAX_LINES} items at a time.`;
  return body.ids.every((i: unknown) => typeof i === "string" && ID.test(i)) ? null : "An item id was not valid.";
}

export function checkRestore(body: any): string | null {
  if (!Array.isArray(body?.items) || body.items.length === 0) return "Nothing to put back.";
  if (body.items.length > MAX_LINES) return `Send at most ${MAX_LINES} items at a time.`;
  for (const it of body.items) {
    if (!it || typeof it.id !== "string" || !ID.test(it.id)) return "An item id was not valid.";
    if (it.intake !== "Inbox" && it.intake !== "Routed") return "A value was not valid.";
    if (!PREV_STATUSES.includes(it.status)) return "A status was not valid.";
  }
  return null;
}

/** Removes items the portal added (archived, marked Dropped). They stay in Notion and can be put back. */
export async function dropItems(key: string, ids: string[]): Promise<{ dropped: Prev[]; failed: number; refused: number; lastStatus?: number }> {
  const dropped: Prev[] = [];
  let failed = 0;
  let refused = 0;
  let lastStatus: number | undefined;
  await mapLimit(ids, 3, async (id) => {
    try {
      const page = await readMine(key, id);
      const intake = readText(page.properties?.["Intake State"]) === "Routed" ? "Routed" : "Inbox";
      const status = readText(page.properties?.["Status"]);
      await notion(`/v1/pages/${id}`, {
        method: "PATCH",
        key,
        body: { properties: { Archive: { checkbox: true }, "Intake State": { select: { name: "Dropped" } } } },
      });
      dropped.push({ id, intake, status: PREV_STATUSES.includes(status) ? status : "Inbox" });
    } catch (err) {
      if (err instanceof TodaySetupError) refused += 1;
      else {
        failed += 1;
        lastStatus = (err as { status?: number }).status;
      }
    }
  });
  return { dropped, failed, refused, lastStatus };
}

export async function restoreItems(key: string, items: Prev[]): Promise<{ restored: number; failed: number; refused: number; lastStatus?: number }> {
  let restored = 0;
  let failed = 0;
  let refused = 0;
  let lastStatus: number | undefined;
  await mapLimit(items, 3, async (it) => {
    try {
      await readMine(key, it.id);
      await notion(`/v1/pages/${it.id}`, {
        method: "PATCH",
        key,
        body: {
          properties: {
            Archive: { checkbox: false },
            "Intake State": { select: { name: it.intake } },
            Status: { status: { name: it.status } },
          },
        },
      });
      restored += 1;
    } catch (err) {
      if (err instanceof TodaySetupError) refused += 1;
      else {
        failed += 1;
        lastStatus = (err as { status?: number }).status;
      }
    }
  });
  return { restored, failed, refused, lastStatus };
}
