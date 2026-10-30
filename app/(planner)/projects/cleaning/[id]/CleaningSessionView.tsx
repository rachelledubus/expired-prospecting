"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { allIds, getTemplate } from "@/lib/cleaning-templates";
import type { CleaningSession, Resolution } from "@/lib/cleaning-templates";

export default function CleaningSessionView({ initial }: { initial: CleaningSession }) {
  const [session, setSession] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const template = getTemplate(session.templateId)!;
  const ids = allIds(template);
  const tasks = useMemo(() => template.areas.flatMap((area) => area.items.map((item) =>
    ({ ...item, area: area.name, icon: area.icon }))), [template]);
  const lookup = new Map(tasks.map((task) => [task.id, task]));
  const queue = session.queue.filter((id) => ids.includes(id) && !session.resolutions[id]);
  const remaining = [...queue, ...ids.filter((id) => !queue.includes(id) && !session.resolutions[id])];
  const done = Object.values(session.resolutions).filter((r) => r === "done").length;
  const notNeeded = Object.values(session.resolutions).filter((r) => r === "not-needed").length;
  const resolved = done + notNeeded;

  async function action(kind: "resolve" | "skip" | "sync", taskId?: string, resolution?: Resolution | null) {
    setBusy(true); setError(null); setMessage(null);
    try {
      const res = await fetch("/api/cleaning/sessions/" + session.id, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: kind, ...(taskId ? { taskId } : {}), ...(kind === "resolve" ? { resolution } : {}) }) });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.ok) throw new Error(result.message || "Change could not be saved.");
      setSession(result.session);
      if (result.warning) setError(result.warning);
      else if (kind === "sync") setMessage("Linked Notion phases are up to date.");
    } catch (e) { setError(e instanceof Error ? e.message : "Check your connection and retry."); }
    finally { setBusy(false); }
  }

  return (
    <main className="hc-checklist wrap page-turn">
      <Link className="hc-back" href="/projects">← Projects / Home</Link>
      <div className="hc-titleline"><div><span className="hc-overline">HOME · CLEANING</span><h1>{template.name}</h1>
        <p>{template.duration} · {template.description}</p></div>
        <span className="hc-bigcount">{resolved}/{ids.length}</span>
      </div>
      <section className="hc-summary" aria-label="Cleaning progress">
        <div className="hc-progress-head"><strong>{Math.round(resolved / ids.length * 100)}% resolved</strong><span>{done} done · {notNeeded} not needed</span></div>
        <div className="hc-meter"><i style={{ width: (resolved * 100 / ids.length) + "%" }} /></div>
        <p>Checkmarks save automatically. “Not Needed” counts as resolved, but is recorded separately.</p>
      </section>
      {session.status !== "active" ? (
        <div className="hc-finished"><h2>{session.status === "completed" ? "✨ Cleaning complete!" : "Archived as incomplete"}</h2>
          <p>{session.status === "completed" ? "Your finished session is saved in Cleaning History." : "Your progress was preserved when you chose Start Fresh."}</p>
          <Link href="/projects">Back to Home projects</Link></div>
      ) : (
        <>
          <section className="hc-next" aria-label="Next three recommended cleaning tasks">
            <div className="hc-section-head"><h2>Do these next</h2><span>{remaining.length} remaining</span></div>
            <p>Follow this order to avoid redoing work. Skip a task to move it later.</p>
            {remaining.slice(0, 3).map((id, i) => {
              const task = lookup.get(id)!;
              return <div className="hc-step" key={id}>
                <div className="hc-step-number">{i + 1}</div>
                <div className="hc-step-body"><small>{task.icon} {task.area}</small><strong>{task.text}</strong>
                  <div className="hc-step-actions">
                    <button type="button" disabled={busy} className="hc-action primary" onClick={() => void action("resolve", id, "done")}>✓ Done</button>
                    <button type="button" disabled={busy} className="hc-action" onClick={() => void action("skip", id)}>Skip for now</button>
                    <button type="button" disabled={busy} className="hc-action" onClick={() => void action("resolve", id, "not-needed")}>Not needed</button>
                  </div>
                </div>
              </div>;
            })}
            {remaining.length === 0 && <p className="hc-muted">All tasks are resolved. Your session is ready to archive.</p>}
          </section>
        </>
      )}
      {error && <p className="hc-error" role="alert">{error} {session.phases.some((phase) => !phase.synced) && <button type="button" disabled={busy} onClick={() => void action("sync")}>Retry Notion sync</button>}</p>}
      {message && <p className="hc-message" role="status">{message}</p>}
      {busy && <p className="hc-muted" role="status">Saving…</p>}
      <details className="hc-all">
        <summary>View full checklist ({resolved}/{ids.length})</summary>
        <p className="hc-muted">You can check, mark not needed, or undo any item here. Sections correspond to rooms or cleaning phases.</p>
        {template.areas.map((area) => {
          const count = area.items.filter((item) => Boolean(session.resolutions[item.id])).length;
          return <section key={area.id}>
            <h3>{area.icon} {area.name} <span>{count}/{area.items.length}</span></h3>
            {area.items.map((item) => {
              const resolution = session.resolutions[item.id];
              return <div key={item.id} className="hc-all-row">
                <span className="hc-all-task">{item.text}</span>
                <div className="hc-all-actions">
                  {resolution ? <><span className="hc-resolved">{resolution === "done" ? "✓ Done" : "Not needed"}</span>
                    {session.status === "active" && <button type="button" disabled={busy} onClick={() => void action("resolve", item.id, null)}>Undo</button>}</>
                    : session.status === "active" ? <>
                      <button type="button" disabled={busy} onClick={() => void action("resolve", item.id, "done")}>✓ Done</button>
                      <button type="button" disabled={busy} onClick={() => void action("resolve", item.id, "not-needed")}>N/A</button>
                    </> : <span>Unfinished</span>}
                </div>
              </div>;
            })}
          </section>;
        })}
      </details>
      {session.phases.length > 0 && <div className="hc-sync">Notion schedule: {session.phases.filter((p) => p.synced).length} of {session.phases.length} cleaning blocks synced.
        {session.phases.some((p) => !p.synced) && <button type="button" disabled={busy} onClick={() => void action("sync")}>Retry Notion sync</button>}
      </div>}
      <p className="hc-safety">Follow product labels. Never mix cleaners, ventilate and keep dogs away from wet floors or cleaning products.</p>
    </main>
  );
}
