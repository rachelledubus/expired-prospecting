"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TodayData, TodayTask } from "@/lib/today";

const TZ = "America/New_York";
const SC = 1.7; // pixels per minute on the timeline

type Item = TodayTask;

// ---------- time helpers (all display is in Eastern time) ----------

function etParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "numeric", minute: "numeric", hour12: false,
  }).formatToParts(d);
  const o: Record<string, string> = {};
  parts.forEach((p) => { o[p.type] = p.value; });
  return { date: `${o.year}-${o.month}-${o.day}`, min: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
}
const minOf = (iso: string) => etParts(new Date(iso)).min;
const hasTime = (iso: string | null) => Boolean(iso && iso.includes("T"));

function fmtTime(iso: string, withMeridiem: boolean) {
  const s = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ }).format(new Date(iso));
  return withMeridiem ? s : s.replace(/\s?[AP]M$/, "");
}
const meridiem = (iso: string) => (/PM$/.test(fmtTime(iso, true)) ? "PM" : "AM");
function rangeText(start: string, end: string) {
  return meridiem(start) === meridiem(end)
    ? `${fmtTime(start, false)} to ${fmtTime(end, true)}`
    : `${fmtTime(start, true)} to ${fmtTime(end, true)}`;
}
function durText(m: number) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}
const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"}`;
const endIso = (t: { start: string | null; end: string | null }, s: number, e: number) =>
  t.end && hasTime(t.end) ? t.end : new Date(new Date(t.start!).getTime() + (e - s) * 60000).toISOString();

function taskMeta(t: Item) {
  const when = t.minutes ? `${durText(t.minutes)}, no set time` : "No set time";
  const kind = t.calendarRole === "Deadline" || t.calendarRole === "Appointment" ? t.calendarRole : null;
  return [when, kind, tagsOf(t).join(", ") || t.timeBlock].filter(Boolean).join("  ·  ");
}

type Cat = "work" | "routine" | "appt" | "deadline" | "other";
const catOf = (t: TodayTask): Cat =>
  t.calendarRole === "Appointment" ? "appt"
  : t.calendarRole === "Deadline" ? "deadline"
  : t.calendarRole === "Time Block" ? "work"
  : t.calendarRole === "Maintenance" ? "routine"
  : "other";
const CAT_LABEL: Record<Cat, string> = { work: "Work blocks", routine: "Routines and meals", appt: "Appointments", deadline: "Deadlines", other: "Other" };

function Icon({ kind }: { kind: Cat | "check" }) {
  const p = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (kind) {
    case "work": return <svg {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /></svg>;
    case "routine": return <svg {...p}><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" /></svg>;
    case "appt": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "deadline": return <svg {...p}><path d="M5 21V4h11l-2 4 2 4H5" /></svg>;
    case "check": return <svg {...p} strokeWidth={3}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
    default: return <svg {...p}><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></svg>;
  }
}

function dueText(t: Item) {
  if (!t.start) return null;
  const d = hasTime(t.start)
    ? new Date(t.start)
    : new Date(`${t.start}T12:00:00Z`);
  const zone = hasTime(t.start) ? TZ : "UTC";
  return "Due " + new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: zone }).format(d);
}

function metaLine(t: Item) {
  const parts = [t.tier, t.workClass, t.minutes ? durText(t.minutes) : null, dueText(t)].filter(Boolean);
  return parts.length ? parts.join("  ·  ") : t.status ?? "";
}
function tagsOf(t: Item): string[] {
  return [t.weeklyRole, t.workClass, t.tier].filter((x): x is string => Boolean(x));
}

// ---------- timeline layout ----------

type Placed = { task: Item; s: number; e: number; lane: number; lanes: number };

function layout(tasks: Item[]): { placed: Placed[]; unscheduled: Item[]; gridStart: number; gridEnd: number } {
  const timed: { task: Item; s: number; e: number }[] = [];
  const unscheduled: Item[] = [];
  tasks.forEach((task) => {
    if (!task.start || !hasTime(task.start)) { unscheduled.push(task); return; }
    const s = minOf(task.start);
    let e = task.end && hasTime(task.end) ? minOf(task.end) : s + (task.minutes ?? 30);
    if (e <= s) e = s + (task.minutes ?? 30);
    timed.push({ task, s, e });
  });
  timed.sort((a, b) => a.s - b.s || a.e - b.e);

  // Blocks that overlap in time share the width side by side.
  const placed: Placed[] = [];
  let group: Placed[] = [];
  let laneEnds: number[] = [];
  let groupEnd = -1;
  const flush = () => { group.forEach((p) => { p.lanes = laneEnds.length; }); placed.push(...group); group = []; laneEnds = []; };
  timed.forEach((t) => {
    if (t.s >= groupEnd && group.length) flush();
    let lane = laneEnds.findIndex((end) => end <= t.s);
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(t.e); } else { laneEnds[lane] = t.e; }
    group.push({ ...t, lane, lanes: 1 });
    groupEnd = Math.max(groupEnd, t.e);
  });
  if (group.length) flush();

  const gridStart = timed.length ? Math.floor(Math.min(...timed.map((t) => t.s)) / 60) * 60 : 0;
  const gridEnd = timed.length ? Math.ceil(Math.max(...timed.map((t) => t.e)) / 60) * 60 : 0;
  return { placed, unscheduled, gridStart, gridEnd };
}

// ---------- component ----------

export default function TodayPlanner({ data }: { data: TodayData }) {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const refresh = useCallback(() => startTransition(() => router.refresh()), [router]);

  // Clock, and re-read Notion when the page comes back to the foreground after a while.
  useEffect(() => {
    setNowMs(Date.now());
    const tick = setInterval(() => setNowMs(Date.now()), 30000);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setNowMs(Date.now());
        if (Date.now() - new Date(data.fetchedAt).getTime() > 120000) refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(tick); document.removeEventListener("visibilitychange", onVisible); };
  }, [data.fetchedAt, refresh]);

  const items = useMemo(() => {
    const m = new Map<string, Item>();
    [...data.now, ...data.schedule, ...data.pool].forEach((t) => m.set(t.id, t));
    return m;
  }, [data]);

  const { placed, unscheduled, gridStart, gridEnd } = useMemo(() => layout(data.schedule), [data.schedule]);

  const nowParts = nowMs === null ? null : etParts(new Date(nowMs));
  const todayDate = etParts(new Date(data.fetchedAt)).date;
  const live = nowParts !== null && nowParts.date === todayDate;

  // Current focus comes from the schedule: the block(s) happening right now, and what is next.
  // Before the browser clock is read, use the time the data was fetched so the first paint matches the server.
  const clockMs = nowMs ?? Date.parse(data.fetchedAt);
  const cp = etParts(new Date(clockMs));
  const sameDay = cp.date === todayDate;
  const openBlocks = placed.filter((p) => p.task.status !== "Done");
  const currentBlocks = sameDay ? openBlocks.filter((p) => cp.min >= p.s && cp.min < p.e) : [];
  // Only one block can be "right now". If blocks overlap, an Appointment wins, then a Deadline,
  // then whichever started most recently. The others are noted on the card, not shown as current.
  const rank = (p: Placed) => (p.task.calendarRole === "Appointment" ? 0 : p.task.calendarRole === "Deadline" ? 1 : 2);
  const ranked = [...currentBlocks].sort((a, b) => rank(a) - rank(b) || b.s - a.s || a.e - b.e);
  const focusBlock = ranked[0] ?? null;
  const alsoNow = ranked.slice(1);
  const nextBlock = sameDay
    ? openBlocks.filter((p) => p.s > cp.min && !currentBlocks.includes(p)).sort((a, b) => a.s - b.s)[0] ?? null
    : null;

  // Important Tasks are the to-do items: NOW-list tasks that are not time blocks on the schedule,
  // plus anything on today's schedule list that has no time. None of them appear on the agenda.
  const scheduleIds = new Set(data.schedule.map((t) => t.id));
  const importantTasks: Item[] = [];
  [...data.now.filter((t) => !scheduleIds.has(t.id)), ...unscheduled.filter((t) => t.status !== "Done" && t.calendarRole !== "Maintenance")].forEach((t) => {
    if (!importantTasks.some((x) => x.id === t.id)) importantTasks.push(t);
  });

  // The open "Must Happen" tasks that used to be their own list now sit with the rest of the tasks.
  data.defaultPriorityIds.forEach((id) => {
    const t = items.get(id);
    if (t && !importantTasks.some((x) => x.id === id)) importantTasks.push(t);
  });

  const hours: number[] = [];
  for (let m = gridStart; m <= gridEnd && gridEnd > 0; m += 30) hours.push(m);

  // ---------- detail sheet ----------
  const open = openId ? items.get(openId) ?? null : null;
  const openDetail = (id: string) => { lastFocus.current = document.activeElement as HTMLElement; setOpenId(id); };
  const closeDetail = useCallback(() => {
    setOpenId(null);
    lastFocus.current?.focus?.({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (!openId) return;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeDetail(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openId, closeDetail]);

  const headerDate = new Date(data.fetchedAt);
  const clock = nowMs === null ? "" : new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ }).format(new Date(nowMs));
  const updated = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ }).format(headerDate);

  const jump = (id: string) => {
    if (id === "sec-tasks") setTasksOpen(true);
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), id === "sec-tasks" ? 60 : 0);
  };
  const cats = Array.from(new Set(placed.map((p) => catOf(p.task))));

  return (
    <div className="tp">
      <div className="shell">
        <div className="paper">
          <div className="holes" aria-hidden="true" />
          <header className="hd">
            <div>
              <div className="dow"><span>{new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: TZ }).format(headerDate)}</span></div>
              <div className="dmy">{new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: TZ }).format(headerDate)}</div>
            </div>
            <div className="hd-right">
              <div className="clock">{clock}</div>
              <button className="refresh" type="button" onClick={refresh} disabled={refreshing}>
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </header>
          <p className="state-line">Updated from Notion at {updated}.</p>
          {data.warnings.map((w) => (
            <p className="state-line" key={w}>{w}</p>
          ))}

          <div className="cols">
            <div className="col-main">
              <section id="sec-now" className="sec">
                {!sameDay ? (
                  <div className="cf idle">
                    <div className="cf-top"><span className="cf-kicker">Out of date</span></div>
                    <h2>This page was loaded on a different day.</h2>
                    <div className="cf-actions"><button className="pill" type="button" onClick={refresh}>Refresh</button></div>
                  </div>
                ) : focusBlock ? (
                  [focusBlock].map(({ task: t, s, e }) => {
                    const pct = Math.min(100, Math.max(0, ((cp.min - s) / (e - s)) * 100));
                    const endI = endIso(t, s, e);
                    return (
                      <div className="cf" key={t.id}>
                        <div className="cf-top">
                          <span className="cf-kicker">Right now</span>
                          <span className="cf-left">{durText(e - cp.min)} left</span>
                        </div>
                        <h2>{t.title}</h2>
                        <div className="cf-bar" aria-hidden="true"><div style={{ width: `${pct}%` }} /></div>
                        <div className="cf-ends"><span>{fmtTime(t.start!, true)}</span><span>{fmtTime(endI, true)}</span></div>
                        {t.nextInstruction && <p className="cf-instr">{t.nextInstruction}</p>}
                        {alsoNow.length > 0 && <p className="cf-also">Also on the schedule at this time: {alsoNow.map((o) => o.task.title).join(", ")}</p>}
                        <div className="cf-actions">
                          {t.link && <a className="pill" href={t.link} target="_blank" rel="noopener noreferrer">Open linked page</a>}
                          <button className={"pill" + (t.link ? " ghost" : "")} type="button" onClick={() => openDetail(t.id)}>Details</button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="cf idle">
                    <div className="cf-top"><span className="cf-kicker">{nextBlock ? "Free right now" : "Schedule clear"}</span></div>
                    <h2>
                      {nextBlock
                        ? "Nothing is scheduled at this moment."
                        : placed.length === 0
                          ? "Nothing is scheduled for today in Notion."
                          : "Nothing left on today's schedule."}
                    </h2>
                  </div>
                )}
                {sameDay && nextBlock && (
                  <button className="cf-next" type="button" onClick={() => openDetail(nextBlock.task.id)}>
                    <span className="nx">Up next</span>
                    <strong>{nextBlock.task.title}</strong>
                    <span>{fmtTime(nextBlock.task.start!, true)}, in {durText(nextBlock.s - cp.min)}</span>
                  </button>
                )}
              </section>

              <section id="sec-schedule" className="sec">
                <div className="label">Schedule</div>
                {placed.length === 0 ? (
                  <div className="nothing">Nothing is scheduled for today in Notion.</div>
                ) : (
                  <div className="sheet">
                    <div className="grid" style={{ height: (gridEnd - gridStart) * SC }}>
                      {hours.map((m) =>
                        m % 60 === 0 ? (
                          <div className="hour" key={m} style={{ top: (m - gridStart) * SC }}><span>{hourLabel(m / 60)}</span></div>
                        ) : (
                          <div className="half" key={m} style={{ top: (m - gridStart) * SC }} />
                        )
                      )}
                      {placed.map(({ task: t, s, e, lane, lanes }) => {
                        const isDone = t.status === "Done";
                        const cur = focusBlock?.task.id === t.id;
                        const past = (live && nowParts!.min >= e) || isDone;
                        const cat = catOf(t);
                        const cls = ["block", cat, past ? "past" : "", cur ? "current" : "", isDone ? "done" : "", lanes > 1 ? "lane" : "", e - s < 30 ? "short" : ""].filter(Boolean).join(" ");
                        const style: React.CSSProperties = { top: (s - gridStart) * SC + 2, height: Math.max((e - s) * SC - 4, 24) };
                        if (lanes > 1) {
                          style.left = `calc(var(--tc) + (100% - var(--tc)) * ${lane} / ${lanes})`;
                          style.width = `calc((100% - var(--tc)) / ${lanes} - 4px)`;
                        }
                        return (
                          <button className={cls} type="button" key={t.id} style={style} onClick={() => openDetail(t.id)}>
                            <div className="b-time">
                              <span className="ic"><Icon kind={isDone ? "check" : cat} /></span>
                              <span>{rangeText(t.start!, endIso(t, s, e))}</span>
                              {cur && <span className="tag-now">Now</span>}
                              {isDone && <span className="done-tag">Done</span>}
                            </div>
                            <div className="b-title">{t.title}</div>
                            {e - s >= 90 && !isDone && <div className="b-sub">{[durText(e - s), t.timeBlock].filter(Boolean).join("  ·  ")}</div>}
                          </button>
                        );
                      })}
                    </div>
                    <div className="legend">
                      {cats.map((c) => (<span key={c}><i className={c} />{CAT_LABEL[c]}</span>))}
                    </div>
                  </div>
                )}
              </section>
            </div>

            <div className="col-side">
              <section id="sec-tasks" className="sec">
                <button className="fold" type="button" aria-expanded={tasksOpen} aria-controls="important-tasks" onClick={() => setTasksOpen((v) => !v)}>
                  <span className="label">Important Tasks</span>
                  <span className="count">{importantTasks.length}</span>
                  <span className={"chev" + (tasksOpen ? " up" : "")} aria-hidden="true" />
                </button>
                {tasksOpen && (
                  <div className="focus" id="important-tasks">
                    {importantTasks.length === 0 && <div className="empty">No tasks in your NOW list right now.</div>}
                    {importantTasks.map((t) => (
                      <button className="focus-item" type="button" key={t.id} onClick={() => openDetail(t.id)}>
                        <span className={"bullet" + (t.weeklyRole === "Must Happen" ? " hot" : "")} />
                        <span>
                          <div className="f-title">{t.title}</div>
                          <div className="f-meta">{taskMeta(t)}</div>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>

          <footer>
            Source: your Tasks database in Notion (Schedule and NOW views). Read only. Tap any block for details.{" "}
            <a className="portal-link" href="/">Portal home</a>
          </footer>
        </div>

        <nav className="tabs" aria-label="Jump to a section">
          <button type="button" className="t1" onClick={() => jump("sec-now")}>Now</button>
          <button type="button" className="t2" onClick={() => jump("sec-schedule")}>Schedule</button>
          <button type="button" className="t3" onClick={() => jump("sec-tasks")}>Tasks</button>
        </nav>
      </div>

      <div className={"scrim" + (open ? " open" : "")} onClick={closeDetail} />
      <div className={"detail" + (open ? " open" : "")} role="dialog" aria-modal="true" aria-labelledby="d-title" aria-hidden={!open}>
        {open && (
          <>
            <div className="grab" />
            <h2 id="d-title">{open.title}</h2>
            <div className="d-time">
              {open.start && hasTime(open.start) && open.end
                ? `${rangeText(open.start, open.end)}  ·  ${durText(minOf(open.end) - minOf(open.start))}`
                : open.minutes ? `${durText(open.minutes)}, no set time` : "No set time"}
            </div>
            <div className="chips">
              {open.status && <span className="chip">{open.status}</span>}
              {open.canDefer && <span className="chip">Can defer</span>}
              {!hasTime(open.start) && dueText(open) && <span className="chip">{dueText(open)}</span>}
              {tagsOf(open).map((g) => (
                <span className={"chip" + (g === "Must Happen" && data.now.some((n) => n.id === open.id) ? " hot" : "")} key={g}>{g}</span>
              ))}
            </div>
            {open.nextInstruction && (<><div className="d-label">Next instruction</div><p>{open.nextInstruction}</p></>)}
            {open.executionInstructions && (<><div className="d-label">Execution notes</div><p>{open.executionInstructions}</p></>)}
            {!open.nextInstruction && !open.executionInstructions && (
              <><div className="d-label">Notes</div><p>No instruction on this task in Notion.</p></>
            )}
            <div className="actions">
              {open.link && <a className="pill" href={open.link} target="_blank" rel="noopener noreferrer">Open linked page</a>}
              {open.url && <a className={"pill" + (open.link ? " ghost" : "")} href={open.url} target="_blank" rel="noopener noreferrer">Task in Notion</a>}
              <button className="pill ghost" type="button" ref={closeRef} onClick={closeDetail}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
