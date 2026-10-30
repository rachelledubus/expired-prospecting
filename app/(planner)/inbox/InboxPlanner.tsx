"use client";

import { useRef, useState } from "react";
import { CAPTURE_TYPES } from "@/lib/inbox-sort";
import type { Created, InboxData, InboxItem, Prev } from "@/lib/inbox";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const md = (ymd: string) => `${MONTHS[Number(ymd.slice(5, 7)) - 1]} ${Number(ymd.slice(8, 10))}`;
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
const bare = (id: string) => id.replace(/-/g, "").toLowerCase();

type Undo = { label: string; run: () => Promise<void> };

export default function InboxPlanner({ data }: { data: InboxData }) {
  const [filed, setFiled] = useState<InboxItem[]>(data.filed);
  const [needs, setNeeds] = useState<InboxItem[]>(data.needs);
  const [text, setText] = useState("");
  const [working, setWorking] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [undo, setUndo] = useState<Undo | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [fixType, setFixType] = useState("Task");
  const [fixProject, setFixProject] = useState("");
  const [fixDue, setFixDue] = useState("");
  const [copied, setCopied] = useState(false);
  const busy = useRef(false);

  const lines = text.split(/\r?\n/).filter((l) => l.trim()).length;

  const post = async (body: unknown) => {
    const res = await fetch("/api/inbox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || !out.ok) throw new Error(out.message || "Notion did not accept the change. Nothing more was changed.");
    return out;
  };

  const place = (item: InboxItem) => {
    // An item lives in exactly one list, so a fix can move it between them.
    setFiled((cur) => cur.filter((i) => i.id !== item.id));
    setNeeds((cur) => cur.filter((i) => i.id !== item.id));
    if (item.filed) setFiled((cur) => [item, ...cur]);
    else setNeeds((cur) => [item, ...cur]);
  };
  const remove = (ids: string[]) => {
    const gone = new Set(ids);
    setFiled((cur) => cur.filter((i) => !gone.has(i.id)));
    setNeeds((cur) => cur.filter((i) => !gone.has(i.id)));
  };

  const dropIds = async (ids: string[], items: InboxItem[]) => {
    const out = await post({ mode: "drop", ids });
    const prevs = out.dropped as Prev[];
    remove(prevs.map((p) => p.id));
    const back = new Set(prevs.map((p) => p.id));
    setUndo({
      label: "Undo",
      run: async () => {
        const r = await post({ mode: "restore", items: prevs });
        items.filter((i) => back.has(i.id)).forEach(place);
        setNotice(`Put back ${plural(r.restored, "item")}.`);
      },
    });
    return out;
  };

  const add = async () => {
    if (busy.current || !lines) return;
    busy.current = true;
    setNotice(null);
    setUndo(null);
    setWorking(`Adding ${plural(lines, "item")}...`);
    try {
      const out = await post({ mode: "capture", text });
      const created = out.created as Created[];
      created.slice().reverse().forEach(place);
      setText("");
      const sorted = created.filter((c) => c.filed).length;
      const bits = [`Added ${plural(created.length, "item")}: ${sorted} sorted, ${created.length - sorted} to look at.`];
      if (out.failed) bits.push(`${plural(out.failed, "item")} did not save and ${out.failed === 1 ? "is" : "are"} still in the box. Check the list before adding again.`);
      setNotice(bits.join(" "));
      if (out.failed) {
        // Keep only the lines that did not save, so a retry cannot add the same ones twice.
        const saved = new Set(created.map((c) => c.original.toLowerCase()));
        setText(text.split(/\r?\n/).filter((l) => l.trim() && !saved.has(l.replace(/^\s*(?:[-*•]|\d{1,2}[.)])\s+/, "").trim().replace(/\s+/g, " ").toLowerCase())).join("\n"));
      }
      const ids = created.map((c) => c.id);
      if (ids.length) {
        setUndo({
          label: "Undo",
          run: async () => {
            const r = await dropIds(ids, created);
            setNotice(`Removed ${plural(r.dropped.length, "item")}. They are archived in Notion.`);
          },
        });
      }
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      busy.current = false;
      setWorking(null);
    }
  };

  const runUndo = async () => {
    if (!undo || busy.current) return;
    busy.current = true;
    const u = undo;
    setUndo(null);
    setWorking("Working...");
    try {
      await u.run();
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      busy.current = false;
      setWorking(null);
    }
  };

  const withItem = async (item: InboxItem, fn: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    setBusyId(item.id);
    setNotice(null);
    setUndo(null);
    try {
      await fn();
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      busy.current = false;
      setBusyId(null);
    }
  };

  const drop = (item: InboxItem) =>
    withItem(item, async () => {
      await dropIds([item.id], [item]);
      setNotice(`Removed "${item.title}". It is archived in Notion.`);
    });

  const makeTask = (item: InboxItem) =>
    withItem(item, async () => {
      const out = await post({ mode: "fix", id: item.id, task: true });
      place(out.item as InboxItem);
      setNotice(`Filed "${item.title}" as a task.`);
    });

  const openFix = (item: InboxItem) => {
    setOpen(item.id);
    setFixType(item.type ?? "Task");
    setFixProject(item.projectId ? data.projects.find((p) => bare(p.id) === bare(item.projectId!))?.id ?? "" : "");
    setFixDue(item.due ?? "");
  };

  const saveFix = (item: InboxItem) =>
    withItem(item, async () => {
      const body: Record<string, unknown> = { mode: "fix", id: item.id };
      if (fixType !== (item.type ?? "Task")) body.type = fixType;
      const curProject = item.projectId ? data.projects.find((p) => bare(p.id) === bare(item.projectId!))?.id ?? "" : "";
      if (fixProject !== curProject) body.project = fixProject || null;
      if (fixDue !== (item.due ?? "")) body.due = fixDue || null;
      // Saving an item that is still waiting, as a task, files it.
      if (!item.filed && fixType === "Task") body.task = true;
      if (Object.keys(body).length === 2) {
        setOpen(null);
        return;
      }
      const out = await post(body);
      place(out.item as InboxItem);
      setOpen(null);
      setNotice(`Saved "${item.title}".`);
    });

  const copyText = async () => {
    const body = needs
      .map((i, n) => `${n + 1}. ${i.title}${i.original && i.original !== i.title ? ` (I wrote: ${i.original})` : ""}${i.type && i.type !== "Task" ? ` [looks like: ${i.type}]` : ""} ${i.url}`)
      .join("\n");
    const out =
      "Please sort these Inbox items in my Notion Tasks database. For each one, suggest a Capture Type, a Route Destination, a project if one fits, and a due date if there is one. " +
      "Show me your suggestions first and only change Notion after I say yes.\n\n" + body;
    try {
      await navigator.clipboard.writeText(out);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setNotice("Your browser would not let the page copy. Select the items and copy them by hand.");
    }
  };

  const [y, m, d] = data.today.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });

  const fixPanel = (item: InboxItem) => (
    <div className="ib-fix">
      <label className="pj-label" htmlFor={`t-${item.id}`}>Type</label>
      <select id={`t-${item.id}`} value={fixType} onChange={(e) => setFixType(e.target.value)} disabled={busyId === item.id}>
        {CAPTURE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <label className="pj-label" htmlFor={`p-${item.id}`}>Project</label>
      <select id={`p-${item.id}`} value={fixProject} onChange={(e) => setFixProject(e.target.value)} disabled={busyId === item.id || data.projects.length === 0}>
        <option value="">No project</option>
        {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <label className="pj-label" htmlFor={`d-${item.id}`}>Date</label>
      <div className="pj-row">
        <input id={`d-${item.id}`} type="date" value={fixDue} onChange={(e) => setFixDue(e.target.value)} disabled={busyId === item.id} />
        {fixDue && <button type="button" className="pj-btn ghost" onClick={() => setFixDue("")}>No date</button>}
      </div>
      <div className="pj-row">
        <button type="button" className="pj-btn" disabled={busyId === item.id} onClick={() => saveFix(item)}>Save</button>
        <button type="button" className="pj-btn ghost" onClick={() => setOpen(null)}>Cancel</button>
      </div>
    </div>
  );

  const card = (item: InboxItem, look: boolean) => (
    <li key={item.id} className={"ib-card" + (look ? " look" : "") + (busyId === item.id ? " busy" : "")}>
      <div className="ib-title">{item.title}</div>
      {item.mine && item.original && item.original.toLowerCase() !== item.title.toLowerCase() && <div className="ib-said">You wrote: {item.original}</div>}
      {!item.mine && item.original && item.original !== item.title && <div className="ib-said">{item.original}</div>}
      <div className="ib-meta">
        {!item.mine && <span className="ib-tag">Added earlier</span>}
        {[
          look && item.mine && (item.type === "Task" || !item.type) ? "Could not tell what this is" : item.type ? (look && item.type !== "Task" ? `Looks like ${item.type}${item.route ? ` (${item.route})` : ""}` : item.type) : null,
          item.projectName ? `Project: ${item.projectName}` : null,
          item.due ? `Due ${md(item.due)}` : null,
        ].filter(Boolean).join(" · ")}
      </div>
      {item.mine && data.canEdit && (
        <>
          <div className="ib-acts">
            {look && item.type !== "Task" && <button type="button" className="pj-btn ghost" disabled={busyId === item.id} onClick={() => makeTask(item)}>Keep as a task</button>}
            {look && item.type === "Task" && <button type="button" className="pj-btn ghost" disabled={busyId === item.id} onClick={() => makeTask(item)}>File as a task</button>}
            <button type="button" className="pj-btn ghost" disabled={busyId === item.id} onClick={() => (open === item.id ? setOpen(null) : openFix(item))}>
              {open === item.id ? "Close" : "Fix"}
            </button>
            <button type="button" className="pj-btn ghost" disabled={busyId === item.id} onClick={() => drop(item)}>Drop</button>
            <a className="pj-link" href={item.url} target="_blank" rel="noreferrer">Open in Notion</a>
          </div>
          {open === item.id && fixPanel(item)}
        </>
      )}
      {!item.mine && (
        <div className="ib-acts"><a className="pj-link" style={{ marginLeft: 0 }} href={item.url} target="_blank" rel="noreferrer">Open in Notion</a></div>
      )}
    </li>
  );

  return (
    <div className="tp">
      <div className="shell gutter">
        <div className="paper">
          <div className="holes" aria-hidden="true" />
          <header className="hd">
            <div>
              <div className="dow"><span>Inbox</span></div>
              <div className="dmy">{dow}, {MONTHS[m - 1]} {d}</div>
            </div>
          </header>
          <p className="state-line">Write anything down. It is sorted into your Tasks automatically, and anything unclear waits here for you.</p>
          {data.warnings.map((w) => <p className="state-line" key={w}>{w}</p>)}

          {data.canEdit ? (
            <div className="ib-box">
              <label className="pj-label" htmlFor="ib-text" style={{ marginTop: 0 }}>Capture</label>
              <textarea
                id="ib-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={"One item per line.\ncall Dana about the listing tomorrow\norder closet bins\nbuy printer paper"}
                disabled={!!working}
              />
              <div className="pj-row">
                <button type="button" className="pj-btn" disabled={!!working || lines === 0} onClick={add}>
                  {lines > 1 ? `Add ${lines} items` : "Add to Inbox"}
                </button>
                <span className="lp-count">{lines > 10 ? "Up to 10 at a time" : ""}</span>
              </div>
              <p className="ib-hint">The sorting uses plain rules, not AI. It reads dates like tomorrow or Friday, matches words to your project names, and leaves anything unclear below.</p>
            </div>
          ) : (
            <p className="state-line">Adding needs the edit connection, which is not set up on this site yet. See docs/today-dashboard.md.</p>
          )}

          {notice && (
            <p className="notice" role="status">
              {notice}{" "}
              {undo && <button className="refresh" type="button" onClick={runUndo}>{undo.label}</button>}{" "}
              <button className="refresh" type="button" onClick={() => setNotice(null)}>Dismiss</button>
            </p>
          )}
          {working && <p className="notice" role="status">{working}</p>}

          <section>
            <div className="label">Needs a look ({data.needsMore ? `${needs.length}+` : needs.length})</div>
            {needs.length === 0 ? (
              <p className="wo-empty">Nothing waiting. Everything is sorted.</p>
            ) : (
              <>
                <div className="ib-copy">
                  <button type="button" className="pj-btn ghost" onClick={copyText}>{copied ? "Copied" : "Copy these for cleanup"}</button>
                </div>
                <ul className="wo-list">{needs.map((i) => card(i, true))}</ul>
              </>
            )}
          </section>

          {filed.length > 0 && (
            <section>
              <div className="label">Sorted for you, last 3 days ({filed.length})</div>
              <ul className="wo-list">{filed.map((i) => card(i, false))}</ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
