"use client";

import { useState } from "react";
import { questKey, type GameProgress } from "@/lib/games-data";
import type { DreamlightGame, DreamlightStage, DreamlightStep } from "@/lib/dreamlight-data";
import { DREAMLIGHT_MISSION_MATERIALS } from "@/lib/dreamlight-resource-guides";
import DreamlightCharacters from "./DreamlightCharacters";
import DreamlightItems, { ItemDetails } from "./DreamlightItems";

type Props = {
  game: DreamlightGame;
  prog: GameProgress;
  setCheck: (key: string, value: boolean) => void;
  setField: (key: string, value: string) => void;
};
type Section = "story" | "realms" | "friends" | "projects" | "collections" | "honeyglow" | "honeyglow-friends";
const SECTIONS: { id: Section; label: string; help: string }[] = [
  { id: "story", label: "📖 Main story", help: "Progress through the Valley's main story" },
  { id: "realms", label: "🏰 Realms", help: "Explore the Dream Castle and unlock new characters" },
  { id: "friends", label: "💕 Characters", help: "Individual friendship quest chains, one character at a time" },
  { id: "projects", label: "🌿 Projects", help: "Village upgrades and cozy decorating goals" },
  { id: "collections", label: "✨ Collections", help: "Optional gathering and discovery challenges" },
  { id: "honeyglow", label: "🍯 Honeyglow Woods", help: "Your owned Adventure Pack: Pooh, Eeyore, Piglet, and the complete Honeyglow storyline" },
  { id: "honeyglow-friends", label: "🐻 Honeyglow characters", help: "Pooh, Eeyore and Piglet each have their own friendship questline" },
];
const savedKey = (gameId: string, stageId: string, stepId: string) =>
  questKey(gameId, "dreamlight-" + stageId, stepId);

function Progress({ done, total }: { done: number; total: number }) {
  const percent = total ? Math.round(100 * done / total) : 0;
  return (
    <div style={{ margin: "10px 0 14px" }}>
      <div className="gm-note">{done}/{total} actions complete · {percent}%</div>
      <div role="progressbar" aria-label="Current section progress"
        aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}
        style={{ height: 7, borderRadius: 99, background: "rgba(128,128,128,.2)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: percent + "%", borderRadius: 99,
          background: "var(--accent,#ab94c0)" }} />
      </div>
    </div>
  );
}

function MissionMaterials({ stage, step }: { stage: DreamlightStage; step: DreamlightStep }) {
  const groups = DREAMLIGHT_MISSION_MATERIALS[stage.id + ":" + step.id] ?? [];
  if (!groups.length) return null;
  return (
    <div className="gm-dv-mission-materials">
      <div className="gm-panel-label">📦 Materials · exact locations</div>
      {groups.map((group, index) => (
        <div key={index} style={{ marginTop: 10 }}>
          {group.note && <p className="gm-note">{group.note}</p>}
          {group.items.map((required, i) => (
            <ItemDetails key={required.item + ":" + i} item={required.item} qty={required.qty} />
          ))}
        </div>
      ))}
      <p className="gm-note gm-dv-caveat">Quantities are for this objective, not the amount still missing from your inventory.</p>
    </div>
  );
}

function Action({ gameId, stage, step, checked, setCheck }: {
  gameId: string; stage: DreamlightStage; step: DreamlightStep;
  checked: boolean; setCheck: Props["setCheck"];
}) {
  const key = savedKey(gameId, stage.id, step.id);
  return (
    <div>
      <label className="gm-item">
        <input type="checkbox" checked={checked}
          onChange={event => setCheck(key, event.target.checked)} />
        <span className="gm-box" aria-hidden="true" />
        <span className="gm-txt">
          <span className="gm-name">{step.label}</span>
          {step.how && <span className="gm-sub">{step.how}</span>}
        </span>
      </label>
      {!checked && <MissionMaterials stage={stage} step={step} />}
    </div>
  );
}

export default function DreamlightView({ game, prog, setCheck, setField }: Props) {
  const [section, setSection] = useState<Section>("story");
  const [chosen, setChosen] = useState("");
  const available = game.stages.filter(stage => stage.section === section && stage.id !== "honeyglow-friendship" && section !== "friends");
  const checked = (stage: DreamlightStage, step: DreamlightStep) =>
    !!prog.checks[savedKey(game.id, stage.id, step.id)];
  const pending = (stage: DreamlightStage) => stage.steps.filter(step => !checked(stage, step));
  const finished = (stage: DreamlightStage) => stage.steps.filter(step => checked(stage, step));
  const complete = (stage: DreamlightStage) => pending(stage).length === 0;
  const recommended = available.find(stage => !complete(stage)) ?? available[0];
  const focus = available.find(stage => stage.id === chosen) ?? recommended;
  const total = available.reduce((n,stage) => n + stage.steps.length, 0);
  const completed = available.reduce((n,stage) => n + finished(stage).length, 0);
  const activeSection = SECTIONS.find(entry => entry.id === section);

  return (
    <div style={{ marginTop: 14 }}>
      <section className="gm-card" style={{ padding: 16 }}>
        <div className="gm-panel-label">✨ Dreamlight Valley · Base Game + Honeyglow Woods</div>
        <p className="gm-note">One small quest action at a time. Your base-game quests and Honeyglow Woods are in their own sections. Other expansions are excluded.</p>
        <nav className="gm-chips" aria-label="Dreamlight Valley guide sections" style={{ marginTop: 12 }}>
          {SECTIONS.map(item => (
            <button key={item.id} type="button" className={"gm-chip" + (section === item.id ? " on" : "")}
              aria-pressed={section === item.id} onClick={() => {setSection(item.id);setChosen("");}}>
              {item.label}
            </button>
          ))}
        </nav>
      </section>
      <DreamlightItems />
      {section === "friends" && <DreamlightCharacters gameId={game.id} prog={prog} setCheck={setCheck} setField={setField} area="Valley" />}
      {section === "honeyglow-friends" && <DreamlightCharacters gameId={game.id} prog={prog} setCheck={setCheck} setField={setField} area="Honeyglow" />}
      {section !== "friends" && (
      <section className="gm-card" style={{ padding: 16, marginTop: 12 }}>
        <div className="gm-panel-label">{activeSection?.label}</div>
        <p className="gm-note">{activeSection?.help}</p>
        <Progress done={completed} total={total} />
        <label className="gm-note">
          Current chapter
          <select className="gm-input gm-sel" style={{ display: "block", width: "100%", marginTop: 7 }}
            value={focus?.id ?? ""} onChange={event => setChosen(event.target.value)}>
            {available.map(stage => (
              <option key={stage.id} value={stage.id}>{complete(stage) ? "✓ " : ""}{stage.title}</option>
            ))}
          </select>
        </label>
        {chosen && chosen !== recommended?.id && (
          <button className="gm-pill" type="button" style={{ marginTop: 10 }} onClick={() => setChosen("")}>
            Return to recommended chapter
          </button>
        )}
      </section>
      )}

      {focus && (
        <section className="gm-card" style={{ padding: 16, marginTop: 12 }}>
          <div className="gm-panel-label">{complete(focus) ? "Chapter complete" : "Do this next"}</div>
          <h3 style={{ margin: "8px 0" }}>{focus.title}</h3>
          <p className="gm-note">{focus.summary}</p>
          <Progress done={finished(focus).length} total={focus.steps.length} />
          {pending(focus).slice(0, 1).map(step => (
            <Action key={step.id} gameId={game.id} stage={focus} step={step}
              checked={false} setCheck={setCheck} />
          ))}
          {pending(focus).length > 1 && (
            <details style={{ marginTop: 10 }}>
              <summary className="gm-note" style={{ cursor: "pointer" }}>
                Upcoming actions ({pending(focus).length - 1})
              </summary>
              {pending(focus).slice(1).map(step => (
                <Action key={step.id} gameId={game.id} stage={focus} step={step}
                  checked={false} setCheck={setCheck} />
              ))}
            </details>
          )}
          {finished(focus).length > 0 && (
            <details style={{ marginTop: 10 }}>
              <summary className="gm-note" style={{ cursor: "pointer" }}>
                Completed actions ({finished(focus).length})
              </summary>
              {finished(focus).map(step => (
                <Action key={step.id} gameId={game.id} stage={focus} step={step}
                  checked setCheck={setCheck} />
              ))}
            </details>
          )}
          <p className="gm-note" style={{ marginTop: 12 }}>Check each action as you finish it in game. Item locations are available in the finder above.</p>
        </section>
      )}
      {focus && (
        <details className="gm-card" style={{ padding: 14, marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontWeight: 700 }}>
            🧺 Prepare for this chapter · material check
          </summary>
          <p className="gm-note">These are separate mission objectives, not one combined shopping list.
            Counts may include items you already have or will receive during the story.</p>
          {focus.steps.filter(step => !!DREAMLIGHT_MISSION_MATERIALS[`${focus.id}:${step.id}`])
            .map(step => (
              <div key={step.id} style={{ marginTop: 12 }}>
                <b style={{ fontSize: ".9rem" }}>{step.label}</b>
                <MissionMaterials stage={focus} step={step} />
              </div>
            ))}
          {!focus.steps.some(step => !!DREAMLIGHT_MISSION_MATERIALS[`${focus.id}:${step.id}`]) &&
            <p className="gm-note">No verified fixed material list recorded for this chapter.
              Search the item directory above for any materials requested during this chapter.</p>}
        </details>
      )}
      {/* The item finder stays near the top in every section. */}
      {available.length > 0 && (
      <details className="gm-card" style={{ padding: 16, marginTop: 12 }}>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>
          Browse all {activeSection?.label} chapters · {available.filter(complete).length}/{available.length} complete
        </summary>
        {available.map(stage => (
          <div key={stage.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 10, padding: "12px 0", borderBottom: "1px solid rgba(128,128,128,.15)" }}>
            <div><b>{complete(stage) ? "✓ " : ""}{stage.title}</b>
              <div className="gm-note">{finished(stage).length}/{stage.steps.length} actions</div></div>
            <button className="gm-pill" type="button" onClick={() => setChosen(stage.id)}>
              {complete(stage) ? "Review" : "Open"}
            </button>
          </div>
        ))}
      </details>
      )}
    </div>
  );
}
