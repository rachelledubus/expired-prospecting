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
  mainQuestKey,
  questKey,
  saveKey,
  seasonKey,
  weatherKey,
  type Bundle,
  type BundleGame,
  type BundleItem,
  type ChecklistGame,
  type GamePhase,
  type GameProgress,
  type GameProgressPatch,
  type GameQuestBucket,
  type GameQuestStep,
  type GameStoryline,
  type Season,
} from "@/lib/games-data";
import Lookup from "./Lookup";

type Status = "idle" | "saving" | "saved" | "error" | "signedout" | "loadfail";

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

const boardKeyCache = new WeakMap<ChecklistGame, Set<string>>();

/** Roadmap boxes that a quest board step already uses. They live on the board, so the roadmap does not repeat them. */
function boardKeys(game: ChecklistGame): Set<string> {
  let keys = boardKeyCache.get(game);
  if (!keys) {
    const found = new Set<string>();
    game.questBoard?.storylines.forEach((story) =>
      story.steps.forEach((step) => {
        if (step.legacy) found.add(itemKey(game.id, step.legacy.phaseId, step.legacy.groupLabel, step.legacy.text));
      }),
    );
    keys = found;
    boardKeyCache.set(game, found);
  }
  return keys;
}

/** The items of a roadmap group that are shown there. */
function roadmapItems(game: ChecklistGame, phase: GamePhase, g: GamePhase["groups"][number]): string[] {
  const onBoard = boardKeys(game);
  return g.items.filter((t) => !g.hidden?.includes(t) && !onBoard.has(itemKey(game.id, phase.id, g.label, t)));
}

function phaseCounts(game: ChecklistGame, phase: GamePhase, progress: GameProgress) {
  let total = 0;
  let done = 0;
  let hidden = 0;
  for (const g of phase.groups) {
    const shown = roadmapItems(game, phase, g);
    hidden += g.items.length - shown.length;
    for (const t of shown) {
      total += 1;
      if (progress.checks[itemKey(game.id, phase.id, g.label, t)]) done += 1;
    }
  }
  return { done, total, hidden };
}

function phaseRemainingText(game: ChecklistGame, phase: GamePhase, progress: GameProgress): string {
  const lines = [`Phase: ${phase.title} (${phase.when})`];
  for (const g of phase.groups) {
    const left = roadmapItems(game, phase, g).filter((t) => !progress.checks[itemKey(game.id, phase.id, g.label, t)]);
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

const SEASON_NAMES = ["Spring", "Summer", "Fall", "Winter"] as const;

const formatGameDate = (season: string, day: number, year: number) => `${season} ${day}, Year ${year}`;

/** The date a number of days later (or earlier). Never goes before Spring 1, Year 1. */
function shiftGameDate(d: ParsedGameDate, days: number): string {
  const t = Math.max(0, d.totalDay - 1 + days);
  return formatGameDate(SEASON_NAMES[Math.floor((t % 112) / 28)], (t % 28) + 1, Math.floor(t / 112) + 1);
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

  const isOpen = (p: GamePhase) => !!open[`${game.id}:${p.id}`];
  const toggle = (p: GamePhase) => setOpen((o) => ({ ...o, [`${game.id}:${p.id}`]: !isOpen(p) }));

  const saveVal = prog.fields[saveKey(game.id)] ?? game.saveDefault;
  const gameDate = useMemo(() => parseGameDate(saveVal), [saveVal]);
  const shownDate = gameDate ?? parseGameDate(game.saveDefault) ?? { season: "Spring", day: 1, year: 1, totalDay: 1 };
  const weather = prog.fields[weatherKey(game.id)] ?? "sunny";
  const pinnedStory = prog.fields[mainQuestKey(game.id)] ?? "";

  type QuestRow = {
    story: GameStoryline;
    step: GameQuestStep;
    bucket: GameQuestBucket;
    reason: string;
    index: number;
    todayOk: boolean;
    importance: "required" | "recommended" | "optional";
  };

  const questRows = useMemo<QuestRow[]>(() => {
    const storyById = new Map(game.questBoard.storylines.map((story) => [story.id, story]));
    const isRefDone = (ref: string) => {
      const split = ref.indexOf(":");
      if (split < 0) return false;
      const story = storyById.get(ref.slice(0, split));
      if (!story) return false;
      const step = story.steps.find((s) => s.id === ref.slice(split + 1));
      return !!step && !!prog.checks[questStepKey(game, story, step)];
    };

    const rows: QuestRow[] = [];
    for (const story of game.questBoard.storylines) {
      const index = story.steps.findIndex((step) => !prog.checks[questStepKey(game, story, step)]);
      if (index < 0) continue;

      const step = story.steps[index];
      let bucket: GameQuestBucket = step.bucket;
      let reason = "";

      const missingReq = step.requires?.find((ref) => !isRefDone(ref));
      if (missingReq) {
        bucket = "waiting";
        reason = step.unlock ?? "Finish the required storyline first";
      }

      if (!missingReq && step.gate && gameDate) {
        const g = step.gate;
        let dateMet = true;
        if (g.year !== undefined && gameDate.year !== g.year) dateMet = false;
        if (g.seasons?.length && !g.seasons.includes(gameDate.season)) dateMet = false;
        if (g.minDay !== undefined && gameDate.day < g.minDay) dateMet = false;
        if (g.maxDay !== undefined && gameDate.day > g.maxDay) dateMet = false;
        if (g.minTotalDay !== undefined && gameDate.totalDay < g.minTotalDay) dateMet = false;
        if (!dateMet && bucket !== "toward") {
          bucket = "waiting";
          reason = step.unlock ?? "Calendar gate not met yet";
        }
      }

      const todayOk = !step.gate?.weather?.length || step.gate.weather.includes(weather as "sunny" | "rain" | "storm" | "snow");
      rows.push({
        story,
        step,
        bucket,
        reason,
        index,
        todayOk,
        importance: step.importance ?? story.importance ?? "recommended",
      });
    }
    return rows;
  }, [game, prog, gameDate, weather]);

  const scoreRow = (row: QuestRow) => {
    const bucketScore = row.bucket === "deadline" ? 500 : row.bucket === "now" ? 400 : row.bucket === "toward" ? 250 : 0;
    const importanceScore = row.importance === "required" ? 70 : row.importance === "recommended" ? 35 : 0;
    const weatherScore = row.todayOk ? 0 : -140;
    return bucketScore + importanceScore + (row.step.priority ?? 0) + weatherScore;
  };

  const rankedRows = useMemo(() => [...questRows].sort((a, b) => scoreRow(b) - scoreRow(a)), [questRows]);
  const pinnedRow = pinnedStory ? questRows.find((row) => row.story.id === pinnedStory) : undefined;
  const mainRow =
    pinnedRow ??
    rankedRows.find((row) => row.bucket !== "waiting" && row.todayOk) ??
    rankedRows.find((row) => row.bucket !== "waiting") ??
    rankedRows[0];

  const sideRows = rankedRows
    .filter((row) => row.story.id !== mainRow?.story.id && row.bucket !== "waiting" && row.todayOk)
    .slice(0, 4);

  const deadlineRows = rankedRows.filter((row) => row.bucket === "deadline");
  const availableRows = rankedRows.filter((row) => row.bucket === "now");
  const towardRows = rankedRows.filter((row) => row.bucket === "toward");
  const waitingRows = rankedRows.filter((row) => row.bucket === "waiting");
  const completedStories = game.questBoard.storylines.filter((story) =>
    story.steps.every((step) => !!prog.checks[questStepKey(game, story, step)]),
  );

  const questStats = useMemo(() => {
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
  const pct = questStats.total ? Math.round((questStats.done / questStats.total) * 100) : 0;

  const importanceLabel = (importance: QuestRow["importance"]) =>
    importance === "required" ? "Required" : importance === "recommended" ? "Recommended" : "Optional";

  const weatherLabel = (step: GameQuestStep) => {
    const needs = step.gate?.weather;
    if (!needs?.length) return "";
    return needs.map((w) => w[0].toUpperCase() + w.slice(1)).join(" / ");
  };

  const renderQuest = (row: QuestRow, mode: "main" | "compact" | "full" = "full") => {
    const { story, step } = row;
    const key = questStepKey(game, story, step);
    const nextStep = story.steps[row.index + 1];
    const weatherNeed = weatherLabel(step);
    const details = [
      step.location ? `📍 ${step.location}` : "",
      row.bucket === "waiting" ? `🔒 ${row.reason}` : "",
      !row.todayOk && weatherNeed ? `Not for today's weather · needs ${weatherNeed}` : "",
      step.reward ? `Unlocks/reward: ${step.reward}` : "",
    ].filter(Boolean);

    return (
      <article className={`gm-smart-quest ${row.bucket} ${mode === "main" ? "main" : ""}`} key={story.id}>
        <div className="gm-smart-top">
          <span className={`gm-importance ${row.importance}`}>{importanceLabel(row.importance)}</span>
          <span className="gm-quest-mod">{story.mod}</span>
          {pinnedStory === story.id && <span className="gm-pinned">Pinned Main</span>}
        </div>
        <h3>{story.title}</h3>
        <Check
          label={step.label}
          sub={step.how}
          checked={!!prog.checks[key]}
          onChange={(v) => setCheck(key, v)}
        />
        {details.length > 0 && (
          <div className="gm-quest-facts">
            {details.map((detail) => <span key={detail}>{detail}</span>)}
          </div>
        )}
        {step.why && <p className="gm-why"><b>Why it matters:</b> {step.why}</p>}
        {mode !== "compact" && nextStep && <p className="gm-next-preview"><b>After this:</b> {nextStep.label}</p>}
        <div className="gm-quest-actions">
          {pinnedStory !== story.id && row.bucket !== "waiting" && (
            <button type="button" className="gm-link-btn" onClick={() => setField(mainQuestKey(game.id), story.id)}>
              Make Main Quest
            </button>
          )}
          {pinnedStory === story.id && (
            <button type="button" className="gm-link-btn" onClick={() => setField(mainQuestKey(game.id), "")}>
              Use automatic Main Quest
            </button>
          )}
        </div>
        {mode === "full" && (
          <details className="gm-rest">
            <summary>Storyline path · {story.steps.filter((s) => !!prog.checks[questStepKey(game, story, s)]).length}/{story.steps.length}</summary>
            {story.note && <p className="gm-note">{story.note}</p>}
            {story.steps.map((s, idx) => {
              const k = questStepKey(game, story, s);
              const isCurrent = idx === row.index;
              return (
                <div className={isCurrent ? "gm-path-step current" : "gm-path-step"} key={s.id}>
                  <span>{prog.checks[k] ? "✓" : isCurrent ? "→" : "·"}</span>
                  <span>{s.label}</span>
                </div>
              );
            })}
          </details>
        )}
      </article>
    );
  };

  const roadmapCards = stats.map(({ phase, done: d, total: t, hidden: hiddenN }, idx) => {
    const isDone = d === t;
    const expanded = isOpen(phase);
    return (
      <section
        key={phase.id}
        id={`gm-${game.id}-${phase.id}`}
        className={"gm-phase" + (isDone ? " done" : " later") + (expanded ? " open" : "")}
      >
        <button type="button" className="gm-head" aria-expanded={expanded} onClick={() => toggle(phase)}>
          <span className="gm-badge">{isDone ? "✓" : idx + 1}</span>
          <span className="gm-title">
            <b>{phase.title}</b>
            <span>{phase.when}</span>
          </span>
          <span className="gm-meta">
            <b>{d}/{t}</b>
            {isDone && <em>Done</em>}
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
            {phase.groups.filter((g) => roadmapItems(game, phase, g).length > 0).map((g) => (
              <div className="gm-group" key={g.label}>
                <div className="gm-sublabel">{g.label}</div>
                {g.note && <p className="gm-note">{g.note}</p>}
                {g.field && (
                  <div className="gm-field-row">
                    <label className="gm-lbl" htmlFor={`gm-f-${phase.id}-${g.field}`}>{g.field}:</label>
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
                {roadmapItems(game, phase, g).map((text) => {
                  const key = itemKey(game.id, phase.id, g.label, text);
                  const checked = !!prog.checks[key];
                  return (
                    <Check
                      key={text}
                      label={text}
                      sub={checked ? undefined : g.how?.[text]}
                      checked={checked}
                      onChange={(v) => setCheck(key, v)}
                    />
                  );
                })}
                {g.after && <p className="gm-note end">{g.after}</p>}
              </div>
            ))}
            {hiddenN > 0 && <p className="gm-note">{hiddenN} linked items are tracked elsewhere in this guide, so they are not duplicated here.</p>}
            {phase.footer && (
              <div className={"gm-callout" + (phase.footer.warn ? " warn" : "")}>
                <b>{phase.footer.lead} </b>{phase.footer.text}
              </div>
            )}
            <CopyButton getText={() => phaseRemainingText(game, phase, prog)} />
          </div>
        )}
      </section>
    );
  });

  return (
    <>
      <p className="gm-mods">{game.mods}</p>

      <div className="gm-context-card">
        <div className="gm-date-block">
          <span className="gm-context-label">In-game date</span>
          <div className="gm-date" role="group" aria-label="In-game date">
            <select className="gm-input gm-sel" value={shownDate.season} onChange={(e) => setField(saveKey(game.id), formatGameDate(e.target.value, shownDate.day, shownDate.year))}>
              {SEASON_NAMES.map((n) => <option key={n}>{n}</option>)}
            </select>
            <select className="gm-input gm-sel" value={shownDate.day} onChange={(e) => setField(saveKey(game.id), formatGameDate(shownDate.season, Number(e.target.value), shownDate.year))}>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((n) => <option key={n}>{n}</option>)}
            </select>
            <select className="gm-input gm-sel" value={shownDate.year} onChange={(e) => setField(saveKey(game.id), formatGameDate(shownDate.season, shownDate.day, Number(e.target.value)))}>
              {Array.from({ length: Math.max(6, shownDate.year + 1) }, (_, i) => i + 1).map((n) => <option key={n} value={n}>Year {n}</option>)}
            </select>
            <button type="button" className="gm-pill" onClick={() => setField(saveKey(game.id), shiftGameDate(shownDate, 1))}>Next day</button>
          </div>
        </div>
        <div className="gm-weather-block">
          <label className="gm-context-label" htmlFor="gm-weather">Today's weather</label>
          <select id="gm-weather" className="gm-input gm-sel" value={weather} onChange={(e) => setField(weatherKey(game.id), e.target.value)}>
            <option value="sunny">Sunny / clear</option>
            <option value="rain">Rain</option>
            <option value="storm">Storm</option>
            <option value="snow">Snow</option>
          </select>
        </div>
      </div>

      {deadlineRows.length > 0 && (
        <section>
          <div className="label">⏰ Do before the window closes</div>
          <div className="gm-deadline-stack">{deadlineRows.map((row) => renderQuest(row, "compact"))}</div>
        </section>
      )}

      <div className="label">Dashboard</div>
      <div className="gm-dashboard">
        <section className="gm-main-panel">
          <div className="gm-panel-label">🎯 Main Quest</div>
          {mainRow ? renderQuest(mainRow, "main") : <p className="gm-note">You are caught up on the tracked storylines.</p>}
        </section>

        <section className="gm-next-panel">
          <div className="gm-panel-label">▶ Play This Next</div>
          {sideRows.length ? sideRows.map((row) => renderQuest(row, "compact")) : <p className="gm-note">No extra side objectives need your attention right now.</p>}
        </section>

        <section className="gm-progress-panel">
          <div className="gm-panel-label">📊 Story Progress</div>
          <div className="gm-bar"><i style={{ width: `${pct}%` }} /></div>
          <p className="gm-overview-number">{questStats.done} / {questStats.total} tracked steps</p>
          <div className="gm-mini-stats">
            <span><b>{availableRows.length}</b> available</span>
            <span><b>{towardRows.length}</b> work toward</span>
            <span><b>{waitingRows.length}</b> waiting</span>
            <span><b>{completedStories.length}</b> stories done</span>
          </div>
        </section>
      </div>

      <p className="gm-guide-rule">{game.rule.text}</p>

      {availableRows.length > 0 && (
        <section>
          <div className="label">🟢 Available Now · {availableRows.length}</div>
          <div className="gm-smart-list">{availableRows.map((row) => renderQuest(row))}</div>
        </section>
      )}

      {towardRows.length > 0 && (
        <section>
          <div className="label">🟡 Work Toward · {towardRows.length}</div>
          <div className="gm-smart-list">{towardRows.map((row) => renderQuest(row))}</div>
        </section>
      )}

      {waitingRows.length > 0 && (
        <details className="gm-card gm-fold-card">
          <summary>🔒 Waiting On · {waitingRows.length}</summary>
          <p className="gm-note">These are real gates. If the card gives you a prerequisite, work on that; otherwise ignore it for now.</p>
          <div className="gm-smart-list">{waitingRows.map((row) => renderQuest(row))}</div>
        </details>
      )}

      {completedStories.length > 0 && (
        <details className="gm-card gm-fold-card">
          <summary>✅ Completed Storylines · {completedStories.length}</summary>
          <ul className="gm-ul">{completedStories.map((story) => <li key={story.id}>{story.title}</li>)}</ul>
        </details>
      )}

      <details className="gm-card gm-fold-card">
        <summary>How events trigger + finished-day options</summary>
        <ul className="gm-ul">{game.guide.events.map((t) => <li key={t}>{t}</li>)}</ul>
        <div className="gm-sublabel">When nothing urgent is available</div>
        <ul className="gm-ul">{game.guide.early.map((t) => <li key={t}>{t}</li>)}</ul>
      </details>

      <details className="gm-roadmap">
        <summary>🗺️ Overall game roadmap · reference only</summary>
        <p className="gm-note">This is the big-picture sequence, not a list you have to clear before doing something else.</p>
        {roadmapCards}
      </details>
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

  const openBundles = visible.filter((b) => !complete(b));
  const doneBundles = visible.filter(complete);

  const renderBundle = (b: Bundle) => {
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
      {openBundles.map(renderBundle)}
      {doneBundles.length > 0 && (
        <details className="gm-fold gm-done-bundles">
          <summary>Completed bundles · {doneBundles.length}</summary>
          {doneBundles.map(renderBundle)}
        </details>
      )}

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
  const [status, setStatus] = useState<Status>(loaded ? "idle" : "loadfail");
  const [armed, setArmed] = useState(false);

  const game = GAMES.find((g) => g.id === gameId) ?? GAMES[0];
  const prog = progress[game.id] ?? emptyProgress();

  // Saving: changes queue up, then go to the server together half a second after the last tap.
  const pending = useRef<Record<string, GameProgressPatch>>({});
  const inflight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failures = useRef(0);

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
    let signedOut = false;
    for (const id of ids) {
      try {
        const res = await fetch("/api/games/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game: id, patch: batch[id] }),
          keepalive: true,
        });
        // An expired login is answered with a redirect to the login page, which looks like a normal 200.
        if (res.redirected && new URL(res.url).pathname.startsWith("/login")) {
          signedOut = true;
          throw new Error("signed out");
        }
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) throw new Error(`save failed: ${res.status}`);
      } catch {
        ok = false;
        const newer = pending.current[id];
        pending.current[id] = newer ? mergePatch(batch[id], newer) : batch[id];
      }
    }
    inflight.current = false;
    if (ok) {
      failures.current = 0;
      setStatus("saved");
      return;
    }
    setStatus(signedOut ? "signedout" : "error");
    // Keep trying on its own, a little slower each time. Signing in again is the only fix for a lapsed login.
    if (!signedOut && !timer.current) {
      failures.current += 1;
      timer.current = setTimeout(send, Math.min(30000, 2000 * 2 ** (failures.current - 1)));
    }
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
        // Leaving the page: send anything still waiting now, including a batch that failed earlier.
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        void send();
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
      : status === "loadfail"
        ? "Could not load your saved progress. Reload the page to try again."
        : status === "signedout"
          ? "You were signed out, so your last change did not save. Log in again and redo it."
          : status === "error"
            ? "Not saved yet. Trying again."
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

          <Lookup />

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
