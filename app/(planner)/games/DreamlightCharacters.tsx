"use client";

import { useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import { DREAMLIGHT_CHARACTERS, dreamlightCharacterKey, type DreamlightCharacterChain } from "@/lib/dreamlight-character-quests";
import { ItemDetails } from "./DreamlightItems";

type Props = { gameId: string; prog: GameProgress; setCheck: (key: string, checked: boolean) => void; area?: "Valley" | "Honeyglow" };
const QUEST_HELP: Record<string, { tip: string; items?: string[] }> = {
  "the-mysterious-wreck": {
    tip: "Goofy's raft repair takes place on Dazzle Beach. Gather the crafting supplies, then repair the raft by the small island.",
    items: ["Hardwood", "Rope", "Clay", "Iron Ingot"],
  },
  "very-sleepy-stitch": {
    tip: "Work through Stitch's coffee-making quest. Grow the Coffee Sapling before collecting coffee beans; the sapling requires crafting materials.",
    items: ["Pebbles", "Clay"],
  },
  "the-dreamlight-fountain": {
    tip: "The fountain requires multiple crafted materials. Build up Iron Ingots ahead of time instead of mining only when the quest asks.",
    items: ["Stone", "Iron Ingot", "Soil", "Hardwood", "Clay"],
  },
  "the-final-trial": {
    tip: "This is Merlin's quest to finish upgrading the Watering Can. The purification step uses mushrooms and other magical supplies.",
    items: ["Mushroom", "Purified Night Shard"],
  },
  "a-restaurant-makeover": {
    tip: "Open the restaurant for Remy, then buy the ingredients he requests from inside Chez Remy.",
    items: ["Milk", "Egg", "Cheese", "Butter"],
  },
  "remys-recipe-book": {
    tip: "Find the missing recipe books and help Remy restore his ingredients. Completing this unlocks Peanuts at Chez Remy.",
    items: ["Peanut"],
  },
  "the-unknown-flavor": {
    tip: "Remy's level-10 dessert quest eventually makes Slush Ice available for purchase at Chez Remy.",
    items: ["Slush Ice"],
  },
  "a-fishy-dispute": {
    tip: "Meet Donald at the fishing spots he identifies; fish in the indicated ripples.",
  },
  "back-from-the-bayou": {
    tip: "Start Tiana's restaurant storyline to unlock Tiana's Palace.",
  },
};
function QuestRow({ chain, quest, done, next, gameId, setCheck }: {
 chain: DreamlightCharacterChain;
 quest: DreamlightCharacterChain["quests"][number];
 done: boolean; next?: boolean; gameId: string; setCheck: Props["setCheck"];
}) {
 const help = QUEST_HELP[quest.id];
 const key = dreamlightCharacterKey(gameId, chain.id, quest.id);
 return (
   <div className={"gm-dv-quest" + (next ? " next" : "") + (done ? " done" : "")}>
     <label className="gm-item">
       <input type="checkbox" checked={done} onChange={e => setCheck(key, e.target.checked)} />
       <span className="gm-box" aria-hidden="true" />
       <span className="gm-txt">
         <span className="gm-name">{quest.title}</span>
         {next && <span className="gm-sub">Next unchecked quest in this character's chain</span>}
       </span>
     </label>
     {!done && help && (
       <div className="gm-dv-help">
         <p>{help.tip}</p>
         {help.items?.length ? <details>
           <summary>Where to find the materials ({help.items.length})</summary>
           {help.items.map(name => <ItemDetails key={name} item={name} />)}
         </details> : null}
       </div>
     )}
   </div>
 );
}

export default function DreamlightCharacters({ gameId, prog, setCheck, area }: Props) {
 const [search, setSearch] = useState("");
 const [chosen, setChosen] = useState("");
 const [showAll, setShowAll] = useState(false);
 const all = DREAMLIGHT_CHARACTERS.filter(c => !area || c.area === area);
 const filtered = all.filter(c => (c.name + " " + c.quests.map(q => q.title).join(" ")).toLowerCase().includes(search.trim().toLowerCase()));
 const list = search.trim() || showAll ? filtered : filtered.slice(0, 18);
 const selected = all.find(c => c.id === chosen) ?? null;
 const isDone = (c: DreamlightCharacterChain, q: DreamlightCharacterChain["quests"][number]) =>
   !!prog.checks[dreamlightCharacterKey(gameId, c.id, q.id)];
 const completed = (c: DreamlightCharacterChain) => c.quests.filter(q => isDone(c, q)).length;
 const total = all.reduce((sum, c) => sum + c.quests.length, 0);
 const done = all.reduce((sum, c) => sum + completed(c), 0);
 const pending = selected?.quests.filter(q => !isDone(selected, q)) ?? [];
 const finished = selected?.quests.filter(q => isDone(selected, q)) ?? [];
 return (
  <section className="gm-card gm-dv-characters" style={{ marginTop: 12 }}>
    <div className="gm-panel-label">{area === "Honeyglow" ? "🍯 Honeyglow friends" : "💕 Character questlines"}</div>
    <h3 className="gm-h2">Each character has their own quest chain</h3>
    <p className="gm-note">{all.length} characters · {done}/{total} named quests checked. Select a character to track their story in order. Checkboxes save to your portal progress.</p>
    <label className="gm-note gm-dv-search-label">
      Find a character or quest name
      <input type="search" className="gm-input" value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="e.g. Remy, Elsa, Making Music..." />
    </label>
    <div className="gm-dv-character-grid">
      {list.map(c => {
        const count = completed(c), active = selected?.id === c.id;
        return (
         <button key={c.id} type="button" className={"gm-dv-character" + (active ? " active" : "")}
           aria-pressed={active} onClick={() => setChosen(active ? "" : c.id)}>
           <span className="gm-dv-character-name">{c.name}</span>
           <span className="gm-dv-character-count">{count}/{c.quests.length}{count === c.quests.length ? " ✓" : ""}</span>
         </button>
        );
      })}
    </div>
    {filtered.length === 0 && <p className="gm-note">No character or quest matches that search. Try part of the name.</p>}
    {!search.trim() && filtered.length > list.length && (
      <button className="gm-pill ghost gm-dv-show-all" type="button" onClick={() => setShowAll(true)}>
        Show all {filtered.length} characters
      </button>
    )}
    {!search.trim() && showAll && filtered.length > 18 && (
      <button className="gm-pill ghost gm-dv-show-all" type="button" onClick={() => setShowAll(false)}>Show fewer characters</button>
    )}
    {!selected && <p className="gm-note gm-dv-select-hint">Choose a character above to open their individual questline.</p>}
    {selected && (
      <div className="gm-dv-character-detail" key={selected.id}>
        <div className="gm-dv-character-head">
          <div>
            <div className="gm-panel-label">{selected.area} · Individual story</div>
            <h3 className="gm-h2">{selected.name}</h3>
            <p className="gm-note">{finished.length} of {selected.quests.length} quests complete</p>
          </div>
          <button type="button" className="gm-pill ghost" onClick={() => setChosen("")}>Close</button>
        </div>
        <div className="gm-bar thin" role="progressbar" aria-label={selected.name + " quest progress"}
          aria-valuemin={0} aria-valuemax={selected.quests.length} aria-valuenow={finished.length}>
          <i style={{ width: (100 * finished.length / selected.quests.length) + "%" }} />
        </div>
        {pending.length ? <>
          <div className="gm-panel-label">Do next</div>
          <QuestRow chain={selected} quest={pending[0]} gameId={gameId} next
            done={false} setCheck={setCheck} />
          {pending.length > 1 && <details className="gm-dv-quest-fold">
            <summary>Remaining quests ({pending.length - 1})</summary>
            {pending.slice(1).map(q => (
              <QuestRow key={q.id} chain={selected} quest={q} gameId={gameId}
                done={false} setCheck={setCheck} />
            ))}
          </details>}
        </> : <p className="gm-note">✓ Every quest in this character's listed chain is checked.</p>}
        {finished.length > 0 && <details className="gm-dv-quest-fold">
          <summary>Completed quests ({finished.length}) · tap to undo</summary>
          {finished.map(q => (
            <QuestRow key={q.id} chain={selected} quest={q} gameId={gameId}
              done setCheck={setCheck} />
          ))}
        </details>}
        <p className="gm-note gm-dv-caveat">Quests may require friendship levels, biome access, or earlier character stories. Check a quest only after completing it in-game; this tracker does not auto-detect game progress.</p>
      </div>
    )}
  </section>
 );
}
