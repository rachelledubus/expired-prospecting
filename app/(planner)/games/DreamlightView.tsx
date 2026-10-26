"use client";

import { useState } from "react";
import { questKey, type GameProgress } from "@/lib/games-data";
import type { DreamlightGame, DreamlightStage, DreamlightSection, DreamlightArea } from "@/lib/dreamlight-data";

type Props = {
 game: DreamlightGame;
 prog: GameProgress;
 setCheck: (key: string, checked: boolean) => void;
 setField: (key: string, value: string) => void;
};
type DisplaySection = "story" | "realms" | "friends" | "projects" | "collections" | "dlc";
const SECTIONS: { id: DisplaySection; label: string }[] = [
 { id: "story", label: "📖 Main story" },
 { id: "realms", label: "🏰 Realms" },
 { id: "friends", label: "💕 Friendships" },
 { id: "projects", label: "🌿 Projects" },
 { id: "collections", label: "✨ Collections" },
 { id: "dlc", label: "🗺 Expansions" },
];
const PACKS: { id: Exclude<DreamlightArea,"valley">; label: string; descriptor: string }[] = [
 { id: "rift", label: "A Rift in Time", descriptor: "Eternity Isle" },
 { id: "storybook", label: "The Storybook Vale", descriptor: "The Bind, Mythopia & Everafter" },
 { id: "ranch", label: "Wishblossom Ranch", descriptor: "Wishblossom Mountains & horses" },
 { id: "honeyglow", label: "Honeyglow Woods", descriptor: "Winnie the Pooh adventure" },
];
const keyFor = (gameId: string, stageId: string, stepId: string) =>
 questKey(gameId, "dreamlight-" + stageId, stepId);

function Progress({ done, total }: {done:number;total:number}) {
 const p=total?Math.round(100*done/total):0;
 return <div style={{ margin:"8px 0 14px" }}>
   <div className="gm-note">{done} / {total} actions completed · {p}%</div>
   <div role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total}
     aria-label="Section progress" style={{height:7,borderRadius:10,background:"rgba(128,128,128,.2)",overflow:"hidden"}}>
     <div style={{height:"100%",width:p+"%",background:"var(--accent,#b5a0ca)",borderRadius:10}} />
   </div>
 </div>;
}

export default function DreamlightView({game,prog,setCheck,setField}:Props) {
 const [section,setSection]=useState<DisplaySection>("story");
 const [pack,setPack]=useState<Exclude<DreamlightArea,"valley">>("rift");
 const [manualStage,setManualStage]=useState("");
 const [showFuture,setShowFuture]=useState(false);

 const owned=(id:string)=>prog.fields[game.id+"|owned|"+id]==="yes";
 const ownedKey=(id:string)=>game.id+"|owned|"+id;
 const completed=(stage:DreamlightStage)=>stage.steps.filter(step=>!!prog.checks[keyFor(game.id,stage.id,step.id)]);
 const incomplete=(stage:DreamlightStage)=>stage.steps.filter(step=>!prog.checks[keyFor(game.id,stage.id,step.id)]);
 const done=(stage:DreamlightStage)=>incomplete(stage).length===0;

 const available=game.stages.filter(stage=>
   section==="dlc"
     ? stage.section==="dlc" && stage.area===pack
     : stage.section===section && stage.area==="valley"
 );
 const recommend=available.find(stage=>!done(stage))??available[0];
 const focus=available.find(stage=>stage.id===manualStage)??recommend;
 const amount=available.reduce((n,s)=>n+completed(s).length,0);
 const total=available.reduce((n,s)=>n+s.steps.length,0);
 const changeSection=(next:DisplaySection)=>{setSection(next);setManualStage("");setShowFuture(false)};
 const changePack=(next:typeof pack)=>{setPack(next);setManualStage("");setShowFuture(false)};
 const activePack=PACKS.find(p=>p.id===pack)!;
 const hasPack=section!=="dlc"||owned(pack);

 return <div style={{marginTop:14}}>
   <div className="gm-card" style={{padding:16}}>
     <div className="gm-panel-label">✨ Disney Dreamlight Valley</div>
     <p className="gm-note">Your own story journal, not another giant to-do list. Choose what you feel like doing; only the next step is visible by default. Your saved checkmarks are separate from Stardew and Terraria.</p>
     <div className="gm-chips" role="group" aria-label="Dreamlight Valley guide section" style={{marginTop:12}}>
       {SECTIONS.map(item=><button key={item.id} type="button"
         className={"gm-chip"+(section===item.id?" on":"")}
         aria-pressed={section===item.id} onClick={()=>changeSection(item.id)}>{item.label}</button>)}
     </div>
   </div>

   {section==="dlc" && <section className="gm-card" style={{padding:16,marginTop:12}}>
     <div className="gm-panel-label">Expansion library · optional</div>
     <p className="gm-note">Only mark packs you own. Unowned content will not be suggested as something you can play.</p>
     <label className="gm-note">Choose an expansion
       <select className="gm-input gm-sel" style={{display:"block",width:"100%",marginTop:6}}
         value={pack} onChange={e=>changePack(e.target.value as typeof pack)}>
         {PACKS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
       </select>
     </label>
     <label className="gm-item" style={{marginTop:10}}>
       <input type="checkbox" checked={owned(pack)}
         onChange={e=>setField(ownedKey(pack),e.target.checked?"yes":"")} />
       <span className="gm-box" aria-hidden="true" />
       <span className="gm-txt">
         <span className="gm-name">I own {activePack.label}</span>
         <span className="gm-sub">{activePack.descriptor}</span>
       </span>
     </label>
     {!owned(pack) && <p className="gm-note">This expansion's story is hidden until you mark it as owned.</p>}
     <details style={{marginTop:8}}>
       <summary className="gm-note" style={{cursor:"pointer"}}>Coming soon · The Keepsake Sea</summary>
       <p className="gm-note">Announced for November 18, 2026. Its quests are not playable yet, so they are excluded from this checklist.</p>
     </details>
   </section>}

   {hasPack&&focus&&<>
     <section className="gm-card" style={{padding:16,marginTop:12}}>
       <div className="gm-panel-label">Your next chapter</div>
       <Progress done={amount} total={total} />
       <label className="gm-note">Jump to a storyline or review one you've completed
         <select className="gm-input gm-sel" value={focus.id} onChange={e=>setManualStage(e.target.value)}
           style={{display:"block",width:"100%",marginTop:6}}>
           {available.map(stage=><option key={stage.id} value={stage.id}>{done(stage)?"✓ ":""}{stage.title}</option>)}
         </select>
       </label>
       {manualStage&&manualStage!==recommend?.id&&<button type="button" className="gm-pill"
         style={{marginTop:10}} onClick={()=>setManualStage("")}>Return to recommended chapter</button>}
     </section>

     <section className="gm-card" style={{padding:16,marginTop:12}}>
       <div className="gm-panel-label">{done(focus)?"Completed chapter":"Do this next"}</div>
       <h3 style={{margin:"8px 0"}}>{focus.title}</h3>
       <p className="gm-note">{focus.summary}</p>
       <Progress done={completed(focus).length} total={focus.steps.length} />
       {incomplete(focus).slice(0,1).map(step=><label key={step.id} className="gm-item">
         <input type="checkbox" checked={false} onChange={e=>setCheck(keyFor(game.id,focus.id,step.id),e.target.checked)} />
         <span className="gm-box" aria-hidden="true" />
         <span className="gm-txt"><span className="gm-name">{step.label}</span>{step.how&&<span className="gm-sub">{step.how}</span>}</span>
       </label>)}
       {incomplete(focus).length>1&&<details style={{marginTop:9}}>
         <summary className="gm-note" style={{cursor:"pointer"}}>Upcoming actions · {incomplete(focus).length-1}</summary>
         {incomplete(focus).slice(1).map(step=><label key={step.id} className="gm-item">
           <input type="checkbox" checked={false} onChange={e=>setCheck(keyFor(game.id,focus.id,step.id),e.target.checked)} />
           <span className="gm-box" aria-hidden="true" />
           <span className="gm-txt"><span className="gm-name">{step.label}</span>{step.how&&<span className="gm-sub">{step.how}</span>}</span>
         </label>)}
       </details>}
       {completed(focus).length>0&&<details style={{marginTop:9}}>
         <summary className="gm-note" style={{cursor:"pointer"}}>Completed actions · {completed(focus).length}</summary>
         {completed(focus).map(step=><label key={step.id} className="gm-item">
           <input type="checkbox" checked onChange={e=>setCheck(keyFor(game.id,focus.id,step.id),e.target.checked)} />
           <span className="gm-box" aria-hidden="true" />
           <span className="gm-txt"><span className="gm-name">{step.label}</span></span>
         </label>)}
       </details>}
       <p className="gm-note" style={{marginTop:12}}>
         <a href={focus.source} target="_blank" rel="noopener noreferrer">Quest reference / detailed walkthrough ↗</a>
       </p>
     </section>

     <details className="gm-card" style={{padding:16,marginTop:12}} open={showFuture}
       onToggle={e=>setShowFuture(e.currentTarget.open)}>
       <summary style={{cursor:"pointer",fontWeight:700}}>All {section==="dlc"?activePack.label:"section"} chapters · {available.filter(done).length}/{available.length} complete</summary>
       {available.map(stage=><div key={stage.id} style={{padding:"10px 0",borderBottom:"1px solid rgba(128,128,128,.15)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
         <div><b>{done(stage)?"✓ ":""}{stage.title}</b><div className="gm-note">{completed(stage).length}/{stage.steps.length} actions</div></div>
         <button type="button" className="gm-pill" onClick={()=>{setManualStage(stage.id);setShowFuture(false)}}>{done(stage)?"Review":"Open"}</button>
       </div>)}
     </details>
   </>}
 </div>;
}
