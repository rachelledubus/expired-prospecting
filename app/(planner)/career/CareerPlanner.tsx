"use client";

import { useMemo, useState } from "react";
import { CAREER_GATES, CAREER_SKILLS, type CareerGate, type CareerSkill } from "@/lib/career-skills";
import type { CareerProgress, CareerSkillState } from "@/lib/career-store";

type Editor = { status: string; evidenceUrl: string; verified: boolean; notes: string };
type SavePatch =
  | { type: "skill"; id: string; status: string; evidenceUrl: string; verified: boolean; notes: string }
  | { type: "action"; gate: number; taken: boolean };

const learningStatuses = ["Not started", "Learning", "Practicing"];
const validUrl = (value: string) => {
  try { return ["https:", "http:"].includes(new URL(value).protocol); }
  catch { return false; }
};

function stateOf(progress: CareerProgress, skill: CareerSkill): Editor {
  const saved = progress.skills[skill.id];
  return {
    status: saved?.status || skill.initialStatus || "Not started",
    evidenceUrl: saved?.evidenceUrl ?? "",
    verified: Boolean(saved?.verified),
    notes: saved?.notes ?? "",
  };
}
function proven(progress: CareerProgress, skill: CareerSkill): boolean {
  const state = progress.skills[skill.id];
  return Boolean(state?.verified && validUrl(state.evidenceUrl));
}
function gateCount(progress: CareerProgress, gate: CareerGate) {
  const all = CAREER_SKILLS.filter((skill) => skill.gate === gate.id);
  return { proven: all.filter((skill) => proven(progress, skill)).length, total: all.length };
}

export default function CareerPlanner({ initial }: { initial: CareerProgress }) {
  const [progress, setProgress] = useState(initial);
  const [selectedGate, setSelectedGate] = useState(() => CAREER_GATES.find((gate) => {
    const count = gateCount(initial, gate);
    return count.proven < count.total;
  })?.id ?? 1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [showProven, setShowProven] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const gate = CAREER_GATES.find((item) => item.id === selectedGate)!;
  const count = gateCount(progress, gate);
  const ready = count.proven === count.total;
  const totalProven = useMemo(() => CAREER_SKILLS.filter((s) => proven(progress, s)).length, [progress]);
  const skills = CAREER_SKILLS.filter((skill) => skill.gate === selectedGate && (showProven || !proven(progress, skill)));

  function openSkill(skill: CareerSkill) {
    if (expandedId === skill.id) {
      setExpandedId(null); setEditor(null); setNotice("");
      return;
    }
    setExpandedId(skill.id);
    setEditor(stateOf(progress, skill));
    setNotice("");
  }

  async function persist(patch: SavePatch): Promise<boolean> {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) {
        setNotice(payload.message || "The change did not save. Please retry.");
        return false;
      }
      setProgress(payload.progress as CareerProgress);
      setNotice("Saved — this will be available when you open the portal on another device.");
      return true;
    } catch {
      setNotice("Could not reach the portal. Nothing was marked complete.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveSkill(skill: CareerSkill) {
    if (!editor || busy) return;
    if (editor.verified && !validUrl(editor.evidenceUrl.trim())) {
      setNotice("Evidence required: add a valid http(s) link before you verify this skill.");
      return;
    }
    if (editor.evidenceUrl.trim() && !validUrl(editor.evidenceUrl.trim())) {
      setNotice("Evidence link must start with https:// or http://.");
      return;
    }
    const ok = await persist({
      type: "skill", id: skill.id,
      status: editor.verified ? "Verified" : editor.status,
      evidenceUrl: editor.evidenceUrl.trim(), verified: editor.verified,
      notes: editor.notes.trim(),
    });
    if (ok) { setExpandedId(null); setEditor(null); }
  }

  async function actionToggle() {
    if (busy) return;
    await persist({ type: "action", gate: gate.id, taken: !Boolean(progress.actions[String(gate.id)]) });
  }

  return (
    <div className="shell gutter cr-shell">
      <div className="paper cr-paper">
        <div className="holes" aria-hidden="true" />
        <div className="cr-inner">
          <header className="cr-header">
            <div>
              <div className="cr-kicker">School → software engineering → consulting</div>
              <h1>Career readiness</h1>
              <p>Proof before doubt. Learn it, demonstrate it, then act.</p>
            </div>
            <div className="cr-total"><strong>{totalProven}/{CAREER_SKILLS.length}</strong><span>skills proven</span></div>
          </header>

          <div className="cr-gates" role="group" aria-label="Career milestones">
            {CAREER_GATES.map((item) => {
              const summary = gateCount(progress, item);
              const selected = item.id === selectedGate;
              const acted = Boolean(progress.actions[String(item.id)]);
              return (
                <button type="button" key={item.id}
                  className={"cr-gate" + (selected ? " on" : "")}
                  aria-pressed={selected}
                  onClick={() => { setSelectedGate(item.id); setExpandedId(null); setEditor(null); setNotice(""); setShowProven(false); }}>
                  <span className="cr-gate-number">0{item.id} {acted ? "✓" : summary.proven === summary.total ? "★" : ""}</span>
                  <strong>{item.title}</strong>
                  <span className="cr-gate-count">{summary.proven} of {summary.total} proven</span>
                  <span className="cr-meter" aria-hidden="true"><span style={{ width: (summary.proven / summary.total * 100) + "%" }} /></span>
                </button>
              );
            })}
          </div>

          <section className="cr-milestone" aria-label="Selected milestone">
            <div className="cr-milestone-top">
              <div><span className="cr-kicker">Milestone {gate.id}</span><h2>{gate.title}</h2></div>
              <span className={"cr-pill" + (ready ? " ready" : "")}>{ready ? "READY — TAKE ACTION" : count.proven + "/" + count.total + " verified"}</span>
            </div>
            <p className="cr-muted">{ready ? "The required proof is complete. Don't add another prerequisite." : "Focus on these evidence requirements as you complete your WGU courses. You can apply for roles sooner."}</p>
            <div className="cr-action">
              <div className="cr-kicker">{ready ? "Your action now" : "Action this evidence unlocks"}</div>
              <p>{gate.action}</p>
              <div className="cr-action-bottom">
                <span>{gate.deadline}</span>
                <button type="button" onClick={actionToggle} disabled={busy} className="cr-do-btn">
                  {progress.actions[String(gate.id)] ? "✓ Action recorded · Undo" : "Mark action taken"}
                </button>
              </div>
            </div>
          </section>

          <div className="cr-skill-heading">
            <div><h2>Skills and evidence</h2><p>{count.total - count.proven} remaining in this milestone</p></div>
            <label className="cr-completed-toggle"><input type="checkbox" checked={showProven} onChange={(e) => setShowProven(e.target.checked)} /> Show completed</label>
          </div>
          {notice && <p className="cr-notice" role="status">{notice}</p>}
          <div className="cr-skill-list">
            {skills.length === 0 && <div className="cr-empty"><strong>Everything in this milestone is verified.</strong><p>Use the action above. Switch on “Show completed” to review your proof.</p></div>}
            {skills.map((skill) => {
              const complete = proven(progress, skill);
              const saved = stateOf(progress, skill);
              const open = expandedId === skill.id;
              return (
                <article className={"cr-skill" + (complete ? " done" : "")} key={skill.id}>
                  <button type="button" className="cr-skill-title" aria-expanded={open} onClick={() => openSkill(skill)}>
                    <span className="cr-check-icon" aria-hidden="true">{complete ? "✓" : "○"}</span>
                    <span className="cr-skill-text"><strong>{skill.name}</strong><small>{skill.domain} · {complete ? "Verified" : saved.status}</small></span>
                    <span aria-hidden="true">{open ? "⌄" : "›"}</span>
                  </button>
                  {open && editor && (
                    <div className="cr-skill-detail">
                      <div className="cr-proof"><strong>What counts as proof</strong><p>{skill.proof}</p></div>
                      <p className="cr-step"><strong>Next small step:</strong> {skill.next}</p>
                      <p className="cr-course"><strong>WGU courses:</strong> {skill.course}</p>
                      <label className="cr-field">Learning status
                        <select value={editor.verified ? "Verified" : editor.status} disabled={editor.verified}
                          onChange={(e) => setEditor({ ...editor, status: e.target.value })}>
                          {learningStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                          {editor.verified && <option value="Verified">Verified</option>}
                        </select>
                      </label>
                      <label className="cr-field">Evidence URL
                        <input type="url" value={editor.evidenceUrl} maxLength={1000} placeholder="https://github.com/…"
                          onChange={(e) => setEditor({ ...editor, evidenceUrl: e.target.value })} />
                      </label>
                      <label className="cr-field">Private notes (optional)
                        <textarea rows={2} maxLength={600} value={editor.notes} placeholder="What I built, tested or demonstrated"
                          onChange={(e) => setEditor({ ...editor, notes: e.target.value })} />
                      </label>
                      <label className="cr-verified-check">
                        <input type="checkbox" checked={editor.verified} onChange={(e) => setEditor({ ...editor, verified: e.target.checked })} />
                        <span><strong>I checked that my evidence meets the requirement.</strong><small>A checked box without a valid evidence URL never counts.</small></span>
                      </label>
                      <div className="cr-row-buttons">
                        <button type="button" disabled={busy} className="cr-save" onClick={() => saveSkill(skill)}>{busy ? "Saving…" : "Save skill"}</button>
                        <button type="button" disabled={busy} className="cr-cancel" onClick={() => { setExpandedId(null); setEditor(null); setNotice(""); }}>Cancel</button>
                        {validUrl(saved.evidenceUrl) && <a href={saved.evidenceUrl} target="_blank" rel="noopener noreferrer">View saved evidence ↗</a>}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          <p className="cr-footer-note">
            This is a snapshot of your 33 Notion skills, with independent progress saved privately in this portal using Netlify storage.
            Checking boxes here does not update Notion. Meeting a gate is an action threshold, not a guarantee of employment,
            and you may apply for internships or jobs before all requirements are complete.
          </p>
        </div>
      </div>
    </div>
  );
}
