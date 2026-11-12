"use client";

import { useMemo, useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import {
  WOW_PROFESSIONS, WOW_RECIPES, WOW_RECIPE_CATALOG, professionField, recipeLearnedKey, recipeHiddenKey, recipeStatus,
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

const ranking = (r: WowRecipe, skill: number, learned: boolean, goal: string, preferKalimdor: boolean, faction: string) => {
  const state = recipeStatus(r, skill);
  const statusRank = ({ orange: 0, yellow: 1, chance: 2, green: 3, locked: 4, gray: 5 } as const)[state];
  const accessible = r.sourceLocations.filter(l => l.faction === faction || l.faction === "neutral");
  const localPenalty = preferKalimdor && accessible.length && !accessible.some(l => l.continent === "kalimdor") ? 1 : 0;
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
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [confirmed, setConfirmed] = useState("");
  const [query, setQuery] = useState("");
  const [continentFilter, setContinentFilter] = useState("all");
  const [shown, setShown] = useState(35);

  const skillFor = (id: WowProfessionId) => {
    const initial = WOW_PROFESSIONS.find(p => p.id === id)?.initial ?? 0;
    const raw = prog.fields[professionField(gameId, "skill-" + id)];
    return raw === undefined ? initial : Math.max(0, Math.min(300, Number(raw) || 0));
  };
  const skill = skillFor(selected);
  const goal = prog.fields[professionField(gameId, "goal")] || "guaranteed";
  const region = prog.fields[professionField(gameId, "region")] || "any";
  const faction = prog.fields[gameId + "|faction"] || "horde";
  const isLearned = (id: string) => !!prog.checks[recipeLearnedKey(gameId, id)];
  const isHidden = (id: string) => !!prog.checks[recipeHiddenKey(gameId, id)];
  const hiddenCount = WOW_RECIPES.filter(r => r.profession === selected && isHidden(r.id)).length;
  const setHidden = (id: string, hidden: boolean) => {
    setCheck(recipeHiddenKey(gameId, id), hidden);
    setConfirmed(hidden ? "Recipe hidden. Recommendations updated." : "Recipe restored.");
  };
  const toggleHiddenView = () => {
    setShowHidden(v => !v);
    setShown(35);
    setQuery("");
    setContinentFilter("all");
    setLearnedOnly(false);
  };
  const baseRecipes = useMemo(() => WOW_RECIPES
    .filter(r => r.profession === selected && !isHidden(r.id) && (showGray || recipeStatus(r, skill) !== "gray"))
    .sort((a, b) => compareRank(
      ranking(a, skill, isLearned(a.id), goal, region === "kalimdor", faction),
      ranking(b, skill, isLearned(b.id), goal, region === "kalimdor", faction),
    )), [selected, skill, goal, region, showGray, faction, prog.checks]);
  const recipes = useMemo(() => (showHidden
    ? WOW_RECIPES.filter(r => r.profession === selected && isHidden(r.id))
    : baseRecipes)
    .filter(r => showHidden || !learnedOnly || isLearned(r.id))
    .filter(r => !query.trim() || (r.name + " " + r.category + " " + r.reagents.map(m => m.name).join(" ") + " " +
      r.sourceLocations.map(loc => loc.zone + " " + loc.npc).join(" ")).toLowerCase().includes(query.trim().toLowerCase()))
    .filter(r => showHidden || continentFilter === "all" || r.sourceLocations.some(loc =>
      loc.continent === continentFilter && (loc.faction === faction || loc.faction === "neutral"))),
      [baseRecipes, query, continentFilter, faction, learnedOnly, showHidden, selected, prog.checks]);
  const next = baseRecipes.find(r => recipeStatus(r, skill) === "orange" && isLearned(r.id))
    || baseRecipes.find(r => recipeStatus(r, skill) === "orange");

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
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 9 }}>
          <button className="gm-pill" type="button" disabled={!isLearned(next.id) || recipeStatus(next, skill) !== "orange"}
            onClick={() => confirmCraft(next)}>I crafted it and gained +1 skill</button>
          <button className="gm-pill" type="button"
            aria-label={"Hide " + next.name + " from future recommendations"}
            onClick={() => setHidden(next.id, true)}>Hide this recipe</button>
        </div>
        {confirmed && <p role="status" className="gm-note" style={small}>{confirmed}</p>}
      </div>}
      {!next && <div className="gm-card" style={panel}>
        <h3 style={{ margin: "0 0 6px" }}>No verified orange recipe in this starter catalog</h3>
        <p className="gm-note" style={small}>No orange craft in the current client snapshot at this skill. Check trainer unlocks and whether the game has received a newer patch before buying materials.</p>
      </div>}

      <div className="gm-card" style={panel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>{showHidden ? "Hidden recipes" : "Recipe finder"}</h3>
          <button className="gm-pill" type="button" aria-pressed={showHidden}
            onClick={toggleHiddenView}>
            {showHidden ? "Back to recipes" : "Hidden recipes (" + hiddenCount + ")"}
          </button>
        </div>
        <p className="gm-note" style={small}>
          {showHidden
            ? "These are excluded from recommendations and normal searches. Restore any recipe to bring it back."
            : "Not interested in a pattern? Hide it without marking it learned. You can restore it from Hidden recipes."}
        </p>
        {!showHidden && <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <label style={{ ...small, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={learnedOnly} onChange={e => setLearnedOnly(e.target.checked)}/> Learned recipes only
          </label>
          <label style={{ ...small, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={showGray} onChange={e => setShowGray(e.target.checked)}/> Include gray recipes
          </label>
        </div>}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "12px 0" }}>
          <input type="search" aria-label="Search recipes, reagents or vendor zones" placeholder="Search recipes, materials or vendor…" value={query}
            onChange={e => { setQuery(e.target.value); setShown(35); }} style={{ ...input, flex: 1, minWidth: 170 }}/>
          {!showHidden && <select aria-label="Continent source filter" style={input} value={continentFilter}
            onChange={e => { setContinentFilter(e.target.value); setShown(35); }}>
            <option value="all">All recipes / both continents</option>
            <option value="eastern-kingdoms">Known Eastern Kingdoms sources</option>
            <option value="kalimdor">Known Kalimdor sources</option>
          </select>}
        </div>
        <p className="gm-note" style={small}>
          {showHidden
            ? recipes.length + " hidden " + selected + " recipes match."
            : recipes.length + " available in search · " + hiddenCount + " hidden · " +
              WOW_RECIPES.filter(r => r.profession === selected).length +
              " total catalog entries. Continent filtering only includes recorded usable vendor sources."}
        </p>
        {recipes.length === 0 && <p className="gm-note">
          {showHidden ? "No hidden recipes found for this profession or search." : "No matching recipes. Try clearing your search, filters, or including gray recipes."}
        </p>}
        {recipes.slice(0, shown).map(r => {
          const state = recipeStatus(r, skill);
          const learned = isLearned(r.id);
          return <div key={r.id} style={{ padding: "13px 0", borderTop: "1px solid var(--border,#ddd)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, flexWrap: "wrap" }}>
              <div>
                <b>{r.name}</b>
                <div style={small}>{statusLabels[state]} · {r.learnAt === null ? "Trainer unlock skill not verified" : "Learn at " + r.learnAt} · Yellow at {r.yellowAt} · Gray at {r.grayAt}</div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <label style={{ ...small, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <input type="checkbox" checked={learned} onChange={e => setCheck(recipeLearnedKey(gameId, r.id), e.target.checked)}/>
                  Learned
                </label>
                <button type="button" className="gm-pill"
                  aria-label={(showHidden ? "Restore " : "Hide ") + r.name}
                  onClick={() => setHidden(r.id, !showHidden)}>
                  {showHidden ? "Restore" : "Hide"}
                </button>
              </div>
            </div>
            <div style={{ ...small, marginTop: 7 }}>
              <b>Per craft:</b> {r.reagents.map(m => String(m.quantity) + "× " + m.name).join(" · ")}
            </div>
            <div style={{ ...small, marginTop: 4 }}><b>How learned:</b> {r.acquisition === "trainer" ? "Trainer (unlock skill may require checking in game)" : r.acquisition === "pattern" ? "Pattern / recipe item (check its acquisition source)" : "Unknown"}</div>
            {r.sourceLocations.length > 0 ? <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
              {r.sourceLocations.map((loc, idx) => {
                const waypoint = "/way " + loc.zone + " " + loc.x + " " + loc.y;
                const availableToFaction = loc.faction === "neutral" || loc.faction === faction;
                return <div key={idx} style={{ ...small, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                  <span><b>{loc.npc}</b> · {loc.zone} · {loc.continent === "eastern-kingdoms" ? "Eastern Kingdoms" : "Kalimdor"} · {loc.faction}</span>
                  <span style={{ opacity: 0.8 }}>(Classic location reference)</span>
                  {availableToFaction && <button type="button" className="gm-pill"
                    onClick={() => copyWaypoint(waypoint)}>Copy TomTom</button>}
                </div>;
              })}
            </div> : <div style={{ ...small, marginTop: 4, opacity: 0.8 }}>Detailed vendor or drop location not yet verified; check source reference.</div>}
            <div style={{ marginTop: 8 }}>
              <a href={"https://www.zockify.com/forever/professions/" + (selected === "first-aid" ? "first-aid" : selected) + "/recipes/"}
                target="_blank" rel="noopener noreferrer" style={small}>Browse source database ↗</a>
            </div>
            {state === "orange" && <p className="gm-note" style={{ ...small, marginTop: 5 }}>
              {r.yellowAt - skill} confirmed +1 crafts possible before this recipe turns yellow.
            </p>}
          </div>;
        })}
        {recipes.length > shown && <button type="button" className="gm-pill"
          onClick={() => setShown(v => v + 35)}>Show 35 more ({recipes.length - shown} remaining)</button>}
        {copied && <p role="status" className="gm-note" style={small}>{copied}</p>}
        <p className="gm-note" style={{ ...small, marginTop: 15 }}>
          {WOW_RECIPE_CATALOG.build} game-client snapshot · {WOW_RECIPES.length} recipes across Leatherworking, Cooking and First Aid.
          Hidden entries stay saved but excluded from normal recommendations. Not every recipe is obtainable; many vendor/drop locations remain unconfirmed.
          <a href={WOW_RECIPE_CATALOG.sourceUrl} target="_blank" rel="noopener noreferrer"> Source data ↗</a>
        </p>
      </div>
    </>}
  </section>;
}
