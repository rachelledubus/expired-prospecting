"use client";

import { useMemo, useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import WoWCraftingEconomy from "./WoWCraftingEconomy";
import { wowExtraField } from "@/lib/wow-portal-extras";
import { WOWHEAD_FOREVER_PATTERN_LEADS } from "@/lib/wowhead-forever-pattern-leads";
import {
  WOW_PROFESSIONS, WOW_RECIPES, WOW_RECIPE_CATALOG, professionField, recipeLearnedKey, recipeHiddenKey, recipeStatus,
  type WowProfessionId, type WowRecipe, type SourceLocation,
} from "@/lib/wow-forever-professions";

type Props = {
  gameId: string;
  prog: GameProgress;
  setCheck: (key: string, value: boolean) => void;
  setField: (key: string, value: string) => void;
  initialQuery?: string;
  onFindMaterial?: (name: string) => void;
};

const panel: React.CSSProperties = { padding: 16, marginTop: 12 };
const small: React.CSSProperties = { fontSize: 13, opacity: 0.85, lineHeight: 1.5 };
const statusLabels = {
  locked: "Not yet learnable",
  orange: "Orange · +1 guaranteed",
  yellow: "Yellow · chance",
  green: "Green · low chance",
  chance: "Chance · check game color",
  gray: "Gray · no skill-up",
};

// The catalog contains Classic-baseline vendor data for both factions. An
// opposing-faction vendor is a reference, never an actionable purchase route.
const usableVendorLocations = (r: WowRecipe, faction: string) =>
  r.sourceLocations.filter(l => l.faction === faction || l.faction === "neutral");
const otherFactionLocations = (r: WowRecipe, faction: string) =>
  r.sourceLocations.filter(l => l.faction !== faction && l.faction !== "neutral");
const opposingVendorsOnly = (r: WowRecipe, faction: string) =>
  r.sourceLocations.length > 0 && usableVendorLocations(r, faction).length === 0;
const acquisitionRank = (r: WowRecipe, learned: boolean, faction: string) => {
  if (learned || r.acquisition === "trainer" || usableVendorLocations(r, faction).length > 0) return 0;
  if (opposingVendorsOnly(r, faction)) return 2;
  return 1; // source is not yet documented, not automatically unavailable
};

const ranking = (r: WowRecipe, skill: number, learned: boolean, goal: string, preferKalimdor: boolean, faction: string) => {
  const state = recipeStatus(r, skill);
  const statusRank = ({ orange: 0, yellow: 1, chance: 2, green: 3, locked: 4, gray: 5 } as const)[state];
  const accessible = usableVendorLocations(r, faction);
  const localPenalty = preferKalimdor && accessible.length && !accessible.some(l => l.continent === "kalimdor") ? 1 : 0;
  const sourcePenalty = acquisitionRank(r, learned, faction);
  const reagents = r.reagents.reduce((n, m) => n + m.quantity, 0);
  // Vendor accessibility must outrank material quantity. Neither guarantees current vendor stock.
  if (goal === "fewest") return [statusRank, learned ? 0 : 1, sourcePenalty, reagents, localPenalty];
  if (goal === "farm") return [statusRank, learned ? 0 : 1, sourcePenalty, localPenalty, reagents];
  return [statusRank, learned ? 0 : 1, sourcePenalty, localPenalty, reagents];
};
const compareRank = (a: number[], b: number[]) => {
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
};

// The recipe finder is a progression list, not an optimization ranking.
// Unknown trainer unlock levels must not be invented or sorted as level 0.
const compareLearnLevel = (a: WowRecipe, b: WowRecipe) => {
  const aLevel = a.learnAt ?? Number.POSITIVE_INFINITY;
  const bLevel = b.learnAt ?? Number.POSITIVE_INFINITY;
  if (aLevel !== bLevel) return aLevel - bLevel;
  return a.name.localeCompare(b.name);
};

type RecipeLocationGroup = { id: string; title: string; subtitle: string;
  kind: "known" | "trainer" | "unverified" | "opposing"; recipes: WowRecipe[] };
const locationGroupId = (loc: SourceLocation) => "loc:" + loc.continent + ":" + loc.zone + ":" + loc.area;
const groupRecipesByLocation = (recipes: WowRecipe[], faction: string, manualArea:(id:string)=>string): RecipeLocationGroup[] => {
  const groups = new Map<string, RecipeLocationGroup>();
  const add = (id: string, title: string, subtitle: string, kind: RecipeLocationGroup["kind"], recipe: WowRecipe) => {
    if (!groups.has(id)) groups.set(id, { id, title, subtitle, kind, recipes: [] });
    const found = groups.get(id)!;
    if (!found.recipes.some(r => r.id === recipe.id)) found.recipes.push(recipe);
  };
  for (const r of recipes) {
    const sources = usableVendorLocations(r, faction);
    if (sources.length) {
      for (const loc of sources) add(locationGroupId(loc), loc.area, loc.zone + " · " +
        (loc.continent === "eastern-kingdoms" ? "Eastern Kingdoms" : "Kalimdor"), "known", r);
    } else if (manualArea(r.id).trim()) {
      const place=manualArea(r.id).trim();
      add("personal:"+place.toLowerCase(),place,"My personally recorded acquisition source (not independently verified).","known",r);
    } else if (r.acquisition === "trainer" && !opposingVendorsOnly(r, faction)) {
      add("trainer", "Profession trainers", "Any qualified trainer for this profession; exact NPC and rank may vary.", "trainer", r);
    } else if (opposingVendorsOnly(r, faction)) {
      add("opposing", "Other-faction vendor references", "Not directly accessible to your current faction.", "opposing", r);
    } else {
      add("unverified", "Learning location not yet mapped",
        "No reliable town, NPC, drop, quest or trainer location is documented for your faction.", "unverified", r);
    }
  }
  const order = { known: 0, trainer: 1, unverified: 2, opposing: 3 };
  return [...groups.values()].map(g => ({ ...g, recipes: g.recipes.sort(compareLearnLevel) }))
    .sort((a,b) => order[a.kind]-order[b.kind] || a.title.localeCompare(b.title));
};

const clampSkill = (text: string) => {
  const n = Number(text);
  return String(Math.max(0, Math.min(300, Number.isFinite(n) ? Math.floor(n) : 0)));
};

export default function WoWProfessions({ gameId, prog, setCheck, setField, initialQuery = "", onFindMaterial }: Props) {
  const [selected, setSelected] = useState<WowProfessionId>("leatherworking");
  const [showGray, setShowGray] = useState(Boolean(initialQuery));
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [confirmed, setConfirmed] = useState("");
  const [query, setQuery] = useState(initialQuery);
  const [areaFilter, setAreaFilter] = useState("all");
  const [sourceDrafts, setSourceDrafts] = useState<Record<string,string>>({});
  const [shown, setShown] = useState(12);

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
  const extra = (value: string) => wowExtraField(gameId,value);
  const manualArea = (id: string) => prog.fields[extra("source-area-"+id)] ?? "";
  const manualKind = (id: string) => prog.fields[extra("source-kind-"+id)] ?? "";
  const manualNote = (id: string) => prog.fields[extra("source-note-"+id)] ?? "";
  const professionSourceIndex = selected === "leatherworking"
    ? "https://www.zockify.com/forever/professions/leatherworking/recipes/"
    : selected === "cooking"
      ? "https://www.zockify.com/forever/professions/cooking/recipes/"
      : "https://www.zockify.com/forever/professions/first-aid/recipes/";
  const hiddenCount = WOW_RECIPES.filter(r => r.profession === selected && isHidden(r.id) && !isLearned(r.id)).length;
  const setHidden = (id: string, hidden: boolean) => {
    setCheck(recipeHiddenKey(gameId, id), hidden);
    setConfirmed(hidden ? "Recipe hidden. Recommendations updated." : "Recipe restored.");
  };
  const toggleHiddenView = () => {
    setShowHidden(v => !v);
    setShown(12);
    setQuery("");
    setAreaFilter("all");
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
    // Keep learned recipes exclusively in the Recommended Next area.
    .filter(r => !isLearned(r.id))
    .filter(r => !query.trim() || (r.name + " " + r.category + " " + r.reagents.map(m => m.name).join(" ") + " " +
      r.sourceLocations.map(loc => loc.area + " " + loc.zone + " " + loc.npc).join(" ") + " " + manualArea(r.id) + " " + manualNote(r.id)).toLowerCase().includes(query.trim().toLowerCase()))
    .sort(compareLearnLevel),
      [baseRecipes, query, faction, showHidden, selected, prog.checks, prog.fields]);
  const areaOptions = useMemo(() => {
    const found = new Map<string, string>();
    WOW_RECIPES.filter(r => r.profession === selected).forEach(r => {
      usableVendorLocations(r, faction).forEach(loc => found.set(locationGroupId(loc), loc.area + " · " + loc.zone));
      if(!usableVendorLocations(r,faction).length && manualArea(r.id).trim()){
        const place=manualArea(r.id).trim();
        found.set("personal:"+place.toLowerCase(),place+" · My recorded location");
      }
    });
    return [...found].sort((a, b) => a[1].localeCompare(b[1]));
  }, [selected, faction, prog.fields]);
  const groupedRecipes = useMemo(() =>
    groupRecipesByLocation(recipes, faction, manualArea).filter(g => areaFilter === "all" || g.id === areaFilter),
    [recipes, faction, areaFilter, prog.fields]);
  const visibleRecipeCount = new Set(groupedRecipes.flatMap(g => g.recipes.map(r => r.id))).size;
  const learnedRecipes = useMemo(() =>
    WOW_RECIPES.filter(r => r.profession === selected && isLearned(r.id)).sort(compareLearnLevel),
    [selected, prog.checks]);
  const next = baseRecipes.find(r => recipeStatus(r, skill) === "orange" && isLearned(r.id))
    || baseRecipes.find(r => recipeStatus(r, skill) === "orange" && !opposingVendorsOnly(r, faction));
  const nextToLearn = baseRecipes.find(r => !isLearned(r.id) && r.learnAt !== null && r.learnAt <= skill &&
    (r.acquisition === "trainer" || usableVendorLocations(r,faction).length > 0 || !!manualArea(r.id) || !!WOWHEAD_FOREVER_PATTERN_LEADS[r.name]));
  // Unlearned recipes with only opposing-faction vendor records stay searchable
  // but will not be presented as your next vendor acquisition.

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

  const renderLearnedManager = () => learnedRecipes.length ? <details className="gm-wow-settings" style={{ marginTop: 14 }}>
    <summary>Review learned recipes ({learnedRecipes.length})</summary>
    <p className="gm-note" style={small}>These stay out of Recipe Finder. Uncheck a recipe below if it was marked Learned by mistake.</p>
    <div style={{ display: "grid", gap: 8, maxHeight: 240, overflowY: "auto", paddingTop: 6 }}>
      {learnedRecipes.map(r => <label key={r.id} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14 }}>
        <input type="checkbox" checked={isLearned(r.id)}
          onChange={e => setCheck(recipeLearnedKey(gameId, r.id), e.target.checked)}/>
        <span>{r.name}{isHidden(r.id) ? " · Hidden separately" : ""}</span>
      </label>)}
    </div>
    <p className="gm-note" style={small}>Unlearned recipes return to Recipe Finder when its gray, hidden, and search filters permit.</p>
  </details> : null;

  const renderRecipe = (r: WowRecipe) => {
            const state = recipeStatus(r, skill);
            const learned = isLearned(r.id);
            const foreverLead=WOWHEAD_FOREVER_PATTERN_LEADS[r.name];
            return <article key={r.id} className="gm-wow-recipe">
              <div className="gm-wow-recipe-head">
                <div className="gm-wow-recipe-heading">
                  <b>{r.name}</b>
                  <span className={"gm-wow-recipe-status gm-wow-status-" + state}>{statusLabels[state]}</span>
                  <span className="gm-wow-recipe-skill">
                    {r.learnAt === null ? "Trainer skill unknown" : "Learn at " + r.learnAt}
                    {" · Yellow " + r.yellowAt + " · Gray " + r.grayAt}
                  </span>
                  {!learned && opposingVendorsOnly(r, faction) && <span className="gm-wow-source-warning">
                    Only {faction === "horde" ? "Alliance" : "Horde"} vendor references known — not a usable purchase route
                  </span>}
                </div>
                <div className="gm-wow-recipe-actions">
                  <label className="gm-wow-learned">
                    <input type="checkbox" checked={learned}
                      onChange={e => setCheck(recipeLearnedKey(gameId, r.id), e.target.checked)}/>
                    Learned
                  </label>
                  <button type="button" className="gm-pill gm-wow-hide-btn"
                    aria-label={(showHidden ? "Restore " : "Hide ") + r.name}
                    onClick={() => setHidden(r.id, !showHidden)}>
                    {showHidden ? "Restore" : "Hide"}
                  </button>
                </div>
              </div>
              <details className="gm-wow-recipe-details">
                <summary>Materials, sources &amp; skill details</summary>
                <div className="gm-wow-recipe-detail-body">
                  <p><b>For one craft:</b> {r.reagents.map(m => m.quantity + "× " + m.name).join(" · ")}</p>
                  {onFindMaterial && <div style={{display:"flex",gap:7,flexWrap:"wrap",margin:"8px 0"}}>
                    {r.reagents.map(m=><button key={m.name} type="button" className="gm-pill"
                      onClick={()=>onFindMaterial(m.name)}>
                      Farm {m.name}
                    </button>)}
                  </div>}
                  <p><b>Learning:</b> {r.acquisition === "trainer" ? "Trainer (verify unlock skill in game)" : r.acquisition === "pattern" ? "Recipe or pattern item" : "Source unknown"}</p>
                   <p className="gm-note" style={small}><b>Source details:</b> {r.source}</p>
                  {foreverLead && <div style={{padding:10,border:"1px solid var(--border,#ddd)",borderRadius:9,margin:"10px 0"}}>
                    <b>Wowhead Forever pattern lead</b>
                    <p className="gm-note" style={small}>{foreverLead.details}</p>
                    {foreverLead.factionWarning&&faction==="horde"&&
                      <p className="gm-wow-source-warning">{foreverLead.factionWarning}</p>}
                    {foreverLead.levelHint&&<p className="gm-note" style={small}>{foreverLead.levelHint}</p>}
                    <a href={foreverLead.itemUrl} target="_blank" rel="noopener noreferrer">
                      Open exact pattern item on Wowhead Forever ↗
                    </a>
                    <p className="gm-note" style={small}>Reported source, not guaranteed current server loot or vendor stock.</p>
                  </div>}
                  {usableVendorLocations(r, faction).length > 0 ? <div className="gm-wow-locations">
                    <b>{faction === "horde" ? "Horde" : "Alliance"} / neutral vendor references</b>
                    {usableVendorLocations(r, faction).map((loc, idx) => {
                      const waypoint = "/way " + loc.zone + " " + loc.x + " " + loc.y;
                      return <div key={idx} className="gm-wow-location">
                        <span><b>{loc.npc}</b> · {loc.area} · {loc.zone} · {loc.continent === "eastern-kingdoms" ? "Eastern Kingdoms" : "Kalimdor"} · {loc.faction}</span>
                        <span className="gm-wow-reference">{loc.verification} · Current stock and route safety not guaranteed</span>
                        <button type="button" className="gm-pill"
                          onClick={() => copyWaypoint(waypoint)}>Copy TomTom</button>
                      </div>;
                    })}
                  </div> : <p className={opposingVendorsOnly(r, faction) ? "gm-wow-source-warning" : undefined}>
                    {opposingVendorsOnly(r, faction)
                      ? "No known " + (faction === "horde" ? "Horde" : "Alliance") + "/neutral vendor. The listed opposing-faction vendor cannot sell to your character."
                      : "A usable vendor or drop location has not been verified for your faction."}
                    {r.acquisition === "pattern" && !r.recipeItemBoP ? " A tradeable copy may be available through the Auction House, but check in-game." : ""}
                  </p>}
                  {otherFactionLocations(r, faction).length > 0 && <details className="gm-wow-other-faction">
                    <summary>Other-faction vendor references ({otherFactionLocations(r, faction).length}) — not usable</summary>
                    <div className="gm-wow-locations">
                      {otherFactionLocations(r, faction).map((loc, idx) => <div key={idx} className="gm-wow-location">
                        <span><b>{loc.npc}</b> · {loc.area} · {loc.zone} · {loc.continent === "eastern-kingdoms" ? "Eastern Kingdoms" : "Kalimdor"}</span>
                        <span className="gm-wow-reference">{loc.faction} vendor — cannot purchase as {faction}. No waypoint offered.</span>
                      </div>)}
                    </div>
                  </details>}
                  <div style={{borderTop:"1px solid var(--border,#ddd)",marginTop:12,paddingTop:10}}>
                    <b>Acquisition source — personal notes</b>
                    <p className="gm-note" style={small}>Published sources may be incomplete. Save where you actually find this pattern; your location appears as its own group when no usable vendor was mapped.</p>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,160px),1fr))",gap:8}}>
                      <label style={small}>How obtained
                        <select value={manualKind(r.id)} onChange={e=>setField(extra("source-kind-"+r.id),e.target.value)}
                          style={{width:"100%",padding:8,borderRadius:7}}>
                          <option value="">Not confirmed</option><option value="trainer">Trainer</option>
                          <option value="vendor">Vendor</option><option value="drop">Drop</option>
                          <option value="quest">Quest</option><option value="favor">Merchant's Favor</option>
                          <option value="reputation">Reputation</option><option value="other">Other</option>
                        </select>
                      </label>
                      <label style={small}>Exact town, camp or location
                        <input value={sourceDrafts[r.id]??manualArea(r.id)} maxLength={120} placeholder="e.g. Hammerfall"
                          onChange={e=>setSourceDrafts(old=>({...old,[r.id]:e.target.value}))}
                          style={{width:"100%",padding:8,borderRadius:7}}/>
                        <button className="gm-pill" type="button"
                          disabled={sourceDrafts[r.id]===undefined||sourceDrafts[r.id]===manualArea(r.id)}
                          onClick={()=>setField(extra("source-area-"+r.id),sourceDrafts[r.id]??"")}>
                          Save location
                        </button>
                      </label>
                    </div>
                    <label style={{...small,display:"block",marginTop:7}}>NPC, boss or source requirements
                      <input value={manualNote(r.id)} maxLength={240} placeholder="Vendor name, reputation, quest, drop…"
                        onChange={e=>setField(extra("source-note-"+r.id),e.target.value)}
                        style={{width:"100%",padding:8,borderRadius:7}}/>
                    </label>
                  </div>
                  {state === "orange" && <p>{Math.max(0, r.yellowAt - skill)} possible +1 crafts before this recipe becomes yellow, based on the catalog's thresholds.</p>}
                  <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">View client recipe ↗</a>
                  {" · "}<a href={professionSourceIndex} target="_blank" rel="noopener noreferrer">Check community acquisition index ↗</a>
                </div>
              </details>
            </article>;
  };
  const renderGroupRecipes = (group: RecipeLocationGroup) => <>
    {group.recipes.slice(0, shown).map(renderRecipe)}
    {group.recipes.length > shown && <button type="button" className="gm-pill"
      onClick={() => setShown(n => n + 12)}>Show 12 more in {group.title} ({group.recipes.length-shown} remaining)</button>}
  </>;

  return <section className="gm-wow-professions" aria-label="WoW Forever professions">
    <div className="gm-card gm-wow-profile-card" style={panel}>
      <div className="gm-wow-section-head">
        <h3 style={{ margin: 0 }}>My profession skills</h3>
        <span className="gm-wow-subtitle">Tap a number to update</span>
      </div>
      <div className="gm-wow-skill-grid">
        {WOW_PROFESSIONS.map(p => <label key={p.id} className="gm-wow-skill-field">
          <span>{p.label}</span>
          <input type="number" inputMode="numeric" min={0} max={300}
            aria-label={p.label + " skill"} className="gm-wow-skill-input"
            value={skillFor(p.id)}
            onChange={e => setField(professionField(gameId, "skill-" + p.id), clampSkill(e.target.value))}/>
        </label>)}
      </div>
      <details className="gm-wow-settings">
        <summary>Preferences &amp; gold</summary>
        <div className="gm-wow-setting-grid">
          <label>Goal
            <select value={goal} onChange={e => setField(professionField(gameId, "goal"), e.target.value)}>
              <option value="guaranteed">Guaranteed skill-ups first</option>
              <option value="farm">Prioritize easy-to-access recipe sources</option>
              <option value="fewest">Fewest total material units</option>
            </select>
          </label>
          <label>Recipe locations
            <select value={region} onChange={e => setField(professionField(gameId, "region"), e.target.value)}>
              <option value="any">Both continents (default)</option>
              <option value="kalimdor">Prefer Kalimdor vendors</option>
            </select>
          </label>
          <label>Gold on hand (optional)
            <input value={prog.fields[professionField(gameId, "gold")] ?? "19"} aria-label="Gold on hand"
              onChange={e => setField(professionField(gameId, "gold"), e.target.value.replace(/[^0-9.]/g, "").slice(0, 10))}
              type="text" inputMode="decimal"/>
          </label>
        </div>
        <p className="gm-note" style={small}>
          Both continents are included by default. The catalog is a game-client snapshot, not a live WoW or Auction House connection.
          Skill levels, learned patterns, and hidden recipes must be updated here; in-game recipe colors take precedence after patches.
        </p>
      </details>
    </div>

    <nav aria-label="Choose a profession" className="gm-chips gm-wow-profession-tabs">
      {WOW_PROFESSIONS.map(p => <button key={p.id} type="button"
        className={"gm-chip" + (selected === p.id ? " on" : "")}
        aria-pressed={selected === p.id} onClick={() => { setSelected(p.id); setConfirmed(""); setAreaFilter("all"); setShown(12); }}>
        {p.label} · {skillFor(p.id)}
      </button>)}
    </nav>

    {selected === "skinning" ? <div className="gm-card" style={panel}>
      <h3 style={{ margin: 0 }}>Skinning · {skill}</h3>
      <p className="gm-note" style={small}>Skinning has no crafted recipes. Train the next rank when eligible and skin appropriately leveled creatures. This tracker is separate from your crafting recipe list.</p>
    </div> : <>
      {next && <div className="gm-card gm-wow-next-card" style={panel}>
        <div className="gm-panel-label">{isLearned(next.id) ? "Craft next for skill" : "Recommended next · learn before crafting"} · {selected}</div>
        <h3 style={{ margin: "8px 0 4px" }}>{next.name}</h3>
        <p className="gm-note" style={small}>
          Orange until {next.yellowAt - 1}: {Math.max(0, next.yellowAt - skill)} guaranteed skill-ups remaining.
          {" "}{isLearned(next.id)
            ? "You marked this recipe learned."
            : usableVendorLocations(next, faction).length
              ? "You have not learned this recipe. A vendor reference exists for your faction; check current stock before traveling."
              : next.acquisition === "trainer"
                ? "You have not learned this recipe. Check a profession trainer for its current unlock requirement."
                : "You have not learned this recipe. Its Horde/neutral acquisition source is not yet confirmed; check before traveling."}
        </p>
        <div className="gm-wow-next-actions">
          <label className="gm-wow-learned">
            <input type="checkbox" checked={isLearned(next.id)}
              onChange={e => setCheck(recipeLearnedKey(gameId, next.id), e.target.checked)}/>
            Learned
          </label>
          <button className="gm-pill" type="button" disabled={!isLearned(next.id) || recipeStatus(next, skill) !== "orange"}
            onClick={() => confirmCraft(next)}>I crafted it and gained +1 skill</button>
          <button className="gm-pill" type="button"
            aria-label={"Hide " + next.name + " from future recommendations"}
            onClick={() => setHidden(next.id, true)}>Hide this recipe</button>
        </div>
        {confirmed && <p role="status" className="gm-note" style={small}>{confirmed}</p>}
        {renderLearnedManager()}
      </div>}
      {!next && <div className="gm-card" style={panel}>
        <h3 style={{ margin: "0 0 6px" }}>No eligible orange recipe recommended</h3>
        <p className="gm-note" style={small}>There may be orange recipes in the catalog, but no suitable unhidden recipe with a non-opposing acquisition route is available at this skill. Review recipes, learned status, and current trainers before traveling.</p>
        {renderLearnedManager()}
      </div>}
      {nextToLearn && <div className="gm-card" style={panel}>
        <div className="gm-panel-label">Learn next · accessible or recorded source</div>
        <h3 style={{margin:"6px 0"}}>{nextToLearn.name}</h3>
        <p className="gm-note" style={small}>
          {nextToLearn.acquisition === "trainer" ? "Check a profession trainer for its actual current unlock skill." :
            usableVendorLocations(nextToLearn,faction).length ? "Vendor: " + usableVendorLocations(nextToLearn,faction).map(l=>l.npc+" · "+l.area).join("; ") :
            WOWHEAD_FOREVER_PATTERN_LEADS[nextToLearn.name] ? "Wowhead Forever reports: "+WOWHEAD_FOREVER_PATTERN_LEADS[nextToLearn.name].details : "My recorded source: "+manualArea(nextToLearn.id)}
          {" "}No source here guarantees live Forever stock.
        </p>
        <label className="gm-wow-learned"><input type="checkbox" checked={isLearned(nextToLearn.id)}
          onChange={e=>setCheck(recipeLearnedKey(gameId,nextToLearn.id),e.target.checked)}/> Learned this recipe</label>
      </div>}
      <WoWCraftingEconomy gameId={gameId} profession={selected} prog={prog} setField={setField} onFindMaterial={onFindMaterial}/>
      <div className="gm-card gm-wow-finder-card" style={panel}>
        <div className="gm-wow-finder-head">
          <h3 style={{ margin: 0 }}>{showHidden ? "Hidden recipes" : "Recipe finder"}</h3>
          <button className="gm-pill" type="button" aria-pressed={showHidden}
            onClick={toggleHiddenView}>
            {showHidden ? "Back to recipes" : "Hidden recipes (" + hiddenCount + ")"}
          </button>
        </div>
        <p className="gm-note" style={small}>
          {showHidden
            ? "These are excluded from recommendations and normal searches. Restore any recipe to bring it back."
            : "Unlearned recipes are grouped by exact source (when mapped). Mark Learned to remove one. Check source details and record missing locations; review learned recipes in Recommended Next."}
        </p>
        <p className="gm-wow-sort-note">
          Grouped by specific learning location, then sorted by the skill needed to learn within each group.
          Trainer recipes with an unknown unlock skill appear last. “Next Craft” uses a separate recommendation order.
        </p>
        {!showHidden && <div className="gm-wow-filter-toggles">
          <label style={{ ...small, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={showGray} onChange={e => setShowGray(e.target.checked)}/> Include gray recipes
          </label>
        </div>}
        <div className="gm-wow-filter-row">
          <input type="search" aria-label="Search recipe, reagent, vendor or town" placeholder="Search recipe, vendor, town or materials…" value={query}
            onChange={e => { setQuery(e.target.value); setShown(12); }} className="gm-wow-search"/>
          <select aria-label="Specific learning location filter" className="gm-wow-continent-filter" value={areaFilter}
            onChange={e => { setAreaFilter(e.target.value); setShown(12); }}>
            <option value="all">All towns, camps &amp; learning sources</option>
            {areaOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            <option value="trainer">Profession trainers (location varies)</option>
            <option value="unverified">Sources not mapped yet</option>
            <option value="opposing">Other-faction vendors (reference only)</option>
          </select>
        </div>
        <p className="gm-note" style={small}>
          {showHidden
            ? visibleRecipeCount + " hidden " + selected + " recipes match."
            : visibleRecipeCount + " recipes in " + groupedRecipes.length + " learning-location groups · " + hiddenCount + " hidden · " +
              WOW_RECIPES.filter(r => r.profession === selected).length +
              " total catalog entries. Vendor locations are Classic references; current Forever stock is unverified."}
        </p>
        {groupedRecipes.length === 0 && <p className="gm-note">
          {showHidden ? "No hidden unlearned recipes match." : "No unlearned recipes match. Try clearing search or filters, or include gray recipes."}
        </p>}
        <div className="gm-wow-recipe-list">
          {groupedRecipes.map(group => {
            const heading = <><strong>{group.title}</strong> <span className="gm-note">({group.recipes.length})</span></>;
            const groupStyle: React.CSSProperties = {
              borderTop: "1px solid var(--border,#ddd)", marginTop: 16, paddingTop: 12
            };
            return group.kind === "known" ? <section key={group.id} style={groupStyle}>
              <h4 style={{ margin: "0 0 3px" }}>📍 {heading}</h4>
              <p className="gm-note" style={{ ...small, margin: "0 0 9px" }}>{group.subtitle} · Classic vendor reference, not live stock</p>
              {renderGroupRecipes(group)}
            </section> : <details key={group.id} style={groupStyle}
              open={Boolean(query.trim()) || areaFilter === group.id}>
              <summary style={{ cursor: "pointer", padding: "4px 0" }}>{heading}</summary>
              <p className="gm-note" style={small}>{group.subtitle}</p>
              {renderGroupRecipes(group)}
            </details>;
          })}
        </div>
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
