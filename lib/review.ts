import { loadLoops, type LoopTask } from "@/lib/loops";
import type { ProjectCard } from "@/lib/projects";
import type { WaitingItem } from "@/lib/today";
import { config, dayNumber, etDate, etMidnight, explain, notion, readDate, readText } from "@/lib/today";

const MAX_PAGES = 3;
const LIST = 8;

export type ReviewTask = { id: string; url: string; title: string; day: string | null; status: string; appointment: boolean };

export type ReviewData = {
  fetchedAt: string;
  today: string;
  /** "this" is the week that contains today. "last" is the one before it. */
  which: "this" | "last";
  weekStart: string;
  weekEnd: string;
  nextStart: string;
  nextEnd: string;
  done: { tasks: ReviewTask[]; total: number };
  routine: { done: number; total: number } | null;
  upcoming: { tasks: ReviewTask[]; total: number; blocks: number };
  pastDue: { tasks: LoopTask[]; count: number; more: boolean };
  waiting: WaitingItem[];
  moved: ProjectCard[];
  quiet: { name: string; id: string; quietDays: number }[];
  noNext: ProjectCard[];
  inbox: number | null;
  warnings: string[];
};

const addDays = (ymd: string, n: number) => new Date((dayNumber(ymd) + n) * 86400000).toISOString().slice(0, 10);

/** Monday of the week containing `ymd`. */
function mondayOf(ymd: string): string {
  const dow = new Date(dayNumber(ymd) * 86400000).getUTCDay(); // 0 = Sunday
  return addDays(ymd, -((dow + 6) % 7));
}

type Row = ReviewTask & { routine: boolean };

/** Every task with a Due Date from the start of `from` up to (not including) `to`, Eastern time. */
async function tasksBetween(from: string, to: string): Promise<{ rows: Row[]; more: boolean }> {
  const cfg = config();
  const rows: Row[] = [];
  let more = false;
  let cursor: string | undefined;
  for (let i = 0; i < MAX_PAGES; i += 1) {
    const res = await notion(`/v1/data_sources/${cfg.tasksDataSourceId}/query`, {
      method: "POST",
      body: {
        filter: {
          and: [
            { property: "Archive", checkbox: { equals: false } },
            { property: "Due Date", date: { on_or_after: etMidnight(from).toISOString() } },
            { property: "Due Date", date: { before: etMidnight(to).toISOString() } },
          ],
        },
        sorts: [{ property: "Due Date", direction: "ascending" }],
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      },
    });
    for (const page of res.results ?? []) {
      const p = page.properties ?? {};
      const start = readDate(p["Due Date"]).start;
      rows.push({
        id: page.id,
        url: page.url,
        title: readText(p["Task"]) || "(untitled)",
        day: start ? (start.length <= 10 ? start : etDate(new Date(start))) : null,
        status: readText(p["Status"]) || "",
        appointment: readText(p["Calendar Role"]) === "Appointment",
        routine: readText(p["Occurrence Type"]) === "Routine Block",
      });
    }
    if (!res.has_more) break;
    if (i === MAX_PAGES - 1) more = true;
    cursor = res.next_cursor;
  }
  return { rows, more };
}

async function inboxCount(): Promise<number> {
  const res = await notion(`/v1/data_sources/${config().tasksDataSourceId}/query`, {
    method: "POST",
    body: {
      filter: {
        and: [
          { property: "Archive", checkbox: { equals: false } },
          { property: "Intake State", select: { equals: "Inbox" } },
          { property: "Status", status: { does_not_equal: "Done" } },
        ],
      },
      page_size: 100,
    },
  });
  return (res.results ?? []).length;
}

export async function getReview(which: "this" | "last"): Promise<ReviewData> {
  const now = new Date();
  const today = etDate(now);
  const thisMonday = mondayOf(today);
  const weekStart = which === "last" ? addDays(thisMonday, -7) : thisMonday;
  const weekEnd = addDays(weekStart, 6);
  const nextStart = addDays(weekStart, 7);
  const nextEnd = addDays(nextStart, 6);
  const warnings: string[] = [];

  const [lp, wk, nx, ib] = await Promise.allSettled([
    loadLoops(),
    tasksBetween(weekStart, nextStart),
    tasksBetween(nextStart, addDays(nextStart, 7)),
    inboxCount(),
  ]);

  let done: ReviewData["done"] = { tasks: [], total: 0 };
  let routine: ReviewData["routine"] = null;
  if (wk.status === "fulfilled") {
    const real = wk.value.rows.filter((r) => !r.routine && r.status === "Done");
    done = { tasks: real.slice(-LIST).reverse(), total: real.length };
    const blocks = wk.value.rows.filter((r) => r.routine);
    // Only blocks that have already come up count against the week, so a week in progress is not marked down for tomorrow.
    const due = blocks.filter((r) => r.day !== null && r.day <= today);
    routine = due.length ? { done: due.filter((r) => r.status === "Done").length, total: due.length } : null;
  } else warnings.push(explain(wk.reason, "this week's tasks").message);

  let upcoming: ReviewData["upcoming"] = { tasks: [], total: 0, blocks: 0 };
  if (nx.status === "fulfilled") {
    const open = nx.value.rows.filter((r) => !r.routine && r.status !== "Done");
    upcoming = { tasks: open.slice(0, LIST), total: open.length, blocks: nx.value.rows.filter((r) => r.routine).length };
  } else warnings.push(explain(nx.reason, "next week's tasks").message);

  let pastDue: ReviewData["pastDue"] = { tasks: [], count: 0, more: false };
  let waiting: WaitingItem[] = [];
  let moved: ProjectCard[] = [];
  let quiet: ReviewData["quiet"] = [];
  let noNext: ProjectCard[] = [];
  if (lp.status === "fulfilled") {
    const { loops, active } = lp.value;
    pastDue = { tasks: loops.pastDue.tasks.slice(0, 3), count: loops.pastDue.tasks.length, more: loops.pastDue.more };
    waiting = loops.waiting;
    noNext = loops.noNext;
    quiet = loops.quiet.map((q) => ({ id: q.id, name: q.name, quietDays: q.quietDays }));
    moved = active.filter((p) => p.lastProgress !== null && p.lastProgress >= weekStart && p.lastProgress <= weekEnd);
    warnings.push(...loops.warnings);
  } else warnings.push(explain(lp.reason, "the open loops").message);

  return {
    fetchedAt: now.toISOString(),
    today,
    which,
    weekStart,
    weekEnd,
    nextStart,
    nextEnd,
    done,
    routine,
    upcoming,
    pastDue,
    waiting,
    moved,
    quiet,
    noNext,
    inbox: ib.status === "fulfilled" ? ib.value : null,
    warnings,
  };
}
