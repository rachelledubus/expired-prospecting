"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  GAMES,
  SEASONS,
  bundleItemKey,
  emptyProgress,
  fieldKey,
  isBundleGame,
  itemKey,
  objKey,
  questKey,
  saveKey,
  seasonKey,
  type Bundle,
  type BundleGame,
  type BundleItem,
  type ChecklistGame,
  type GamePhase,
  type GameProgress,
  type GameProgressPatch,
  type GameQuestStep,
  type GameStoryline,
  type Season,
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

function Check({
  label,
  sub,
  checked,
  onChange,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="gm-item">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="gm-box" aria-hidden="true" />
      <span className="gm-txt">
        <span className="gm-name">{label}</span>
        {sub && <span className="gm-sub">{sub}</span>}
      </span>
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

type ViewProps<G> = {
  game: G;
  prog: GameProgress;
  setCheck: (key: string, value: boolean) => void;
  setField: (key: string, value: string) => void;
};

/* ---------- Phase checklist (Stardew Mega-Mod) ---------- */

function phaseCounts(game: ChecklistGame, phase: GamePhase, progress: GameProgress) {
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

function phaseRemainingText(game: ChecklistGame, phase: GamePhase, progress: GameProgress): string {
  const lines = [`Phase: ${phase.title} (${phase.when})`];
  for (const g of phase.groups) {
    const left = g.items.filter((t) => !progress.checks[itemKey(game.id, phase.id, g.label, t)]);
    if (!left.length) continue;
    lines.push("", g.label);
    left.forEach((t) => lines.push(`- [ ] ${t}`));
  }
  return lines.join("\n");
}

type ParsedGameDate = { season: string; day: number; year: number; totalDay: number };

function parseGameDate(value: string): ParsedGameDate | null {
  const m = value.match(/(Spring|Summer|Fall|Winter)\s+(\d{1,2}).*?Year\s*(\d+)/i);
  if (!m) return null;
  const season = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
  const day = Number(m[2]);
  const year = Number(m[3]);
  if (!Number.isFinite(day) || !Number.isFinite(year) || day < 1 || day > 28 || year < 1) return null;
  const seasonIndex = ["Spring", "Summer", "Fall", "Winter"].indexOf(season);
  return { season, day, year, totalDay: (year - 1) * 112 + seasonIndex * 28 + day };
}

function questStepKey(game: ChecklistGame, story: GameStoryline, step: GameQuestStep): string {
  if (step.legacy) return itemKey(game.id, step.legacy.phaseId, step.legacy.groupLabel, step.legacy.text);
  return questKey(game.id, story.id, step.id);
}

function ChecklistView({ game, prog, setCheck, setField }: ViewProps<ChecklistGame>) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const stats = useMemo(
    () => game.phases.map((p) => ({ phase: p, ...phaseCounts(game, p, prog) })),
    [game, prog],
  );
  const current = game.questBoard ? null : (stats.find((s) => s.done < s.total)?.phase ?? null);
  const questStats = useMemo(() => {
    if (!game.questBoard) return { done: 0, total: 0 };
    let qDone = 0;
    let qTotal = 0;
    for (const story of game.questBoard.storylines) {
      for (const step of story.steps) {
        qTotal += 1;
        if (prog.checks[questStepKey(game, story, step)]) qDone += 1;
      }
    }
    return { done: qDone, total: qTotal };
  }, [game, prog]);
  const phaseTotal = stats.reduce((n, s) => n + s.total, 0);
  const phaseDone = stats.reduce((n, s) => n + s.done, 0);
  const total = game.questBoard ? questStats.total : phaseTotal;
  const done = game.questBoard ? questStats.done : phaseDone;
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
  const gameDate = useMemo(() => parseGameDate(saveVal), [saveVal]);

  const questRows = useMemo(() => {
    if (!game.questBoard) return [];
    const storyById = new Map(game.questBoard.storylines.map((story) => [story.id, story]));
    const isRefDone = (ref: string) => {
      const split = ref.indexOf(":");
      if (split < 0) return false;
      const story = storyById.get(ref.slice(0, split));
      if (!story) return false;
      const step = story.steps.find((s) => s.id === ref.slice(split + 1));
      return !!step && !!prog.checks[questStepKey(game, story, step)];
    };

    return game.questBoard.storylines
      .map((story) => {
        const index = story.steps.findIndex((step) => !prog.checks[questStepKey(game, story, step)]);
        if (index < 0) return { story, step: null, bucket: "done" as const, reason: "", index };

        const step = story.steps[index];
        let bucket: "deadline" | "now" | "toward" | "waiting" = step.bucket;
        let reason = "";

        const missingReq = step.requires?.find((ref) => !isRefDone(ref));
        if (missingReq) {
          bucket = "waiting";
          reason = step.unlock ?? "Finish the required storyline first";
        }

        if (!missingReq && step.gate && gameDate) {
          const g = step.gate;
          let met = true;
          if (g.year !== undefined && gameDate.year !== g.year) met = false;
          if (g.seasons?.length && !g.seasons.includes(gameDate.season)) met = false;
          if (g.minDay !== undefined && gameDate.day < g.minDay) met = false;
          if (g.maxDay !== undefined && gameDate.day > g.maxDay) met = false;
          if (g.minTotalDay !== undefined && gameDate.totalDay < g.minTotalDay) met = false;
          if (!met && bucket !== "toward") {
            bucket = "waiting";
            reason = step.unlock ?? "Calendar gate not met yet";
          }
        }

        return { story, step, bucket, reason, index };
      })
      .filter((row) => row.step !== null);
  }, [game, prog, gameDate]);

  const playNext = useMemo(() => {
    const actionable = questRows
      .filter((r) => r.bucket === "deadline" || r.bucket === "now")
      .sort((a, b) => (b.step?.priority ?? 0) - (a.step?.priority ?? 0));
    if (actionable.length >= 5) return actionable.slice(0, 5);
    const toward = questRows
      .filter((r) => r.bucket === "toward")
      .sort((a, b) => (b.step?.priority ?? 0) - (a.step?.priority ?? 0));
    return [...actionable, ...toward].slice(0, 5);
  }, [questRows]);

  const renderQuestRow = (
    row: (typeof questRows)[number],
    compact = false,
  ) => {
    if (!row.step) return null;
    const key = questStepKey(game, row.story, row.step);
    const status =
      row.bucket === "deadline"
        ? "Do before the window closes"
        : row.bucket === "now"
          ? "Available now"
          : row.bucket === "toward"
            ? "Work toward"
            : row.reason || row.step.unlock || "Waiting";
    const details = [row.story.mod, status, row.step.how].filter(Boolean).join(" · ");
    return (
      <div className={"gm-quest-row " + row.bucket + (compact ? " compact" : "")} key={`${row.story.id}:${row.step.id}`}>
        <div className="gm-quest-context">
          <span className="gm-quest-mod">{row.story.mod}</span>
          <b>{row.story.title}</b>
        </div>
        <Check
          label={row.step.label}
          sub={details}
          checked={!!prog.checks[key]}
          onChange={(v) => setCheck(key, v)}
        />
      </div>
    );
  };

  return (
    <>
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

      {game.questBoard ? (
        <>
          <div className="label">Play this next</div>
          <div className="gm-card gm-quest-board">
            <p className="gm-small">{game.questBoard.intro}</p>
            {gameDate ? (
              <div className="gm-date-chip">{gameDate.season} {gameDate.day}, Year {gameDate.year}</div>
            ) : (
              <div className="gm-callout warn"><b>Date not recognized.</b> Use a format like “Spring 10, Year 1” so calendar gates can update automatically.</div>
            )}
            <div className="gm-play-next">
              {playNext.length ? playNext.map((row) => renderQuestRow(row, true)) : <p className="gm-note">No actionable storyline steps are left right now.</p>}
            </div>
          </div>

          <div className="label">What can I do?</div>
          <div className="gm-status-grid">
            <section className="gm-card gm-status-card">
              <div className="gm-status-title"><span>🟢</span><b>Available now</b></div>
              {questRows.filter((r) => r.bucket === "deadline" || r.bucket === "now").length ? (
                questRows
                  .filter((r) => r.bucket === "deadline" || r.bucket === "now")
                  .sort((a, b) => (b.step?.priority ?? 0) - (a.step?.priority ?? 0))
                  .map((row) => renderQuestRow(row))
              ) : <p className="gm-note">Nothing currently actionable.</p>}
            </section>

            <section className="gm-card gm-status-card">
              <div className="gm-status-title"><span>🟡</span><b>Work toward</b></div>
              {questRows.filter((r) => r.bucket === "toward").length ? (
                questRows
                  .filter((r) => r.bucket === "toward")
                  .sort((a, b) => (b.step?.priority ?? 0) - (a.step?.priority ?? 0))
                  .map((row) => renderQuestRow(row))
              ) : <p className="gm-note">No prep goals right now.</p>}
            </section>

            <section className="gm-card gm-status-card">
              <div className="gm-status-title"><span>🔒</span><b>Waiting on</b></div>
              {questRows.filter((r) => r.bucket === "waiting").length ? (
                questRows
                  .filter((r) => r.bucket === "waiting")
                  .sort((a, b) => (b.step?.priority ?? 0) - (a.step?.priority ?? 0))
                  .map((row) => renderQuestRow(row))
              ) : <p className="gm-note">Nothing is hard-locked right now.</p>}
            </section>
          </div>

          <div className="label">Storylines</div>
          {game.questBoard.storylines
            .filter((story) => story.steps.some((step) => !prog.checks[questStepKey(game, story, step)]))
            .map((story) => {
              const d = story.steps.filter((step) => !!prog.checks[questStepKey(game, story, step)]).length;
              const currentIndex = story.steps.findIndex((step) => !prog.checks[questStepKey(game, story, step)]);
              return (
                <details className="gm-card gm-story" key={story.id}>
                  <summary>
                    <span>
                      <small>{story.mod}</small>
                      <b>{story.title}</b>
                    </span>
                    <em>{d}/{story.steps.length}</em>
                  </summary>
                  {story.note && <p className="gm-note">{story.note}</p>}
                  <div className="gm-story-steps">
                    {story.steps.map((step, idx) => {
                      const key = questStepKey(game, story, step);
                      const currentStep = idx === currentIndex;
                      return (
                        <div className={currentStep ? "gm-story-step current" : "gm-story-step"} key={step.id}>
                          {currentStep && <span className="gm-current-tag">Next</span>}
                          <Check
                            label={step.label}
                            sub={step.how || step.unlock}
                            checked={!!prog.checks[key]}
                            onChange={(v) => setCheck(key, v)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}

          {game.questBoard.storylines.some((story) => story.steps.every((step) => !!prog.checks[questStepKey(game, story, step)])) && (
            <details className="gm-card gm-details">
              <summary>Completed storylines</summary>
              <ul className="gm-ul">
                {game.questBoard.storylines
                  .filter((story) => story.steps.every((step) => !!prog.checks[questStepKey(game, story, step)]))
                  .map((story) => <li key={story.id}>{story.title}</li>)}
              </ul>
            </details>
          )}
        </>
      ) : (
        <>
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
                {game.objectives.after.map((t) => <li key={t}>{t}</li>)}
              </ul>
              <p className="gm-small">{game.objectives.closing}</p>
            </div>
          </div>
        </>
      )}

      <details className="gm-card gm-details">
        <summary>How events trigger</summary>
        <ul className="gm-ul">
          {game.guide.events.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </details>

      <div className="label">{game.questBoard ? "Long-term roadmap — not a gate" : "Phases"}</div>
      {stats.map(({ phase, done: d, total: t }, idx) => {
        const isDone = d === t;
        const isCur = !game.questBoard && current?.id === phase.id;
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
                <em>{isDone ? "Done" : game.questBoard ? "Roadmap" : isCur ? "Current" : "Later"}</em>
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
                      const done = !!prog.checks[key];
                      return (
                        <Check
                          key={text}
                          label={text}
                          sub={done ? undefined : g.how?.[text]}
                          checked={done}
                          onChange={(v) => setCheck(key, v)}
                        />
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
                <CopyButton getText={() => phaseRemainingText(game, phase, prog)} />
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}

/* ---------- Community Center bundles, sorted by season ---------- */

type View = Season | "any";

const itemLabel = (i: BundleItem) =>
  `${i.name}${i.qty ? ` x${i.qty}` : ""}${i.quality ? ` (${i.quality} quality)` : ""}`;

const inView = (i: BundleItem, view: View) =>
  view === "any" ? i.seasons === "any" : i.seasons !== "any" && i.seasons.includes(view);

function BundleView({ game, prog, setCheck, setField }: ViewProps<BundleGame>) {
  const storedSeason = prog.fields[seasonKey(game.id)];
  const now: Season = (SEASONS as readonly string[]).includes(storedSeason ?? "")
    ? (storedSeason as Season)
    : game.defaultSeason;
  const [view, setView] = useState<View>(now);
  const [shown, setShown] = useState<Record<string, boolean>>({});

  const key = (b: Bundle, i: BundleItem) => bundleItemKey(game.id, b.id, i);
  const doneCount = (b: Bundle) => b.items.filter((i) => prog.checks[key(b, i)]).length;
  const complete = (b: Bundle) => doneCount(b) >= b.need;

  const bundlesDone = game.bundles.filter(complete).length;
  const pct = game.bundles.length ? Math.round((bundlesDone / game.bundles.length) * 100) : 0;

  // Items still worth gathering in a view: unchecked items in bundles that are not finished yet.
  const remaining = (v: View) =>
    game.bundles.reduce(
      (n, b) => (complete(b) ? n : n + b.items.filter((i) => inView(i, v) && !prog.checks[key(b, i)]).length),
      0,
    );

  const tabs: { id: View; label: string }[] = [...SEASONS.map((s) => ({ id: s as View, label: s })), { id: "any", label: "Any season" }];
  const visible = game.bundles.filter((b) => b.items.some((i) => inView(i, view)));

  const viewNote =
    view === "any"
      ? "Items you can get at any time of year."
      : `Items you can get in ${view}. Anything that works all year is on the Any season tab.`;

  const remainingText = () => {
    const label = view === "any" ? "Any season" : view;
    const lines = [`Community Center: ${label}`];
    for (const b of visible) {
      if (complete(b)) continue;
      const left = b.items.filter((i) => inView(i, view) && !prog.checks[key(b, i)]);
      if (!left.length) continue;
      lines.push("", `${b.room}: ${b.name} (need ${b.need - doneCount(b)} more)`);
      left.forEach((i) => lines.push(`- [ ] ${itemLabel(i)}`));
    }
    return lines.join("\n");
  };

  return (
    <>
      <p className="gm-mods">{game.mods}</p>
      <div className="gm-bar" aria-hidden="true">
        <i style={{ width: `${pct}%` }} />
      </div>
      <div className="gm-overall">
        <span>
          {bundlesDone} of {game.bundles.length} bundles complete
        </span>
        <span>{pct}%</span>
      </div>
      <div className="gm-rooms">
        {game.rooms.map((room) => {
          const inRoom = game.bundles.filter((b) => b.room === room);
          const d = inRoom.filter(complete).length;
          return (
            <span key={room} className={"gm-room" + (d === inRoom.length ? " done" : "")}>
              {room} <b>{d}/{inRoom.length}</b>
            </span>
          );
        })}
      </div>

      <div className="label">Items by season</div>
      <div className="gm-tabs" role="tablist" aria-label="Season">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={view === t.id}
            className={"gm-tab" + (view === t.id ? " on" : "")}
            onClick={() => setView(t.id)}
          >
            <span>{t.label}</span>
            <b>{remaining(t.id)}</b>
            {t.id === now && <em>now</em>}
          </button>
        ))}
      </div>
      <div className="gm-viewrow">
        <p className="gm-note">{viewNote}</p>
        {view !== "any" && view !== now && (
          <button type="button" className="gm-pill ghost" onClick={() => setField(seasonKey(game.id), view)}>
            It is {view} in game now
          </button>
        )}
      </div>

      {visible.length === 0 && <p className="gm-note">Nothing to gather here.</p>}
      {visible.map((b) => {
        const d = doneCount(b);
        const isDone = d >= b.need;
        const expanded = !isDone || !!shown[b.id];
        const needText = b.need === b.items.length ? `All ${b.need} needed` : `Any ${b.need} of ${b.items.length}`;
        const head = (
          <>
            <span className="gm-bh-top">
              <span className="gm-room-label">{b.room}</span>
              <span className={"gm-bcount" + (isDone ? " done" : "")}>{isDone ? "Complete" : `${d} of ${b.need}`}</span>
            </span>
            <span className="gm-bname">{b.name}</span>
            <span className="gm-bneed">{needText}</span>
          </>
        );
        return (
          <section key={b.id} className={"gm-bundle" + (isDone ? " done" : "")}>
            {isDone ? (
              <button
                type="button"
                className="gm-bh"
                aria-expanded={expanded}
                onClick={() => setShown((s) => ({ ...s, [b.id]: !s[b.id] }))}
              >
                {head}
              </button>
            ) : (
              <div className="gm-bh static">{head}</div>
            )}
            {expanded && (
              <div className="gm-bitems">
                {b.items
                  .filter((i) => inView(i, view))
                  .map((i) => {
                    const others = i.seasons === "any" ? [] : i.seasons.filter((s) => s !== view);
                    const sub = [others.length ? `Also in ${others.join(", ")}` : "", i.note ?? ""].filter(Boolean).join(". ");
                    return (
                      <Check
                        key={i.id ?? i.name}
                        label={itemLabel(i)}
                        sub={sub || undefined}
                        checked={!!prog.checks[key(b, i)]}
                        onChange={(v) => setCheck(key(b, i), v)}
                      />
                    );
                  })}
              </div>
            )}
          </section>
        );
      })}

      <div className="gm-foot-actions">
        <CopyButton getText={remainingText} />
      </div>
      <ul className="gm-ul gm-footnotes">
        {game.footnotes.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </>
  );
}

/* ---------- Page ---------- */

export default function GamesPlanner({ initial, loaded }: { initial: Record<string, GameProgress>; loaded: boolean }) {
  const [gameId, setGameId] = useState(GAMES[0].id);
  const [progress, setProgress] = useState<Record<string, GameProgress>>(initial);
  const [status, setStatus] = useState<Status>(loaded ? "idle" : "error");
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
            <div className="gm-chips" role="tablist" aria-label="Game checklists" onClick={() => setArmed(false)}>
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

          {isBundleGame(game) ? (
            <BundleView key={game.id} game={game} prog={prog} setCheck={setCheck} setField={setField} />
          ) : (
            <ChecklistView key={game.id} game={game} prog={prog} setCheck={setCheck} setField={setField} />
          )}

          <div className="gm-foot">
            <span className="gm-small" aria-live="polite">
              {statusText}
            </span>
            <button type="button" className={"gm-pill ghost" + (armed ? " arm" : "")} onClick={resetGame}>
              {armed ? "Tap again to confirm" : isBundleGame(game) ? "Reset this tracker" : "Reset this checklist"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
