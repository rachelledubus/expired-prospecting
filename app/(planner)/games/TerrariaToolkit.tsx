"use client";

import { useState } from "react";
import { questKey, type GameProgress } from "@/lib/games-data";
import type { TerrariaGame, TerrariaStage, TerrariaStep } from "@/lib/terraria-spirit-data";
import { TERRARIA_ITEM_INDEX, terrariaItem } from "@/lib/terraria-resource-index";
import { TERRARIA_STEP_GUIDES } from "@/lib/terraria-step-guides";

const key = (gameId: string, stage: string, step: string) =>
  questKey(gameId, "terraria-" + stage, step);

export function TerrariaItemInfo({ name }: { name: string }) {
 const item = terrariaItem(name);
 return <div className="gm-ter-item">
   <b>{name}</b>
   {item ? <>
     <span className="gm-ter-method">{item.method}</span>
     <p><strong>Where:</strong> {item.where}</p>
     <p><strong>Recipe / use:</strong> {item.recipe}</p>
     <p className="gm-note">{item.tip}</p>
   </> : <p className="gm-note">Exact location or recipe has not yet been confirmed for this item.</p>}
 </div>;
}

export function TerrariaStepHelp({ stage, step }: { stage: TerrariaStage; step: TerrariaStep }) {
 const guide = TERRARIA_STEP_GUIDES[stage.id + ":" + step.id];
 const matching = guide?.items?.length ? guide.items :
   TERRARIA_ITEM_INDEX.filter(item => step.label.toLowerCase().includes(item.name.toLowerCase()))
     .sort((a, b) => b.name.length - a.name.length).slice(0, 3).map(item => item.name);
 if (!guide && !matching.length && !step.how) return null;
 return <details className="gm-ter-help">
   <summary>Where / how / materials</summary>
   {guide ? <>
     <p><strong>Go to:</strong> {guide.place}</p>
     <p><strong>Do:</strong> {guide.action}</p>
     {guide.tip && <p className="gm-note">{guide.tip}</p>}
   </> : step.how ? <p>{step.how}</p> : null}
   {matching.map(name => <TerrariaItemInfo key={name} name={name} />)}
 </details>;
}

const popular = ["Durasilk Sheaf","Scarab Idol","Seabreak Pearl","Feather Crown","Dusk Crown","Stone Fist"];
export function TerrariaItemFinder() {
 const [q, setQ] = useState("");
 const [all, setAll] = useState(false);
 const [limit, setLimit] = useState(25);
 const query = q.trim().toLowerCase();
 const matches = TERRARIA_ITEM_INDEX.filter(item =>
   !query || [item.name,item.method,item.where,item.recipe,item.tip].some(s => s.toLowerCase().includes(query)));
 if (query) matches.sort((a,b) => {
   const rank = (name: string) => name.toLowerCase() === query ? 0 : name.toLowerCase().startsWith(query) ? 1 : name.toLowerCase().includes(query) ? 2 : 3;
   return rank(a.name) - rank(b.name) || a.name.localeCompare(b.name);
 });
 const displayed = !query && !all ? [] : matches.slice(0, limit);
 return <section className="gm-card gm-ter-finder">
   <div className="gm-panel-label">🔎 Terraria + Spirit Classic item finder</div>
   <h3 className="gm-h2">Where do I get it?</h3>
   <p className="gm-note">Search material sources, crafting recipes, biomes and boss summons without leaving your guide.</p>
   <label className="gm-note gm-ter-search">
     Search an item, recipe or location
     <input type="search" className="gm-input" value={q}
       placeholder="e.g. Durasilk, Dungeon, Stone Fist..."
       onChange={e => {setQ(e.target.value);setLimit(25);}} />
   </label>
   <div className="gm-ter-tags">
     {popular.map(name => <button key={name} type="button" className="gm-ter-tag"
       onClick={() => {setQ(name);setAll(false);setLimit(25);}}>{name}</button>)}
     {!!q && <button className="gm-ter-tag" type="button" onClick={() => setQ("")}>Clear</button>}
   </div>
   <div aria-live="polite">
     {displayed.map(item => <TerrariaItemInfo key={item.name} name={item.name} />)}
     {!!query && !matches.length && <p className="gm-note">No location saved yet for that term. Try a biome or a shorter item name; this guide will not invent an unverified recipe.</p>}
     {matches.length > displayed.length && (query || all) && <button className="gm-pill ghost" type="button"
       onClick={() => setLimit(n => n + 25)}>Show more ({displayed.length}/{matches.length})</button>}
   </div>
   {!query && <button type="button" className="gm-pill ghost" onClick={() => {setAll(x => !x);setLimit(25);}}>
     {all ? "Hide directory" : "Browse all " + TERRARIA_ITEM_INDEX.length + " item entries"}
   </button>}
 </section>;
}

type Priority = { stage: string; step: string; title: string; reason: string; requires?: string[] };
const PRIORITIES: Priority[] = [
 {stage:"first-day",step:"a3",title:"Build valid NPC houses",reason:"Prepare a home for early town NPCs and the Adventurer."},
 {stage:"first-day",step:"a4",title:"Set up crafting stations and lighting",reason:"Unlock smelting and basic equipment."},
 {stage:"first-day",step:"a6",title:"Get mobility and better starter gear",reason:"Survive long Briar drops and cave exploration."},
 {stage:"briar-adventurer",step:"a4",title:"Rescue the Adventurer from the Briar",reason:"Unlock Spirit Classic's main quest provider.",requires:["first-day:a4"]},
 {stage:"briar-adventurer",step:"a6",title:"Unlock the Quest Book",reason:"Access the mod's actual quest system.",requires:["briar-adventurer:a4"]},
 {stage:"first-adventure",step:"a2",title:"Activate The First Adventure",reason:"Quest progress only counts while it is active.",requires:["briar-adventurer:a6"]},
 {stage:"first-adventure",step:"a4",title:"Farm 3 Durasilk Sheaves",reason:"Get materials for your first Spirit armor set.",requires:["first-adventure:a2"]},
 {stage:"first-adventure",step:"a5",title:"Craft Wayfarer's Hat",reason:"Start your exploration armor set.",requires:["first-adventure:a4"]},
 {stage:"first-adventure",step:"a6",title:"Craft Wayfarer's Rucksack",reason:"Improve movement and survivability.",requires:["first-adventure:a4"]},
 {stage:"first-adventure",step:"a7",title:"Craft Wayfarer's Pants",reason:"Complete the Wayfarer set.",requires:["first-adventure:a4"]},
 {stage:"first-adventure",step:"a8",title:"Claim The First Adventure reward",reason:"Opens more NPC quests.",requires:["first-adventure:a5","first-adventure:a6","first-adventure:a7"]},
 {stage:"heart-cause",step:"a3",title:"Get a Life Crystal",reason:"Increase maximum health before bosses.",requires:["first-adventure:a8"]},
 {stage:"desert-scarabeus",step:"a3",title:"Obtain Scarab Idol",reason:"Prepare the first Spirit boss summon.",requires:["first-adventure:a8"]},
 {stage:"desert-scarabeus",step:"a5",title:"Defeat Scarabeus",reason:"Unlock Chitin equipment.",requires:["desert-scarabeus:a3"]},
 {stage:"eye-jelly",step:"a3",title:"Defeat Eye of Cthulhu",reason:"Opens the Jelly Deluge event.",requires:["first-adventure:a8"]},
 {stage:"evil-and-briar",step:"a3",title:"Beat the world evil boss",reason:"Open more combat and crafting progression.",requires:["eye-jelly:a3"]},
 {stage:"dungeon",step:"a3",title:"Defeat Skeletron",reason:"Unlock Dungeon NPC and loot.",requires:["evil-and-briar:a3"]},
 {stage:"tide-and-stars",step:"a3",title:"Start The Tide at the Ocean",reason:"Unlock Tide combat rewards and quests.",requires:["dungeon:a3"]},
 {stage:"hardmode-gate",step:"a5",title:"Defeat Wall of Flesh",reason:"Unlock Hardmode.",requires:["dungeon:a3"]},
 {stage:"hardmode-first",step:"a6",title:"Defeat Infernon",reason:"Earn powerful early Hardmode Spirit drops.",requires:["hardmode-gate:a5"]},
 {stage:"mechs-and-dusking",step:"a4",title:"Beat the Mechanical Bosses",reason:"Open Plantera progression.",requires:["hardmode-gate:a5"]},
 {stage:"jungle-temple",step:"a3",title:"Defeat Plantera",reason:"Obtain the Temple Key.",requires:["mechs-and-dusking:a2","mechs-and-dusking:a3","mechs-and-dusking:a4"]},
 {stage:"jungle-temple",step:"a6",title:"Defeat Golem",reason:"Access post-Golem progress.",requires:["jungle-temple:a3"]},
 {stage:"atlas",step:"a5",title:"Defeat Atlas",reason:"Complete Spirit's major boss progression.",requires:["jungle-temple:a6"]},
 {stage:"moon-lord",step:"a4",title:"Defeat Moon Lord",reason:"Finish the main playthrough.",requires:["atlas:a5"]},
];
export function TerrariaPriorities({game,prog,setCheck,onOpenStage}:{
 game:TerrariaGame;prog:GameProgress;setCheck:(key:string,v:boolean)=>void;onOpenStage:(id:string)=>void;
}) {
 const [expanded,setExpanded]=useState(false);
 const checked=(s:string,t:string)=>!!prog.checks[key(game.id,s,t)];
 const done=(p:Priority)=>checked(p.stage,p.step);
 const ready=(p:Priority)=>(p.requires??[]).every(x=>{const [s,t]=x.split(":");return checked(s,t);});
 const pending=PRIORITIES.filter(p=>!done(p));
 const available=pending.filter(ready);
 const chosen=available[0]??pending[0]??null;
 const s=chosen&&game.stages.find(stage=>stage.id===chosen.stage);
 const t=s?.steps.find(step=>step.id===chosen?.step);
 const count=PRIORITIES.length-pending.length;
 return <section className="gm-card gm-ter-priorities">
   <div className="gm-panel-label">🎯 Useful progression before chronological story</div>
   <h3 className="gm-h2">Do this next</h3>
   <p className="gm-note">{count}/{PRIORITIES.length} priorities checked. Focus on housing, mobility, the Quest Book, gear and survivability before major boss progression.</p>
   <div className="gm-bar thin" role="progressbar" aria-label="Priority progress"
     aria-valuemin={0} aria-valuemax={PRIORITIES.length} aria-valuenow={count}>
     <i style={{width:(count/PRIORITIES.length*100)+"%"}}/>
   </div>
   {chosen&&s&&t ? <div className="gm-ter-priority-focus">
     <div className="gm-panel-label">{ready(chosen)?"Recommended now":"Work toward"}</div>
     <h4>{chosen.title}</h4>
     <p className="gm-note">{chosen.reason}</p>
     <p>{t.label}</p>
     <TerrariaStepHelp stage={s} step={t}/>
     <label className="gm-item">
       <input type="checkbox" checked={false} onChange={e=>setCheck(key(game.id,chosen.stage,chosen.step),e.target.checked)}/>
       <span className="gm-box" aria-hidden="true"/>
       <span className="gm-txt"><span className="gm-name">Complete this milestone</span><span className="gm-sub">Updates the same checkbox in the chapter / quest tracker.</span></span>
     </label>
     <button type="button" className="gm-pill ghost" onClick={()=>onOpenStage(chosen.stage)}>Open this chapter</button>
   </div>:<p className="gm-note">✓ All priority milestones complete. Explore your remaining Spirit quests or boss challenges!</p>}
   <button type="button" className="gm-ter-fold-toggle" aria-expanded={expanded} onClick={()=>setExpanded(x=>!x)}>
     {expanded?"Hide full priority roadmap":"See all priority milestones"} <span aria-hidden="true">{expanded?"⌃":"⌄"}</span>
   </button>
   {expanded&&<div className="gm-ter-priority-list">
     {PRIORITIES.map(p=>{
       const stage=game.stages.find(s=>s.id===p.stage);
       const step=stage?.steps.find(t=>t.id===p.step);
       const complete=done(p);
       return <div className={"gm-ter-priority-row"+(complete?" done":"")} key={p.stage+":"+p.step}>
         <label className="gm-item">
           <input type="checkbox" checked={complete} onChange={e=>setCheck(key(game.id,p.stage,p.step),e.target.checked)}/>
           <span className="gm-box" aria-hidden="true"/>
           <span className="gm-txt"><span className="gm-name">{p.title}</span>
             <span className="gm-sub">{complete?"Completed":ready(p)?p.reason:"Earlier milestones needed"}</span></span>
         </label>
         {!complete&&stage&&step&&<TerrariaStepHelp stage={stage} step={step}/>}
       </div>;
     })}
   </div>}
   <p className="gm-note gm-ter-disclaimer">Recommended, not required order. Your Terraria world does not sync progress automatically. Quest Book objectives count in-game only while the quest is active.</p>
 </section>;
}
