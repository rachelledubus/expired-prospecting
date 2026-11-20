"use client";

import { useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import { WOW_HUNTER_BIS_SLOTS } from "@/lib/wow-hunter-bis";
import { wowExtraField } from "@/lib/wow-portal-extras";
import {
  FOREVER_PVE60_BIS, FOREVER_PVP60_TARGETS, FOREVER_ENDGAME_REVIEW_DATE,
  FOREVER_PVE_BIS_GUIDE, FOREVER_PVP_REWARDS_GUIDE, FOREVER_HUNTER_GEAR_PLANNER,
  type ForeverEndgameItem,
} from "@/lib/wow-hunter-endgame-bis";

type EndgameMode="pve60"|"pvp60";
type Props={
  gameId:string;level:number;faction:"horde"|"alliance";
  prog:GameProgress;setField:(key:string,value:string)=>void;mode:EndgameMode;
};
const note:React.CSSProperties={fontSize:13,lineHeight:1.5,opacity:.86};
const link:React.CSSProperties={fontSize:13};
const itemSource=(item:ForeverEndgameItem)=>"https://www.wowhead.com/forever/item="+item.itemId;
export default function WoWHunterEndgameBiS({gameId,level,faction,prog,setField,mode}:Props){
  const [hideOwned,setHideOwned]=useState(false);
  const [dualWield,setDualWield]=useState(false);
  const [query,setQuery]=useState("");
  const list=(mode==="pve60"?FOREVER_PVE60_BIS:FOREVER_PVP60_TARGETS)
    .filter(x=>!x.faction||x.faction===faction);
  const mark=(item:ForeverEndgameItem)=>wowExtraField(gameId,"bis-owned-item-"+item.itemId);
  const isOwned=(item:ForeverEndgameItem)=>prog.fields[mark(item)]==="yes";
  const activeSlots=WOW_HUNTER_BIS_SLOTS.filter(([slot])=>slot!=="offhand"||dualWield);
  const completed=activeSlots.filter(([slot])=>list.some(item=>item.slot===slot&&isOwned(item))).length;
  const viewIsPvp=mode==="pvp60";
  const sourceGuide=viewIsPvp?FOREVER_PVP_REWARDS_GUIDE:FOREVER_PVE_BIS_GUIDE;
  return <section className="gm-card" aria-label={viewIsPvp?"Level 60 Hunter PvP gear":"Level 60 pre-raid Beast Mastery gear"} style={{padding:16,marginTop:12}}>
    <div className="gm-panel-label">Hunter · {viewIsPvp?"PvP gear targets":"Level 60 pre-raid Beast Mastery"} · {faction==="horde"?"Horde":"Alliance"}</div>
    <h3 style={{margin:"7px 0"}}>{viewIsPvp?"Level 60 PvP loadout":"Level 60 PvE BiS — pre-raid"}</h3>
    <p style={note}>
      {viewIsPvp
        ?"PvP choices emphasize stamina, agility, ranged pressure and control. These are source-checked targets, not a proven single best PvP simulation; battleground roles and set bonuses may change the best combination."
        :"Slot picks follow Wowhead Forever's Nov 19 Beast Mastery guide, with corrected faction rewards. This is the obtainable/pre-raid goal, not a raid-loot list. Raid BiS will need a separate update once raid gear is available."}
      {" "}Reviewed {FOREVER_ENDGAME_REVIEW_DATE}. Your Hunter is level {level}; these are long-term level-60 goals, and some quests or items can be pursued earlier.
    </p>
    {viewIsPvp&&<div style={{border:"1px solid var(--border,#ddd)",padding:12,borderRadius:10,margin:"10px 0"}}>
      <b style={{fontSize:14}}>PvP progression in Forever</b>
      <p style={{...note,margin:"5px 0"}}>Buy rare honor armor without a rank requirement. Upgrade armor with earned rank seals: rank 8 wrists/waist, 9 feet, 10 hands, 12 shoulders/legs, 13 head/chest. Rank 14 unlocks epic PvP weapons. All rank rewards depend on season caps.</p>
      <p style={{...note,margin:"5px 0"}}>At level 60, Wizzik Dustfizz in Gadgetzan (/way Tanaris 51.8 27.2) offers PvP Season's Journey quests that award Honor Points and Rank Points.</p>
      <a href={FOREVER_PVP_REWARDS_GUIDE} target="_blank" rel="noopener noreferrer" style={link}>Wowhead Forever honor/rank guide ↗</a>
    </div>}
    <p style={{...note,fontWeight:700,margin:"8px 0"}}>{completed}/{activeSlots.length} planned equipment positions marked obtained{dualWield?" · dual-wield view":" · two-handed view"}.</p>
    <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center",marginBottom:12}}>
      <label style={note}><input type="checkbox" checked={hideOwned} onChange={e=>setHideOwned(e.target.checked)}/> Hide obtained</label>
      <label style={note}><input type="checkbox" checked={dualWield} onChange={e=>setDualWield(e.target.checked)}/> Show optional off-hand (dual-wield)</label>
      <input type="search" value={query} onChange={e=>setQuery(e.target.value)} aria-label="Filter endgame gear by item or location"
        placeholder="Find a dungeon, quest, item…" style={{background:"var(--panel,#fff)",color:"var(--text,#222)",border:"1px solid var(--border,#bbb)",borderRadius:8,padding:"9px 10px",maxWidth:"100%",flex:"1 1 195px"}}/>
    </div>
    <div style={{display:"grid",gap:9}}>
      {activeSlots.map(([slot,slotLabel])=>{
        const options=list.filter(item=>item.slot===slot&&
          (!query.trim()||(item.name+" "+item.where+" "+item.how).toLowerCase().includes(query.trim().toLowerCase())));
        const shown=options.filter(item=>!hideOwned||!isOwned(item));
        if(!options.length&&query.trim())return null;
        return <article key={slot} style={{border:"1px solid var(--border,#ddd)",borderRadius:10,padding:12}}>
          <strong style={{fontSize:15}}>{slotLabel}</strong>
          {slot==="melee"&&<p style={{...note,margin:"4px 0"}}>A two-handed melee weapon occupies both hand slots. Do not farm an off-hand unless you change to dual-wield.</p>}
          {!options.length&&<p style={note}>No source-checked target for this slot yet.</p>}
          {!!options.length&&!shown.length&&<p style={note}>All matching targets marked obtained. Disable “Hide obtained” to see them.</p>}
          {shown.map(item=><div key={item.itemId} style={{borderTop:"1px solid var(--border,#ddd)",marginTop:9,paddingTop:9}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
              <div style={{flex:"1 1 220px",minWidth:0}}>
                <p style={{...note,fontWeight:650,margin:"0 0 3px"}}>
                  {viewIsPvp?"PvP gear candidate":item.kind==="bis"?"Wowhead PvE BiS choice":"Practical alternative"}
                  {item.kind==="conditional"?" · conditional":""}
                </p>
                <strong style={{fontSize:15}}>{item.name}</strong>
                <p style={{...note,margin:"5px 0"}}><b>Where:</b> {item.where}</p>
                <p style={{...note,margin:"5px 0"}}><b>How:</b> {item.how}</p>
                {item.note&&<p style={{...note,margin:"5px 0"}}>{item.note}</p>}
                {item.warning&&<p style={{...note,margin:"5px 0"}}><b>Check restriction:</b> {item.warning}</p>}
                <a href={itemSource(item)} target="_blank" rel="noopener noreferrer" style={link}>Exact Wowhead Forever item ↗</a>
              </div>
              <label style={note}><input type="checkbox" checked={isOwned(item)}
                onChange={e=>setField(mark(item),e.target.checked?"yes":"")}/> I have it</label>
            </div>
          </div>)}
        </article>;
      })}
    </div>
    <p style={{...note,marginTop:12}}>All item links open the Forever database, not Classic. Loot and vendor stock are not checked live. Some quest rewards are exclusive choices, and some items require profession eligibility or reputation. Future raid gear is intentionally not presented as currently obtainable.</p>
    <div style={{display:"flex",gap:14,flexWrap:"wrap",marginTop:8}}>
      <a href={sourceGuide} target="_blank" rel="noopener noreferrer" style={link}>{viewIsPvp?"Forever PvP ranking and rewards":"Forever Beast Mastery BiS rankings"} ↗</a>
      <a href={FOREVER_HUNTER_GEAR_PLANNER} target="_blank" rel="noopener noreferrer" style={link}>Wowhead Hunter gear planner ↗</a>
    </div>
  </section>;
}
