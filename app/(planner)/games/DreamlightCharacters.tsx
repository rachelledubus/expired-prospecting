"use client";

import { useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import { DREAMLIGHT_CHARACTERS, dreamlightCharacterKey, dreamlightCharacterVisibilityKey, type DreamlightCharacterChain } from "@/lib/dreamlight-character-quests";
import { ItemDetails } from "./DreamlightItems";

type Props = { gameId: string; prog: GameProgress; setCheck: (key: string, checked: boolean) => void; setField: (key: string, value: string) => void; area?: "Valley" | "Honeyglow" };
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


function CharacterCard({ chain, gameId, prog, setCheck, onHide }: {
 chain: DreamlightCharacterChain; gameId: string; prog: GameProgress;
 setCheck: Props["setCheck"]; onHide: () => void;
}) {
 const [expanded, setExpanded] = useState(false);
 const isDone = (q: DreamlightCharacterChain["quests"][number]) =>
   !!prog.checks[dreamlightCharacterKey(gameId, chain.id, q.id)];
 const pending = chain.quests.filter(q => !isDone(q));
 const finished = chain.quests.filter(isDone);
 return (
   <article className="gm-dv-track" aria-label={chain.name + " questline"}>
     <div className="gm-dv-track-head">
       <div className="gm-dv-track-heading">
         <b>{chain.name}</b>
         <span>{finished.length} of {chain.quests.length} quests complete</span>
       </div>
       <button className="gm-pill ghost gm-dv-hide" type="button"
         title={"Remove " + chain.name + " from your active tracker without deleting quest progress"}
         onClick={onHide}>Hide</button>
     </div>
     {pending.length > 0 ? (
       <QuestRow chain={chain} quest={pending[0]} gameId={gameId} next done={false} setCheck={setCheck} />
     ) : (
       <p className="gm-note gm-dv-track-finished">✓ All listed quests completed.</p>
     )}
     <button className="gm-dv-expand" type="button" aria-expanded={expanded}
       onClick={() => setExpanded(v => !v)}>
       {expanded ? "Hide quest history" : "Show the rest of this character's quests"}
       <span aria-hidden="true">{expanded ? "⌃" : "⌄"}</span>
     </button>
     {expanded && (
       <div className="gm-dv-track-more">
         {pending.length > 1 && (
           <>
             <div className="gm-panel-label">Upcoming ({pending.length - 1})</div>
             {pending.slice(1).map(q => (
               <QuestRow key={q.id} chain={chain} quest={q} gameId={gameId}
                 done={false} setCheck={setCheck} />
             ))}
           </>
         )}
         {finished.length > 0 && (
           <details className="gm-dv-quest-fold">
             <summary>Completed quests ({finished.length}) · tap to undo</summary>
             {finished.map(q => (
               <QuestRow key={q.id} chain={chain} quest={q} gameId={gameId}
                 done setCheck={setCheck} />
             ))}
           </details>
         )}
         {pending.length <= 1 && finished.length === 0 && (
           <p className="gm-note">No other quests are listed for this character yet.</p>
         )}
       </div>
     )}
   </article>
 );
}

/** Show only characters actually marked as unlocked. Previously checked character quests count as
 * unlocked unless the user deliberately hides the character. No unlocks are guessed from realm access.
 * Visibility changes are text fields, separate from the completed quest checkboxes, so hiding is reversible.
 */
export default function DreamlightCharacters({ gameId, prog, setCheck, setField, area }: Props) {
 const [search, setSearch] = useState("");
 const [addSearch, setAddSearch] = useState("");
 const [manageOpen, setManageOpen] = useState(false);
 const all = DREAMLIGHT_CHARACTERS.filter(c => !area || c.area === area);
 const visibilityKey = (c: DreamlightCharacterChain) => dreamlightCharacterVisibilityKey(gameId, c.id);
 const hasQuestProgress = (c: DreamlightCharacterChain) =>
   c.quests.some(q => !!prog.checks[dreamlightCharacterKey(gameId, c.id, q.id)]);
 const isUnlocked = (c: DreamlightCharacterChain) => {
   const value = prog.fields[visibilityKey(c)];
   return value === "unlocked" || (value !== "hidden" && hasQuestProgress(c));
 };
 const completed = (c: DreamlightCharacterChain) =>
   c.quests.filter(q => !!prog.checks[dreamlightCharacterKey(gameId, c.id, q.id)]).length;
 const unlocked = all.filter(isUnlocked);
 const locked = all.filter(c => !isUnlocked(c));
 const matches = (c: DreamlightCharacterChain, value: string) =>
   (c.name + " " + c.quests.map(q => q.title).join(" ")).toLowerCase().includes(value.trim().toLowerCase());
 const shown = unlocked.filter(c => matches(c, search));
 const active = shown.filter(c => completed(c) < c.quests.length);
 const finished = shown.filter(c => completed(c) === c.quests.length);
 const total = unlocked.reduce((n, c) => n + c.quests.length, 0);
 const done = unlocked.reduce((n, c) => n + completed(c), 0);
 const addable = locked.filter(c => matches(c, addSearch));
 const setUnlocked = (c: DreamlightCharacterChain, yes: boolean) =>
   setField(visibilityKey(c), yes ? "unlocked" : "hidden");
 return (
   <section className="gm-card gm-dv-characters" style={{ marginTop: 12 }}>
     <div className="gm-panel-label">{area === "Honeyglow" ? "🍯 Honeyglow friends" : "💕 Character quest tracker"}</div>
     <h3 className="gm-h2">Your unlocked characters</h3>
     <p className="gm-note">
       {unlocked.length} unlocked · {done}/{total} quests finished. Only characters you've added appear in this tracker.
       Your next quest is shown under each character, like your Stardew quest board.
     </p>
     <div className="gm-dv-manage-actions">
       <button className="gm-pill" type="button" aria-expanded={manageOpen}
         onClick={() => setManageOpen(v => !v)}>
         {manageOpen ? "Close character list" : "+ Add / manage characters"}
       </button>
       <span className="gm-note">{locked.length} not shown</span>
     </div>
     {manageOpen && (
       <div className="gm-dv-manage-panel">
         <p className="gm-note">Tap Add when a character joins your Valley. You can hide one later without losing quest checkmarks.</p>
         <label className="gm-note gm-dv-search-label">
           Search characters to add
           <input type="search" className="gm-input" value={addSearch}
             onChange={e => setAddSearch(e.target.value)} placeholder="Search all hidden characters..." />
         </label>
         <div className="gm-dv-manage-list">
           {addable.map(c => (
             <div className="gm-dv-manage-row" key={c.id}>
               <div>
                 <b>{c.name}</b>
                 <span>{c.quests.length} quests{hasQuestProgress(c) ? " · previous progress preserved" : ""}</span>
               </div>
               <button className="gm-pill" type="button" onClick={() => setUnlocked(c, true)}
                 aria-label={"Add " + c.name + " to unlocked characters"}>+ Add</button>
             </div>
           ))}
           {addable.length === 0 && (
             <p className="gm-note">{locked.length === 0 ? "Every listed character has been added." : "No hidden characters match that search."}</p>
           )}
         </div>
       </div>
     )}
     {unlocked.length === 0 && (
       <div className="gm-dv-empty">
         <b>No unlocked characters selected yet.</b>
         <p>Use <strong>Add / manage characters</strong> to choose the villagers you've already welcomed. You can add several in one visit.</p>
         {!manageOpen && <button type="button" className="gm-pill" onClick={() => setManageOpen(true)}>Choose unlocked characters</button>}
       </div>
     )}
     {unlocked.length > 0 && (
       <>
         <label className="gm-note gm-dv-search-label">
           Find one of your unlocked characters or their quests
           <input type="search" className="gm-input" value={search}
             onChange={e => setSearch(e.target.value)} placeholder="e.g. Remy, Mickey, Making Music..." />
         </label>
         {shown.length === 0 && <p className="gm-note">No unlocked character matches your search.</p>}
         <div className="gm-dv-track-list">
           {active.map(c => (
             <CharacterCard key={c.id} chain={c} gameId={gameId} prog={prog}
               setCheck={setCheck} onHide={() => setUnlocked(c, false)} />
           ))}
         </div>
         {finished.length > 0 && (
           <details className="gm-dv-completed">
             <summary>Completed character storylines ({finished.length})</summary>
             <div className="gm-dv-track-list">
               {finished.map(c => (
                 <CharacterCard key={c.id} chain={c} gameId={gameId} prog={prog}
                   setCheck={setCheck} onHide={() => setUnlocked(c, false)} />
               ))}
             </div>
           </details>
         )}
       </>
     )}
     <p className="gm-note gm-dv-caveat">
       Unlocks and quests are saved to the portal, not read automatically from the game. Hiding a character keeps its quest history; adding it again restores everything.
     </p>
   </section>
 );
}
