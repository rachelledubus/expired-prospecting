/**
 * "Restart time": pure planning of how today's schedule moves when the current task is
 * restarted at the current time. Used by the page (to preview and confirm) and by the
 * server route (to decide exactly what to write), so both always agree.
 *
 * Rules:
 * - The anchor task starts at the current time (rounded down to the minute) and keeps its length.
 * - Starting late: later timed tasks (not Done) move only as far as needed. Each one keeps its
 *   own start time unless the task before it now runs past that time, so free time between
 *   tasks absorbs the delay and nothing moves once the delay has been used up.
 * - Starting early: later tasks move earlier by the same number of minutes, as before.
 * - Appointments and Deadlines stay where they are, unless one of them is the anchor itself.
 * - Nothing may move into a different day.
 */
import type { TodayTask } from "@/lib/today";

const TZ = "America/New_York";
const FIXED_ROLES = ["Appointment", "Deadline"];
const MIN = 60000;
const MAX_SHIFT_MIN = 8 * 60;

export type Move = {
  id: string;
  title: string;
  fromStart: string;
  fromEnd: string | null;
  toStart: string;
  toEnd: string | null;
  /** Positive = later, negative = earlier. */
  shiftMin: number;
};

export type ShiftPlan =
  | { ok: true; deltaMin: number; anchorId: string; moves: Move[]; leftFixed: string[]; conflicts: string[] }
  | { ok: false; message: string };

const hasTime = (iso: string | null): iso is string => Boolean(iso && iso.includes("T"));
const etDate = (ms: number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));

/** Same text format as the original (same offset), at a different instant. Null if the format is not supported. */
function shiftedText(orig: string, ms: number): string | null {
  if (/Z$/.test(orig)) return new Date(ms).toISOString().replace(/\.\d{3}Z$/, ".000Z");
  const m = orig.match(/([+-])(\d\d):(\d\d)$/);
  if (!m) return null;
  const offMin = (m[1] === "-" ? -1 : 1) * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
  return new Date(ms + offMin * MIN).toISOString().replace(/\.\d{3}Z$/, ".000") + m[0];
}

function rangeOf(t: TodayTask, startMs: number, endMs: number | null): [number, number] {
  const e = endMs ?? startMs + (t.minutes ?? 30) * MIN;
  return [startMs, Math.max(e, startMs + MIN)];
}
const overlaps = (a: [number, number], b: [number, number]) => a[0] < b[1] && b[0] < a[1];

export function planShift(schedule: TodayTask[], anchorId: string, nowMs: number): ShiftPlan {
  const anchor = schedule.find((t) => t.id === anchorId);
  if (!anchor || !hasTime(anchor.start) || anchor.status === "Done") {
    return { ok: false, message: "That task is no longer on today's schedule. Refresh and try again." };
  }
  const anchorStart = Date.parse(anchor.start);
  const nowMin = Math.floor(nowMs / MIN) * MIN;
  const deltaMin = Math.round((nowMin - anchorStart) / MIN);
  if (deltaMin === 0) return { ok: false, message: "This task already starts at the current time." };
  if (Math.abs(deltaMin) > MAX_SHIFT_MIN) return { ok: false, message: "That is more than 8 hours away from its scheduled start, so nothing was changed." };

  const timed = schedule.filter((t) => hasTime(t.start) && t.status !== "Done");
  const moving = timed.filter(
    (t) => t.id === anchor.id || (Date.parse(t.start!) >= anchorStart && !FIXED_ROLES.includes(t.calendarRole ?? ""))
  );
  const movingIds = new Set(moving.map((t) => t.id));
  const fixedAfter = timed.filter((t) => !movingIds.has(t.id) && Date.parse(t.start!) >= anchorStart);

  // How far each moving task goes. Late start: only as far as the task before it forces.
  const rangeNow = (t: TodayTask): [number, number] =>
    rangeOf(t, Date.parse(t.start!), hasTime(t.end) ? Date.parse(t.end) : null);
  const shiftOf = new Map<string, number>();
  if (deltaMin < 0) {
    moving.forEach((t) => shiftOf.set(t.id, deltaMin));
  } else {
    const newEnd = new Map<string, number>();
    const order = [anchor, ...moving.filter((t) => t.id !== anchor.id).sort((a, b) => Date.parse(a.start!) - Date.parse(b.start!))];
    for (const t of order) {
      const [s0, e0] = rangeNow(t);
      let shift = deltaMin;
      if (t.id !== anchor.id) {
        // Only tasks that used to finish before this one starts can push it. Tasks that already
        // overlapped it keep overlapping it the way they did.
        let need = s0;
        for (const p of order) {
          if (p === t) break;
          if (rangeNow(p)[1] <= s0 && newEnd.has(p.id)) need = Math.max(need, newEnd.get(p.id)!);
        }
        shift = Math.round((need - s0) / MIN);
      }
      shiftOf.set(t.id, shift);
      newEnd.set(t.id, e0 + shift * MIN);
    }
  }

  const moves: Move[] = [];
  for (const t of moving) {
    const shift = shiftOf.get(t.id) ?? 0;
    if (shift === 0) continue; // absorbed by free time: leave it alone in Notion
    if (t.dueTimeZone) return { ok: false, message: `"${t.title}" uses a named time zone in Notion, which this button does not handle yet. Nothing was changed.` };
    const s = Date.parse(t.start!);
    const e = hasTime(t.end) ? Date.parse(t.end) : null;
    const ns = s + shift * MIN;
    const ne = e === null ? null : e + shift * MIN;
    if (etDate(s) !== etDate(ns) || (ne !== null && etDate(ne - 1) !== etDate(ns))) {
      return { ok: false, message: `That would push "${t.title}" into a different day, so nothing was changed.` };
    }
    const toStart = shiftedText(t.start!, ns);
    const toEnd = t.end === null || ne === null ? null : shiftedText(t.end, ne);
    if (!toStart || (t.end !== null && !toEnd)) {
      return { ok: false, message: `"${t.title}" has a date format this button does not handle. Nothing was changed.` };
    }
    moves.push({ id: t.id, title: t.title, fromStart: t.start!, fromEnd: t.end, toStart, toEnd, shiftMin: shift });
  }

  // Fixed items that the shifted blocks now overlap but did not overlap before.
  const conflicts: string[] = [];
  for (const f of fixedAfter) {
    const fr = rangeOf(f, Date.parse(f.start!), hasTime(f.end) ? Date.parse(f.end) : null);
    const hit = moves.some((m) => {
      const t = moving.find((x) => x.id === m.id)!;
      const s = Date.parse(t.start!);
      const e = hasTime(t.end) ? Date.parse(t.end) : null;
      const before = rangeOf(t, s, e);
      const after = rangeOf(t, s + m.shiftMin * MIN, e === null ? null : e + m.shiftMin * MIN);
      return overlaps(after, fr) && !overlaps(before, fr);
    });
    if (hit) conflicts.push(f.title);
  }
  return { ok: true, deltaMin, anchorId: anchor.id, moves, leftFixed: fixedAfter.map((t) => t.title), conflicts };
}
