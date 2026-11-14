"use client";

import { useMemo, useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import {
  WOW_RECIPES, WOW_PROFESSIONS, professionField,
  recipeHiddenKey, recipeLearnedKey, recipeStatus,
  type WowProfessionId, type WowRecipe
} from "@/lib/wow-forever-professions";
import { materialRoutes, type MaterialRoute } from "@/lib/wow-material-farms";
import { externalMaterialLookup } from "@/lib/wow-material-farms";
import { wowheadForeverItemUrl } from "@/lib/wowhead-forever-items";
import { grayMobThreshold, wowExtraField, wowMaterialKey } from "@/lib/wow-portal-extras";

type Props = {
  gameId:string;level:number;faction:"horde"|"alliance";prog:GameProgress;
  setField:(key:string,value:string)=>void;onFindMaterial:(name:string)=>void;
  onOpenProfessions:()=>void;
};
const note:React.CSSProperties={fontSize:13,lineHeight:1.5,opacity:.86};
const fieldStyle:React.CSSProperties={display:"block",width:"100%",minHeight:44,minWidth:0,
  background:"var(--panel,#fff)",color:"var(--text,#222)",border:"1px solid var(--border,#ccc)",
  borderRadius:9,padding:"9px 11px",font:"inherit"};
const num=(raw:string|undefined):number|null=>{
  if(raw===undefined||raw==="")return null;
  const parsed=Number(raw);
  return Number.isFinite(parsed)&&parsed>=0?parsed:null;
};
const colorRank=(r:WowRecipe,skill:number):number=>
  ({orange:0,yellow:1,chance:2,green:3,locked:6,gray:7})[recipeStatus(r,skill)];
const typeLabel:Record<MaterialRoute["method"],string>={
  vendor:"Check supplier",crafting:"Craft it",skinning:"Skin creatures",mob:"Loot enemy",
  dungeon:"Dungeon loot",mining:"Mine ore",herbalism:"Gather herb"
};
const bestRoute=(item:string,faction:"horde"|"alliance",cutoff:number,requireNoXp:boolean,isLearned:(r:WowRecipe)=>boolean)=>
  materialRoutes(item,faction)
    .filter(r=>r.method!=="mining"&&r.method!=="herbalism")
    .filter(r=>r.method!=="crafting"||WOW_RECIPES.some(rec=>r.id==="craft-"+rec.id&&isLearned(rec)))
    .map(route=>{
      const nonCombat=route.method==="vendor"||route.method==="crafting";
      const grayKnown=route.maxMob!==undefined&&route.maxMob<=cutoff;
      const xpRisk=route.minMob!==undefined&&route.minMob>cutoff;
      const uncertainCombat=!nonCombat&&!grayKnown;
      const score=(nonCombat?95:grayKnown?65:xpRisk?-60:0)+
        (route.evidence==="forever-reported"?5:0)+(route.waypoint?2:0)+
        (route.method==="vendor"?4:0);
      return {route,score,nonCombat,grayKnown,uncertainCombat};
    })
    .filter(x=>!requireNoXp||x.nonCombat||x.grayKnown)
    .sort((a,b)=>b.score-a.score)[0];

export default function WoWProfessionRun({gameId,level,faction,prog,setField,onFindMaterial,onOpenProfessions}:Props){
  const [copyText,setCopyText]=useState("");
  const field=(key:string)=>wowExtraField(gameId,key);
  const profession=prog.fields[field("session-profession")]??"leatherworking";
  const skillRaw=prog.fields[professionField(gameId,"skill-"+profession)];
  const skill=skillRaw===undefined?(WOW_PROFESSIONS.find(x=>x.id===profession)?.initial??0):Math.max(0,Number(skillRaw)||0);
  const storedBatch=num(prog.fields[field("session-craft-count")]);
  const count=Math.max(1,Math.min(50,Math.floor(storedBatch??1)));
  const requireNoXp=prog.fields[field("session-no-xp")]!=="false";
  const isLearned=(r:WowRecipe)=>!!prog.checks[recipeLearnedKey(gameId,r.id)];
  const known=useMemo(()=>WOW_RECIPES.filter(r=>r.profession===profession&&
    !!prog.checks[recipeLearnedKey(gameId,r.id)]&&!prog.checks[recipeHiddenKey(gameId,r.id)]&&
    !["gray","locked"].includes(recipeStatus(r,skill)))
    .sort((a,b)=>colorRank(a,skill)-colorRank(b,skill)||
      a.reagents.reduce((n,x)=>n+x.quantity,0)-b.reagents.reduce((n,x)=>n+x.quantity,0)||
      a.name.localeCompare(b.name)),[profession,skill,prog.checks,gameId]);
  const chosen=known.find(r=>r.id===prog.fields[field("session-recipe")])??known[0];
  const materials=chosen?.reagents.map(m=>{
    const stockKey=field("stock-"+wowMaterialKey(m.name));
    const raw=prog.fields[stockKey];
    const have=num(raw);
    const needed=m.quantity*count;
    const missing=have===null?null:Math.max(0,needed-have);
    return {...m,stockKey,raw:raw??"",have,needed,missing,
      route:bestRoute(m.name,faction,grayMobThreshold(level),requireNoXp,isLearned)};
  })??[];
  const missingFirst=materials.find(m=>m.missing!==null&&m.missing>0)??materials.find(m=>m.have===null);
  const availableAll=materials.length>0&&materials.every(m=>m.have!==null&&m.missing===0);
  const unknownCount=materials.filter(m=>m.have===null).length;
  const missingCount=materials.filter(m=>m.missing!==null&&m.missing>0).length;
  const openMaterial=(name:string)=>{
    setField(field("session-material"),name);
    onFindMaterial(name);
  };
  const copy=(value:string)=>{
    void navigator.clipboard.writeText(value).then(()=>setCopyText("Waypoint copied. Paste in-game using TomTom."))
      .catch(()=>setCopyText("Copy unavailable; select the waypoint text manually."));
  };
  return <div className="gm-wow-session-focus" aria-label="Profession craft run planner">
    <h4>Plan my next skill-up</h4>
    <p style={note}>Choose a recipe you actually know. The ingredient plan updates using your entered inventory; it cannot read your in-game bags.</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,170px),1fr))",gap:9}}>
      <label style={note}>Profession
        <select style={fieldStyle} value={profession}
          onChange={e=>setField(field("session-profession"),e.target.value)}>
          {WOW_PROFESSIONS.filter(p=>p.id!=="skinning").map(p=><option value={p.id} key={p.id}>{p.label} · skill {
            num(prog.fields[professionField(gameId,"skill-"+p.id)])??p.initial}</option>)}
        </select>
      </label>
      <label style={note}>Craft this many
        <input style={fieldStyle} type="number" min={1} max={50} step={1} value={count}
          onChange={e=>setField(field("session-craft-count"),String(Math.max(1,Math.min(50,Math.floor(Number(e.target.value)||1)))))}/>
      </label>
    </div>
    <label style={{...note,display:"flex",alignItems:"center",gap:8,margin:"12px 0 9px"}}>
      <input type="checkbox" checked={requireNoXp}
        onChange={e=>setField(field("session-no-xp"),e.target.checked?"true":"false")}/>
      Prioritize methods without kill XP
    </label>
    {known.length===0?<div>
      <p style={note}>No usable recipe is currently marked Learned and unhidden at this saved skill. Mark known recipes Learned in Professions before using an automatic recommendation.</p>
      <button className="gm-pill" type="button" onClick={onOpenProfessions}>Manage learned recipes</button>
    </div>:<>
      <label style={note}>Recipe
        <select style={fieldStyle} value={chosen?.id??""}
          onChange={e=>setField(field("session-recipe"),e.target.value)}>
          {known.map(r=><option value={r.id} key={r.id}>{r.name} · {recipeStatus(r,skill)}</option>)}
        </select>
      </label>
      <p style={{...note,margin:"9px 0"}}>
        <b>{chosen?.name}</b> · {recipeStatus(chosen!,skill)==="orange"?"Orange in recipe snapshot (verify in game)":
        "Skill-up chance only; not guaranteed"} · {materials.length} ingredients
      </p>
      <p style={note}>
        {availableAll?"Your entered inventory covers this batch.":
         missingCount>0?"Missing "+missingCount+" material type"+(missingCount===1?"":"s")+
           (unknownCount>0?" · "+unknownCount+" inventory counts not entered":""):
         "Enter your inventory for "+unknownCount+" ingredient"+(unknownCount===1?"":"s")+" to calculate shortages."}
      </p>
      {missingFirst&&<div style={{padding:10,border:"1px solid var(--border,#ddd)",borderRadius:9,margin:"10px 0"}}>
        <b>Next action: {missingFirst.have===null?"Check how much "+missingFirst.name+" you have":
          "Get "+missingFirst.missing+"× "+missingFirst.name}</b>
        {missingFirst.route?<>
          <p style={{...note,margin:"6px 0"}}>{typeLabel[missingFirst.route.route.method]}:
            <b> {missingFirst.route.route.target}</b> · {missingFirst.route.route.zone}
          </p>
          <p style={{...note,margin:"6px 0"}}>{missingFirst.route.route.advice}</p>
          <p style={{...note,margin:"6px 0"}}>{missingFirst.route.route.evidence==="forever-reported"?
            "Reported for Forever; check current availability.":missingFirst.route.route.evidence==="client-recipe"?
            "Based on your learned recipe, check the required tools and inputs.":missingFirst.route.route.evidence==="wowhead-item-page"?
            "Wowhead Forever supplier area; vendor stock not confirmed.":"Historical/Classic reference, not current server confirmation."}</p>
          {missingFirst.route.route.waypoint&&<div className="gm-wow-session-waypoint">
            <code>{missingFirst.route.route.waypoint}</code>
            <button className="gm-pill" type="button" onClick={()=>copy(missingFirst.route!.route.waypoint!)}>Copy TomTom</button>
          </div>}
        </>:<p style={note}>{requireNoXp?"No documented non-XP method or fully gray mob range is available here. Avoid assuming unverified mobs give no XP.":"No documented source is mapped. Check Wowhead Forever before traveling."}</p>}
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:7}}>
          <button className="gm-pill" type="button" onClick={()=>openMaterial(missingFirst.name)}>See sources and set focus</button>
          <a href={wowheadForeverItemUrl(missingFirst.name)??externalMaterialLookup(missingFirst.name)}
            className="gm-pill gm-wowhead-search" target="_blank" rel="noopener noreferrer">Wowhead Forever ↗</a>
        </div>
      </div>}
      <details style={{marginTop:10}}>
        <summary style={{fontWeight:700,cursor:"pointer"}}>Full shopping and farming checklist ({materials.length})</summary>
        <div style={{display:"grid",gap:9,marginTop:10}}>
          {materials.map(m=><div key={m.name} style={{border:"1px solid var(--border,#ddd)",borderRadius:9,padding:10}}>
            <b style={{fontSize:14}}>{m.name}</b>
            <p style={{...note,margin:"4px 0"}}>Need {m.needed} · {m.have===null?"Count not entered":
              m.missing===0?"Enough in inventory":"Missing "+m.missing}</p>
            <label style={note}>Have in inventory
              <input style={{...fieldStyle,width:"100%",marginTop:5}} type="number" min={0} step={1}
                value={m.raw} placeholder="Not recorded" aria-label={"Amount of "+m.name+" owned"}
                onChange={e=>setField(m.stockKey,e.target.value.replace(/[^0-9]/g,"").slice(0,8))}/>
            </label>
            <p style={{...note,margin:"6px 0"}}>
              {m.route?"Suggested: "+typeLabel[m.route.route.method]+" · "+m.route.route.zone+
                (m.route.grayKnown?" · estimated gray mob":m.route.uncertainCombat?" · XP risk / unknown range":""):
                "No eligible sourced route under current filters"}
            </p>
            <button className="gm-pill ghost" type="button" onClick={()=>openMaterial(m.name)}>Open {m.name} sources</button>
          </div>)}
        </div>
      </details>
      <p style={{...note,marginTop:10}}>Before crafting, check the recipe's actual color and required station in Forever. Inventory is not deducted and skill is not incremented automatically.</p>
      <button className="gm-pill ghost" type="button" onClick={onOpenProfessions}>Open all profession recipes</button>
    </>}
    {copyText&&<p role="status" style={note}>{copyText}</p>}
  </div>;
}
