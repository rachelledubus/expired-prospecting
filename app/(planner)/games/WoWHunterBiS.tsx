"use client";

import { useState } from "react";
import WoWHunterEndgameBiS from "./WoWHunterEndgameBiS";
import type { GameProgress } from "@/lib/games-data";
import { dungeonLootOwnedKey } from "@/lib/wow-forever-dungeon-gear";
import {
  WOW_HUNTER_BIS_LEADS,WOW_HUNTER_BIS_REVIEW_DATE,WOW_HUNTER_BIS_SLOTS,
  type HunterBisLead
} from "@/lib/wow-hunter-bis";
import { wowExtraField } from "@/lib/wow-portal-extras";

type Props={
  gameId:string;level:number;faction:"horde"|"alliance";prog:GameProgress;
  setCheck:(key:string,value:boolean)=>void;
  setField:(key:string,value:string)=>void;
};
const hint:React.CSSProperties={fontSize:13,lineHeight:1.55,opacity:.85};
const title:React.CSSProperties={fontSize:15,fontWeight:700};

export default function WoWHunterBiS({gameId,level,faction,prog,setCheck,setField}:Props){
  const [bisMode,setBisMode]=useState<"leveling"|"pve60"|"pvp60">(level>=60?"pve60":"leveling");
  const [hideOwned,setHideOwned]=useState(false);
  const [showFuture,setShowFuture]=useState(true);
  const ownedKey=(x:HunterBisLead)=>x.dungeonId&&x.targetId
    ?dungeonLootOwnedKey(gameId,x.dungeonId,x.targetId):"";
  const owned=(x:HunterBisLead)=>x.dungeonId&&x.targetId
    ?!!prog.checks[ownedKey(x)]:
    prog.fields[wowExtraField(gameId,"bis-owned-"+x.id)]==="yes";
  const setOwned=(x:HunterBisLead,next:boolean)=>{
    if(x.dungeonId&&x.targetId)setCheck(ownedKey(x),next);
    else setField(wowExtraField(gameId,"bis-owned-"+x.id),next?"yes":"");
  };
  const factionLeads=WOW_HUNTER_BIS_LEADS.filter(x=>!x.faction||x.faction===faction);
  const currentSlots=WOW_HUNTER_BIS_SLOTS.filter(([slot])=>
    factionLeads.some(x=>x.slot===slot&&x.recommendedLevel<=level));
  const doneSlots=currentSlots.filter(([slot])=>factionLeads
    .filter(x=>x.slot===slot&&x.recommendedLevel<=level).some(owned));
  const Item=({item}:{item:HunterBisLead})=>{
    const has=owned(item);
    const isReady=level>=item.recommendedLevel;
    return <div style={{padding:"10px 0",borderBottom:"1px solid var(--border,#ddd)"}}>
      <div style={{display:"flex",alignItems:"start",justifyContent:"space-between",gap:9,flexWrap:"wrap"}}>
        <div style={{flex:"1 1 200px",minWidth:0}}>
          <div style={{fontSize:12,fontWeight:700}}>
            {item.tier==="leveling-bis-candidate"?"★ Ranked BiS contender":"Practical leveling option"}
            {" · "}{item.evidence==="game-client"?"Recipe in Forever client":
              item.evidence==="forever-item"?"Forever item/source":"Classic-source lead; verify"}
          </div>
          <b>{item.name}</b>
          <p style={{...hint,margin:"4px 0"}}><b>Pursue:</b> level {item.recommendedLevel} 
            {" · "}<b>Equip:</b> level {item.minEquipLevel}
            {" · "}{has?"Obtained":isReady?"Ready to pursue":"Upcoming"}</p>
          <p style={{...hint,margin:"4px 0"}}><b>Where:</b> {item.location}</p>
          <p style={{...hint,margin:"4px 0"}}><b>How:</b> {item.source}</p>
        </div>
        <label style={{fontSize:12,display:"inline-flex",gap:6,alignItems:"center"}}>
          <input type="checkbox" checked={has} onChange={e=>setOwned(item,e.target.checked)}/>
          I have this
        </label>
      </div>
      <details style={{marginTop:5}}>
        <summary style={{cursor:"pointer",fontSize:12,fontWeight:600}}>Notes and verification</summary>
        <p style={{...hint,margin:"6px 0"}}>{item.note}</p>
      </details>
      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:12}}>
        Verify item / acquisition source ↗
      </a>
    </div>;
  };
  return <>
    <nav aria-label="Hunter BiS gear modes" className="gm-card" style={{padding:12,marginTop:12}}>
      <div className="gm-panel-label">Beast Mastery · Gear planning</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>
        {([
          ["leveling","Leveling BiS"],
          ["pve60","Level 60 PvE BiS"],
          ["pvp60","Level 60 PvP BiS"]
        ] as const).map(([id,label])=><button key={id} type="button"
          className={"gm-chip"+(bisMode===id?" on":"")}
          aria-pressed={bisMode===id}
          onClick={()=>setBisMode(id)}>{label}</button>)}
      </div>
    </nav>
    {bisMode==="leveling" && <section className="gm-card" style={{padding:16,marginTop:12}}
    aria-label="Every Hunter gear slot and leveling BiS candidate">
    <div className="gm-panel-label">Beast Mastery Hunter · Gear by slot · level {level}</div>
    <h3 style={{margin:"6px 0"}}>★ BiS and practical upgrades — every equipment slot</h3>
    <p style={hint}>All <b>{WOW_HUNTER_BIS_SLOTS.length}</b> combat equipment positions are tracked, including two rings and two trinkets.
      These are <b>leveling contenders</b>, not guaranteed absolute BiS, since some Forever drops are unconfirmed.
      The current set is researched around level 40; future upgrades appear when documented.</p>
    <p style={{...hint,fontWeight:650,margin:"8px 0"}}>
      {doneSlots.length}/{currentSlots.length} current slots have a tracked item marked obtained.
    </p>
    <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap",margin:"8px 0 14px"}}>
      <label style={{...hint,display:"inline-flex",gap:6,alignItems:"center"}}>
        <input type="checkbox" checked={hideOwned} onChange={e=>setHideOwned(e.target.checked)}/>
        Hide obtained items
      </label>
      <label style={{...hint,display:"inline-flex",gap:6,alignItems:"center"}}>
        <input type="checkbox" checked={showFuture} onChange={e=>setShowFuture(e.target.checked)}/>
        Show upcoming upgrades
      </label>
    </div>
    <div style={{display:"grid",gap:10}}>
      {WOW_HUNTER_BIS_SLOTS.map(([slot,label])=>{
        const options=factionLeads.filter(x=>x.slot===slot).sort((a,b)=>a.recommendedLevel-b.recommendedLevel);
        const now=options.filter(x=>x.recommendedLevel<=level);
        const future=options.filter(x=>x.recommendedLevel>level);
        const current=now.length?[now[now.length-1]]:future.length?[future[0]]:[];
        const allItems=[...current,...(showFuture?future.filter(x=>!current.includes(x)):[])].filter(x=>!hideOwned||!owned(x));
        const isOffhand=slot==="offhand";
        return <article key={slot} style={{border:"1px solid var(--border,#ddd)",borderRadius:10,padding:12}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"baseline",flexWrap:"wrap"}}>
            <b style={title}>{label}</b>
            <span style={{...hint,fontSize:12}}>{now.length?"Level "+now[now.length-1].recommendedLevel+" target":future.length?"Available later":"Not yet verified"}</span>
          </div>
          {isOffhand&&<p style={{...hint,margin:"5px 0"}}>
            A <b>two-handed weapon fills this slot</b>. Only use an off-hand target if you equip one-handed weapons.</p>}
          {!options.length&&<p style={hint}>No reliable {faction==="horde"?"Horde":"Alliance"} target documented yet. Check the source database before spending gold.</p>}
          {!!options.length&&!allItems.length&&<p style={hint}>No unowned target to show. Uncheck Hide obtained to review the previous recommendation.</p>}
          {allItems.map(item=><Item key={item.id} item={item}/>)}
          {!!now.length&&now.length>1&&<details style={{marginTop:8}}>
            <summary style={{fontSize:12,cursor:"pointer"}}>Other previous leveling targets ({now.length-1})</summary>
            {now.slice(0,-1).filter(x=>!hideOwned||!owned(x)).map(item=><Item key={item.id} item={item}/>)}
          </details>}
        </article>;
      })}
    </div>
    <p style={{...hint,marginTop:12}}>
      Research reviewed {WOW_HUNTER_BIS_REVIEW_DATE}. Recommended farming levels are planning advice, not entry requirements.
      Classic-era boss/reputation data must be rechecked in Forever. Cosmetic shirt/tabard slots have no meaningful DPS BiS.
      This guide cannot compare against your live equipment automatically.
    </p>
    <p style={{...hint,marginTop:8}}>
      <a href="https://theforeverera.com/en/bis/hunter/beast-mastery/40/" target="_blank" rel="noopener noreferrer">
        View the source-ranked Beast Mastery level-40 slot chart ↗
      </a>
    </p>
  </section>}
    {bisMode!=="leveling" && <WoWHunterEndgameBiS gameId={gameId} level={level}
      faction={faction} prog={prog} setField={setField} mode={bisMode}/>}
  </>;
}
