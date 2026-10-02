/**
 * Read-only data layer for the /today page.
 *
 * Notion stays the only source of truth. Nothing here writes to Notion.
 *
 * - "Schedule" and "Focus now" come from two saved views on the Today page.
 *   Those views already hold the logic for what counts as today (they filter on
 *   Notion formulas such as Execution Day), so this code asks Notion for each
 *   view's rows instead of re-implementing the rules.
 * - "Other important priorities" candidates come from a plain query on the Tasks
 *   data source (open tasks that are Do Next or In progress).
 *
 * Notion's view-query endpoint returns only page references, so each row is then
 * fetched once to read its properties. That is roughly ten small requests.
 */

const NOTION_VERSION = "2026-03-11";
const REQUEST_TIMEOUT_MS = 8000;

// IDs of Rachelle's existing Notion objects. Override with env vars if they ever change.
const DEFAULT_TASKS_DATA_SOURCE_ID = "8a5f408a-fdce-83e0-a000-87da31fdc6cf";
const DEFAULT_SCHEDULE_VIEW_ID = "3d5f408a-fdce-815c-8533-000c40cb6885";
const DEFAULT_NOW_VIEW_ID = "3d5f408a-fdce-81a1-90b1-000c18b2ce11";
const DEFAULT_HABITS_DATA_SOURCE_ID = "85ff408a-fdce-83fd-8dae-0715a2654ee8";

export type TodayTask = {
  id: string;
  url: string;
  title: string;
  status: string | null;
  /** ISO datetime (with offset) when the Due Date has a time, else a plain date. */
  start: string | null;
  end: string | null;
  /** Named time zone on the Due Date, when Notion has one (normally null; values carry an offset). */
  dueTimeZone: string | null;
  minutes: number | null;
  timeBlock: string | null;
  calendarRole: string | null;
  nextInstruction: string;
  executionInstructions: string;
  link: string | null;
  canDefer: boolean;
  weeklyRole: string | null;
  tier: string | null;
  workClass: string | null;
};

/** A habit from the Habits + Routines database (the definition, not a scheduled task). */
export type TodayHabit = {
  id: string;
  url: string;
  title: string;
  /** Time of day, e.g. "2 morning". Only daily time-of-day routines are kept. */
  routine: string;
  priority: string | null;
  essential: boolean;
  capacity: string | null;
  scaledVersion: string;
  /** The habit's Checkbox in Notion. */
  done: boolean;
};

export type TodayData = {
  fetchedAt: string;
  schedule: TodayTask[];
  now: TodayTask[];
  /** Open tasks (Do Next / In progress) that are not already in schedule or now. */
  pool: TodayTask[];
  /** Daily habits with a Routine Priority that are not already scheduled as a task today. */
  habits: TodayHabit[];
  /** Plain-language reason the Habits section is empty, or null when habits are shown. */
  habitsNote: string | null;
  /** Default contents of "Other important priorities". */
  defaultPriorityIds: string[];
  warnings: string[];
};

/** Thrown with a message that is safe and useful to show on the page. */
export class TodaySetupError extends Error {}

class NotionHttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

function config() {
  // A separate read-only integration is preferred, so the Today page never holds
  // edit access to the Tasks database. The prospecting key is only a fallback.
  const apiKey = process.env.NOTION_TODAY_API_KEY || process.env.NOTION_API_KEY;
  if (!apiKey) {
    throw new TodaySetupError(
      "NOTION_TODAY_API_KEY is not set for this site, so the Today page cannot read Notion yet."
    );
  }
  return {
    apiKey,
    base: (process.env.NOTION_API_BASE || "https://api.notion.com").replace(/\/$/, ""),
    tasksDataSourceId: process.env.NOTION_TASKS_DATA_SOURCE_ID || DEFAULT_TASKS_DATA_SOURCE_ID,
    scheduleViewId: process.env.NOTION_TODAY_SCHEDULE_VIEW_ID || DEFAULT_SCHEDULE_VIEW_ID,
    nowViewId: process.env.NOTION_TODAY_NOW_VIEW_ID || DEFAULT_NOW_VIEW_ID,
    habitsDataSourceId: process.env.NOTION_HABITS_DATA_SOURCE_ID || DEFAULT_HABITS_DATA_SOURCE_ID,
    editKey: process.env.NOTION_TODAY_EDIT_API_KEY || null,
  };
}

async function notion(path: string, init: { method?: string; body?: unknown; key?: string } = {}, attempt = 0): Promise<any> {
  const { apiKey, base } = config();
  const res = await fetch(`${base}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${init.key ?? apiKey}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (res.status === 429 && attempt < 1) {
    const wait = Math.min(Number(res.headers.get("retry-after")) || 1, 2);
    await new Promise((r) => setTimeout(r, wait * 1000));
    return notion(path, init, attempt + 1);
  }

  if (!res.ok) {
    let code = "unknown";
    let message = res.statusText;
    try {
      const j = await res.json();
      code = j.code ?? code;
      message = j.message ?? message;
    } catch {
      /* body was not JSON */
    }
    throw new NotionHttpError(res.status, code, message);
  }
  return res.json();
}

// ---------- property readers (tolerant of a property being a formula or rollup) ----------

function richText(parts: any): string {
  return Array.isArray(parts) ? parts.map((p: any) => p?.plain_text ?? "").join("") : "";
}

function readText(prop: any): string {
  if (!prop) return "";
  switch (prop.type) {
    case "title": return richText(prop.title);
    case "rich_text": return richText(prop.rich_text);
    case "select": return prop.select?.name ?? "";
    case "status": return prop.status?.name ?? "";
    case "url": return prop.url ?? "";
    case "formula": return prop.formula?.type === "string" ? prop.formula.string ?? "" : "";
    default: return "";
  }
}

function readNumber(prop: any): number | null {
  if (!prop) return null;
  if (prop.type === "number") return prop.number ?? null;
  if (prop.type === "formula" && prop.formula?.type === "number") return prop.formula.number ?? null;
  return null;
}

function readBool(prop: any): boolean {
  if (!prop) return false;
  if (prop.type === "checkbox") return Boolean(prop.checkbox);
  if (prop.type === "formula" && prop.formula?.type === "boolean") return Boolean(prop.formula.boolean);
  return false;
}

function readDate(prop: any): { start: string | null; end: string | null; timeZone: string | null } {
  const d = prop?.type === "date" ? prop.date : null;
  return { start: d?.start ?? null, end: d?.end ?? null, timeZone: d?.time_zone ?? null };
}

function toTask(page: any): TodayTask {
  const p = page.properties ?? {};
  const due = readDate(p["Due Date"]);
  return {
    id: page.id,
    url: page.url,
    title: readText(p["Task"]) || "(untitled)",
    status: readText(p["Status"]) || null,
    start: due.start,
    end: due.end,
    dueTimeZone: due.timeZone,
    minutes: readNumber(p["Duration (min)"]),
    timeBlock: readText(p["Time Block"]) || null,
    calendarRole: readText(p["Calendar Role"]) || null,
    nextInstruction: readText(p["Next Instruction"]),
    executionInstructions: readText(p["Execution Instructions"]),
    link: readText(p["Link"]) || null,
    canDefer: readBool(p["Can Defer?"]),
    weeklyRole: readText(p["Weekly Role"]) || null,
    tier: readText(p["Priority Tier"]) || null,
    workClass: readText(p["Work Class"]) || null,
  };
}

// ---------- fetching ----------

/** Row ids returned by one saved view, in the view's own order. */
async function viewRowIds(viewId: string): Promise<string[]> {
  const first = await notion(`/v1/views/${viewId}/queries`, { method: "POST", body: { page_size: 100 } });
  const ids: string[] = (first.results ?? []).map((r: any) => r.id);
  let cursor: string | null = first.has_more ? first.next_cursor : null;
  let guard = 0;
  while (cursor && guard < 5) {
    const next = await notion(
      `/v1/views/${viewId}/queries/${first.id}?page_size=100&start_cursor=${encodeURIComponent(cursor)}`
    );
    ids.push(...(next.results ?? []).map((r: any) => r.id));
    cursor = next.has_more ? next.next_cursor : null;
    guard += 1;
  }
  return ids;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

async function openTasks(dataSourceId: string): Promise<TodayTask[]> {
  const tasks: TodayTask[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 3; i += 1) {
    const res = await notion(`/v1/data_sources/${dataSourceId}/query`, {
      method: "POST",
      body: {
        filter: {
          and: [
            {
              or: [
                { property: "Status", status: { equals: "Do Next" } },
                { property: "Status", status: { equals: "In progress" } },
              ],
            },
            { property: "Archive", checkbox: { equals: false } },
          ],
        },
        sorts: [{ property: "Priority Tier", direction: "ascending" }],
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      },
    });
    tasks.push(...(res.results ?? []).map(toTask));
    if (!res.has_more) break;
    cursor = res.next_cursor;
  }
  return tasks;
}

/**
 * Daily habits that have a Routine Priority. Habits whose task for today is already on the
 * schedule or in the NOW list are left out, so nothing is shown twice.
 */
async function dailyHabits(
  dataSourceId: string,
  shownTaskIds: Set<string>,
  key: string
): Promise<{ habits: TodayHabit[]; withPriority: number; notDaily: number; alreadyScheduled: number }> {
  const rows: any[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 2; i += 1) {
    const res = await notion(`/v1/data_sources/${dataSourceId}/query`, {
      method: "POST",
      key,
      body: {
        filter: { property: "Routine Priority", select: { is_not_empty: true } },
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      },
    });
    rows.push(...(res.results ?? []));
    if (!res.has_more) break;
    cursor = res.next_cursor;
  }
  const num = (v: string | null) => {
    const m = (v ?? "").match(/^(\d)/);
    return m ? parseInt(m[1], 10) : 9;
  };
  const mapped = rows.map((page) => {
    const p = page.properties ?? {};
    const occurrences: string[] = Array.isArray(p["Task Occurrences"]?.relation)
      ? p["Task Occurrences"].relation.map((r: any) => r.id)
      : [];
    const habit: TodayHabit = {
      id: page.id,
      url: page.url,
      title: readText(p["Habit"]) || "(untitled)",
      routine: readText(p["Routine"]),
      priority: readText(p["Routine Priority"]) || null,
      essential: readBool(p["Essential?"]),
      capacity: readText(p["Minimum Capacity"]) || null,
      scaledVersion: readText(p["Scaled Version"]),
      done: readBool(p["Checkbox"]),
    };
    return { habit, occurrences };
  });
  const daily = mapped.filter(({ habit }) => /^[1-7] /.test(habit.routine));
  const fresh = daily.filter(({ occurrences }) => !occurrences.some((id) => shownTaskIds.has(id)));
  return {
    habits: fresh.map(({ habit }) => habit).sort((a, b) => num(a.routine) - num(b.routine) || num(a.priority) - num(b.priority) || a.title.localeCompare(b.title)),
    withPriority: mapped.length,
    notDaily: mapped.length - daily.length,
    alreadyScheduled: daily.length - fresh.length,
  };
}

/** Titles of databases the connection can see, and the id of the one that looks like the habits database. */
async function findHabitsDataSource(key: string): Promise<{ id: string | null; seen: string[] }> {
  const res = await notion("/v1/search", {
    method: "POST",
    key,
    body: { filter: { property: "object", value: "data_source" }, page_size: 100 },
  });
  const list: { id: string; title: string }[] = (res.results ?? []).map((r: any) => ({
    id: r.id,
    title: richText(r.title) || (typeof r.name === "string" ? r.name : ""),
  }));
  const match = list.find((x) => /habit/i.test(x.title) && /routine/i.test(x.title)) ?? list.find((x) => /habit/i.test(x.title));
  return { id: match?.id ?? null, seen: list.map((x) => x.title).filter(Boolean) };
}

/**
 * Reads habits with the edit connection first (it is the one that can tick habits), then the
 * read-only one. If the configured database cannot be found, looks for it among what the
 * connection can see.
 */
async function loadHabits(cfg: ReturnType<typeof config>, shownTaskIds: Set<string>) {
  const keys = Array.from(new Set([cfg.editKey, cfg.apiKey].filter((k): k is string => Boolean(k))));
  let lastError: NotionHttpError | null = null;
  let seen: string[] = [];
  for (const key of keys) {
    try {
      return { ...(await dailyHabits(cfg.habitsDataSourceId, shownTaskIds, key)), error: null as string | null };
    } catch (err) {
      if (!(err instanceof NotionHttpError) || (err.status !== 403 && err.status !== 404)) throw err;
      lastError = err;
    }
    try {
      const found = await findHabitsDataSource(key);
      if (found.id && found.id !== cfg.habitsDataSourceId) {
        return { ...(await dailyHabits(found.id, shownTaskIds, key)), error: null as string | null };
      }
      if (found.seen.length > seen.length) seen = found.seen;
    } catch { /* search not available for this connection */ }
  }
  const visible = seen.length
    ? ` The Today connection can currently see these databases: ${seen.slice(0, 12).join(", ")}.`
    : " The Today connections cannot see any databases right now.";
  return {
    habits: [] as TodayHabit[], withPriority: 0, notDaily: 0, alreadyScheduled: 0,
    error: `Notion said "${lastError?.code ?? "not found"}" for the Habits + Routines database.${visible} In Notion, open Habits + Routines, choose ••• → Connections, and add the "Today (edit times)" connection.`,
  };
}

function explain(err: unknown, what: string): Error {
  if (err instanceof TodaySetupError) return err;
  if (err instanceof NotionHttpError) {
    if (err.status === 401) {
      return new TodaySetupError("Notion rejected the Today page's API key (NOTION_TODAY_API_KEY). Check that the key is current.");
    }
    if (err.status === 403 || err.status === 404) {
      return new TodaySetupError(
        `Notion could not find ${what}. In Notion, open the Tasks database and the Today page, ` +
          `choose ••• → Connections, and add the integration used for the Today page. (${err.code})`
      );
    }
    return new TodaySetupError(`Notion returned an error while loading ${what}: ${err.message}`);
  }
  if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
    return new TodaySetupError(`Notion took too long to answer while loading ${what}. Try again.`);
  }
  return new TodaySetupError(`Could not load ${what}.`);
}

export async function getToday(): Promise<TodayData> {
  const cfg = config();

  const [scheduleIds, nowIds, poolResult] = await Promise.all([
    viewRowIds(cfg.scheduleViewId).catch((e) => { throw explain(e, "the Schedule view"); }),
    viewRowIds(cfg.nowViewId).catch((e) => { throw explain(e, "the NOW view"); }),
    openTasks(cfg.tasksDataSourceId).then(
      (tasks) => ({ tasks, warning: null as string | null }),
      (e) => ({ tasks: [] as TodayTask[], warning: explain(e, "your open tasks").message })
    ),
  ]);

  // Habits are read alongside the task pages. A problem here only costs the Habits section.
  const habitsPromise = loadHabits(cfg, new Set([...scheduleIds, ...nowIds])).then(
    (r) => ({
      habits: r.habits,
      warning: null as string | null,
      note: r.error
        ? r.error
        : r.habits.length > 0 ? null
        : r.withPriority === 0
          ? "Notion returned no habits that have a Routine Priority. The connection can see the Habits + Routines database, but none of its habits have that field filled in."
          : `Notion returned ${r.withPriority} habits with a Routine Priority. ${r.alreadyScheduled} already on today's schedule or NOW list, and ${r.notDaily} weekly, monthly or without a daily time of day, so none are left to show.`,
    }),
    (e) => {
      const msg = explain(e, "your habits").message;
      return { habits: [] as TodayHabit[], warning: msg, note: msg };
    }
  );

  const uniqueIds = Array.from(new Set([...scheduleIds, ...nowIds]));
  const pages = await mapLimit(uniqueIds, 5, (id) =>
    notion(`/v1/pages/${id}`).catch((e) => { throw explain(e, "a task from today"); })
  );
  const byId = new Map<string, TodayTask>(pages.map((p: any) => [p.id, toTask(p)]));

  const pick = (ids: string[]) => ids.map((id) => byId.get(id)).filter((t): t is TodayTask => Boolean(t));
  const schedule = pick(scheduleIds);
  const now = pick(nowIds);

  const shown = new Set([...scheduleIds, ...nowIds]);
  const pool = poolResult.tasks.filter((t) => !shown.has(t.id));

  // Default list: open "Must Happen" tasks in Notion's own priority order, top four.
  const defaultPriorityIds = pool.filter((t) => t.weeklyRole === "Must Happen").slice(0, 4).map((t) => t.id);

  const habitsResult = await habitsPromise;

  return {
    fetchedAt: new Date().toISOString(),
    schedule,
    now,
    pool,
    habits: habitsResult.habits,
    habitsNote: habitsResult.note,
    defaultPriorityIds,
    warnings: [poolResult.warning, habitsResult.warning].filter((w): w is string => Boolean(w)),
  };
}

/**
 * The only write this site makes to Notion: set a task's Due Date. It uses the separate
 * edit key (NOTION_TODAY_EDIT_API_KEY), never the read-only key, and touches nothing else.
 */
export async function setDueDate(key: string, pageId: string, date: { start: string; end: string | null }): Promise<void> {
  await notion(`/v1/pages/${pageId}`, {
    method: "PATCH",
    key,
    body: { properties: { "Due Date": { date: { start: date.start, end: date.end, time_zone: null } } } },
  });
}

/**
 * Check or uncheck a habit in Notion by setting its Checkbox. Uses the edit key. Refuses anything
 * that is not a page in the Habits + Routines database.
 */
export async function setHabitDone(key: string, pageId: string, done: boolean): Promise<void> {
  const cfg = config();
  const page = await notion(`/v1/pages/${pageId}`, { key });
  const parent: string | null = page.parent?.data_source_id ?? page.parent?.database_id ?? null;
  let inHabits = parent !== null && parent === cfg.habitsDataSourceId;
  if (!inHabits) {
    const found = await findHabitsDataSource(key).catch(() => ({ id: null as string | null, seen: [] as string[] }));
    inHabits = parent !== null && parent === found.id;
  }
  if (!inHabits || page.properties?.["Checkbox"]?.type !== "checkbox") {
    throw new TodaySetupError("That page is not one of your habits, so nothing was changed.");
  }
  await notion(`/v1/pages/${pageId}`, { method: "PATCH", key, body: { properties: { Checkbox: { checkbox: done } } } });
}
