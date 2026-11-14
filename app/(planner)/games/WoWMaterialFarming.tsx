"use client";

import { useMemo, useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import { grayMobThreshold, wowExtraField, wowMaterialKey } from "@/lib/wow-portal-extras";
import { ALL_RECIPE_MATERIALS, externalMaterialLookup, materialRecipes, materialRoutes, type MaterialRoute } from "@/lib/wow-material-farms";
import { wowheadForeverItemUrl } from "@/lib/wowhead-forever-items";

type Props={gameId:string;level:number;faction?:"horde"|"alliance";prog:GameProgress;setField:(key:string,value:string)=>void;initialQuery?:string};
const small:React.CSSProperties={fontSize:13,lineHeight:1.5,opacity:.86};
const input:React.CSSProperties={width:"100%",minWidth:0,padding:"9px 11px",border:"1px solid var(--border,#ccc)",borderRadius:8,background:"var(--panel,#fff)",color:"var(--text,#222)",font:"inherit"};
const mine=(r:MaterialRoute)=>r.method==="mining"||r.method==="herbalism";
const typeLabel=(r:MaterialRoute)=>({
  mob:"Kill and loot",dungeon:"Dungeon drop",skinning:"Kill, loot and skin",mining:"Mining node",herbalism:"Herbalism node",vendor:"Buy from supplier",crafting:"Craft with your profession","other-profession":"Ask another crafter or use Auction House"
})[r.method];

export default function WoWMaterialFarming({gameId,level,faction="horde",prog,setField,initialQuery=""}:Props){
 const [query,setQuery]=useState(initialQuery||"Moss Agate");
 const [showOtherProfessions,setShowOtherProfessions]=useState(false);
 const [grayOnly,setGrayOnly]=useState(false);
 const [message,setMessage]=useState("");
 const cutoff=grayMobThreshold(level);
 const suggestions=useMemo(()=>ALL_RECIPE_MATERIALS.filter(name=>name.toLowerCase().includes(query.trim().toLowerCase())),[query]);
 const exact=ALL_RECIPE_MATERIALS.find(name=>name.toLowerCase()===query.trim().toLowerCase());
 const chosen=exact||(suggestions.length===1?suggestions[0]:null);
 // External lookup is available for ANY search phrase, including unknown items.
 const wowheadTerm=chosen??query.trim();
 const foreverItem=chosen?wowheadForeverItemUrl(chosen):null;
 const recipes=chosen?materialRecipes(chosen):[];
 const options=chosen?materialRoutes(chosen,faction):[];
 const ordered=options.slice().sort((a,b)=>{
   const aRisk=typeof a.maxMob==="number"&&a.maxMob<=cutoff?0:typeof a.maxMob==="number"?2:1;
   const bRisk=typeof b.maxMob==="number"&&b.maxMob<=cutoff?0:typeof b.maxMob==="number"?2:1;
   const aTrade=["vendor","crafting","other-profession"].includes(a.method);
   const bTrade=["vendor","crafting","other-profession"].includes(b.method);
   if(aTrade!==bTrade)return aTrade?-1:1;
   return aRisk-bRisk||Number(mine(a))-Number(mine(b));
 });
 const visible=ordered.filter(r=>(showOtherProfessions||!mine(r))&&(!grayOnly||
   ["vendor","crafting","other-profession"].includes(r.method)||
   (r.maxMob!==undefined&&r.maxMob<=cutoff)));
 const inventoryKey=chosen?wowExtraField(gameId,"stock-"+wowMaterialKey(chosen)):"";
 const invValue=chosen?prog.fields[inventoryKey]??"":"";
 const copy=(value:string)=>{void navigator.clipboard.writeText(value).then(()=>setMessage("Copied waypoint: "+value)).catch(()=>setMessage("Copy blocked. Select the waypoint manually."));};
 return <section className="gm-card" style={{padding:16,marginTop:12}} aria-label="Material farming locations">
  <div className="gm-panel-label">Crafting material finder · {faction==="horde"?"Horde":"Alliance"} sources first</div>
  <h3 style={{margin:"6px 0"}}>Where can I farm this material?</h3>
  <p style={small}>Search all 286 reagents in your 669-recipe catalog. The results distinguish Forever-reported drops, old reference routes, supplies you can buy, and ingredients you can craft. Unmapped sources are not guessed.</p>
  <label style={{...small,display:"block",marginTop:12}}>Search material by name
   <input style={{...input,marginTop:6}} type="search" value={query}
     onChange={e=>{setQuery(e.target.value);setMessage("");}} placeholder="Moss Agate, Wool Cloth, Medium Leather…"
     aria-label="Search WoW crafting materials"/>
  </label>
  {wowheadTerm && <div style={{margin:"10px 0 14px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
    <a className="gm-pill gm-wowhead-search" href={foreverItem||externalMaterialLookup(wowheadTerm)} target="_blank" rel="noopener noreferrer"
      aria-label={(foreverItem?"Open item on Wowhead Forever: ":"Search Wowhead Forever for ")+wowheadTerm}>
      {foreverItem?"Open exact Wowhead Forever item":"Search Wowhead Forever for "+wowheadTerm} ↗
    </a>
    <span style={small}>{foreverItem?"Matched a checked Forever item ID. Its source tables may include Classic-era data.":
      "Searches Wowhead Forever even when the local item has no recorded source."}</span>
  </div>}
  {!chosen && <div style={{marginTop:10}}>
   <p style={small}>{suggestions.length? suggestions.length+" matching materials (select one)":"Not in your recipe catalog. Use Search Wowhead Forever above to look up any item, creature, or material."}</p>
   <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
    {suggestions.slice(0,18).map(name=><button type="button" key={name} className="gm-pill" onClick={()=>setQuery(name)}>{name}</button>)}
   </div>
   {suggestions.length>18&&<p style={small}>Showing the first 18. Type a few more letters to narrow the results.</p>}
  </div>}
  {chosen && <>
   <div style={{marginTop:14,padding:12,border:"1px solid var(--border,#ddd)",borderRadius:10}}>
    <h4 style={{margin:"0 0 8px"}}>{chosen}</h4>
    <div style={{display:"flex",alignItems:"center",gap:9,flexWrap:"wrap"}}>
     <label style={small}>Already have
      <input style={{...input,width:95,marginLeft:7,display:"inline-block"}} type="number" min={0} step={1}
        value={invValue} onChange={e=>setField(inventoryKey,e.target.value.replace(/[^0-9]/g,"").slice(0,8))}
        placeholder="Not set" aria-label={chosen+" inventory"}/>
     </label>
     <span style={small}>Shared with your crafting calculator</span>
    </div>
    <details style={{marginTop:9}}>
     <summary style={{cursor:"pointer",fontWeight:650,fontSize:13}}>Used by {recipes.length} recipes in your catalog</summary>
     <div style={{maxHeight:180,overflowY:"auto",marginTop:7}}>
      {recipes.slice(0,35).map(({recipe,quantity})=><p key={recipe.id} style={{...small,margin:"5px 0"}}>
       <b>{recipe.name}</b> · {quantity} per craft · {recipe.profession} · Learn at {recipe.learnAt??"unknown"}
      </p>)}
      {recipes.length>35&&<p style={small}>{recipes.length-35} more in the recipe finder.</p>}
     </div>
    </details>
   </div>
   <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:12,margin:"12px 0"}}>
    <label style={{...small,display:"inline-flex",alignItems:"center",gap:6}}>
     <input type="checkbox" checked={showOtherProfessions} onChange={e=>setShowOtherProfessions(e.target.checked)}/>
     Include Mining/Herbalism
    </label>
    <label style={{...small,display:"inline-flex",alignItems:"center",gap:6}}>
     <input type="checkbox" checked={grayOnly} onChange={e=>setGrayOnly(e.target.checked)}/>
     Only sources without expected kill XP
    </label>
   </div>
   <p style={small}>At character level <b>{level}</b>, ordinary Classic-style mobs level <b>{cutoff} or below</b> should be gray. Confirm enemy color and Forever XP rules before killing; dungeon level ranges are not guarantees.</p>
   {options.length===0&&<p style={small}>No named farming route is mapped for this material yet. {foreverItem?
     "Its specific Wowhead Forever item page is linked above; check its source tabs before you travel.":
     "Search Wowhead Forever above to investigate new item and drop records."} This does not mean the item is unavailable.</p>}
   {options.length>0&&visible.length===0&&<p style={small}>No listed routes match these filters. Allow XP-risk sources or include Mining/Herbalism to inspect other possibilities.</p>}
   <div style={{display:"grid",gap:10,marginTop:10}}>
    {visible.map(r=>{
     const safe=r.maxMob!==undefined&&r.maxMob<=cutoff;
     const dangerous=r.minMob!==undefined&&r.minMob>cutoff;
     const nonCombat=["vendor","crafting","other-profession"].includes(r.method);
     const provenance=r.evidence==="wowhead-item-page"?(r.method==="other-profession"?
       "Wowhead Forever profession spell / item; ask a crafter, check output":
       "Wowhead Forever lists seller zones; NPC / stock unconfirmed"):
       r.evidence==="client-recipe"?"Forever client recipe; exact unlock may need verification":
       r.evidence==="forever-reported"?"Reported on Wowhead Forever; recheck current server":
       "Classic / historical reference; not verified as a Forever drop";
     return <article key={r.id} style={{border:"1px solid var(--border,#ddd)",borderRadius:10,padding:12}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start",flexWrap:"wrap"}}>
       <b style={{fontSize:14}}>{r.target}</b>
       <span style={{...small,fontWeight:650}}>{nonCombat?"No mob XP":safe?"Gray expected":dangerous?"XP likely":r.method==="mining"||r.method==="herbalism"?"Check gathering skill":"Verify mob XP"}</span>
      </div>
      <p style={{...small,margin:"5px 0"}}><b>{r.zone}</b> · {typeLabel(r)}
       {r.requiredSkill!==undefined?" · Needs "+r.method+" skill "+r.requiredSkill:""}
       {r.minMob!==undefined?" · mob level "+r.minMob+(r.maxMob!==r.minMob?"–"+r.maxMob:""):""}
      </p>
      <p style={{...small,margin:"7px 0"}}>{r.advice}</p>
      {r.waypoint&&<p style={{...small,margin:"7px 0"}}><code>{r.waypoint}</code>{" "}
       <button type="button" className="gm-pill" onClick={()=>copy(r.waypoint!)}>Copy TomTom</button></p>}
      <p style={{...small,margin:"7px 0 0"}}>
       <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">Check source ↗</a>
       {" · "}{provenance}
       {r.reviewedAt?" · Reviewed "+r.reviewedAt:""}
      </p>
     </article>;
    })}
   </div>
   <p style={{...small,marginTop:12}}>
    Item IDs and supplier zone names come from Wowhead Forever. Some drop tables and player comments are older Classic references, not confirmed Forever results. Compare Auction House prices against farm time, and use the linked item record to check for changes.
   </p>
  </>}
  {message&&<p role="status" style={small}>{message}</p>}
 </section>;
}
