"use client";

import { useMemo, useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import { WOW_RECIPES, WOW_PROFESSIONS, professionField, recipeHiddenKey,
  recipeLearnedKey, recipeStatus, type WowRecipe } from "@/lib/wow-forever-professions";
import { materialRoutes, externalMaterialLookup, type MaterialRoute } from "@/lib/wow-material-farms";
import { planCraftChain, type PlanRequirement } from "@/lib/wow-crafting-chain";
import { wowheadForeverItemUrl } from "@/lib/wowhead-forever-items";
import { grayMobThreshold, wowExtraField, wowMaterialKey } from "@/lib/wow-portal-extras";

type Props={
  gameId:string;level:number;faction:"horde"|"alliance";prog:GameProgress;
  setField:(key:string,value:string)=>void;onFindMaterial:(name:string)=>void;
  onOpenProfessions:()=>void;
};
const small:React.CSSProperties={fontSize:13,lineHeight:1.55,opacity:.86};
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
  vendor:"Check supplier",crafting:"Craft","other-profession":"Ask another crafter / check Auction House",skinning:"Skin",mob:"Loot",
  dungeon:"Dungeon drop",mining:"Mine",herbalism:"Gather"
};
const sourceText=(r:MaterialRoute)=>r.evidence==="forever-reported"?
  "Forever-reported; confirm this drop in-game":r.evidence==="wowhead-item-page"?
  (r.method==="other-profession"?
    "Wowhead Forever confirms another profession creates this item; ask a crafter or check Auction House.":
    "Wowhead Forever supplier area; exact NPC and stock not confirmed"):
  r.evidence==="client-recipe"?"Catalog recipe; skill and output yield must be checked":
  "Classic/historical reference; not verified as a current Forever drop";
const sourceFor=(item:string,faction:"horde"|"alliance",level:number,noXp:boolean)=>{
  const cutoff=grayMobThreshold(level);
  const options=materialRoutes(item,faction)
    // These professions do not include Mining or Herbalism. Crafted inputs
    // have already been expanded by the bill-of-materials planner.
    .filter(r=>r.method!=="mining"&&r.method!=="herbalism"&&r.method!=="crafting")
    .map(route=>{
      const nonCombat=route.method==="vendor"||route.method==="other-profession";
      const gray=route.maxMob!==undefined&&route.maxMob<=cutoff;
      const xpRisk=route.minMob!==undefined&&route.minMob>cutoff;
      const score=(nonCombat?80:gray?55:xpRisk?-30:0)+
        (route.evidence==="forever-reported"?4:0)+(route.waypoint?3:0);
      return {route,nonCombat,gray,score};
    }).filter(item=>!noXp||item.nonCombat||item.gray)
    .sort((a,b)=>b.score-a.score);
  return options[0];
};

export default function WoWProfessionRun({gameId,level,faction,prog,setField,onFindMaterial,onOpenProfessions}:Props){
  const [copyStatus,setCopyStatus]=useState("");
  const field=(name:string)=>wowExtraField(gameId,name);
  const profession=prog.fields[field("session-profession")]??"leatherworking";
  const skillKey=(id:string)=>professionField(gameId,"skill-"+id);
  const skill=num(prog.fields[skillKey(profession)])??
    WOW_PROFESSIONS.find(p=>p.id===profession)?.initial??0;
  const batch=Math.max(1,Math.min(50,Math.floor(num(prog.fields[field("session-craft-count")])??1)));
  const noXp=prog.fields[field("session-no-xp")]!=="false";
  const expand=prog.fields[field("session-expand-crafts")]!=="false";
  const learned=(r:WowRecipe)=>!!prog.checks[recipeLearnedKey(gameId,r.id)]&&
    !prog.checks[recipeHiddenKey(gameId,r.id)];
  const available=useMemo(()=>WOW_RECIPES.filter(r=>r.profession===profession&&
    !!prog.checks[recipeLearnedKey(gameId,r.id)]&&!prog.checks[recipeHiddenKey(gameId,r.id)]&&
    !["gray","locked"].includes(recipeStatus(r,skill)))
    .sort((a,b)=>colorRank(a,skill)-colorRank(b,skill)||
      a.reagents.reduce((n,i)=>n+i.quantity,0)-b.reagents.reduce((n,i)=>n+i.quantity,0)||
      a.name.localeCompare(b.name)),[profession,skill,prog.checks,gameId]);
  const chosen=available.find(r=>r.id===prog.fields[field("session-recipe")])??available[0];
  const inventory=(name:string)=>num(prog.fields[field("stock-"+wowMaterialKey(name))]);
  const chain=chosen?planCraftChain({
    recipe:chosen,batch,recipes:WOW_RECIPES,isLearned:learned,inventory,
    yieldPerCraft:r=>num(prog.fields[field("yield-"+r.id)])??1,
    expandLearned:expand
  }):null;
  const toReview=chain?.unknown[0];
  const toFind=chain?.toAcquire[0];
  const toCraft=chain?.steps[0];
  const source=toFind?sourceFor(toFind.name,faction,level,noXp):undefined;
  const setStock=(item:string,value:string)=>
    setField(field("stock-"+wowMaterialKey(item)),value.replace(/[^0-9]/g,"").slice(0,9));
  const openItem=(item:string)=>{
    setField(field("session-material"),item);
    onFindMaterial(item);
  };
  const copy=(value:string)=>{
    void navigator.clipboard.writeText(value)
      .then(()=>setCopyStatus("TomTom waypoint copied. Paste it in WoW."))
      .catch(()=>setCopyStatus("Copy unavailable. Select the waypoint manually."));
  };
  const stockInput=(item:PlanRequirement)=><label key={item.name} style={{...small,display:"block"}}>
    <span style={{display:"block",fontWeight:700}}>Have: {item.name}</span>
    <input aria-label={"Amount owned of "+item.name} style={{...fieldStyle,marginTop:5}}
      type="number" min={0} step={1} placeholder="Not entered" inputMode="numeric"
      value={prog.fields[field("stock-"+wowMaterialKey(item.name))]??""}
      onChange={e=>setStock(item.name,e.target.value)}/>
  </label>;
  return <section className="gm-wow-session-focus" aria-label="WoW profession material preparation plan">
    <h4>Plan a complete skill-up run</h4>
    <p style={small}>Choose a recipe you know, enter your bag counts, then follow the next preparation step. Materials that you can craft are broken down into their own ingredients.</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,170px),1fr))",gap:10}}>
      <label style={small}>Profession
        <select style={fieldStyle} value={profession}
          onChange={e=>setField(field("session-profession"),e.target.value)}>
          {WOW_PROFESSIONS.filter(p=>p.id!=="skinning").map(p=><option key={p.id} value={p.id}>
            {p.label} · {num(prog.fields[skillKey(p.id)])??p.initial}
          </option>)}
        </select>
      </label>
      <label style={small}>Number of crafts
        <input style={fieldStyle} type="number" min={1} max={50} step={1} value={batch}
          onChange={e=>setField(field("session-craft-count"),
            String(Math.max(1,Math.min(50,Math.floor(Number(e.target.value)||1)))))}/>
      </label>
    </div>
    <div style={{display:"grid",gap:7,margin:"12px 0"}}>
      <label style={{...small,display:"flex",alignItems:"center",gap:8}}>
        <input type="checkbox" checked={noXp} onChange={e=>setField(field("session-no-xp"),e.target.checked?"true":"false")}/>
        Prefer suppliers and gray mobs (avoid kill XP)
      </label>
      <label style={{...small,display:"flex",alignItems:"center",gap:8}}>
        <input type="checkbox" checked={expand} onChange={e=>setField(field("session-expand-crafts"),e.target.checked?"true":"false")}/>
        Break down ingredients I can craft
      </label>
    </div>
    {!chosen?<div>
      <p style={small}>No learned, visible, non-gray recipe is recorded for this profession. Mark recipes Learned in Professions first; the guide won't assume you know them.</p>
      <button className="gm-pill" type="button" onClick={onOpenProfessions}>Review my recipes</button>
    </div>:<>
      <label style={small}>Selected recipe
        <select style={fieldStyle} value={chosen.id} onChange={e=>setField(field("session-recipe"),e.target.value)}>
          {available.map(r=><option key={r.id} value={r.id}>{r.name} · {recipeStatus(r,skill)}</option>)}
        </select>
      </label>
      <p style={{...small,margin:"9px 0"}}>
        <b>{batch}× {chosen.name}</b> · {recipeStatus(chosen,skill)==="orange"?
          "Orange in stored recipe data; verify in game":"Skill-up chance only; not guaranteed"}
      </p>
      <div style={{padding:12,border:"1px solid var(--border,#ddd)",borderRadius:10,margin:"12px 0"}}>
        <b style={{display:"block",marginBottom:6}}>Your next action</b>
        {toReview?<div>
          <p style={{...small,margin:"4px 0 9px"}}>Check the number of <b>{toReview.name}</b> in your bags. Blank inventory is unknown, not zero.</p>
          {stockInput(toReview)}
          {chain&&chain.steps.length>0&&<p style={small}>The plan can expand further once the remaining inventory amounts are entered.</p>}
        </div>:toFind?<div>
          <p style={{...small,margin:"4px 0 8px"}}>Obtain <b>{toFind.rawShortage}× {toFind.name}</b> for this crafting batch.</p>
          {source?<div>
            <p style={{...small,margin:"6px 0"}}><b>{typeLabel[source.route.method]}:</b> {source.route.target} · {source.route.zone}</p>
            <p style={{...small,margin:"6px 0"}}>{source.route.advice}</p>
            <p style={{...small,margin:"6px 0"}}>{sourceText(source.route)}{source.gray?" · Gray expected, verify mob color":""}</p>
            {source.route.waypoint&&<div className="gm-wow-session-waypoint">
              <code>{source.route.waypoint}</code>
              <button type="button" className="gm-pill" onClick={()=>copy(source.route.waypoint!)}>Copy TomTom</button>
            </div>}
          </div>:<p style={small}>{noXp?
            "No documented supplier or fully gray enemy route was found. The guide will not recommend an unverified mob as XP-safe.":
            "No usable farm documented in this guide. Review the source record before traveling."}</p>}
          <div className="gm-wow-session-actions">
            <button type="button" className="gm-pill ghost" onClick={()=>openItem(toFind.name)}>All sources</button>
            <a className="gm-pill gm-wowhead-search" href={wowheadForeverItemUrl(toFind.name)??externalMaterialLookup(toFind.name)}
              target="_blank" rel="noopener noreferrer">Wowhead Forever ↗</a>
          </div>
        </div>:toCraft?<p style={small}>
          Your entered raw inventory covers the plan. <b>Craft {toCraft.casts}× {toCraft.recipe.name}</b> first using the inputs shown below; then craft your main recipe. Verify actual yield in-game.
        </p>:<p style={small}>Your entered inventory covers this batch. Check the recipe and craft it when ready; the guide won't automatically deduct items or add skill.</p>}
      </div>
      <details open style={{marginTop:11}}>
        <summary style={{cursor:"pointer",fontWeight:700}}>Materials to obtain ({chain?.toAcquire.length??0})</summary>
        {chain?.toAcquire.length?<div style={{display:"grid",gap:8,marginTop:10}}>
          {chain.toAcquire.map(item=><div key={item.name} style={{padding:10,border:"1px solid var(--border,#ddd)",borderRadius:9}}>
            <b>{item.name}</b> · {item.rawShortage} still needed
            <p style={{...small,margin:"5px 0"}}>{sourceFor(item.name,faction,level,noXp)?.route.target??"No eligible sourced route found"}</p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button className="gm-pill ghost" type="button" onClick={()=>openItem(item.name)}>Find {item.name}</button>
              <a href={wowheadForeverItemUrl(item.name)??externalMaterialLookup(item.name)}
                className="gm-pill gm-wowhead-search" target="_blank" rel="noopener noreferrer">Wowhead Forever ↗</a>
            </div>
          </div>)}
        </div>:<p style={small}>No additional raw materials can be calculated yet, or your recorded stock covers them.</p>}
      </details>
      {chain?.steps.length? <details open style={{marginTop:12}}>
        <summary style={{cursor:"pointer",fontWeight:700}}>Craft these components first ({chain.steps.length})</summary>
        <div style={{display:"grid",gap:9,marginTop:10}}>
          {chain.steps.map((step,i)=><div key={step.recipe.id} style={{padding:10,border:"1px solid var(--border,#ddd)",borderRadius:9}}>
            <b>{i+1}. Craft {step.casts}× {step.recipe.name}</b>
            <p style={{...small,margin:"5px 0"}}>Needs: {step.recipe.reagents.map(r=>r.quantity*step.casts+"× "+r.name).join(" · ")}</p>
            <label style={small}>Items produced per craft (verify in Forever)
              <input type="number" min={1} max={99} step={1} inputMode="numeric"
                aria-label={"Yield per craft of "+step.recipe.name}
                style={{...fieldStyle,marginTop:5}} value={num(prog.fields[field("yield-"+step.recipe.id)])??1}
                onChange={e=>setField(field("yield-"+step.recipe.id),
                  String(Math.max(1,Math.min(99,Math.floor(Number(e.target.value)||1)))))}/>
            </label>
          </div>)}
        </div>
      </details>:null}
      <details style={{marginTop:12}}>
        <summary style={{cursor:"pointer",fontWeight:700}}>All required materials & inventory ({chain?.requirements.length??0})</summary>
        <div style={{display:"grid",gap:9,marginTop:9}}>
          {chain?.requirements.map(item=><div key={item.name} style={{padding:10,border:"1px solid var(--border,#ddd)",borderRadius:9}}>
            <p style={{...small,margin:"0 0 6px"}}><b>{item.name}</b> · Required {item.required}
              {item.crafted>0?" · Make "+item.crafted:""}
              {item.rawShortage>0?" · Obtain "+item.rawShortage:""}
            </p>
            {stockInput(item)}
          </div>)}
        </div>
      </details>
      {chain?.warnings.map(w=><p key={w} style={small}>{w}</p>)}
      <p style={{...small,marginTop:12}}>Plan based on saved WoW Forever recipe formulas. Default output yield is <b>one item per cast</b> unless you change it. No server inventory, drop chance, Auction House price, or skill gain is automatically verified.</p>
      <button className="gm-pill ghost" type="button" onClick={onOpenProfessions}>Review profession recipes</button>
    </>}
    {copyStatus&&<p style={small} role="status">{copyStatus}</p>}
  </section>;
}
