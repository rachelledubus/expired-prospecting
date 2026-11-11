"use client";

import { useMemo, useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import {
  WOW_PROFESSIONS, WOW_RECIPES, professionField, recipeLearnedKey, recipeStatus,
  type WowProfessionId, type WowRecipe,
} from "@/lib/wow-forever-professions";

type Props = {
  gameId: string;
  prog: GameProgress;
  setCheck: (key: string, value: boolean) => void;
  setField: (key: string, value: string) => void;
};

const panel: React.CSSProperties = { padding: 16, marginTop: 12 };
const input: React.CSSProperties = {
  padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border,#ddd)",
  background: "var(--panel,#fff)", color: "var(--text,#222)", maxWidth: "100%", font: "inherit",
};
const small: React.CSSProperties = { fontSize: 13, opacity: 0.85, lineHeight: 1.5 };
const statusLabels = {
  locked: "Not yet learnable",
  orange: "Orange · +1 guaranteed",
  yellow: "Yellow · chance",
  green: "Green · low chance",
  chance: "Chance · check game color",
  gray: "Gray · no skill-up",
};

const ranking = (r: WowRecipe, skill: number, learned: boolean, goal: string, kalimdorOnly: boolean) => {
  const state = recipeStatus(r, skill);
  const statusRank = ({ orange: 0, yellow: 1, chance: 2, green: 3, locked: 4, gray: 5 } as const)[state];
  const localPenalty = kalimdorOnly && r.acquisition === "auction" ? 1 : 0;
  const reagents = r.reagents.reduce((n, m) => n + m.quantity, 0);
  // No gold/profit estimates without real user-entered market prices.
  if (goal === "fewest") return [statusRank, reagents, learned ? 0 : 1, localPenalty];
  if (goal === "farm") return [statusRank, localPenalty, learned ? 0 : 1, reagents];
  return [statusRank, learned ? 0 : 1, localPenalty, reagents];
};
const compareRank = (a: number[], b: number[]) => {
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
};
const clampSkill = (text: string) => {
  const n = Number(text);
  return String(Math.max(0, Math.min(300, Number.isFinite(n) ? Math.floor(n) : 0)));
};

export default function WoWProfessions({ gameId, prog, setCheck, setField }: Props) {
  const [selected, setSelected] = useState<WowProfessionId>("leatherworking");
  const [showGray, setShowGray] = useState(false);
  const [learnedOnly, setLearnedOnly] = useState(false);
  const [copied, setCopied] = useState("");
  const [confirmed, setConfirmed] = useState("");

  const skillFor = (id: WowProfessionId) => {
    const initial = WOW_PROFESSIONS.find(p => p.id === id)?.initial ?? 0;
    const raw = prog.fields[professionField(gameId, "skill-" + id)];
    return raw === undefined ? initial : Math.max(0, Math.min(300, Number(raw) || 0));
  };
  const skill = skillFor(selected);
  const goal = prog.fields[professionField(gameId, "goal")] || "guaranteed";
  const region = prog.fields[professionField(gameId, "region")] || "any";
  const isLearned = (id: string) => !!prog.checks[recipeLearnedKey(gameId, id)];
  const recipes = useMemo(() => WOW_RECIPES
    .filter(r => r.profession === selected && (showGray || recipeStatus(r, skill) !== "gray"))
    .filter(r => !learnedOnly || isLearned(r.id))
    .sort((a, b) => compareRank(
      ranking(a, skill, isLearned(a.id), goal, region === "kalimdor"),
      ranking(b, skill, isLearned(b.id), goal, region === "kalimdor"),
    )), [selected, skill, goal, region, showGray, learnedOnly, prog.checks]);
  const next = recipes.find(r => recipeStatus(r, skill) === "orange" && isLearned(r.id))
    || recipes.find(r => recipeStatus(r, skill) === "orange");

  const confirmCraft = (r: WowRecipe) => {
    // Player confirms the craft actually happened; NEVER infer skill gained from game state.
    if (recipeStatus(r, skill) !== "orange" || !isLearned(r.id)) return;
    setField(professionField(gameId, "skill-" + selected), String(skill + 1));
    setConfirmed("Recorded one confirmed skill point from " + r.name + ". You can edit your skill if needed.");
  };

  const copyWaypoint = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("Copied TomTom waypoint: " + text);
    } catch {
      setCopied("Copy did not work. Select the waypoint text manually: " + text);
    }
  };

  return <section aria-label="WoW Forever professions">
    <div className="gm-card" style={panel}>
      <h3 style={{ margin: "0 0 7px" }}>My profession skills</h3>
      <p className="gm-note" style={small}>Edit your skill after playing. The starting values come from our last conversation and become saved once you change them. The site does not read your WoW client automatically.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginTop: 12 }}>
        {WOW_PROFESSIONS.map(p => <label key={p.id} style={{ display: "grid", gap: 5, fontSize: 13 }}>
          {p.label}
          <input type="number" inputMode="numeric" min={0} max={300}
            aria-label={p.label + " skill"} style={{ ...input, width: 110 }}
            value={skillFor(p.id)}
            onChange={e => setField(professionField(gameId, "skill-" + p.id), clampSkill(e.target.value))}/>
        </label>)}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 15 }}>
        <label style={{ display: "grid", gap: 5, fontSize: 13 }}>Goal
          <select value={goal} style={input} onChange={e => setField(professionField(gameId, "goal"), e.target.value)}>
            <option value="guaranteed">Guaranteed skill-ups first</option>
            <option value="farm">Prioritize easy-to-access recipe sources</option>
            <option value="fewest">Fewest total material units</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: 5, fontSize: 13 }}>Recipe location preference
          <select value={region} style={input} onChange={e => setField(professionField(gameId, "region"), e.target.value)}>
            <option value="any">Both continents (default)</option>
            <option value="kalimdor">Prefer Kalimdor vendors</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: 5, fontSize: 13 }}>Gold on hand (optional)
          <input value={prog.fields[professionField(gameId, "gold")] ?? "19"} aria-label="Gold on hand"
            onChange={e => setField(professionField(gameId, "gold"), e.target.value.replace(/[^0-9.]/g, "").slice(0, 10))}
            type="text" inputMode="decimal" style={{ ...input, width: 95 }}/>
        </label>
      </div>
      <p className="gm-note" style={{ ...small, marginTop: 12 }}>
        Recipes from both continents are eligible by default. Preferring Kalimdor changes sorting only and never excludes Eastern Kingdoms sources. This starter catalog is not yet geographically comprehensive. This first release has no live Auction House feed. Fewest materials does not mean lowest gold cost or highest profit.
        Recipe colors are calculated from a limited, verified Forever catalog; always trust your current in-game orange/yellow color if a patch differs.
      </p>
    </div>

    <nav aria-label="Choose a profession" className="gm-chips" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
      {WOW_PROFESSIONS.map(p => <button key={p.id} type="button"
        className={"gm-chip" + (selected === p.id ? " on" : "")}
        aria-pressed={selected === p.id} onClick={() => { setSelected(p.id); setConfirmed(""); }}>
        {p.label} · {skillFor(p.id)}
      </button>)}
    </nav>

    {selected === "skinning" ? <div className="gm-card" style={panel}>
      <h3 style={{ margin: 0 }}>Skinning · {skill}</h3>
      <p className="gm-note" style={small}>Skinning has no crafted recipes. Train the next rank when eligible and skin appropriately leveled creatures. This tracker is separate from your crafting recipe list.</p>
    </div> : <>
      {next && <div className="gm-card" style={panel}>
        <div className="gm-panel-label">Recommended next · {selected}</div>
        <h3 style={{ margin: "8px 0 4px" }}>{next.name}</h3>
        <p className="gm-note" style={small}>
          Orange until {next.yellowAt - 1}: {Math.max(0, next.yellowAt - skill)} guaranteed skill-ups remaining.
          {" "}{isLearned(next.id) ? "You marked this pattern learned." : "You have not marked this pattern learned yet: acquire it before crafting."}
        </p>
        <button className="gm-pill" type="button" disabled={!isLearned(next.id) || recipeStatus(next, skill) !== "orange"}
          onClick={() => confirmCraft(next)}>I crafted it and gained +1 skill</button>
        {confirmed && <p role="status" className="gm-note" style={small}>{confirmed}</p>}
      </div>}
      {!next && <div className="gm-card" style={panel}>
        <h3 style={{ margin: "0 0 6px" }}>No verified orange recipe in this starter catalog</h3>
        <p className="gm-note" style={small}>Try the next recipe listed below, or check a current Forever profession database. We will not invent a guaranteed craft when the catalog is incomplete.</p>
      </div>}

      <div className="gm-card" style={panel}>
        <h3 style={{ margin: "0 0 9px" }}>Recipe finder</h3>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <label style={{ ...small, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={learnedOnly} onChange={e => setLearnedOnly(e.target.checked)}/> Learned recipes only
          </label>
          <label style={{ ...small, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={showGray} onChange={e => setShowGray(e.target.checked)}/> Include gray recipes
          </label>
        </div>
        <p className="gm-note" style={small}>{recipes.length} verified starter-catalog recipe(s). An Auction House pattern may or may not be listed on your realm.</p>
        {recipes.length === 0 && <p className="gm-note">No results with these filters. Clear “Learned recipes only” or include gray recipes.</p>}
        {recipes.map(r => {
          const state = recipeStatus(r, skill);
          const learned = isLearned(r.id);
          return <div key={r.id} style={{ padding: "13px 0", borderTop: "1px solid var(--border,#ddd)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, flexWrap: "wrap" }}>
              <div>
                <b>{r.name}</b>
                <div style={small}>{statusLabels[state]} · Learn at {r.learnAt} · Yellow at {r.yellowAt} · Gray at {r.grayAt}</div>
              </div>
              <label style={{ ...small, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={learned} onChange={e => setCheck(recipeLearnedKey(gameId, r.id), e.target.checked)}/>
                Pattern learned
              </label>
            </div>
            <div style={{ ...small, marginTop: 7 }}>
              <b>Per craft:</b> {r.reagents.map(m => String(m.quantity) + "× " + m.name).join(" · ")}
            </div>
            <div style={{ ...small, marginTop: 4 }}><b>Source:</b> {r.source}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 7 }}>
              <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" style={small}>Verify recipe details ↗</a>
              {r.waypoint && <button type="button" className="gm-pill" onClick={() => copyWaypoint(r.waypoint!)}>Copy TomTom waypoint</button>}
            </div>
            {r.waypoint && <div style={{ ...small, fontFamily: "monospace", marginTop: 4 }}>{r.waypoint}</div>}
            {state === "orange" && <p className="gm-note" style={{ ...small, marginTop: 5 }}>
              {r.yellowAt - skill} confirmed +1 crafts possible before this recipe turns yellow.
            </p>}
          </div>;
        })}
        {copied && <p role="status" className="gm-note" style={small}>{copied}</p>}
      </div>
    </>}
  </section>;
}
