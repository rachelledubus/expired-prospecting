"use client";

import { useMemo, useState } from "react";
import { questKey, type GameProgress } from "@/lib/games-data";
import type { TerrariaGame, TerrariaStage, TerrariaStep } from "@/lib/terraria-spirit-data";
import { TerrariaPriorities, TerrariaItemFinder, TerrariaStepHelp } from "./TerrariaToolkit";

type Props = {
  game: TerrariaGame;
  prog: GameProgress;
  setCheck: (key: string, value: boolean) => void;
  setField: (key: string, value: string) => void;
};
type View = "next" | "quests" | "bosses" | "roadmap";
const CHAPTERS = [
  { id: "pre", label: "Pre-Hardmode" },
  { id: "hard", label: "Hardmode" },
  { id: "end", label: "Endgame" },
] as const;

export const terrariaCheckKey = (gameId: string, stageId: string, stepId: string) =>
  questKey(gameId, "terraria-" + stageId, stepId);

function ProgressLine({ current, total }: { current: number; total: number }) {
  const percent = total ? Math.round(current / total * 100) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, margin: "10px 0 14px" }}>
      <div className="gm-note">{current}/{total} completed · {percent}%</div>
      <div role="progressbar" aria-label="Playthrough completed" aria-valuenow={current} aria-valuemin={0}
        aria-valuemax={total}
        style={{ height: 7, background: "rgba(128,128,128,.18)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: percent + "%", borderRadius: 99, background: "var(--accent, #659e8b)", transition: "width .2s" }} />
      </div>
    </div>
  );
}

function QuestCheck({ step, stage, checked, onChange }: {
  step: TerrariaStep; stage?: TerrariaStage; checked: boolean; onChange: (value: boolean) => void;
}) {
  return (
    <div className="gm-ter-check-wrap">
    <label className="gm-item">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="gm-box" aria-hidden="true" />
      <span className="gm-txt">
        <span className="gm-name">{step.label}</span>
        {step.how && <span className="gm-sub">{step.how}</span>}
      </span>
    </label>
    {!checked && stage && <TerrariaStepHelp stage={stage} step={step} />}
    </div>
  );
}

function FocusedStage({ game, stage, prog, setCheck, variant }: {
  game: TerrariaGame; stage: TerrariaStage; prog: GameProgress;
  setCheck: Props["setCheck"]; variant: "main" | "quest";
}) {
  const [showNext, setShowNext] = useState(false);
  const done = (step: TerrariaStep) => !!prog.checks[terrariaCheckKey(game.id, stage.id, step.id)];
  const remaining = stage.steps.filter((step) => !done(step));
  const finished = stage.steps.filter(done);
  const complete = remaining.length === 0;
  const onChange = (step: TerrariaStep, value: boolean) =>
    setCheck(terrariaCheckKey(game.id, stage.id, step.id), value);
  return (
    <section className="gm-card" style={{ padding: 16, marginTop: 12 }}>
      <div className="gm-panel-label">{variant === "main" ? "🎯 Current chapter" : "📜 Quest Book objective"}</div>
      <h3 style={{ margin: "8px 0" }}>{stage.title}</h3>
      <p className="gm-note">{stage.summary}</p>
      <ProgressLine current={finished.length} total={stage.steps.length} />
      {complete ? (
        <p className="gm-note">✓ All steps complete. {variant === "main" ? "The guide will recommend the next chapter." : "Choose another Spirit quest."}</p>
      ) : (
        <>
          <div className="gm-panel-label">Next action in this chapter</div>
          <QuestCheck stage={stage} step={remaining[0]} checked={false} onChange={(value) => onChange(remaining[0], value)} />
          {remaining.length > 1 && (
            <details open={showNext} onToggle={(e) => setShowNext(e.currentTarget.open)}>
              <summary className="gm-note" style={{ cursor: "pointer", padding: "10px 0" }}>
                Upcoming actions ({remaining.length - 1})
              </summary>
              {remaining.slice(1).map((step) => (
                <QuestCheck key={step.id} stage={stage} step={step} checked={false}
                  onChange={(value) => onChange(step, value)} />
              ))}
            </details>
          )}
        </>
      )}
      {finished.length > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary className="gm-note" style={{ cursor: "pointer" }}>Completed actions ({finished.length})</summary>
          {finished.map((step) => (
            <QuestCheck key={step.id} stage={stage} step={step} checked onChange={(value) => onChange(step, value)} />
          ))}
        </details>
      )}
      <p className="gm-note" style={{ marginTop: 12 }}>Use the item directory on this page for material locations and crafting instructions.</p>
    </section>
  );
}

export default function TerrariaSpiritView({ game, prog, setCheck, setField }: Props) {
  const [view, setView] = useState<View>("next");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [selectedQuest, setSelectedQuest] = useState("");
  const route = useMemo(() => game.stages.filter((stage) => stage.track === "route"), [game]);
  const quests = useMemo(() => game.stages.filter((stage) => stage.track === "quest" || stage.id === "first-adventure"), [game]);
  const sides = useMemo(() => game.stages.filter((stage) => stage.track === "side"), [game]);
  const allQuests = useMemo(() => [...quests, ...sides], [quests, sides]);
  const isDone = (stage: TerrariaStage, step: TerrariaStep) =>
    !!prog.checks[terrariaCheckKey(game.id, stage.id, step.id)];
  const completedCount = (stage: TerrariaStage) => stage.steps.filter((step) => isDone(stage, step)).length;
  const stageDone = (stage: TerrariaStage) => completedCount(stage) === stage.steps.length;
  const unlockedToken = (token: string) => {
    const [id, stepId] = token.split(":");
    const stage = game.stages.find((entry) => entry.id === id);
    if (!stage) return false;
    return stepId ? !!prog.checks[terrariaCheckKey(game.id, id, stepId)] : stageDone(stage);
  };
  const questUnlocked = (stage: TerrariaStage) =>
    (stage.unlockAll ?? []).every(unlockedToken) &&
    (!(stage.unlockAny?.length) || stage.unlockAny.some(unlockedToken));
  const recommended = route.find((stage) => !stageDone(stage)) ?? route[route.length - 1];
  const current = route.find((stage) => stage.id === selectedRoute) ?? recommended;
  const questChoice =
    allQuests.find((stage) => stage.id === selectedQuest && questUnlocked(stage)) ??
    quests.find((stage) => questUnlocked(stage) && !stageDone(stage)) ??
    quests.find(questUnlocked);
  const total = route.reduce((n, stage) => n + stage.steps.length, 0);
  const completed = route.reduce((n, stage) => n + completedCount(stage), 0);
  const worldKey = game.id + "|world";
  const difficultyKey = game.id + "|difficulty";
  const classKey = game.id + "|class";
  const evilKey = game.id + "|world-evil";
  const openStage = (stageId: string) => { setSelectedRoute(stageId); setView("next"); };
  return (
    <div style={{ marginTop: 14 }}>
      <section className="gm-card" style={{ padding: 16 }}>
        <div className="gm-panel-label">🌲 Terraria + Spirit Classic · full playthrough</div>
        <p className="gm-note">A fresh playthrough from first shelter to Moon Lord. Only one next action is visible by default; completed chapters stay archived. Nothing here is checked until you do it.</p>
        <ProgressLine current={completed} total={total} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <label className="gm-note" style={{ flex: "1 1 150px" }}>
            World name
            <input className="gm-input" style={{ width: "100%", marginTop: 5 }} placeholder="My Spirit world"
              value={prog.fields[worldKey] ?? ""} onChange={(event) => setField(worldKey, event.target.value)} />
          </label>
          <label className="gm-note" style={{ flex: "1 1 105px" }}>
            Difficulty
            <select className="gm-input gm-sel" style={{ width: "100%", marginTop: 5 }}
              value={prog.fields[difficultyKey] ?? ""}
              onChange={(event) => setField(difficultyKey, event.target.value)}>
              <option value="">Choose</option><option value="Classic">Classic</option>
              <option value="Expert">Expert</option><option value="Master">Master</option>
            </select>
          </label>
          <label className="gm-note" style={{ flex: "1 1 105px" }}>
            Playstyle
            <select className="gm-input gm-sel" style={{ width: "100%", marginTop: 5 }}
              value={prog.fields[classKey] ?? ""}
              onChange={(event) => setField(classKey, event.target.value)}>
              <option value="">Undecided</option><option>Melee</option><option>Ranged</option>
              <option>Magic</option><option>Summoner</option><option>Mixed</option>
            </select>
          </label>
          <label className="gm-note" style={{ flex: "1 1 105px" }}>
            World evil
            <select className="gm-input gm-sel" style={{ width: "100%", marginTop: 5 }}
              value={prog.fields[evilKey] ?? ""}
              onChange={(event) => setField(evilKey, event.target.value)}>
              <option value="">Not sure</option><option>Corruption</option><option>Crimson</option>
            </select>
          </label>
        </div>
      </section>

      <nav className="gm-chips" style={{ marginTop: 14 }} aria-label="Terraria playthrough views">
        {([
          ["next", "▶ Play next"],
          ["quests", "📜 Spirit quests"],
          ["bosses", "⚔ Bosses"],
          ["roadmap", "🗺 Roadmap"],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" className={"gm-chip" + (view === id ? " on" : "")}
            aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>
        ))}
      </nav>

      {view !== "next" && <TerrariaItemFinder />}
      {view === "next" && <>
        <TerrariaPriorities game={game} prog={prog} setCheck={setCheck} onOpenStage={openStage} />
        <TerrariaItemFinder />
        <div style={{ marginTop: 14 }}>
          <p className="gm-note">Full chapter roadmap (secondary to the priority guide): {recommended.title}</p>
          <label className="gm-note">Jump to another chapter
            <select className="gm-input gm-sel" style={{ display: "block", width: "100%", marginTop: 5 }}
              value={selectedRoute || recommended.id} onChange={(event) => setSelectedRoute(event.target.value)}>
              {CHAPTERS.map((chapter) => (
                <optgroup key={chapter.id} label={chapter.label}>
                  {route.filter((stage) => stage.chapter === chapter.id).map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stageDone(stage) ? "✓ " : ""}{stage.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          {selectedRoute && selectedRoute !== recommended.id && (
            <button type="button" className="gm-pill" style={{ marginTop: 8 }}
              onClick={() => setSelectedRoute("")}>Return to recommended chapter</button>
          )}
        </div>
        <FocusedStage key={current.id} game={game} stage={current} prog={prog} setCheck={setCheck} variant="main" />
        <p className="gm-note" style={{ marginTop: 12 }}>Spirit's Quest Book: activate an available quest before pursuing its objectives. It supports five active quests; rewards are claimed in its Completed tab.</p>
        <button className="gm-pill" type="button" onClick={() => setView("quests")}>See available Spirit questlines</button>
        {route.every(stageDone) && <p className="gm-note">🏆 Main route complete! Your Moon Lord victory is recorded. Optional Spirit quests and bonus encounters remain accessible.</p>}
      </>}

      {view === "quests" && <>
        <section className="gm-card" style={{ padding: 16, marginTop: 14 }}>
          <div className="gm-panel-label">Spirit Quest Book companion</div>
          <p className="gm-note">Active quests are listed below with their own next action and progress. Locked quests are folded separately. In-game progress counts only while the quest is activated.</p>
          <div className="gm-ter-quest-board">
            {allQuests.filter(stage => questUnlocked(stage) && !stageDone(stage)).map(stage => {
              const nextStep = stage.steps.find(step => !isDone(stage, step));
              return <div key={stage.id} className={"gm-ter-quest-row" + (questChoice?.id === stage.id ? " current" : "")}>
                <div className="gm-ter-quest-meta"><b>{stage.title}</b>
                  <span>{completedCount(stage)}/{stage.steps.length} actions</span>
                </div>
                {nextStep && <p className="gm-note">Next: {nextStep.label}</p>}
                <button className="gm-pill ghost" type="button" onClick={() => setSelectedQuest(stage.id)}>
                  {questChoice?.id === stage.id ? "Selected" : "Focus quest"}
                </button>
              </div>;
            })}
            {!allQuests.some(stage => questUnlocked(stage) && !stageDone(stage)) &&
              <p className="gm-note">No available unfinished questlines yet. Unlock the Quest Book and finish its first assignment.</p>}
          </div>
          <details className="gm-ter-locked">
            <summary>Not unlocked yet ({allQuests.filter(stage => !questUnlocked(stage)).length})</summary>
            <p className="gm-note">These questlines stay out of your active list until their requirements are checked.</p>
            {allQuests.filter(stage => !questUnlocked(stage)).map(stage =>
              <p className="gm-note" key={stage.id}><b>{stage.title}</b> · Prerequisites: {(stage.unlockAll ?? []).join(", ") || (stage.unlockAny ?? []).join(" or ") || "other progression"}</p>)}
          </details>
          {allQuests.some(stage => questUnlocked(stage) && stageDone(stage)) && <details className="gm-ter-locked">
            <summary>Completed questlines ({allQuests.filter(stage => questUnlocked(stage) && stageDone(stage)).length})</summary>
            {allQuests.filter(stage => questUnlocked(stage) && stageDone(stage)).map(stage =>
              <button key={stage.id} type="button" className="gm-pill ghost" style={{ margin: 5 }}
                onClick={() => setSelectedQuest(stage.id)}>{stage.title}</button>)}
          </details>}
        </section>
        {questChoice ? (
          <FocusedStage key={questChoice.id} game={game} stage={questChoice} prog={prog} setCheck={setCheck} variant="quest" />
        ) : (
          <section className="gm-card" style={{ padding: 16, marginTop: 12 }}>
            <div className="gm-panel-label">Unlock Spirit quests</div>
            <p className="gm-note">Find the Adventurer in the Underground Briar and complete The First Adventure to open up your town's quest chains.</p>
            <button type="button" className="gm-pill" onClick={() => openStage("briar-adventurer")}>Go to the Adventurer chapter</button>
          </section>
        )}

      </>}

      {view === "bosses" && <>
        <p className="gm-note" style={{ marginTop: 14 }}>Bosses are linked to the same checkpoints as the playthrough, so checking a victory here updates its chapter too. Optional bosses don't block the main route.</p>
        {CHAPTERS.map((chapter) => (
          <section className="gm-card" key={chapter.id} style={{ padding: 14, marginTop: 10 }}>
            <div className="gm-panel-label">{chapter.label}</div>
            {game.bosses.filter((boss) => boss.chapter === chapter.id).map((boss) => {
              const key = terrariaCheckKey(game.id, boss.stageId, boss.stepId);
              return (
                <QuestCheck key={key} step={{ id: key, label: boss.name + (boss.optional ? " · Optional" : "") }}
                  checked={!!prog.checks[key]} onChange={(value) => setCheck(key, value)} />
              );
            })}
          </section>
        ))}
      </>}

      {view === "roadmap" && <>
        <p className="gm-note" style={{ marginTop: 14 }}>A spoiler-light outline of your full playthrough. Everything can be revisited; later chapters stay visible without occupying your Play Next screen.</p>
        {CHAPTERS.map((chapter) => (
          <details key={chapter.id} className="gm-card" style={{ padding: 14, marginTop: 12 }} open={chapter.id === recommended.chapter ? true : undefined}>
            <summary style={{ cursor: "pointer", fontWeight: 700 }}>{chapter.label} · {route.filter((stage) => stage.chapter === chapter.id && stageDone(stage)).length}/{route.filter((stage) => stage.chapter === chapter.id).length} chapters</summary>
            {route.filter((stage) => stage.chapter === chapter.id).map((stage) => (
              <div key={stage.id} style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(128,128,128,.15)" }}>
                <div><b>{stageDone(stage) ? "✓ " : ""}{stage.title}</b><div className="gm-note">{completedCount(stage)}/{stage.steps.length} actions</div></div>
                <button type="button" className="gm-pill" onClick={() => openStage(stage.id)}>{stageDone(stage) ? "Review" : "Play"}</button>
              </div>
            ))}
          </details>
        ))}
      </>}
    </div>
  );
}
