"use client";

import { useMemo, useRef, useState } from "react";
import type { BulkAction, LoopsData, LoopTask, Prev } from "@/lib/loops";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const md = (ymd: string) => `${MONTHS[Number(ymd.slice(5, 7)) - 1]} ${Number(ymd.slice(8, 10))}`;
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
const dayNum = (ymd: string) => {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
};

const PEEK = 5;
const CHUNK = 12;

const ACTIONS: { id: BulkAction; label: string; sentence: string; hint: string }[] = [
  { id: "drop", label: "Drop it", sentence: "Drop", hint: "Archive them. They stay in Notion." },
  { id: "unschedule", label: "Back to to-schedule", sentence: "Move back to to-schedule", hint: "Clear the old date and set Status to Schedule." },
  { id: "done", label: "Mark Done", sentence: "Mark Done", hint: "Counts as finished in totals and reviews." },
  { id: "today", label: "Move to today", sentence: "Move to today", hint: "Set the date to today. Status stays." },
];

type Batch = { label: string; items: Prev[]; tasks: LoopTask[] };

export default function LoopsPlanner({ data }: { data: LoopsData }) {
  const [tasks, setTasks] = useState<LoopTask[]>(data.pastDue.tasks);
  const [all, setAll] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<BulkAction | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [undo, setUndo] = useState<Batch | null>(null);
  const busy = useRef(false);

  const shown = all ? tasks : tasks.slice(0, PEEK);
  const hidden = tasks.length - shown.length;
  const total = tasks.length;
  const pickedTasks = useMemo(() => tasks.filter((t) => picked.has(t.id)), [tasks, picked]);

  const toggle = (id: string) =>
    setPicked((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const post = async (body: unknown) => {
    const res = await fetch("/api/loops/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || !out.ok) throw new Error(out.message || "Notion did not accept the change. Nothing more was changed.");
    return out;
  };

  const run = async (action: BulkAction) => {
    if (busy.current) return;
    busy.current = true;
    setConfirm(null);
    setNotice(null);
    setUndo(null);
    const chosen = pickedTasks;
    const done: Prev[] = [];
    let skipped = 0;
    let failedCount = 0;
    let stopped: string | null = null;
    try {
      for (let i = 0; i < chosen.length; i += CHUNK) {
        setWorking(`Working... ${Math.min(i, chosen.length)} of ${chosen.length} done`);
        const part = chosen.slice(i, i + CHUNK);
        try {
          const out = await post({ mode: "apply", action, ids: part.map((t) => t.id) });
          done.push(...(out.changed as Prev[]));
          skipped += out.skipped;
          failedCount += out.failed;
          // Remove from the list as we go, so the page always matches Notion.
          const gone = new Set((out.changed as Prev[]).map((c) => c.id));
          setTasks((cur) => cur.filter((t) => !gone.has(t.id)));
          setPicked((cur) => {
            const next = new Set(cur);
            gone.forEach((g) => next.delete(g));
            return next;
          });
        } catch (e) {
          stopped = (e as Error).message;
          break;
        }
      }
    } finally {
      busy.current = false;
      setWorking(null);
    }
    const label = ACTIONS.find((a) => a.id === action)!.sentence;
    const idSet = new Set(done.map((d) => d.id));
    if (done.length) setUndo({ label, items: done, tasks: chosen.filter((t) => idSet.has(t.id)) });
    const bits = [`${label}: ${plural(done.length, "task")} changed in Notion.`];
    if (skipped) bits.push(`${plural(skipped, "task")} had already changed, so they were left alone.`);
    if (failedCount) bits.push(`${plural(failedCount, "task")} did not save.`);
    if (stopped) bits.push(`Stopped early: ${stopped}`);
    setNotice(bits.join(" "));
  };

  const doUndo = async () => {
    if (!undo || busy.current) return;
    busy.current = true;
    const batch = undo;
    setUndo(null);
    setNotice(null);
    let restored = 0;
    let stopped: string | null = null;
    try {
      for (let i = 0; i < batch.items.length; i += 10) {
        setWorking(`Putting back... ${i} of ${batch.items.length}`);
        const part = batch.items.slice(i, i + 10);
        try {
          const out = await post({ mode: "restore", items: part });
          restored += out.restored;
          const back = new Set(part.map((p) => p.id));
          setTasks((cur) =>
            [...cur, ...batch.tasks.filter((t) => back.has(t.id))].sort((a, b) => a.due.start.localeCompare(b.due.start)),
          );
        } catch (e) {
          stopped = (e as Error).message;
          break;
        }
      }
    } finally {
      busy.current = false;
      setWorking(null);
    }
    setNotice(stopped ? `Put back ${restored} of ${batch.items.length}. ${stopped}` : `Put back ${plural(restored, "task")}.`);
  };

  const [y, m, d] = data.today.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  const none = !data.waiting.length && !data.noNext.length && !data.quiet.length && !tasks.length;
  const action = confirm ? ACTIONS.find((a) => a.id === confirm)! : null;

  return (
    <div className="tp">
      <div className="shell gutter">
        <div className="paper">
          <div className="holes" aria-hidden="true" />
          <header className="hd">
            <div>
              <div className="dow"><span>Open Loops</span></div>
              <div className="dmy">{dow}, {MONTHS[m - 1]} {d}</div>
            </div>
          </header>
          <p className="state-line">Things that may have slipped. Nothing here changes unless you choose it.</p>
          {data.warnings.map((w) => <p className="state-line" key={w}>{w}</p>)}
          {notice && (
            <p className="notice" role="status">
              {notice}{" "}
              {undo && <button className="refresh" type="button" onClick={doUndo}>Undo</button>}{" "}
              <button className="refresh" type="button" onClick={() => setNotice(null)}>Dismiss</button>
            </p>
          )}
          {working && <p className="notice" role="status">{working}</p>}
          {none && !working && <p className="wo-empty" style={{ marginTop: 18 }}>No open loops right now.</p>}

          {tasks.length > 0 && (
            <section>
              <div className="label">Past due ({data.pastDue.more ? `${total}+` : total})</div>
              <p className="lp-help">Dated tasks that are still open. Most of these are probably plans that changed.</p>

              {data.canEdit && (
                <div className="lp-bar">
                  <div className="lp-pick">
                    <button type="button" className="pj-btn ghost" disabled={!!working} onClick={() => { setAll(true); setPicked(new Set(tasks.map((t) => t.id))); }}>
                      Select all {tasks.length}
                    </button>
                    <button type="button" className="pj-btn ghost" disabled={!!working || picked.size === 0} onClick={() => setPicked(new Set())}>
                      Select none
                    </button>
                    <span className="lp-count">{picked.size} selected</span>
                  </div>
                  <div className="lp-acts">
                    {ACTIONS.map((a) => (
                      <button key={a.id} type="button" className="pj-btn" disabled={!!working || picked.size === 0} onClick={() => setConfirm(a.id)}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {action && (
                <div className="lp-confirm" role="alertdialog" aria-label="Confirm change">
                  <strong>{action.sentence} {plural(pickedTasks.length, "task")}?</strong>
                  <p>{action.hint}</p>
                  <ul>
                    {pickedTasks.slice(0, 3).map((t) => <li key={t.id}>{t.title}</li>)}
                    {pickedTasks.length > 3 && <li>and {pickedTasks.length - 3} more</li>}
                  </ul>
                  <div className="pj-row">
                    <button type="button" className="pj-btn" onClick={() => run(action.id)}>Yes, do it</button>
                    <button type="button" className="pj-btn ghost" onClick={() => setConfirm(null)}>Cancel</button>
                  </div>
                  <p className="lp-small">You can undo this right after.</p>
                </div>
              )}

              <ul className="wo-list">
                {shown.map((t) => (
                  <li key={t.id} className="lp-row">
                    {data.canEdit && (
                      <input type="checkbox" id={`c-${t.id}`} checked={picked.has(t.id)} disabled={!!working} onChange={() => toggle(t.id)} aria-label={`Select ${t.title}`} />
                    )}
                    <label htmlFor={`c-${t.id}`} className="lp-text">
                      <span className="lp-title">{t.title}</span>
                      <span className="lp-meta">Was due {md(t.day)} · {plural(dayNum(data.today) - dayNum(t.day), "day")} ago{t.status ? ` · ${t.status}` : ""}</span>
                    </label>
                  </li>
                ))}
              </ul>
              {hidden > 0 && (
                <button type="button" className="earlier" onClick={() => setAll(true)}>
                  and {hidden} more. Review them all
                </button>
              )}
              {all && tasks.length > PEEK && (
                <button type="button" className="earlier" onClick={() => setAll(false)}>Show only the oldest {PEEK}</button>
              )}
              {data.pastDue.more && <p className="lp-small">Showing the oldest 300. Clear these and the next ones will appear.</p>}
            </section>
          )}

          {data.waiting.length > 0 && (
            <section>
              <div className="label">Waiting too long ({data.waiting.length})</div>
              <ul className="wo-list">
                {data.waiting.slice(0, PEEK).map((i) => (
                  <li key={i.id} className="wo-card">
                    <div className="wo-title">{i.title}</div>
                    <div className="wo-meta">
                      {i.daysToCheck !== null && i.daysToCheck <= 0 ? "Check-back day has passed" : "No check-back date"}
                      {i.daysWaiting !== null ? ` · ${plural(i.daysWaiting, "day")} waiting` : ""}
                    </div>
                  </li>
                ))}
              </ul>
              <a className="pj-link lp-more" href="/waiting">{data.waiting.length > PEEK ? `and ${data.waiting.length - PEEK} more on ` : "Open "}Waiting On</a>
            </section>
          )}

          {data.noNext.length > 0 && (
            <section>
              <div className="label">Projects with no next action ({data.noNext.length})</div>
              <ul className="wo-list">
                {data.noNext.slice(0, PEEK).map((p) => (
                  <li key={p.id} className="wo-card"><div className="wo-title">{p.name}</div><div className="wo-meta">{p.status}</div></li>
                ))}
              </ul>
              <a className="pj-link lp-more" href="/projects">{data.noNext.length > PEEK ? `and ${data.noNext.length - PEEK} more on ` : "Open "}Projects</a>
            </section>
          )}

          {data.quiet.length > 0 && (
            <section>
              <div className="label">Projects gone quiet ({data.quiet.length})</div>
              <ul className="wo-list">
                {data.quiet.slice(0, PEEK).map((p) => (
                  <li key={p.id} className="wo-card">
                    <div className="wo-title">{p.name}</div>
                    <div className="wo-meta">Last moved {plural(p.quietDays, "day")} ago · usually every {plural(p.stallAfterDays ?? 0, "day")}</div>
                  </li>
                ))}
              </ul>
              <a className="pj-link lp-more" href="/projects">{data.quiet.length > PEEK ? `and ${data.quiet.length - PEEK} more on ` : "Open "}Projects</a>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
