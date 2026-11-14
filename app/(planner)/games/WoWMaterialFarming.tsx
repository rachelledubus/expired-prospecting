"use client";

import { useMemo, useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import { wowExtraField, wowMaterialKey } from "@/lib/wow-portal-extras";
import { expectedGrayCutoff, rankMaterialRoutes } from "@/lib/wow-material-route-ranking";
import { ALL_RECIPE_MATERIALS, externalMaterialLookup, materialRecipes, materialRoutes, type MaterialRoute } from "@/lib/wow-material-farms";
import { wowheadForeverItemUrl } from "@/lib/wowhead-forever-items";

type Props={gameId:string;level:number;faction?:"horde"|"alliance";prog:GameProgress;setField:(key:string,value:string)=>void;initialQuery?:string};
const small:React.CSSProperties={fontSize:13,lineHeight:1.5,opacity:.86};
const input:React.CSSProperties={width:"100%",minWidth:0,padding:"9px 11px",border:"1px solid var(--border,#ccc)",borderRadius:8,background:"var(--panel,#fff)",color:"var(--text,#222)",font:"inherit"};
const typeLabel=(r:MaterialRoute)=>({
  mob:"Kill and loot",dungeon:"Dungeon drop",skinning:"Kill, loot and skin",mining:"Mining node",herbalism:"Herbalism node",vendor:"Buy from supplier",crafting:"Craft with your profession","other-profession":"Ask another crafter or use Auction House"
})[r.method];

export default function WoWMaterialFarming({gameId,level,faction="horde",prog,setField,initialQuery=""}:Props){
 const [query,setQuery]=useState(initialQuery||"Moss Agate");
 const [showOtherProfessions,setShowOtherProfessions]=useState(false);
 const [grayOnly,setGrayOnly]=useState(true);
 const [foreverOnly,setForeverOnly]=useState(false);
 const [message,setMessage]=useState("");
 const cutoff=expectedGrayCutoff(level);
 const suggestions=useMemo(()=>ALL_RECIPE_MATERIALS.filter(name=>name.toLowerCase().includes(query.trim().toLowerCase())),[query]);
 const exact=ALL_RECIPE_MATERIALS.find(name=>name.toLowerCase()===query.trim().toLowerCase());
 const chosen=exact||(suggestions.length===1?suggestions[0]:null);
 // External lookup is available for ANY search phrase, including unknown items.
 const wowheadTerm=chosen??query.trim();
 const foreverItem=chosen?wowheadForeverItemUrl(chosen):null;
 const recipes=chosen?materialRecipes(chosen):[];
 const options=chosen?materialRoutes(chosen,faction):[];
 const ranked=rankMaterialRoutes(options,{level,noXp:grayOnly,
   includeGathering:showOtherProfessions,includeHistorical:!foreverOnly});
 const visible=ranked.map(x=>x.route);
 const top=ranked.find(x=>x.usable==="direct");
 const inventoryKey=chosen?wowExtraField(gameId,"stock-"+wowMaterialKey(chosen)):"";
 const invValue=chosen?prog.fields[inventoryKey]??"":"";
 const copy=(value:string)=>{void navigator.clipboard.writeText(value).then(()=>setMessage("Copied waypoint: "+value)).catch(()=>setMessage("Copy blocked. Select the waypoint manually."));};
 return <section className="gm-card" style={{padding:16,marginTop:12}} aria-label="Material farming locations">
  <div className="gm-panel-label">Crafting material finder · {faction==="horde"?"Horde":"Alliance"} · Skinning and no-XP preference</div>
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
   {top&&<div className="gm-card" style={{padding:12,marginTop:12,border:"1px solid var(--accent,#659e8b)"}}>
     <div className="gm-panel-label">Best available lead for your settings</div>
     <strong>{top.route.target}</strong> · {top.route.zone}
     <p style={{...small,margin:"6px 0 0"}}>{top.xp==="none"?"No mob XP for this method":top.xp==="gray-expected"?"Listed target expected gray — verify before farming":"XP / level needs verification"}. {top.notes.join(". ")}</p>
     <p style={{...small,margin:"6px 0 0"}}>A suggested lead, not a guaranteed drop or best gold/hour route.</p>
   </div>}
   <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:12,margin:"12px 0"}}>
    <label style={{...small,display:"inline-flex",alignItems:"center",gap:6}}>
     <input type="checkbox" checked={showOtherProfessions} onChange={e=>setShowOtherProfessions(e.target.checked)}/>
     Show Mining/Herbalism (not my professions)
    </label>
    <label style={{...small,display:"inline-flex",alignItems:"center",gap:6}}>
     <input type="checkbox" checked={grayOnly} onChange={e=>setGrayOnly(e.target.checked)}/>
     Avoid routes with possible kill XP
    </label>
    <label style={{...small,display:"inline-flex",alignItems:"center",gap:6}}>
     <input type="checkbox" checked={foreverOnly} onChange={e=>setForeverOnly(e.target.checked)}/>
     Hide historical / Classic-only reports
    </label>
   </div>
   <p style={small}>At character level <b>{level}</b>, ordinary Classic-style mobs level <b>{cutoff} or below</b> should be gray. Confirm enemy color and Forever XP rules before killing; dungeon level ranges are not guarantees.</p>
   {options.length===0&&<p style={small}>No named farming route is mapped for this material yet. {foreverItem?
     "Its specific Wowhead Forever item page is linked above; check its source tabs before you travel.":
     "Search Wowhead Forever above to investigate new item and drop records."} This does not mean the item is unavailable.</p>}
   {options.length>0&&visible.length===0&&<p style={small}>No routes qualify under these preferences. Try turning off Avoid kill XP, showing historical sources, or including Mining/Herbalism. Unknown levels are excluded from the no-XP view, not claimed to be unsafe.</p>}
   {options.length>0&&<p style={{...small,margin:"7px 0"}}>Showing <b>{visible.length}</b> of <b>{options.length}</b> source leads, ranked for <b>your level, no-XP preference, and Skinning access</b>. Evidence quality is used after practicality; none of these are guaranteed live drops.</p>}
   <div style={{display:"grid",gap:10,marginTop:10}}>
    {ranked.map(({route:r,xp,notes})=>{
     const evidenceLabel=r.evidence==="forever-reported"?"Forever-reported route":
       r.evidence==="client-recipe"?"Forever client data":
       r.evidence==="wowhead-item-page"?"Forever item record":"Historical reference";
     const provenance=r.evidence==="wowhead-item-page"?(r.method==="other-profession"?
       "Wowhead Forever profession spell / item; ask a crafter, check output":
       "Wowhead Forever lists seller zones; NPC / stock unconfirmed"):
       r.evidence==="client-recipe"?"Forever client recipe; exact unlock may need verification":
       r.evidence==="forever-reported"?"Reported on Wowhead Forever; recheck current server":
       "Classic / historical reference; not verified as a Forever drop";
     return <article key={r.id} style={{border:"1px solid var(--border,#ddd)",borderRadius:10,padding:12}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start",flexWrap:"wrap"}}>
       <div style={{display:"grid",gap:3,minWidth:0}}>
        <b style={{fontSize:14}}>{r.target}</b>
        <span style={{...small}}>Source: {evidenceLabel}</span>
       </div>
       <span style={{...small,fontWeight:650}}>{xp==="none"?"No mob XP":xp==="gray-expected"?"Gray expected":xp==="xp-possible"?"XP likely":"XP unverified"}</span>
      </div>
      <p style={{...small,margin:"5px 0"}}><b>{r.zone}</b> · {typeLabel(r)}
       {r.requiredSkill!==undefined?" · Needs "+r.method+" skill "+r.requiredSkill:""}
       {r.minMob!==undefined?" · mob level "+r.minMob+(r.maxMob!==r.minMob?"–"+r.maxMob:""):""}
      </p>
      <p style={{...small,margin:"7px 0"}}>{r.advice}</p>
      {notes.length>0&&<p style={{...small,margin:"7px 0",fontWeight:600}}>{notes.join(" · ")}</p>}
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
