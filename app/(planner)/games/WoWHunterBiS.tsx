"use client";

import { useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import { dungeonLootOwnedKey } from "@/lib/wow-forever-dungeon-gear";
import { WOW_HUNTER_BIS_LEADS, WOW_HUNTER_BIS_REVIEW_DATE, type HunterBisLead } from "@/lib/wow-hunter-bis";
import { wowExtraField } from "@/lib/wow-portal-extras";

type Props={
  gameId:string;level:number;prog:GameProgress;
  setCheck:(key:string,value:boolean)=>void;
  setField:(key:string,value:string)=>void;
};
const note:React.CSSProperties={fontSize:13,lineHeight:1.5,opacity:.86};
const slotName:Record<HunterBisLead["slot"],string>={
  ranged:"Ranged weapon",melee:"Melee stat stick",head:"Head",shoulders:"Shoulders",
  chest:"Chest",hands:"Hands",wrist:"Wrist",legs:"Legs",back:"Cloak",
  feet:"Boots",ring:"Ring",neck:"Neck",waist:"Belt"
};

export default function WoWHunterBiS({gameId,level,prog,setCheck,setField}:Props){
  const [hideOwned,setHideOwned]=useState(false);
  const ownedKey=(x:HunterBisLead)=>x.dungeonId&&x.targetId
    ?dungeonLootOwnedKey(gameId,x.dungeonId,x.targetId):"";
  const owned=(x:HunterBisLead)=>x.dungeonId&&x.targetId
    ?!!prog.checks[ownedKey(x)]:
    prog.fields[wowExtraField(gameId,"bis-owned-"+x.id)]==="yes";
  const setOwned=(x:HunterBisLead,next:boolean)=>{
    if(x.dungeonId&&x.targetId)setCheck(ownedKey(x),next);
    else setField(wowExtraField(gameId,"bis-owned-"+x.id),next?"yes":"");
  };
  const sorted=[...WOW_HUNTER_BIS_LEADS].sort((a,b)=>{
    const aState=a.recommendedLevel>level?1:0,bState=b.recommendedLevel>level?1:0;
    return aState-bState||Math.abs(a.recommendedLevel-level)-Math.abs(b.recommendedLevel-level)
      ||(a.slot==="ranged"?-1:b.slot==="ranged"?1:0);
  });
  const visible=hideOwned?sorted.filter(x=>!owned(x)):sorted;
  return <section className="gm-card" style={{padding:16,marginTop:12}}
    aria-label="Hunter best-in-slot leveling gear">
    <div className="gm-panel-label">Hunter gear goals · Beast Mastery · level {level}</div>
    <h3 style={{margin:"6px 0"}}>★ Leveling BiS contenders and where to get them</h3>
    <p style={note}><b>BiS contender</b> means a strong leveling candidate, not proven absolute best in slot.
      This list is not a complete raid/pre-raid BiS chart. Compare your actual game tooltips before replacing an equipped piece.</p>
    <label style={{display:"inline-flex",alignItems:"center",gap:8,...note,margin:"8px 0 12px"}}>
      <input type="checkbox" checked={hideOwned} onChange={e=>setHideOwned(e.target.checked)}/>
      Hide items marked obtained
    </label>
    {visible.length===0&&<p style={note}>All currently listed targets are marked obtained. Uncheck the filter to review them.</p>}
    <div style={{display:"grid",gap:10}}>
      {visible.map(item=>{
        const isReady=level>=item.recommendedLevel;
        const has=owned(item);
        return <article key={item.id} style={{padding:12,border:"1px solid var(--border,#ddd)",borderRadius:10}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap",alignItems:"start"}}>
            <div style={{minWidth:0,flex:"1 1 210px"}}>
              <div style={{fontSize:12,fontWeight:700,marginBottom:5}}>
                {item.tier==="leveling-bis-candidate"?"★ Leveling BiS contender":"Strong leveling option"}
                {" · "}{slotName[item.slot]}
              </div>
              <strong>{item.name}</strong>
              <p style={{...note,margin:"5px 0"}}>
                <b>Recommended to pursue:</b> level {item.recommendedLevel}
                {" · "}<b>Equip:</b> level {item.minEquipLevel}
              </p>
              <p style={{...note,margin:"5px 0"}}>
                <b>Where:</b> {item.location}
                {" · "}<b>How:</b> {item.source} ({item.method})
              </p>
            </div>
            <span style={{fontWeight:650,fontSize:12}}>
              {has?"Obtained":isReady?"Ready to pursue":"At level "+item.recommendedLevel}
            </span>
          </div>
          <p style={{...note,margin:"6px 0"}}>{item.note}</p>
          <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:12}}>
            <label style={{display:"inline-flex",alignItems:"center",gap:7,fontSize:13}}>
              <input type="checkbox" checked={has} onChange={e=>setOwned(item,e.target.checked)}/>
              I have this item
            </label>
            <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:13}}>
              Check Forever item and source ↗
            </a>
          </div>
        </article>;
      })}
    </div>
    <p style={{...note,marginTop:12}}>
      Source review: {WOW_HUNTER_BIS_REVIEW_DATE}. Farming levels are recommendations, not instance entry requirements.
      Exact BiS varies with specialization, equipped weapon DPS, item stats, and future loot updates.
    </p>
  </section>;
}
