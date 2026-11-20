"use client";

import { useMemo, useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import {
  WOW_PROFESSIONS, WOW_RECIPES, professionField, recipeLearnedKey,
} from "@/lib/wow-forever-professions";
import {
  VERIFIED_WOWHEAD_FOREVER_REVIEW, VERIFIED_WOWHEAD_FOREVER_STOPS,
  WOWHEAD_FOREVER_LEVELING_GUIDES, nextForeverSkillPath,
  type VerifiedAcquisition, type VerifiedProfession,
} from "@/lib/wow-forever-verified-sources";

type Props={
  gameId:string;prog:GameProgress;
  setCheck:(key:string,checked:boolean)=>void;
  setField:(key:string,value:string)=>void;
};
const small:React.CSSProperties={fontSize:13,lineHeight:1.55};
const selectStyle:React.CSSProperties={minWidth:0,width:"100%",minHeight:42,padding:"8px 10px",background:"var(--panel,#fff)",
  color:"var(--text,#222)",border:"1px solid var(--border,#bbb)",borderRadius:8,font:"inherit"};
const order:Record<VerifiedAcquisition["method"],number>={buy:0,train:1,drop:2};
const tracked=(id:string,itemId:string)=>id+"|verified-source|"+itemId;

const resolvedRecipe=(item:VerifiedAcquisition)=>{
  const name=item.name.replace(/^(?:Pattern|Recipe): /,"").toLowerCase();
  return WOW_RECIPES.find(r=>r.profession===item.profession && r.name.toLowerCase()===name);
};

export default function WoWForeverVerifiedProfessions({gameId,prog,setCheck,setField}:Props){
  const faction=prog.fields[gameId+"|faction"]==="alliance"?"alliance":"horde";
  const [area,setArea]=useState("all");
  const [search,setSearch]=useState("");
  const [showDistant,setShowDistant]=useState(false);
  const [showDone,setShowDone]=useState(false);
  const [message,setMessage]=useState("");
  const skill=(id:string)=>{
    const fallback=WOW_PROFESSIONS.find(p=>p.id===id)?.initial??0;
    const raw=prog.fields[professionField(gameId,"skill-"+id)];
    return raw===undefined?fallback:Math.max(0,Math.min(300,Number(raw)||0));
  };
  const factionRows=VERIFIED_WOWHEAD_FOREVER_STOPS.filter(i=>i.faction===faction||i.faction==="neutral");
  const isDone=(item:VerifiedAcquisition)=>{
    const recipe=resolvedRecipe(item);
    return Boolean(prog.checks[recipe ? recipeLearnedKey(gameId,recipe.id) : tracked(gameId,item.id)]);
  };
  const setDone=(item:VerifiedAcquisition,value:boolean)=>{
    const recipe=resolvedRecipe(item);
    setCheck(recipe?recipeLearnedKey(gameId,recipe.id):tracked(gameId,item.id),value);
  };
  const isUseful=(item:VerifiedAcquisition)=>{
    if(showDistant)return true;
    const current=skill(item.profession);
    // Once at the books' NPC, collect the full 150-225 book/manual bundle in one visit.
    if(item.name==="Expert First Aid - Under Wraps"||item.name.startsWith("Manual: ")||
       item.name==="Expert Cookbook")return current<225;
    if(item.method==="train")return item.skill<=current+35&&item.skill>=current-80;
    return item.skill<=current+35&&item.skill>=current-75;
  };
  const groupByArea=useMemo(()=>{
    const map=new Map<string,VerifiedAcquisition[]>();
    for(const item of factionRows){
      const key=item.zone+"|"+item.area;
      if(!map.has(key))map.set(key,[]);
      map.get(key)!.push(item);
    }
    return [...map].sort((a,b)=>a[0].localeCompare(b[0]));
  },[faction]);
  const groups=groupByArea.map(([key,all])=>({
    key,area:all[0].area,zone:all[0].zone,
    items:all.filter(item=>(showDone||!isDone(item))&&isUseful(item)&&
      (!search.trim()||(item.name+" "+item.npc+" "+item.area+" "+item.zone+" "+item.note)
        .toLowerCase().includes(search.trim().toLowerCase())))
      .sort((a,b)=>order[a.method]-order[b.method]||a.skill-b.skill),
  })).filter(g=>g.items.length&&(area==="all"||g.key===area));
  const copy=async(way:string)=>{
    try{await navigator.clipboard.writeText(way);setMessage("Copied "+way);}
    catch{setMessage("Could not copy automatically: "+way);}
  };
  const professionIds:VerifiedProfession[]=["leatherworking","first-aid","cooking"];
  return <section className="gm-wow-professions" aria-label="Verified WoW Forever profession planner">
    <div className="gm-card" style={{padding:16,marginTop:12}}>
      <div className="gm-wow-section-head">
        <h3 style={{margin:0}}>Profession rescue · skill-ups now</h3>
        <span className="gm-wow-subtitle">Wowhead Forever · reviewed {VERIFIED_WOWHEAD_FOREVER_REVIEW}</span>
      </div>
      <p className="gm-note" style={small}>Update your skills here. The next craft comes from Wowhead Forever's leveling guides, not the older client catalog's vendor locations. A recommended craft can turn yellow or green: skill-ups are not always guaranteed.</p>
      <div className="gm-wow-skill-grid">
        {WOW_PROFESSIONS.map(p=><label key={p.id} className="gm-wow-skill-field">
          <span>{p.label}</span>
          <input type="number" min={0} max={300} inputMode="numeric" className="gm-wow-skill-input"
            aria-label={p.label+" skill"} value={skill(p.id)}
            onChange={e=>setField(professionField(gameId,"skill-"+p.id),
              String(Math.max(0,Math.min(300,Math.floor(Number(e.target.value)||0)))))}/>
        </label>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,240px),1fr))",gap:10,marginTop:12}}>
        {professionIds.map(id=>{
          const curr=skill(id),path=nextForeverSkillPath(id,curr);
          const warnings=id==="leatherworking"&&curr>=145&&curr<155?
            "At your current level, Toughened Leather Gloves are green; a craft can fail to award skill. At 155, Barbaric Shoulders is trainer-learned and orange.":null;
          return <div key={id} style={{padding:12,border:"1px solid var(--border,#ddd)",borderRadius:10}}>
            <strong>{WOW_PROFESSIONS.find(p=>p.id===id)?.label} · {curr}</strong>
            <p style={{...small,margin:"7px 0 3px"}}><b>{path.name}</b> · guide range {path.range}</p>
            <p style={{...small,margin:"4px 0"}}>{path.details}</p>
            <p style={{...small,margin:"4px 0"}}><b>Materials:</b> {path.materials}</p>
            {warnings&&<p style={{...small,margin:"6px 0"}}>{warnings}</p>}
            <a href={WOWHEAD_FOREVER_LEVELING_GUIDES[id]} target="_blank" rel="noopener noreferrer" style={small}>
              Wowhead Forever leveling source ↗
            </a>
          </div>;
        })}
      </div>
    </div>

    <div className="gm-card" style={{padding:16,marginTop:12}}>
      <div className="gm-wow-section-head">
        <h3 style={{margin:0}}>📍 Everything verified for this area</h3>
        <span className="gm-wow-subtitle">{faction==="horde"?"Horde":"Alliance"} &amp; neutral only</span>
      </div>
      <p className="gm-note" style={small}>Prioritize items you can learn now, future books worth buying on the same trip, and relevant drop leads. Each row links directly to a WoW Forever source. Recent firsthand Forever drop reports qualify; unrelated Classic and unverified client location records do not.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,240px),1fr))",gap:10}}>
        <label style={small}>Search a specific area
          <select value={area} style={selectStyle} onChange={e=>setArea(e.target.value)}>
            <option value="all">All verified area stops</option>
            {groupByArea.map(([key,items])=><option key={key} value={key}>{items[0].area} · {items[0].zone} ({items.length})</option>)}
          </select>
        </label>
        <label style={small}>Find a recipe, vendor or zone
          <input type="search" value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="e.g. Ashenvale, book, bracers…" style={selectStyle}/>
        </label>
      </div>
      <div style={{display:"flex",gap:14,flexWrap:"wrap",margin:"12px 0"}}>
        <label style={small}><input type="checkbox" checked={showDistant}
          onChange={e=>setShowDistant(e.target.checked)}/> Include all future skill ranges</label>
        <label style={small}><input type="checkbox" checked={showDone}
          onChange={e=>setShowDone(e.target.checked)}/> Show collected items</label>
      </div>
      <p className="gm-note" style={small}>
        {groups.length} locations · {groups.reduce((count,g)=>count+g.items.length,0)} actionable or reported source leads.
        The list is limited to checked Wowhead Forever entries; it is not a claim that every drop in every zone is cataloged.
      </p>
      <div style={{display:"grid",gap:12}}>
        {groups.map(g=><div key={g.key} style={{border:"1px solid var(--border,#ddd)",padding:12,borderRadius:10}}>
          <h4 style={{fontSize:16,margin:"0 0 8px"}}>📍 {g.area} · {g.zone} <span style={{fontWeight:400}}>({g.items.length})</span></h4>
          {g.items.map(item=>{
            const current=skill(item.profession),canLearn=item.skill<=current;
            const done=isDone(item);
            const isFuture=item.skill>current;
            const heading=item.method==="drop"?"FARM REPORTED DROP":item.method==="train"?"VISIT TRAINER":
              canLearn?"BUY / LEARN NOW":"BUY FOR LATER";
            const description=item.profession==="leatherworking"?"Leatherworking":item.profession==="first-aid"?"First Aid":"Cooking";
            return <div key={item.id} style={{padding:"10px 0",borderTop:"1px solid var(--border,#eee)"}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start",flexWrap:"wrap"}}>
                <div style={{flex:"1 1 225px",minWidth:0}}>
                  <div style={{...small,fontWeight:700}}>{heading} · {item.name}</div>
                  <p style={{...small,margin:"3px 0"}}>{description} required {item.skill} · yours {current}{isFuture?" · collect ahead":""}</p>
                  <p style={{...small,margin:"3px 0"}}><b>{item.npc}</b> · {item.method==="drop"?"Forever player-reported drop":item.method==="train"?"Forever NPC / trainer":"Forever guide/vendor source"}</p>
                  <p className="gm-note" style={{...small,margin:"4px 0"}}>{item.note}</p>
                  {item.concern&&<p className="gm-note" style={{...small,margin:"4px 0"}}><b>Source caveat:</b> {item.concern}</p>}
                  <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:7}}>
                    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={small}>Wowhead Forever evidence ↗</a>
                    {item.guideUrl&&<a href={item.guideUrl} target="_blank" rel="noopener noreferrer" style={small}>Leveling guide ↗</a>}
                    {item.waypoint&&<button type="button" className="gm-pill" onClick={()=>copy(item.waypoint!)}>Copy TomTom</button>}
                  </div>
                </div>
                <label style={small}><input type="checkbox" checked={done} onChange={e=>setDone(item,e.target.checked)}/>
                  {item.method==="train"?"Visited":item.method==="drop"?"Obtained":"Purchased / learned"}</label>
              </div>
            </div>;
          })}
        </div>)}
      </div>
      {!groups.length&&<p className="gm-note" style={small}>No matching verified, uncollected source in this filter. You can include future skill ranges or show collected items; this does not mean there is nothing to obtain in that area.</p>}
      {message&&<p className="gm-note" role="status" style={small}>{message}</p>}
      <p className="gm-note" style={{...small,marginTop:14}}>Only Wowhead Forever pages and relevant Forever-specific reports are used for purchases and sources. Vendor stock, drops, and recipe colors cannot be queried live; check your game before spending gold. Older catalog geography is intentionally excluded.</p>
    </div>
  </section>;
}
