"use client";

import { useMemo, useRef, useState } from "react";
import { ALL_CLEAN_IDS, CLEAN_AREAS, CLEAN_BREAKS, CLEAN_TOTAL } from "@/lib/deep-clean-data";

type Status = "saved" | "saving" | "error" | "refreshing";

export default function DeepCleanTracker({ initial, loaded }: { initial: Record<string, boolean>; loaded: boolean }) {
  const [checks, setChecks] = useState<Record<string, boolean>>(initial);
  const [areaId, setAreaId] = useState(() => CLEAN_AREAS.find(a => a.items.some(t => !initial[t.id]))?.id ?? CLEAN_AREAS[0].id);
  const [status, setStatus] = useState<Status>(loaded ? "saved" : "error");
  const checkedRef = useRef(checks);
  const dirtyRef = useRef(new Map<string, boolean>());
  const savingRef = useRef<Promise<void>>(Promise.resolve());
  const outstandingRef = useRef(0);
  const active = CLEAN_AREAS.find(a => a.id === areaId) ?? CLEAN_AREAS[0];
  const position = CLEAN_AREAS.findIndex(a => a.id === active.id);
  const count = useMemo(() => [...ALL_CLEAN_IDS].filter(id => checks[id]).length, [checks]);
  const pct = Math.round((count / CLEAN_TOTAL) * 100);
  const roomDone = (id: string) => {
    const a = CLEAN_AREAS.find(x => x.id === id);
    return a ? a.items.filter(item => checks[item.id]).length : 0;
  };
  const next = active.items.find(item => !checks[item.id]);

  function enqueue(id: string, done: boolean) {
    outstandingRef.current += 1;
    setStatus("saving");
    savingRef.current = savingRef.current
      .catch(() => {})
      .then(async () => {
        const response = await fetch("/api/cleaning/progress", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, done }),
        });
        if (!response.ok) throw new Error("Save failed");
        if (dirtyRef.current.get(id) === done) dirtyRef.current.delete(id);
      })
      .catch(() => { /* keep unsaved items available for retry */ })
      .finally(() => {
        outstandingRef.current -= 1;
        setStatus(outstandingRef.current > 0 ? "saving" : dirtyRef.current.size > 0 ? "error" : "saved");
      });
  }

  function toggle(id: string, done: boolean) {
    const updated = { ...checkedRef.current };
    if (done) updated[id] = true; else delete updated[id];
    checkedRef.current = updated;
    setChecks(updated);
    dirtyRef.current.set(id, done);
    enqueue(id, done);
  }

  function retry() {
    for (const [id, done] of dirtyRef.current.entries()) enqueue(id, done);
    if (dirtyRef.current.size === 0) void refresh();
  }

  async function refresh() {
    if (outstandingRef.current > 0) return;
    setStatus("refreshing");
    try {
      const response = await fetch("/api/cleaning/progress", { cache: "no-store" });
      if (!response.ok) throw new Error("Read failed");
      const data = await response.json();
      if (!data.ok || !data.progress?.checks) throw new Error("Bad response");
      const saved = data.progress.checks as Record<string, boolean>;
      checkedRef.current = saved;
      setChecks(saved);
      dirtyRef.current.clear();
      setStatus("saved");
    } catch { setStatus("error"); }
  }

  return (
    <main className="wrap dc-page page-turn">
      <div className="dc-topline">HOME RESET · FRIDAY, OCTOBER 30</div>
      <div className="dc-head">
        <div>
          <h1>Whole-home deep clean</h1>
          <p>One room at a time. Check it off, then move on.</p>
        </div>
        <span className="dc-count">{count} / {CLEAN_TOTAL}</span>
      </div>

      <section className="dc-summary" aria-label="Overall cleaning progress">
        <div className="dc-progress-head"><strong>{pct}% complete</strong><span>{CLEAN_TOTAL - count} tasks left</span></div>
        <div className="dc-progress" role="progressbar" aria-valuenow={count} aria-valuemin={0} aria-valuemax={CLEAN_TOTAL} aria-label="Whole-home cleaning progress">
          <span style={{ width: `${pct}%` }} />
        </div>
        <div className="dc-save-row">
          <span className={"dc-save " + status} aria-live="polite">
            {status === "saved" ? "✓ Checkmarks saved to your portal" : status === "saving" ? "Saving…" : status === "refreshing" ? "Refreshing…" : "Some changes aren't saved yet"}
          </span>
          {status === "error"
            ? <button type="button" className="dc-link" onClick={retry}>Retry save / load</button>
            : <button type="button" className="dc-link" disabled={status !== "saved"} onClick={() => void refresh()}>Refresh</button>}
        </div>
      </section>

      {count === CLEAN_TOTAL && <div className="dc-finished" role="status">✨ All done! Put your supplies away and enjoy your fresh home.</div>}

      <div className="dc-room-title">Choose your area</div>
      <nav className="dc-areas" aria-label="Cleaning areas">
        {CLEAN_AREAS.map(a => {
          const done = roomDone(a.id);
          const complete = done === a.items.length;
          return <button type="button" key={a.id} className={"dc-area " + (a.id === areaId ? "selected " : "") + (complete ? "complete" : "")}
            onClick={() => setAreaId(a.id)} aria-current={a.id === areaId ? "step" : undefined}>
            <span className="dc-area-icon" aria-hidden="true">{a.icon}</span>
            <span className="dc-area-name">{a.name}</span>
            <span className="dc-area-count">{complete ? "✓" : `${done}/${a.items.length}`}</span>
          </button>;
        })}
      </nav>

      <section className="dc-card" aria-labelledby="dc-room-heading">
        <div className="dc-card-top"><div><span className="dc-eyebrow">AREA {position + 1} OF {CLEAN_AREAS.length}</span>
          <h2 id="dc-room-heading">{active.icon} {active.name}</h2></div>
          <span className="dc-time">{active.time}</span></div>
        <p className="dc-desc">{active.description}</p>

        {next && <div className="dc-up-next"><span>DO THIS NEXT</span><strong>{next.text}</strong></div>}
        {!next && <div className="dc-up-next done"><span>ROOM COMPLETE</span><strong>Great work. Pick your next area.</strong></div>}

        <div className="dc-tasks">
          {active.items.map((item, i) => (
            <label className={"dc-task " + (checks[item.id] ? "done" : "")} key={item.id}>
              <input type="checkbox" checked={Boolean(checks[item.id])} onChange={e => toggle(item.id, e.target.checked)} />
              <span className="dc-box" aria-hidden="true">{checks[item.id] ? "✓" : ""}</span>
              <span className="dc-task-label">{item.text}</span>
              <span className="dc-task-num">{i + 1}</span>
            </label>
          ))}
        </div>
        <div className="dc-bottom-nav">
          <button type="button" className="dc-secondary" disabled={position === 0} onClick={() => setAreaId(CLEAN_AREAS[position - 1].id)}>← Previous</button>
          <span>{roomDone(active.id)} of {active.items.length} done</span>
          <button type="button" className="dc-primary" disabled={position === CLEAN_AREAS.length - 1} onClick={() => setAreaId(CLEAN_AREAS[position + 1].id)}>Next area →</button>
        </div>
      </section>

      <details className="dc-extras">
        <summary>See breaks, supplies & stopping rules</summary>
        <div className="dc-extras-body">
          <h3>Scheduled breaks</h3>
          {CLEAN_BREAKS.map(b => <p key={b.time}><strong>{b.time}</strong> — {b.label}</p>)}
          <h3>Keep it manageable</h3>
          <p>Do one room at a time. Dust high surfaces before doing floors. Do not reorganize closets or drawers. Stop starting new tasks at 4:30 PM; finish the reset by 5 PM for a 6 PM dinner.</p>
          <h3>Safety</h3>
          <p>Follow product labels, ventilate, never mix cleaners, and keep dogs away from chemicals and wet floors. Take a rest after your morning leg workout if needed.</p>
        </div>
      </details>
    </main>
  );
}
