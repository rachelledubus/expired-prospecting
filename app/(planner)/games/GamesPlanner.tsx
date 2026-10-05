"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  GAMES,
  emptyProgress,
  fieldKey,
  itemKey,
  objKey,
  saveKey,
  type Game,
  type GamePhase,
  type GameProgress,
  type GameProgressPatch,
} from "@/lib/games-data";

type Status = "idle" | "saving" | "saved" | "error";

// A later change wins over an earlier one. A reset drops everything queued before it.
function mergePatch(older: GameProgressPatch | undefined, newer: GameProgressPatch): GameProgressPatch {
  if (!older || newer.reset) return { ...newer };
  return {
    reset: older.reset,
    checks: { ...older.checks, ...newer.checks },
    fields: { ...older.fields, ...newer.fields },
  };
}

function phaseCounts(game: Game, phase: GamePhase, progress: GameProgress) {
  let total = 0;
  let done = 0;
  for (const g of phase.groups) {
    for (const t of g.items) {
      total += 1;
      if (progress.checks[itemKey(game.id, phase.id, g.label, t)]) done += 1;
    }
  }
  return { done, total };
}

function remainingText(game: Game, phase: GamePhase, progress: GameProgress): string {
  const lines = [`Phase: ${phase.title} (${phase.when})`];
  for (const g of phase.groups) {
    const left = g.items.filter((t) => !progress.checks[itemKey(game.id, phase.id, g.label, t)]);
    if (!left.length) continue;
    lines.push("", g.label);
    left.forEach((t) => lines.push(`- [ ] ${t}`));
  }
  return lines.join("\n");
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.append(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="gm-item">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="gm-box" aria-hidden="true" />
      <span className="gm-txt">{label}</span>
    </label>
  );
}

function CopyButton({ getText }: { getText: () => string }) {
  const [label, setLabel] = useState("Copy what’s left");
  return (
    <button
      type="button"
      className="gm-pill"
      onClick={async () => {
        const ok = await copyToClipboard(getText());
        setLabel(ok ? "Copied" : "Could not copy");
        setTimeout(() => setLabel("Copy what’s left"), 1400);
      }}
    >
      {label}
    </button>
  );
}

export default function GamesPlanner({ initial, loaded }: { initial: Record<string, GameProgress>; loaded: boolean }) {
  const [gameId, setGameId] = useState(GAMES[0].id);
  const [progress, setProgress] = useState<Record<string, GameProgress>>(initial);
  const [status, setStatus] = useState<Status>(loaded ? "idle" : "error");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [armed, setArmed] = useState(false);

  const game = GAMES.find((g) => g.id === gameId) ?? GAMES[0];
  const prog = progress[game.id] ?? emptyProgress();

  // Saving: changes queue up, then go to the server together half a second after the last tap.
  const pending = useRef<Record<string, GameProgressPatch>>({});
  const inflight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const send = async () => {
    timer.current = null;
    if (inflight.current) {
      timer.current = setTimeout(send, 400);
      return;
    }
    const batch = pending.current;
    pending.current = {};
    const ids = Object.keys(batch);
    if (!ids.length) return;
    inflight.current = true;
    setStatus("saving");
    let ok = true;
    for (const id of ids) {
      try {
        const res = await fetch("/api/games/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game: id, patch: batch[id] }),
        });
        if (!res.ok) throw new Error(`save failed: ${res.status}`);
      } catch {
        ok = false;
        const newer = pending.current[id];
        pending.current[id] = newer ? mergePatch(batch[id], newer) : batch[id];
      }
    }
    inflight.current = false;
    setStatus(ok ? "saved" : "error");
  };

  const queue = (id: string, patch: GameProgressPatch) => {
    pending.current[id] = mergePatch(pending.current[id], patch);
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(send, 500);
  };

  // Coming back to the page (or switching devices) pulls in the latest saved boxes, unless changes are still waiting to save.
  useEffect(() => {
    const idle = () => !inflight.current && Object.keys(pending.current).length === 0;
    const onVisibility = async () => {
      if (document.visibilityState === "hidden") {
        if (timer.current) {
          clearTimeout(timer.current);
          void send();
        }
        return;
      }
      if (!idle()) return;
      for (const g of GAMES) {
        try {
          const res = await fetch(`/api/games/progress?game=${encodeURIComponent(g.id)}`, { cache: "no-store" });
          if (!res.ok) continue;
          const data = await res.json();
          if (data?.ok && idle()) setProgress((p) => ({ ...p, [g.id]: data.progress as GameProgress }));
        } catch {
          /* offline: keep what is on screen */
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
    // send only touches refs and setStatus, so the first copy is fine to keep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCheck = (key: string, value: boolean) => {
    setProgress((p) => {
      const cur = p[game.id] ?? emptyProgress();
      const checks = { ...cur.checks };
      if (value) checks[key] = true;
      else delete checks[key];
      return { ...p, [game.id]: { ...cur, checks } };
    });
    queue(game.id, { checks: { [key]: value } });
  };

  const setField = (key: string, value: string) => {
    setProgress((p) => {
      const cur = p[game.id] ?? emptyProgress();
      const fields = { ...cur.fields };
      if (value === "") delete fields[key];
      else fields[key] = value;
      return { ...p, [game.id]: { ...cur, fields } };
    });
    queue(game.id, { fields: { [key]: value } });
  };

  const resetGame = () => {
    if (!armed) {
      setArmed(true);
      if (armTimer.current) clearTimeout(armTimer.current);
      armTimer.current = setTimeout(() => setArmed(false), 4000);
      return;
    }
    if (armTimer.current) clearTimeout(armTimer.current);
    setArmed(false);
    setProgress((p) => ({ ...p, [game.id]: emptyProgress() }));
    queue(game.id, { reset: true });
  };

  const stats = useMemo(
    () => game.phases.map((p) => ({ phase: p, ...phaseCounts(game, p, prog) })),
    [game, prog],
  );
  const current = stats.find((s) => s.done < s.total)?.phase ?? null;
  const total = stats.reduce((n, s) => n + s.total, 0);
  const done = stats.reduce((n, s) => n + s.done, 0);
  const pct = total ? Math.round((done / total) * 100) : 0;

  // When the current phase changes, drop manual open/close choices so the new current one opens and the finished one closes.
  const curKey = `${game.id}:${current?.id ?? ""}`;
  const prevCur = useRef(curKey);
  useEffect(() => {
    if (prevCur.current === curKey) return;
    const before = prevCur.current;
    prevCur.current = curKey;
    setOpen((o) => {
      const n = { ...o };
      delete n[before];
      delete n[curKey];
      return n;
    });
  }, [curKey]);

  const isOpen = (p: GamePhase) => {
    const key = `${game.id}:${p.id}`;
    return key in open ? open[key] : current?.id === p.id;
  };
  const toggle = (p: GamePhase) => setOpen((o) => ({ ...o, [`${game.id}:${p.id}`]: !isOpen(p) }));

  const jumpToCurrent = () => {
    if (!current) return;
    setOpen((o) => ({ ...o, [`${game.id}:${current.id}`]: true }));
    document.getElementById(`gm-${game.id}-${current.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const saveVal = prog.fields[saveKey(game.id)] ?? game.saveDefault;
  const statusText =
    status === "saving"
      ? "Saving..."
      : status === "error"
        ? "Not saved yet. It will try again on your next change."
        : "Saved to your portal, so it matches on every device.";

  return (
    <div className="tp gm">
      <div className="shell gutter">
        <div className="paper">
          <div className="holes" aria-hidden="true" />
          <header className="hd">
            <div>
              <div className="dow">
                <span>Games</span>
              </div>
              <div className="dmy">{game.title}</div>
            </div>
          </header>

          {GAMES.length > 1 && (
            <div className="gm-chips" role="tablist" aria-label="Game checklists">
              {GAMES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  role="tab"
                  aria-selected={g.id === game.id}
                  className={"gm-chip" + (g.id === game.id ? " on" : "")}
                  onClick={() => setGameId(g.id)}
                >
                  {g.tab}
                </button>
              ))}
            </div>
          )}

          <p className="gm-mods">{game.mods}</p>
          <div className="gm-field-row">
            <label className="gm-lbl" htmlFor="gm-save">
              {game.saveLabel}
            </label>
            <input
              id="gm-save"
              className="gm-input"
              type="text"
              maxLength={200}
              value={saveVal}
              onChange={(e) => setField(saveKey(game.id), e.target.value)}
            />
          </div>
          <div className="gm-bar" aria-hidden="true">
            <i style={{ width: `${pct}%` }} />
          </div>
          <div className="gm-overall">
            <span>
              {done} of {total} done
            </span>
            <span>{pct}%</span>
          </div>

          <div className="label">The rule</div>
          <div className="gm-card">
            <h2 className="gm-h2">{game.rule.text}</h2>
            <p className="gm-small">{game.rule.notLabel}</p>
            <ul className="gm-ul">
              {game.rule.not.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>

          <div className="label">My current objectives</div>
          <div className="gm-card">
            <p className="gm-small">Whenever I load the game, I start with this card.</p>
            <div className="gm-cur">
              <span className="gm-small">Current phase:</span>
              <b>{current ? `${current.title} (${current.when})` : "All phases done"}</b>
              {current && (
                <button type="button" className="gm-pill" onClick={jumpToCurrent}>
                  Open it
                </button>
              )}
            </div>
            <div className="gm-sublabel">Next 5 things</div>
            {game.objectives.next.map((t) => {
              const key = objKey(game.id, t);
              return <Check key={t} label={t} checked={!!prog.checks[key]} onChange={(v) => setCheck(key, v)} />;
            })}
            <div className="gm-after">
              <div className="gm-sublabel">After those are done</div>
              <ul className="gm-ul">
                {game.objectives.after.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <p className="gm-small">{game.objectives.closing}</p>
            </div>
          </div>

          <div className="label">Phases</div>
          {stats.map(({ phase, done: d, total: t }, idx) => {
            const isDone = d === t;
            const isCur = current?.id === phase.id;
            const expanded = isOpen(phase);
            return (
              <section
                key={phase.id}
                id={`gm-${game.id}-${phase.id}`}
                className={"gm-phase" + (isDone ? " done" : isCur ? " current" : " later") + (expanded ? " open" : "")}
              >
                <button type="button" className="gm-head" aria-expanded={expanded} onClick={() => toggle(phase)}>
                  <span className="gm-badge">{isDone ? "✓" : idx + 1}</span>
                  <span className="gm-title">
                    <b>{phase.title}</b>
                    <span>{phase.when}</span>
                  </span>
                  <span className="gm-meta">
                    <b>
                      {d}/{t}
                    </b>
                    <em>{isDone ? "Done" : isCur ? "Current" : "Later"}</em>
                  </span>
                  <i className="gm-chev" aria-hidden="true" />
                </button>

                {expanded && (
                  <div className="gm-body">
                    <div className="gm-bar thin" aria-hidden="true">
                      <i style={{ width: `${t ? Math.round((d / t) * 100) : 0}%` }} />
                    </div>
                    {phase.callout && (
                      <div className="gm-callout">
                        {phase.callout.lead && <b>{phase.callout.lead} </b>}
                        {phase.callout.text}
                      </div>
                    )}
                    {phase.groups.map((g) => (
                      <div className="gm-group" key={g.label}>
                        <div className="gm-sublabel">{g.label}</div>
                        {g.note && <p className="gm-note">{g.note}</p>}
                        {g.field && (
                          <div className="gm-field-row">
                            <label className="gm-lbl" htmlFor={`gm-f-${phase.id}-${g.field}`}>
                              {g.field}:
                            </label>
                            <input
                              id={`gm-f-${phase.id}-${g.field}`}
                              className="gm-input"
                              type="text"
                              maxLength={200}
                              placeholder="Who did I pick?"
                              value={prog.fields[fieldKey(game.id, phase.id, g.field)] ?? ""}
                              onChange={(e) => setField(fieldKey(game.id, phase.id, g.field!), e.target.value)}
                            />
                          </div>
                        )}
                        {g.items.map((text) => {
                          const key = itemKey(game.id, phase.id, g.label, text);
                          return (
                            <Check key={text} label={text} checked={!!prog.checks[key]} onChange={(v) => setCheck(key, v)} />
                          );
                        })}
                        {g.after && <p className="gm-note end">{g.after}</p>}
                      </div>
                    ))}
                    {phase.footer && (
                      <div className={"gm-callout" + (phase.footer.warn ? " warn" : "")}>
                        <b>{phase.footer.lead} </b>
                        {phase.footer.text}
                      </div>
                    )}
                    <CopyButton getText={() => remainingText(game, phase, prog)} />
                  </div>
                )}
              </section>
            );
          })}

          <div className="gm-foot">
            <span className="gm-small" aria-live="polite">
              {statusText}
            </span>
            <button type="button" className={"gm-pill ghost" + (armed ? " arm" : "")} onClick={resetGame}>
              {armed ? "Tap again to confirm" : "Reset this checklist"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
