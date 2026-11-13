"use client";

import { useMemo, useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import { WOW_PROFESSIONS, professionField, recipeLearnedKey, recipeHiddenKey, type WowProfessionId } from "@/lib/wow-forever-professions";
import { WOW_DUNGEON_PROFESSION_DROPS, type DungeonProfessionDrop } from "@/lib/wow-forever-dungeon-professions";
import { wowExtraField, wowMaterialKey } from "@/lib/wow-portal-extras";

type Props = {
  dungeonId:string;gameId:string;prog:GameProgress;
  setCheck:(key:string,value:boolean)=>void;
  setField:(key:string,value:string)=>void;
};
const note:React.CSSProperties={fontSize:12,lineHeight:1.55,opacity:.83};
const input:React.CSSProperties={background:"var(--panel,#fff)",color:"var(--text,#222)",
  border:"1px solid var(--border,#ddd)",borderRadius:7,padding:"6px 8px",minWidth:0,width:92,maxWidth:"100%",font:"inherit"};
const kindLabel=(kind:string)=>kind==="pattern"?"Pattern / blueprint":"Gathering material";
const professionLabel=(id:WowProfessionId)=>WOW_PROFESSIONS.find(p=>p.id===id)?.label??id;
const statusLabel=(drop:DungeonProfessionDrop,skill:number)=> {
  if(!drop.recipe)return "";
  if(drop.recipe.learnAt===null)return "Learning skill unknown";
  if(skill<drop.recipe.learnAt)return "Learn at skill "+drop.recipe.learnAt;
  if(skill>=drop.recipe.grayAt)return "Learnable · gray to craft";
  return "Learnable · skill "+drop.recipe.learnAt+"+";
};

export default function WoWDungeonProfessionDrops({dungeonId,gameId,prog,setCheck,setField}:Props){
  const [professionFilter,setProfessionFilter]=useState<"all"|WowProfessionId>("all");
  const [expandAll,setExpandAll]=useState(false);
  const skill=(profession:WowProfessionId)=>{
    const initial=WOW_PROFESSIONS.find(p=>p.id===profession)?.initial??0;
    const raw=prog.fields[professionField(gameId,"skill-"+profession)];
    return raw===undefined?initial:Math.max(0,Number(raw)||0);
  };
  const all=WOW_DUNGEON_PROFESSION_DROPS.filter(x=>x.dungeonId===dungeonId);
  const rows=useMemo(()=>all
    .filter(x=>professionFilter==="all"||x.professions.includes(professionFilter))
    // Learned/hidden patterns belong in the profession planner, not dungeon farming results.
    .filter(x=>!x.recipe||
      (!prog.checks[recipeLearnedKey(gameId,x.recipe.id)]&&!prog.checks[recipeHiddenKey(gameId,x.recipe.id)]))
    .sort((a,b)=>{
      if(a.kind!==b.kind)return a.kind==="pattern"?-1:1;
      const aCan=a.recipe&&a.recipe.learnAt!==null&&skill(a.recipe.profession)>=a.recipe.learnAt?1:0;
      const bCan=b.recipe&&b.recipe.learnAt!==null&&skill(b.recipe.profession)>=b.recipe.learnAt?1:0;
      return bCan-aCan||a.itemName.localeCompare(b.itemName);
    }),[dungeonId,professionFilter,prog.checks,prog.fields]);
  const patternCount=rows.filter(x=>x.kind==="pattern").length;
  const materialCount=rows.length-patternCount;
  const shown=expandAll?rows:rows.slice(0,4);
  return <section style={{borderTop:"1px solid var(--border,#ddd)",paddingTop:12,marginTop:12}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <h4 style={{margin:0,fontSize:15}}>Profession drops &amp; crafting materials</h4>
      {all.length>0&&<span style={note}>{patternCount} unlearned patterns · {materialCount} materials</span>}
    </div>
    {all.length===0?<p style={note}>No profession-specific drops have been documented for this dungeon in the current guide. Other materials may still drop.</p>:<>
      <p style={{...note,margin:"6px 0 10px"}}>
        Pattern sources are reported for WoW Forever; cloth, skinning and reagent guidance may use Classic reference data. No guaranteed boss drops or prices.
      </p>
      <label style={{...note,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:10}}>
        Show for
        <select value={professionFilter} onChange={e=>{setProfessionFilter(e.target.value as "all"|WowProfessionId);setExpandAll(false)}}
          style={{...input,width:"auto",maxWidth:"100%"}}>
          <option value="all">All my professions</option>
          {WOW_PROFESSIONS.map(p=><option value={p.id} key={p.id}>{p.label} (skill {skill(p.id)})</option>)}
        </select>
      </label>
      {!rows.length&&<p style={note}>No unlearned, unhidden patterns or matching materials remain under this filter. You can restore hidden patterns in Professions.</p>}
      <div style={{display:"grid",gap:8}}>
        {shown.map(item=><article key={item.id} style={{border:"1px solid var(--border,#ddd)",borderRadius:9,padding:10}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
            <b style={{fontSize:14}}>{item.itemName}</b>
            <span style={{...note,fontWeight:650}}>{kindLabel(item.kind)}</span>
          </div>
          <p style={{...note,margin:"4px 0"}}><b>Where:</b> {item.source}
            {item.method==="skin"?" · Skin after looting":item.method==="loot"?" · Loot eligible mobs":""}
          </p>
          <p style={{...note,margin:"4px 0"}}>
            <b>For:</b> {item.professions.map(professionLabel).join(" / ")}
            {item.recipe?" · "+statusLabel(item,skill(item.recipe.profession)):""}
          </p>
          {item.note&&<p style={{...note,margin:"4px 0"}}>{item.note}</p>}
          {item.recipe?<>
            <p style={{...note,margin:"5px 0"}}>
              <b>Craft materials:</b> {item.recipe.reagents.map(r=>r.quantity+"× "+r.name).join(" · ")}
            </p>
            <label style={{...note,display:"inline-flex",gap:7,alignItems:"center",marginTop:5}}>
              <input type="checkbox" checked={false}
                onChange={e=>{if(e.target.checked)setCheck(recipeLearnedKey(gameId,item.recipe!.id),true)}}/>
              Mark pattern learned
            </label>
          </>:<label style={{...note,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",margin:"8px 0 0"}}>
            Current inventory
            <input aria-label={item.itemName+" inventory"} style={input} type="number" min={0} step={1}
              placeholder="Not set"
              value={prog.fields[wowExtraField(gameId,"stock-"+wowMaterialKey(item.itemName))]??""}
              onChange={e=>setField(wowExtraField(gameId,"stock-"+wowMaterialKey(item.itemName)),e.target.value.replace(/[^0-9]/g,"").slice(0,8))}/>
            <span>Syncs with crafting calculator</span>
          </label>}
          <p style={{...note,margin:"8px 0 0"}}>
            <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
              {item.reliability==="forever-reported"?"Forever drop reference":"Classic material reference"} ↗
            </a>
          </p>
        </article>)}
      </div>
      {rows.length>4&&<button type="button" className="gm-pill" onClick={()=>setExpandAll(v=>!v)} style={{marginTop:10}}>
        {expandAll?"Show fewer items":"Show all "+rows.length+" items"}
      </button>}
    </>}
  </section>;
}
