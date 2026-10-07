"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  GAMES,
  SEASONS,
  bundleItemKey,
  completionCustomItemsKey,
  completionItemKey,
  emptyProgress,
  isBundleGame,
  isCompletionGame,
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
  type CompletionGame,
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

/* ---------- Smart Stardew quest guide ---------- */

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
  const owner = step.progressKey ?? { storylineId: story.id, stepId: step.id };
  return questKey(game.id, owner.storylineId, owner.stepId);
}

function ChecklistView({ game, prog, setCheck, setField }: ViewProps<ChecklistGame>) {
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
      const missingProgress = step.requiresProgress?.find(({ ref }) =>
        !prog.checks[itemKey(ref.gameId, ref.phaseId, ref.groupLabel, ref.text)],
      );
      if (missingReq || missingProgress) {
        bucket = "waiting";
        reason =
          step.unlock ??
          (missingProgress ? `Finish: ${missingProgress.label}` : "Finish the required storyline first");
      }

      if (!missingReq && !missingProgress && step.gate && gameDate) {
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

  const socialRows = useMemo(() => {
    const rows: Array<{
      story: GameStoryline;
      step: GameQuestStep;
      npc: string;
      hearts: number;
      personal: boolean;
      why: string;
      importance: QuestRow["importance"];
      score: number;
    }> = [];

    for (const story of game.questBoard.storylines) {
      const socialStep = story.steps.find((step) => {
        if (!step.social) return false;
        return !prog.checks[questStepKey(game, story, step)];
      });
      if (!socialStep?.social) continue;

      const social = socialStep.social;
      const startStep = social.startAfterStepId
        ? story.steps.find((step) => step.id === social.startAfterStepId)
        : undefined;
      const startStepOk =
        !social.startAfterStepId ||
        (!!startStep && !!prog.checks[questStepKey(game, story, startStep)]);
      const startProgressOk =
        !social.startAfterProgress ||
        !!prog.checks[
          itemKey(
            social.startAfterProgress.gameId,
            social.startAfterProgress.phaseId,
            social.startAfterProgress.groupLabel,
            social.startAfterProgress.text,
          )
        ];

      if (!startStepOk || !startProgressOk) continue;

      const importance = socialStep.importance ?? story.importance ?? "recommended";
      if (importance === "optional") continue;

      const importanceScore = importance === "required" ? 300 : 180;
      const personalScore = social.personal ? 90 : 0;
      rows.push({
        story,
        step: socialStep,
        npc: social.npc,
        hearts: social.hearts,
        personal: !!social.personal,
        why: social.why ?? story.note ?? "",
        importance,
        score: importanceScore + personalScore + (socialStep.priority ?? 0),
      });
    }

    return rows.sort((a, b) => b.score - a.score || a.npc.localeCompare(b.npc));
  }, [game, prog]);

  const scoreRow = (row: QuestRow) => {
    const bucketScore = row.bucket === "deadline" ? 500 : row.bucket === "now" ? 400 : row.bucket === "toward" ? 250 : 0;
    const importanceScore = row.importance === "required" ? 70 : row.importance === "recommended" ? 35 : 0;
    const weatherScore = row.todayOk ? 0 : -140;
    return bucketScore + importanceScore + (row.step.priority ?? 0) + weatherScore;
  };

  const rankedRows = [...questRows].sort((a, b) => scoreRow(b) - scoreRow(a));
  const coreRows = rankedRows.filter((row) => row.importance !== "optional");
  const pinnedRow = pinnedStory ? questRows.find((row) => row.story.id === pinnedStory) : undefined;
  const mainRow =
    pinnedRow ??
    coreRows.find((row) => row.bucket !== "waiting" && row.todayOk) ??
    coreRows.find((row) => row.bucket !== "waiting") ??
    rankedRows.find((row) => row.bucket !== "waiting" && row.todayOk) ??
    rankedRows.find((row) => row.bucket !== "waiting") ??
    rankedRows[0];

  const coreSideRows = coreRows
    .filter((row) => row.story.id !== mainRow?.story.id && row.bucket !== "waiting" && row.todayOk)
    .slice(0, 4);
  const sideRows = coreSideRows.length
    ? coreSideRows
    : rankedRows
        .filter((row) => row.importance === "optional" && row.story.id !== mainRow?.story.id && row.bucket !== "waiting" && row.todayOk)
        .slice(0, 2);

  const deadlineRows = rankedRows.filter((row) => row.bucket === "deadline");
  const availableRows = coreRows.filter((row) => row.bucket === "now");
  const towardRows = coreRows.filter((row) => row.bucket === "toward");
  const waitingRows = coreRows.filter((row) => row.bucket === "waiting");
  const optionalRows = rankedRows.filter((row) => row.importance === "optional" && row.bucket !== "deadline");
  const completedStories = game.questBoard.storylines.filter((story) =>
    story.steps.every((step) => !!prog.checks[questStepKey(game, story, step)]),
  );
  const majorStories = game.questBoard.storylines.filter((story) => story.importance === "required");

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
          sub={step.how ? `How: ${step.how}` : undefined}
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
              const isDone = !!prog.checks[k];
              return (
                <div className={isCurrent ? "gm-path-step current" : "gm-path-step"} key={s.id}>
                  <span>{isDone ? "✓" : isCurrent ? "→" : "·"}</span>
                  <span>{s.label}</span>
                  {isDone && (
                    <button type="button" className="gm-inline-undo" onClick={() => setCheck(k, false)}>
                      Undo
                    </button>
                  )}
                </div>
              );
            })}
          </details>
        )}
      </article>
    );
  };

  const renderMajorStory = (story: GameStoryline) => {
    const current = questRows.find((row) => row.story.id === story.id);
    const doneCount = story.steps.filter((step) => !!prog.checks[questStepKey(game, story, step)]).length;
    const complete = doneCount === story.steps.length;
    const status = complete
      ? "Complete"
      : current?.bucket === "waiting"
        ? "Waiting"
        : current?.bucket === "toward"
          ? "Work toward"
          : current?.bucket === "deadline"
            ? "Time-sensitive"
            : "Available";

    return (
      <article className={"gm-major-story " + (complete ? "complete" : current?.bucket ?? "")} key={story.id}>
        <div className="gm-major-head">
          <div>
            <span className="gm-quest-mod">{story.mod}</span>
            <h3>{story.title}</h3>
          </div>
          <span className="gm-major-status">{status}</span>
        </div>
        <div className="gm-major-progress">
          <span>{doneCount}/{story.steps.length}</span>
          <div className="gm-bar thin" aria-hidden="true">
            <i style={{ width: `${story.steps.length ? Math.round((doneCount / story.steps.length) * 100) : 0}%` }} />
          </div>
        </div>
        {complete ? (
          <p className="gm-note">Storyline complete. You can still open the full path below and undo any step.</p>
        ) : current ? (
          <>
            <p className="gm-major-next"><b>Next:</b> {current.step.label}</p>
            {current.step.how && <p className="gm-note"><b>How:</b> {current.step.how}</p>}
            {current.step.location && <p className="gm-note">📍 {current.step.location}</p>}
            {current.bucket === "waiting" && current.reason && <p className="gm-note">🔒 {current.reason}</p>}
            {current.step.reward && <p className="gm-note"><b>Unlocks:</b> {current.step.reward}</p>}
            {current.step.why && <p className="gm-note">{current.step.why}</p>}
          </>
        ) : null}
        <details className="gm-major-path">
          <summary>Full storyline · {doneCount}/{story.steps.length}</summary>
          {story.note && <p className="gm-note">{story.note}</p>}
          {story.steps.map((step, idx) => {
            const k = questStepKey(game, story, step);
            const isDone = !!prog.checks[k];
            const isCurrent = current?.step.id === step.id;
            return (
              <div className={"gm-major-path-step" + (isCurrent ? " current" : "") + (isDone ? " done" : "")} key={step.id}>
                <span className="gm-major-path-mark">{isDone ? "✓" : isCurrent ? "→" : idx + 1}</span>
                <div>
                  <b>{step.label}</b>
                  {isCurrent && step.how && <span>{step.how}</span>}
                </div>
                {isDone && (
                  <button type="button" className="gm-inline-undo" onClick={() => setCheck(k, false)}>
                    Undo
                  </button>
                )}
              </div>
            );
          })}
        </details>
      </article>
    );
  };

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

      {socialRows.length > 0 && (
        <section className="gm-social-section">
          <div className="label">💬 Talk to Today · {socialRows.length}</div>
          <div className="gm-card gm-social-card">
            <p className="gm-note">
              These are the friendships currently gating progression or a personal goal. Talk to them when convenient; gifts are optional unless you want to speed it up.
            </p>
            <div className="gm-social-list">
              {socialRows.map((row, index) => (
                <div className="gm-social-row" key={`${row.story.id}:${row.npc}`}>
                  <span className="gm-social-rank">{index + 1}</span>
                  <div className="gm-social-copy">
                    <div className="gm-social-name">
                      <b>{row.npc}</b>
                      <span className={`gm-importance ${row.importance}`}>{importanceLabel(row.importance)}</span>
                      {row.personal && <span className="gm-personal-goal">Personal goal</span>}
                    </div>
                    <span>Target: {row.hearts}♥ · {row.why}</span>
                    <em>If you already reached {row.hearts}♥, focus on triggering the listed heart event instead of grinding more friendship.</em>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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

      <section>
        <div className="label">Major Storylines</div>
        <div className="gm-major-grid">{majorStories.map(renderMajorStory)}</div>
      </section>

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

      {optionalRows.length > 0 && (
        <details className="gm-card gm-fold-card">
          <summary>🌿 Optional Side Stories · {optionalRows.length}</summary>
          <p className="gm-note">These are here when you want a change of pace. They do not outrank active progression. Extra friendship stories that do not unlock anything belong here or in Completion instead of taking up arbitrary extra-character slots.</p>
          <div className="gm-smart-list">{optionalRows.map((row) => renderQuest(row))}</div>
        </details>
      )}

      {completedStories.length > 0 && (
        <details className="gm-card gm-fold-card">
          <summary>✅ Completed Storylines · {completedStories.length}</summary>
          <p className="gm-note">Open a completed storyline if you checked something by mistake.</p>
          {completedStories.map((story) => (
            <details className="gm-completed-story" key={story.id}>
              <summary>{story.title}</summary>
              {story.steps.map((step) => {
                const k = questStepKey(game, story, step);
                return (
                  <div className="gm-completed-step" key={step.id}>
                    <span>✓ {step.label}</span>
                    <button type="button" className="gm-inline-undo" onClick={() => setCheck(k, false)}>
                      Undo
                    </button>
                  </div>
                );
              })}
            </details>
          ))}
        </details>
      )}

      <details className="gm-card gm-fold-card">
        <summary>How events trigger + finished-day options</summary>
        <ul className="gm-ul">{game.guide.events.map((t) => <li key={t}>{t}</li>)}</ul>
        <div className="gm-sublabel">When nothing urgent is available</div>
        <ul className="gm-ul">{game.guide.early.map((t) => <li key={t}>{t}</li>)}</ul>
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

function BundleView({
  game,
  prog,
  setCheck,
  setField,
  storyGame,
  storyProg,
  setStoryCheck,
}: ViewProps<BundleGame> & {
  storyGame: ChecklistGame;
  storyProg: GameProgress;
  setStoryCheck: (key: string, value: boolean) => void;
}) {
  const storyDate = parseGameDate(storyProg.fields[saveKey(storyGame.id)] ?? storyGame.saveDefault);
  const storedSeason = prog.fields[seasonKey(game.id)];
  const storySeason = storyDate?.season as Season | undefined;
  const now: Season = storySeason && (SEASONS as readonly string[]).includes(storySeason)
    ? storySeason
    : (SEASONS as readonly string[]).includes(storedSeason ?? "")
      ? (storedSeason as Season)
      : game.defaultSeason;
  const [view, setView] = useState<View>(now);
  const [shown, setShown] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (storySeason) setView(storySeason);
  }, [storySeason]);

  const key = (b: Bundle, i: BundleItem) => bundleItemKey(game.id, b.id, i);
  const doneCount = (b: Bundle) => b.items.filter((i) => prog.checks[key(b, i)]).length;
  const complete = (b: Bundle) => doneCount(b) >= b.need;

  const bundlesDone = game.bundles.filter(complete).length;
  const pct = game.bundles.length ? Math.round((bundlesDone / game.bundles.length) * 100) : 0;

  const remaining = (v: View) =>
    game.bundles.reduce(
      (n, b) => (complete(b) ? n : n + b.items.filter((i) => inView(i, v) && !prog.checks[key(b, i)]).length),
      0,
    );

  const tabs: { id: View; label: string }[] = [
    ...SEASONS.map((s) => ({ id: s as View, label: s })),
    { id: "any", label: "Any season" },
  ];
  const visible = game.bundles.filter((b) => b.items.some((i) => inView(i, view)));
  const openBundles = visible.filter((b) => !complete(b));
  const doneBundles = visible.filter(complete);
  const daysLeft = storyDate && storyDate.season === now ? 28 - storyDate.day + 1 : null;

  const seasonalItems = game.bundles.flatMap((b) => {
    if (complete(b)) return [];
    return b.items
      .filter((i) => i.seasons !== "any" && i.seasons.includes(now) && !prog.checks[key(b, i)])
      .map((i) => ({ bundle: b, item: i }));
  });

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
          <button type="button" className="gm-bh" aria-expanded={expanded} onClick={() => setShown((s) => ({ ...s, [b.id]: !s[b.id] }))}>
            {head}
          </button>
        ) : (
          <div className="gm-bh static">{head}</div>
        )}
        {expanded && (
          <div className="gm-bitems">
            {b.items.filter((i) => inView(i, view)).map((i) => {
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

      <div className="gm-context-card gm-farm-context">
        <div>
          <span className="gm-context-label">Current season</span>
          <b>{storyDate ? `${storyDate.season} ${storyDate.day}, Year ${storyDate.year}` : now}</b>
        </div>
        <div>
          <span className="gm-context-label">Community Center</span>
          <b>{bundlesDone}/{game.bundles.length} bundles</b>
        </div>
        {daysLeft !== null && (
          <div>
            <span className="gm-context-label">Season window</span>
            <b>{daysLeft} {daysLeft === 1 ? "day" : "days"} left</b>
          </div>
        )}
      </div>

      {seasonalItems.length > 0 && (
        <section>
          <div className="label">⏰ Do before {now} ends</div>
          <div className="gm-card gm-season-urgent">
            <p className="gm-note">
              {seasonalItems.length} unchecked Community Center {seasonalItems.length === 1 ? "item is" : "items are"} available this season.
              {daysLeft !== null ? ` You have ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left.` : ""}
            </p>
            {seasonalItems.slice(0, 6).map(({ bundle, item }) => (
              <Check
                key={`${bundle.id}:${item.id ?? item.name}`}
                label={itemLabel(item)}
                sub={item.note}
                checked={!!prog.checks[key(bundle, item)]}
                onChange={(v) => setCheck(key(bundle, item), v)}
              />
            ))}
            {seasonalItems.length > 6 && <p className="gm-note">+ {seasonalItems.length - 6} more in the {now} Community Center view below.</p>}
          </div>
        </section>
      )}

      {game.progression?.map((section) => {
        const doneN = section.items.filter((item) => {
          const r = item.ref;
          return !!storyProg.checks[itemKey(r.gameId, r.phaseId, r.groupLabel, r.text)];
        }).length;
        return (
          <section key={section.id}>
            <div className="label">{section.title} · {doneN}/{section.items.length}</div>
            <div className="gm-card gm-progression-card">
              {section.note && <p className="gm-note">{section.note}</p>}
              {section.items.map((item) => {
                const r = item.ref;
                const k = itemKey(r.gameId, r.phaseId, r.groupLabel, r.text);
                return (
                  <Check
                    key={item.label}
                    label={item.label}
                    sub={[
                      item.how ? `How: ${item.how}` : "",
                      item.why ? `Why: ${item.why}` : "",
                    ].filter(Boolean).join("  •  ") || undefined}
                    checked={!!storyProg.checks[k]}
                    onChange={(v) => setStoryCheck(k, v)}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="label">Community Center</div>
      <div className="gm-bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
      <div className="gm-overall">
        <span>{bundlesDone} of {game.bundles.length} bundles complete</span>
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
        {!storyDate && view !== "any" && view !== now && (
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

      <div className="gm-foot-actions"><CopyButton getText={remainingText} /></div>
      <ul className="gm-ul gm-footnotes">{game.footnotes.map((t) => <li key={t}>{t}</li>)}</ul>
    </>
  );
}


/* ---------- Completion tracker ---------- */

function CompletionView({ game, prog, setCheck, setField }: ViewProps<CompletionGame>) {
  type CustomCompletionItem = { id: string; label: string; done: boolean };
  const [newCustom, setNewCustom] = useState<Record<string, string>>({});

  const parseCustom = (categoryId: string): CustomCompletionItem[] => {
    const raw = prog.fields[completionCustomItemsKey(game.id, categoryId)];
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item): item is CustomCompletionItem =>
          !!item &&
          typeof item === "object" &&
          typeof item.id === "string" &&
          typeof item.label === "string" &&
          typeof item.done === "boolean",
        )
        .slice(0, 60);
    } catch {
      return [];
    }
  };

  const saveCustom = (categoryId: string, items: CustomCompletionItem[]) => {
    setField(completionCustomItemsKey(game.id, categoryId), items.length ? JSON.stringify(items) : "");
  };

  const categoryRows = game.sections.flatMap((section) =>
    section.categories.map((category) => {
      const custom = parseCustom(category.id);
      const builtInDone = category.items.filter((item) => !!prog.checks[completionItemKey(game.id, category.id, item)]).length;
      const customDone = custom.filter((item) => item.done).length;
      const done = builtInDone + customDone;
      const total = category.items.length + custom.length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      return { section, category, custom, done, total, pct };
    }),
  );

  const totalItems = categoryRows.reduce((sum, row) => sum + row.total, 0);
  const totalDone = categoryRows.reduce((sum, row) => sum + row.done, 0);
  const overall = totalItems ? Math.round((totalDone / totalItems) * 100) : 0;
  const completed = categoryRows.filter((row) => row.total > 0 && row.done === row.total).length;
  const trackableCategories = categoryRows.filter((row) => row.total > 0).length;

  const addCustom = (categoryId: string) => {
    const label = (newCustom[categoryId] ?? "").trim();
    if (!label) return;
    const current = parseCustom(categoryId);
    if (current.some((item) => item.label.toLowerCase() === label.toLowerCase())) {
      setNewCustom((values) => ({ ...values, [categoryId]: "" }));
      return;
    }
    const id = `${Date.now()}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "item"}`;
    saveCustom(categoryId, [...current, { id, label, done: false }]);
    setNewCustom((values) => ({ ...values, [categoryId]: "" }));
  };

  const toggleCustom = (categoryId: string, id: string, done: boolean) => {
    saveCustom(categoryId, parseCustom(categoryId).map((item) => item.id === id ? { ...item, done } : item));
  };

  const removeCustom = (categoryId: string, id: string) => {
    saveCustom(categoryId, parseCustom(categoryId).filter((item) => item.id !== id));
  };

  return (
    <>
      <p className="gm-mods">{game.mods}</p>

      <div className="gm-completion-summary">
        <div>
          <span className="gm-context-label">Checklist progress</span>
          <strong>{overall}%</strong>
        </div>
        <div>
          <span className="gm-context-label">Items checked</span>
          <strong>{totalDone}/{totalItems}</strong>
        </div>
        <div className="gm-completion-summary-bar">
          <div className="gm-bar" aria-hidden="true"><i style={{ width: `${overall}%` }} /></div>
          <p className="gm-note">{completed}/{trackableCategories} checklist categories are fully complete.</p>
        </div>
      </div>

      <div className="gm-callout">
        <b>No manual quantities:</b> check the actual fish, artifact, recipe, shipment, goal, or unlock when you complete it. The totals calculate themselves.
      </div>

      {game.sections.map((section) => (
        <section key={section.id} className="gm-completion-section">
          <div className="label">{section.title}</div>
          {section.note && <p className="gm-note gm-section-note">{section.note}</p>}
          <div className="gm-completion-grid">
            {section.categories.map((category) => {
              const custom = parseCustom(category.id);
              const builtInDone = category.items.filter((item) => !!prog.checks[completionItemKey(game.id, category.id, item)]).length;
              const customDone = custom.filter((item) => item.done).length;
              const doneN = builtInDone + customDone;
              const totalN = category.items.length + custom.length;
              const pct = totalN ? Math.round((doneN / totalN) * 100) : 0;
              const done = totalN > 0 && doneN === totalN;

              return (
                <details className={"gm-completion-card" + (done ? " done" : "")} key={category.id}>
                  <summary>
                    <span>
                      <b>{category.title}</b>
                      <em>{category.sourceHint ?? (totalN ? "Checklist" : "Add items as they appear")}</em>
                    </span>
                    <span className="gm-completion-number">{doneN}/{totalN}</span>
                  </summary>

                  <div className="gm-completion-body">
                    <div className="gm-bar thin" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
                    {category.note && <p className="gm-note">{category.note}</p>}

                    {(() => {
                      const openBuiltIn = category.items.filter(
                        (item) => !prog.checks[completionItemKey(game.id, category.id, item)],
                      );
                      const doneBuiltIn = category.items.filter(
                        (item) => !!prog.checks[completionItemKey(game.id, category.id, item)],
                      );
                      const openCustom = custom.filter((item) => !item.done);
                      const doneCustom = custom.filter((item) => item.done);

                      return (
                        <>
                          {(openBuiltIn.length > 0 || openCustom.length > 0) && (
                            <div className="gm-completion-list">
                              {openBuiltIn.map((item) => {
                                const key = completionItemKey(game.id, category.id, item);
                                return (
                                  <Check
                                    key={item}
                                    label={item}
                                    checked={false}
                                    onChange={(value) => setCheck(key, value)}
                                  />
                                );
                              })}
                              {openCustom.map((item) => (
                                <div className="gm-custom-row" key={item.id}>
                                  <Check
                                    label={item.label}
                                    checked={false}
                                    onChange={(value) => toggleCustom(category.id, item.id, value)}
                                  />
                                  <button
                                    type="button"
                                    className="gm-custom-remove"
                                    aria-label={`Remove ${item.label}`}
                                    onClick={() => removeCustom(category.id, item.id)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {(doneBuiltIn.length > 0 || doneCustom.length > 0) && (
                            <details className="gm-completion-completed">
                              <summary>Completed · {doneBuiltIn.length + doneCustom.length}</summary>
                              <div className="gm-completion-list gm-completion-list-done">
                                {doneBuiltIn.map((item) => {
                                  const key = completionItemKey(game.id, category.id, item);
                                  return (
                                    <Check
                                      key={item}
                                      label={item}
                                      checked
                                      onChange={(value) => setCheck(key, value)}
                                    />
                                  );
                                })}
                                {doneCustom.map((item) => (
                                  <div className="gm-custom-row" key={item.id}>
                                    <Check
                                      label={item.label}
                                      checked
                                      onChange={(value) => toggleCustom(category.id, item.id, value)}
                                    />
                                    <button
                                      type="button"
                                      className="gm-custom-remove"
                                      aria-label={`Remove ${item.label}`}
                                      onClick={() => removeCustom(category.id, item.id)}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </>
                      );
                    })()}

                    {category.allowCustom && (
                      <div className="gm-custom-add">
                        <input
                          className="gm-input"
                          type="text"
                          maxLength={80}
                          placeholder="Add a modded or personal checklist item…"
                          value={newCustom[category.id] ?? ""}
                          onChange={(e) => setNewCustom((values) => ({ ...values, [category.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustom(category.id);
                            }
                          }}
                        />
                        <button type="button" className="gm-pill" onClick={() => addCustom(category.id)}>
                          Add item
                        </button>
                      </div>
                    )}

                    {totalN === 0 && <p className="gm-completion-empty">No items yet. Add one when this goal gives you something specific to track.</p>}
                    {done && <div className="gm-completion-done">✓ Category complete</div>}
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

/* ---------- Page ---------- */

export default function GamesPlanner({ initial, loaded }: { initial: Record<string, GameProgress>; loaded: boolean }) {
  const [gameId, setGameId] = useState(GAMES[0].id);
  const [progress, setProgress] = useState<Record<string, GameProgress>>(initial);
  const [status, setStatus] = useState<Status>(loaded ? "idle" : "loadfail");
  const [armed, setArmed] = useState(false);
  const [lastCheck, setLastCheck] = useState<{ gameId: string; key: string; value: boolean } | null>(null);

  const game = GAMES.find((g) => g.id === gameId) ?? GAMES[0];
  const prog = progress[game.id] ?? emptyProgress();
  const storyGame = GAMES.find((g): g is ChecklistGame => g.kind === "checklist") ?? (GAMES[0] as ChecklistGame);
  const storyProg = progress[storyGame.id] ?? emptyProgress();

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

  const setGameCheck = (targetGameId: string, key: string, value: boolean) => {
    setLastCheck({ gameId: targetGameId, key, value });
    setProgress((p) => {
      const cur = p[targetGameId] ?? emptyProgress();
      const checks = { ...cur.checks };
      if (value) checks[key] = true;
      else delete checks[key];
      return { ...p, [targetGameId]: { ...cur, checks } };
    });
    queue(targetGameId, { checks: { [key]: value } });
  };

  const undoLastCheck = () => {
    if (!lastCheck) return;
    const { gameId: targetGameId, key, value } = lastCheck;
    const reversed = !value;
    setProgress((p) => {
      const cur = p[targetGameId] ?? emptyProgress();
      const checks = { ...cur.checks };
      if (reversed) checks[key] = true;
      else delete checks[key];
      return { ...p, [targetGameId]: { ...cur, checks } };
    });
    queue(targetGameId, { checks: { [key]: reversed } });
    setLastCheck(null);
  };

  const setGameField = (targetGameId: string, key: string, value: string) => {
    setProgress((p) => {
      const cur = p[targetGameId] ?? emptyProgress();
      const fields = { ...cur.fields };
      if (value === "") delete fields[key];
      else fields[key] = value;
      return { ...p, [targetGameId]: { ...cur, fields } };
    });
    queue(targetGameId, { fields: { [key]: value } });
  };

  const setCheck = (key: string, value: boolean) => setGameCheck(game.id, key, value);
  const setField = (key: string, value: string) => setGameField(game.id, key, value);

  const resetGame = () => {
    if (!armed) {
      setArmed(true);
      if (armTimer.current) clearTimeout(armTimer.current);
      armTimer.current = setTimeout(() => setArmed(false), 4000);
      return;
    }
    if (armTimer.current) clearTimeout(armTimer.current);
    setArmed(false);
    setLastCheck(null);
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
            <BundleView
              key={game.id}
              game={game}
              prog={prog}
              setCheck={setCheck}
              setField={setField}
              storyGame={storyGame}
              storyProg={storyProg}
              setStoryCheck={(key, value) => setGameCheck(storyGame.id, key, value)}
            />
          ) : isCompletionGame(game) ? (
            <CompletionView key={game.id} game={game} prog={prog} setCheck={setCheck} setField={setField} />
          ) : (
            <ChecklistView key={game.id} game={game} prog={prog} setCheck={setCheck} setField={setField} />
          )}

          {lastCheck && (
            <div className="gm-undo-bar" role="status">
              <span>{lastCheck.value ? "Checked off." : "Unchecked."}</span>
              <button type="button" onClick={undoLastCheck}>
                ↶ Undo last change
              </button>
            </div>
          )}

          <div className="gm-foot">
            <span className="gm-small" aria-live="polite">
              {statusText}
            </span>
            <button type="button" className={"gm-pill ghost" + (armed ? " arm" : "")} onClick={resetGame}>
              {armed ? "Tap again to confirm" : isBundleGame(game) ? "Reset Community Center" : isCompletionGame(game) ? "Reset Completion" : "Reset Story & Quests"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
