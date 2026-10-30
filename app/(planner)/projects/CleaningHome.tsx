"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CLEANING_TEMPLATES, getTemplate, allIds } from "@/lib/cleaning-templates";
import type { CleaningSession, CleaningType } from "@/lib/cleaning-templates";
import type { ScheduledCleaning } from "@/lib/scheduled-cleaning";

const dateText = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
export default function CleaningHome({ initial, scheduled, warning }: { initial: CleaningSession[]; scheduled: ScheduledCleaning[]; warning: string | null }) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initial);
  const [library, setLibrary] = useState(false);
  const [pending, setPending] = useState<{ templateId: CleaningType; scheduledId?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = sessions.filter((s) => s.status === "active");
  const history = sessions.filter((s) => s.status !== "active");

  async function start(templateId: CleaningType, startFresh: boolean, scheduledId?: string) {
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/cleaning/sessions", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, startFresh, ...(scheduledId ? { scheduledId } : {}) }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || "Could not open this cleaning routine.");
      setSessions((prev) => [result.session, ...prev.filter((s) => s.id !== result.session.id)]);
      router.push("/projects/cleaning/" + result.session.id);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not connect to the portal."); }
    finally { setBusy(false); }
  }

  function choose(templateId: CleaningType, scheduledId?: string) {
    const existing = active.find((s) => s.templateId === templateId);
    if (existing) { setPending({ templateId, scheduledId }); setLibrary(false); }
    else void start(templateId, false, scheduledId);
  }

  return (
    <div className="hc-home">
      <div className="hc-subhead"><strong>Active Cleaning</strong><span>{active.length} active</span></div>
      {warning && <p className="hc-error" role="alert">{warning}</p>}
      {active.length === 0 && <p className="hc-muted">No cleaning sessions in progress. Start a checklist whenever you need one.</p>}
      <div className="hc-cards">
        {active.map((s) => {
          const template = getTemplate(s.templateId)!;
          const count = Object.keys(s.resolutions).length, total = allIds(template).length;
          return (
            <Link href={"/projects/cleaning/" + s.id} className="hc-session-card" key={s.id}>
              <div className="hc-card-top"><strong>{template.name}</strong><span>{count}/{total}</span></div>
              <p>{template.duration} · Started {dateText(s.startedAt)}</p>
              <div className="hc-meter" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={count} aria-label={template.name + " progress"}><i style={{ width: (100 * count / total) + "%" }} /></div>
              <span className="hc-card-link">Continue checklist →</span>
            </Link>
          );
        })}
      </div>

      {scheduled.length > 0 && <section className="hc-scheduled">
        <strong>Scheduled in Notion</strong>
        {scheduled.map((group) => <div className="hc-scheduled-row" key={group.id}>
          <span>{group.title} · {group.date} · {group.phases.length} block(s)</span>
          <button type="button" className="pj-btn ghost" disabled={busy} onClick={() => choose(group.templateId, group.id)}>Open scheduled</button>
        </div>)}
      </section>}
      <button type="button" className="pj-btn hc-start" onClick={() => { setLibrary((value) => !value); setPending(null); }} aria-expanded={library} disabled={busy}>
        {library ? "Close checklist library" : "+ Start Cleaning"}
      </button>
      {library && (
        <section className="hc-library" aria-label="Reusable cleaning checklists">
          <p className="hc-muted">Choose a routine to start or resume. Your progress is saved in the portal.</p>
          {CLEANING_TEMPLATES.map((t) => (
            <button type="button" key={t.id} className="hc-template" disabled={busy} onClick={() => choose(t.id)}>
              <strong>{t.name}</strong><span>{t.duration} · {allIds(t).length} tasks</span><small>{t.description}</small>
            </button>
          ))}
        </section>
      )}
      {pending && (
        <div className="hc-choice" role="group" aria-label="Unfinished cleaning session">
          <strong>{getTemplate(pending.templateId)?.name} is already in progress.</strong>
          <p>Resume with your saved checkmarks, or start fresh. Starting fresh archives the old session as Incomplete.</p>
          <div className="pj-actions">
            <button className="pj-btn" type="button" disabled={busy} onClick={() => void start(pending.templateId, false, pending.scheduledId)}>Resume Existing</button>
            <button className="pj-btn ghost" type="button" disabled={busy} onClick={() => void start(pending.templateId, true, pending.scheduledId)}>Start Fresh</button>
            <button className="pj-btn ghost" type="button" disabled={busy} onClick={() => setPending(null)}>Cancel</button>
          </div>
        </div>
      )}
      {error && <p className="hc-error" role="alert">{error}</p>}
      <details className="hc-history">
        <summary>Cleaning History ({history.length})</summary>
        {history.length === 0 ? <p className="hc-muted">Completed and incomplete sessions will appear here.</p> : (
          <ul>
            {history.map((s) => {
              const template = getTemplate(s.templateId)!;
              const done = Object.values(s.resolutions).filter((r) => r === "done").length;
              const notNeeded = Object.values(s.resolutions).filter((r) => r === "not-needed").length;
              return <li key={s.id}><Link href={"/projects/cleaning/" + s.id}><strong>{template.name}</strong></Link>
                <span>{s.status === "completed" ? "Completed" : "Incomplete"} · {dateText(s.finishedAt || s.updatedAt)}</span>
                <small>{done} done · {notNeeded} not needed · {allIds(template).length - done - notNeeded} unfinished</small>
              </li>;
            })}
          </ul>
        )}
      </details>
    </div>
  );
}
