"use client";

import { useMemo, useState } from "react";
import type { ProjectCard, ProjectEdit, ProjectsData, ProjectStatus } from "@/lib/projects";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STATUSES: ProjectStatus[] = ["Not started", "In progress", "Waiting on Client", "Someday Maybe", "Done"];
const SCOPE_ORDER = ["Business", "School", "Personal", "Mixed"];

const md = (ymd: string) => `${MONTHS[Number(ymd.slice(5, 7)) - 1]} ${Number(ymd.slice(8, 10))}`;
const dayNum = (ymd: string) => {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
};
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

function metaText(p: ProjectCard, today: string): { text: string; quiet: boolean } {
  const bits: string[] = [];
  if (p.due) bits.push(p.due < today ? `Was due ${md(p.due)}` : p.due === today ? "Due today" : `Due ${md(p.due)}`);
  let quiet = false;
  if (p.lastProgress) {
    const ago = dayNum(today) - dayNum(p.lastProgress);
    bits.push(ago <= 0 ? "Moved today" : `Moved ${plural(ago, "day")} ago`);
    if (p.stallAfterDays && ago > p.stallAfterDays && p.status === "In progress") quiet = true;
  } else if (p.status === "In progress") {
    bits.push("No progress logged yet");
  }
  if (p.openTasks) bits.push(plural(p.openTasks, "open task"));
  return { text: bits.join(" · "), quiet };
}

type Save = (id: string, edit: ProjectEdit) => Promise<boolean>;

function Card({ p, today, canEdit, save, busy }: { p: ProjectCard; today: string; canEdit: boolean; save: Save; busy: boolean }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(p.next);
  const meta = metaText(p, today);
  const movedToday = p.lastProgress === today;
  const longNext = p.next.replace(/\s+/g, " ").trim() !== p.nextShort;

  return (
    <li className={`pj-card${meta.quiet ? " stale" : ""}${busy ? " busy" : ""}`}>
      <div className="pj-top">
        <div className="pj-name">{p.name}</div>
        <span className={`pj-status s-${p.status.toLowerCase().replace(/[^a-z]+/g, "-")}`}>{p.status}</span>
      </div>
      {p.nextShort && !open && <div className="pj-next">{p.nextShort}</div>}
      {!p.nextShort && !open && <div className="pj-next none">No next action yet.</div>}
      {meta.text && <div className={`pj-meta${meta.quiet ? " quiet" : ""}`}>{meta.text}</div>}
      {!open && longNext && (
        <details className="wo-more">
          <summary>Full note</summary>
          <p>{p.next}</p>
        </details>
      )}
      <div className="pj-actions">
        {canEdit && (
          <>
            <button type="button" className="pj-btn" disabled={busy || movedToday} onClick={() => save(p.id, { field: "moved" })}>
              {movedToday ? "Moved today" : "Moved it today"}
            </button>
            <button type="button" className="pj-btn ghost" aria-expanded={open} onClick={() => { setDraft(p.next); setOpen(!open); }}>
              {open ? "Close" : "Edit"}
            </button>
          </>
        )}
        <a className="pj-link" href={p.url} target="_blank" rel="noreferrer">Open in Notion</a>
      </div>

      {open && canEdit && (
        <div className="pj-edit">
          <label className="pj-label" htmlFor={`n-${p.id}`}>Next action</label>
          <textarea id={`n-${p.id}`} rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} />
          <div className="pj-row">
            <button type="button" className="pj-btn" disabled={busy || draft.trim() === p.next.trim()} onClick={() => save(p.id, { field: "next", value: draft })}>
              Save next action
            </button>
          </div>

          <div className="pj-label">Status</div>
          <div className="pj-chips" role="radiogroup" aria-label="Status">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={p.status === s}
                className={"pj-chip" + (p.status === s ? " on" : "")}
                disabled={busy}
                onClick={() => p.status !== s && save(p.id, { field: "status", value: s })}
              >
                {s}
              </button>
            ))}
          </div>

          <label className="pj-label" htmlFor={`d-${p.id}`}>Due date</label>
          <div className="pj-row">
            <input id={`d-${p.id}`} type="date" value={p.due ?? ""} disabled={busy} onChange={(e) => save(p.id, { field: "due", value: e.target.value || null })} />
            {p.due && (
              <button type="button" className="pj-btn ghost" disabled={busy} onClick={() => save(p.id, { field: "due", value: null })}>
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export default function ProjectsPlanner({ data }: { data: ProjectsData }) {
  const [items, setItems] = useState<ProjectCard[]>([...data.active, ...data.someday]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const save: Save = async (id, edit) => {
    const before = items;
    setBusyId(id);
    setNotice(null);
    // Show the change right away, and put it back if Notion does not accept it.
    setItems((cur) =>
      cur.map((p) => {
        if (p.id !== id) return p;
        switch (edit.field) {
          case "moved": return { ...p, lastProgress: data.today };
          case "next": {
            const next = edit.value.trim();
            const m = next.replace(/\s+/g, " ").match(/^.*?[.!?](?=\s|$)/);
            const s = m ? m[0] : next.replace(/\s+/g, " ");
            return { ...p, next, nextShort: s.length > 140 ? `${s.slice(0, 137).trimEnd()}...` : s };
          }
          case "status": return { ...p, status: edit.value };
          case "due": return { ...p, due: edit.value };
        }
      }),
    );
    try {
      const res = await fetch("/api/projects/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id, edit }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) {
        setItems(before);
        setNotice(out.message || "Notion did not accept the change. Nothing was changed.");
        return false;
      }
      // A project marked Done leaves the page, like it does on the next load.
      if (edit.field === "status" && edit.value === "Done") {
        setItems((cur) => cur.filter((p) => p.id !== id));
        setNotice("Marked Done in Notion.");
      }
      return true;
    } catch {
      setItems(before);
      setNotice("Could not reach the portal. Nothing was changed.");
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const { groups, someday } = useMemo(() => {
    const active = items.filter((p) => p.status !== "Someday Maybe");
    const names = Array.from(new Set(active.map((p) => p.scope).filter((s): s is string => Boolean(s))));
    names.sort((a, b) => {
      const ia = SCOPE_ORDER.indexOf(a), ib = SCOPE_ORDER.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
    });
    const groups = names.map((n) => ({ name: n, list: active.filter((p) => p.scope === n) }));
    const none = active.filter((p) => !p.scope);
    if (none.length) groups.push({ name: "No scope yet", list: none });
    return { groups, someday: items.filter((p) => p.status === "Someday Maybe") };
  }, [items]);

  const [y, m, d] = data.today.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  const activeCount = groups.reduce((n, g) => n + g.list.length, 0);

  return (
    <div className="tp">
      <div className="shell gutter">
        <div className="paper">
          <div className="holes" aria-hidden="true" />
          <header className="hd">
            <div>
              <div className="dow"><span>Projects</span></div>
              <div className="dmy">{dow}, {MONTHS[m - 1]} {d}</div>
            </div>
          </header>
          {!data.canEdit && (
            <p className="state-line">Editing is not set up yet, so this page is read-only. See docs/today-dashboard.md.</p>
          )}
          {notice && (
            <p className="notice" role="status">
              {notice} <button className="refresh" type="button" onClick={() => setNotice(null)}>Dismiss</button>
            </p>
          )}

          {activeCount === 0 && <p className="wo-empty" style={{ marginTop: 18 }}>No active projects.</p>}
          {groups.map((g) => (
            <section key={g.name}>
              <div className="label">{g.name} ({g.list.length})</div>
              <ul className="wo-list">
                {g.list.map((p) => (
                  <Card key={p.id} p={p} today={data.today} canEdit={data.canEdit} save={save} busy={busyId === p.id} />
                ))}
              </ul>
            </section>
          ))}

          {someday.length > 0 && (
            <details className="wo-hold">
              <summary>Someday Maybe ({someday.length})</summary>
              <ul className="wo-list">
                {someday.map((p) => (
                  <Card key={p.id} p={p} today={data.today} canEdit={data.canEdit} save={save} busy={busyId === p.id} />
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
