"use client";

import { useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import { DREAMLIGHT_CHARACTERS, dreamlightCharacterKey, dreamlightCharacterVisibilityKey } from "@/lib/dreamlight-character-quests";
import { DREAMLIGHT_TOOL_UPGRADES, dreamlightToolUpgradeKey, type DreamlightUpgrade } from "@/lib/dreamlight-tool-priorities";
import { ItemDetails } from "./DreamlightItems";

type Props = {
 gameId: string;
 prog: GameProgress;
 setCheck: (key: string, value: boolean) => void;
 onOpenCharacters: () => void;
 onOpenRealms: () => void;
};
const TOOL_ICON: Record<string, string> = {
 Pickaxe: "⛏️", Shovel: "🪏", "Watering Can": "💧",
};

export default function DreamlightTools({ gameId, prog, setCheck, onOpenCharacters, onOpenRealms }: Props) {
 const [showAll, setShowAll] = useState(false);
 const isComplete = (upgrade: DreamlightUpgrade) => !!prog.checks[dreamlightToolUpgradeKey(gameId, upgrade)];
 const ownerIsTracked = (upgrade: DreamlightUpgrade) => {
   const v = prog.fields[dreamlightCharacterVisibilityKey(gameId, upgrade.characterId)];
   const owner = DREAMLIGHT_CHARACTERS.find(c => c.id === upgrade.characterId);
   const progress = owner?.quests.some(q => !!prog.checks[dreamlightCharacterKey(gameId, upgrade.characterId, q.id)]) ?? false;
   return v === "unlocked" || (v !== "hidden" && progress);
 };
 const prereqsMet = (upgrade: DreamlightUpgrade) =>
   (upgrade.dependsOn ?? []).every(id => {
     const prerequisite = DREAMLIGHT_TOOL_UPGRADES.find(u => u.id === id);
     return prerequisite ? isComplete(prerequisite) : true;
   });
 const pending = DREAMLIGHT_TOOL_UPGRADES.filter(u => !isComplete(u));
 // Don't recommend a later upgrade before a required earlier upgrade.
 const eligible = pending.filter(prereqsMet);
 // Favor the paths whose characters the player has added; the Maui realm step works before he moves in.
 const recommendation = eligible.find(u => !u.stage && ownerIsTracked(u)) ?? eligible.find(u => !!u.stage) ?? eligible[0] ?? null;
 const completeCount = DREAMLIGHT_TOOL_UPGRADES.length - pending.length;
 const nextNeedsCharacter = !!recommendation && !recommendation.stage && !ownerIsTracked(recommendation);

 return (
   <section className="gm-card gm-dv-tools" aria-label="Royal tool upgrade priorities">
     <div className="gm-panel-label">🔧 Royal Tools · upgraded-first playthrough</div>
     <div className="gm-dv-tools-heading">
       <div>
         <h3 className="gm-h2">Do this next: improve your tools</h3>
         <p className="gm-note">{completeCount}/{DREAMLIGHT_TOOL_UPGRADES.length} permanent Valley upgrades finished · Only base-game tools, no unowned expansions.</p>
       </div>
     </div>
     <div className="gm-bar thin" role="progressbar" aria-label="Royal tool upgrade progress"
       aria-valuemin={0} aria-valuemax={DREAMLIGHT_TOOL_UPGRADES.length} aria-valuenow={completeCount}>
       <i style={{ width: (100 * completeCount / DREAMLIGHT_TOOL_UPGRADES.length) + "%" }} />
     </div>
     {recommendation ? (
       <div className="gm-dv-tool-focus" key={recommendation.id}>
         <div className="gm-panel-label">{nextNeedsCharacter ? "Next upgrade path · character not marked unlocked" : "Recommended upgrade path"}</div>
         <h4>{TOOL_ICON[recommendation.tool]} {recommendation.tool} — {recommendation.clears}</h4>
         <p className="gm-dv-tool-quest"><b>Quest:</b> {recommendation.quest} · {recommendation.character}</p>
         <p className="gm-dv-tool-instruction">{recommendation.instruction}</p>
         <p className="gm-dv-tool-gate"><b>Before it unlocks:</b> {recommendation.requirement}</p>
         {nextNeedsCharacter && (
           <div className="gm-dv-tool-hint">
             <p className="gm-note">You haven't marked {recommendation.character} as unlocked in the portal. If they're already in your Valley, add them to your character tracker.</p>
             <button className="gm-pill ghost" type="button" onClick={onOpenCharacters}>Manage unlocked characters</button>
           </div>
         )}
         {recommendation.stage && (
           <button type="button" className="gm-pill ghost" style={{ marginBottom: 10 }} onClick={onOpenRealms}>
             See the Moana realm checklist
           </button>
         )}
         <label className="gm-item">
           <input type="checkbox"
             checked={isComplete(recommendation)}
             onChange={e => setCheck(dreamlightToolUpgradeKey(gameId, recommendation), e.target.checked)} />
           <span className="gm-box" aria-hidden="true" />
           <span className="gm-txt"><span className="gm-name">I completed {recommendation.quest} and got this upgrade</span>
             <span className="gm-sub">Updates the same saved quest checkbox in your character or realm tracker.</span>
           </span>
         </label>
         {!!recommendation.material?.length && (
           <details className="gm-dv-tool-materials">
             <summary>
               Gather materials ({recommendation.material.length} types) · exact locations
             </summary>
             {recommendation.material.map(item => <ItemDetails key={item.item} item={item.item} qty={item.qty} />)}
           </details>
         )}
       </div>
     ) : (
       <div className="gm-dv-tool-focus">
         <h4>✓ All tracked permanent Valley tool upgrades complete!</h4>
         <p className="gm-note">Your story guide is now the main progression path. The Fishing Rod has no permanent obstacle-clearing upgrade.</p>
       </div>
     )}
     <button type="button" className="gm-dv-expand" aria-expanded={showAll}
       onClick={() => setShowAll(v => !v)}>
       {showAll ? "Hide the upgrade roadmap" : "See all 10 Royal Tool upgrades and unlock requirements"}
       <span aria-hidden="true">{showAll ? "⌃" : "⌄"}</span>
     </button>
     {showAll && (
       <div className="gm-dv-tool-roadmap">
         {DREAMLIGHT_TOOL_UPGRADES.map(u => {
           const done = isComplete(u);
           const blocked = !prereqsMet(u);
           const tracked = ownerIsTracked(u);
           return (
             <details key={u.id} className={"gm-dv-tool-roadmap-row" + (done ? " done" : "")}>
               <summary>
                 <span>{done ? "✓" : TOOL_ICON[u.tool]} <b>{u.tool}</b> · {u.clears}</span>
                 <em>{done ? "Complete" : blocked ? "Earlier upgrade first" : u.stage || tracked ? "Upgrade path" : "Unlock character first"}</em>
               </summary>
               <p className="gm-dv-tool-quest"><b>{u.quest}</b> — {u.character}</p>
               <p className="gm-note">{u.requirement}</p>
               <p className="gm-dv-tool-instruction">{u.instruction}</p>
               {!!u.material?.length && (
                 <details className="gm-dv-tool-materials">
                   <summary>Materials & locations ({u.material.length})</summary>
                   {u.material.map(item => <ItemDetails key={item.item} item={item.item} qty={item.qty} />)}
                 </details>
               )}
               <label className="gm-item">
                 <input type="checkbox" checked={done}
                   onChange={e => setCheck(dreamlightToolUpgradeKey(gameId, u), e.target.checked)} />
                 <span className="gm-box" aria-hidden="true" />
                 <span className="gm-txt"><span className="gm-name">Quest completed · upgrade obtained</span></span>
               </label>
             </details>
           );
         })}
       </div>
     )}
     <p className="gm-note gm-dv-caveat">
       Quest objectives unlock at different friendship levels and biomes. This guide uses your checked quests and unlocked-character roster, not direct access to your game. Temporary tool potions aren't counted as permanent upgrades.
     </p>
   </section>
 );
}
