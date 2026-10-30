import { getProjects, type ProjectCard } from "@/lib/projects";
import {
  config, dayNumber, etDate, etDayBounds, explain, getWaiting, mapLimit, notion, readBool, readDate, readText, TodaySetupError,
  type WaitingItem,
} from "@/lib/today";

const MAX_PAGES = 3; // 300 tasks. Anything beyond that is reported as "300+".
const WAITING_UNDATED_DAYS = 14;

export type DueDate = { start: string; end: string | null; timeZone: string | null };

export type LoopTask = {
  id: string;
  url: string;
  title: string;
  status: string;
  due: DueDate;
  /** Day shown to her, in Eastern time. */
  day: string;
};

export type QuietProject = ProjectCard & { quietDays: number };

export type LoopsData = {
  fetchedAt: string;
  today: string;
  canEdit: boolean;
  waiting: WaitingItem[];
  noNext: ProjectCard[];
  quiet: QuietProject[];
  pastDue: { tasks: LoopTask[]; more: boolean };
  warnings: string[];
};

// ---------- reading ----------

function isPastDue(start: string, today: string, midnightMs: number): boolean {
  return start.length <= 10 ? start < today : Date.parse(start) < midnightMs;
}

async function pastDueTasks(now: Date): Promise<{ tasks: LoopTask[]; more: boolean }> {
  const cfg = config();
  const today = etDate(now);
  const bounds = etDayBounds(now);
  const midnightMs = Date.parse(bounds.start);
  const tasks: LoopTask[] = [];
  let more = false;
  let cursor: string | undefined;
  for (let i = 0; i < MAX_PAGES; i += 1) {
    const res = await notion(`/v1/data_sources/${cfg.tasksDataSourceId}/query`, {
      method: "POST",
      body: {
        filter: {
          and: [
            { property: "Archive", checkbox: { equals: false } },
            { property: "Status", status: { does_not_equal: "Done" } },
            { property: "Due Date", date: { before: bounds.start } },
          ],
        },
        sorts: [{ property: "Due Date", direction: "ascending" }],
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      },
    });
    for (const page of res.results ?? []) {
      const p = page.properties ?? {};
      const d = readDate(p["Due Date"]);
      // Notion has already filtered; this keeps anything that is not clearly before today out of a "change it" list.
      if (!d.start || !isPastDue(d.start, today, midnightMs) || readBool(p["Archive"])) continue;
      tasks.push({
        id: page.id,
        url: page.url,
        title: readText(p["Task"]) || "(untitled)",
        status: readText(p["Status"]) || "",
        due: { start: d.start, end: d.end, timeZone: d.timeZone },
        day: d.start.length <= 10 ? d.start : etDate(new Date(d.start)),
      });
    }
    if (!res.has_more) break;
    if (i === MAX_PAGES - 1) more = true;
    cursor = res.next_cursor;
  }
  return { tasks, more };
}

export async function getLoops(): Promise<LoopsData> {
  return (await loadLoops()).loops;
}

/** Same as getLoops, plus the active project cards, so the Weekly Review does not read Projects twice. */
export async function loadLoops(): Promise<{ loops: LoopsData; active: ProjectCard[] }> {
  const now = new Date();
  const today = etDate(now);
  const warnings: string[] = [];
  const [w, pj, pd] = await Promise.allSettled([getWaiting(), getProjects(), pastDueTasks(now)]);

  let waiting: WaitingItem[] = [];
  if (w.status === "fulfilled") {
    waiting = [
      ...w.value.due,
      ...w.value.waiting.filter((i) => i.checkBack === null && (i.daysWaiting ?? 0) >= WAITING_UNDATED_DAYS),
    ].sort((a, b) => (b.daysWaiting ?? 0) - (a.daysWaiting ?? 0));
  } else warnings.push("The waiting list could not be read, so it is left out.");

  let noNext: ProjectCard[] = [];
  let quiet: QuietProject[] = [];
  if (pj.status === "fulfilled") {
    noNext = pj.value.active.filter((p) => !p.next.trim());
    quiet = pj.value.active
      .filter((p) => p.status === "In progress" && p.stallAfterDays && p.lastProgress)
      .map((p) => ({ ...p, quietDays: dayNumber(today) - dayNumber(p.lastProgress!) }))
      .filter((p) => p.quietDays > (p.stallAfterDays ?? Infinity))
      .sort((a, b) => b.quietDays - a.quietDays);
  } else warnings.push(`Projects are left out. ${(pj.reason as Error)?.message ?? ""}`.trim());

  let pastDue = { tasks: [] as LoopTask[], more: false };
  if (pd.status === "fulfilled") pastDue = pd.value;
  else warnings.push(explain(pd.reason, "the past-due tasks").message);

  const active = pj.status === "fulfilled" ? pj.value.active : [];
  return { loops: { fetchedAt: now.toISOString(), today, canEdit: Boolean(config().editKey), waiting, noNext, quiet, pastDue, warnings }, active };
}

// ---------- changing past-due tasks ----------

export const BULK_ACTIONS = ["drop", "unschedule", "done", "today"] as const;
export type BulkAction = (typeof BULK_ACTIONS)[number];

/** What a task looked like before a change, so the change can be undone. */
export type Prev = { id: string; status: string; due: DueDate | null; archive: boolean };

export const MAX_PER_CALL = 12;
const TASK_STATUSES = ["Schedule", "Hold", "Do Next", "Inbox", "Waiting for", "Scheduled", "In progress", "Done"];
const ID = /^[0-9a-f-]{32,36}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2})?)?$/;

function propsFor(action: BulkAction, today: string): Record<string, unknown> {
  switch (action) {
    case "drop":
      return { Archive: { checkbox: true } };
    case "unschedule":
      return { "Due Date": { date: null }, Status: { status: { name: "Schedule" } } };
    case "done":
      return { Status: { status: { name: "Done" } } };
    case "today":
      return { "Due Date": { date: { start: today, end: null } } };
  }
}

export function checkApply(body: any): string | null {
  if (!BULK_ACTIONS.includes(body?.action)) return "That is not an action this page can do.";
  if (!Array.isArray(body.ids) || body.ids.length === 0) return "No tasks were chosen.";
  if (body.ids.length > MAX_PER_CALL) return `Send at most ${MAX_PER_CALL} tasks at a time.`;
  return body.ids.every((i: unknown) => typeof i === "string" && ID.test(i)) ? null : "A task id was not valid.";
}

export function checkRestore(body: any): string | null {
  if (!Array.isArray(body?.items) || body.items.length === 0) return "Nothing to put back.";
  if (body.items.length > MAX_PER_CALL) return `Send at most ${MAX_PER_CALL} tasks at a time.`;
  for (const it of body.items) {
    if (!it || typeof it.id !== "string" || !ID.test(it.id)) return "A task id was not valid.";
    if (!TASK_STATUSES.includes(it.status)) return "A status was not valid.";
    if (typeof it.archive !== "boolean") return "An archive value was not valid.";
    if (it.due !== null) {
      const d = it.due;
      if (!d || typeof d.start !== "string" || !ISO.test(d.start)) return "A date was not valid.";
      if (d.end !== null && (typeof d.end !== "string" || !ISO.test(d.end))) return "A date was not valid.";
      if (d.timeZone !== null && (typeof d.timeZone !== "string" || !/^[A-Za-z0-9_/+-]{1,64}$/.test(d.timeZone))) return "A time zone was not valid.";
    }
  }
  return null;
}

/**
 * Applies one action to up to MAX_PER_CALL tasks. Only tasks that are still past due, not Done and not
 * archived are changed, so a stale page can never touch something that changed since it loaded.
 */
export async function applyBulk(key: string, action: BulkAction, ids: string[]): Promise<{ changed: Prev[]; skipped: number; failed: number; lastStatus?: number }> {
  const now = new Date();
  const { tasks } = await pastDueTasks(now);
  const byId = new Map(tasks.map((t) => [t.id.replace(/-/g, ""), t]));
  const today = etDate(now);
  const todo = ids.map((id) => byId.get(id.replace(/-/g, ""))).filter((t): t is LoopTask => Boolean(t));
  const changed: Prev[] = [];
  let failed = 0;
  let lastStatus: number | undefined;
  await mapLimit(todo, 3, async (t) => {
    try {
      await notion(`/v1/pages/${t.id}`, { method: "PATCH", key, body: { properties: propsFor(action, today) } });
      changed.push({ id: t.id, status: t.status, due: t.due, archive: false });
    } catch (err) {
      failed += 1;
      lastStatus = (err as { status?: number }).status;
    }
  });
  return { changed, skipped: ids.length - todo.length, failed, lastStatus };
}

/** Puts back what a change replaced. Each page is checked to be a Tasks row first. */
export async function restoreBulk(key: string, items: Prev[]): Promise<{ restored: number; failed: number; lastStatus?: number }> {
  const cfg = config();
  let restored = 0;
  let failed = 0;
  let lastStatus: number | undefined;
  await mapLimit(items, 3, async (it) => {
    try {
      const page = await notion(`/v1/pages/${it.id}`, { key });
      const parent: string | null = page.parent?.data_source_id ?? page.parent?.database_id ?? null;
      if (parent === null || parent !== cfg.tasksDataSourceId || page.properties?.["Status"]?.type !== "status") {
        throw new TodaySetupError("That page is not one of your tasks.");
      }
      await notion(`/v1/pages/${it.id}`, {
        method: "PATCH",
        key,
        body: {
          properties: {
            Status: { status: { name: it.status } },
            "Due Date": { date: it.due ? { start: it.due.start, end: it.due.end, time_zone: it.due.timeZone } : null },
            Archive: { checkbox: it.archive },
          },
        },
      });
      restored += 1;
    } catch (err) {
      failed += 1;
      lastStatus = (err as { status?: number }).status;
    }
  });
  return { restored, failed, lastStatus };
}
