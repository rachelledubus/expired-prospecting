"use client";

import { useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import { WOW_PROFESSIONS, professionField } from "@/lib/wow-forever-professions";
import { VERIFIED_WOWHEAD_FOREVER_REVIEW, VERIFIED_WOWHEAD_FOREVER_STOPS,
  WOWHEAD_FOREVER_LEVELING_GUIDES, nextForeverSkillPath, type VerifiedProfession } from "@/lib/wow-forever-verified-sources";

type Props = {gameId:string;prog:GameProgress;setCheck:(key:string,value:boolean)=>void;setField:(key:string,value:string)=>void;initialQuery?:string};
const profs:VerifiedProfession[]=["leatherworking","first-aid","cooking"];
const name=(x:string)=>x==="first-aid"?"First Aid":x==="leatherworking"?"Leatherworking":"Cooking";
const control:React.CSSProperties={width:"100%",minHeight:42,padding:8,borderRadius:9,background:"var(--panel,#fff)",color:"var(--text,#222)",border:"1px solid var(--border,#ccc)",font:"inherit"};
const small:React.CSSProperties={fontSize:13,lineHeight:1.55};

export default function WoWForeverVerifiedProfessions({gameId,prog,setCheck,setField,initialQuery=""}:Props){
  const [area,setArea]=useState("all");
  const [query,setQuery]=useState(initialQuery);
  const [showFuture,setShowFuture]=useState(false);
  const [showCompleted,setShowCompleted]=useState(false);
  const [copyStatus,setCopyStatus]=useState("");
  const faction=prog.fields[gameId+"|faction"]==="alliance"?"alliance":"horde";
  const skill=(id:string)=>{
    const p=WOW_PROFESSIONS.find(x=>x.id===id);
    const raw=prog.fields[professionField(gameId,"skill-"+id)];
    return raw===undefined?(p?.initial??0):Math.max(0,Math.min(300,Number(raw)||0));
  };
  const entries=VERIFIED_WOWHEAD_FOREVER_STOPS.filter(item=>item.faction===faction||item.faction==="neutral");
  const stops=[...new Set(entries.map(x=>x.zone+"|"+x.area))].sort();
  const visible=entries.filter(item=>{
    const done=!!prog.checks[gameId+"|verified-source|"+item.id];
    const current=skill(item.profession);
    const isBundle=item.name==="Expert First Aid - Under Wraps"||item.name==="Expert Cookbook"||item.name.startsWith("Manual: ");
    const near=showFuture||(isBundle&&current<225)||(item.skill<=current+35&&item.skill>=current-75);
    const location=item.zone+"|"+item.area;
    const match=(item.name+" "+item.zone+" "+item.area+" "+item.npc).toLowerCase().includes(query.toLowerCase());
    return (showCompleted||!done)&&near&&(area==="all"||area===location)&&match;
  }).sort((a,b)=>a.zone.localeCompare(b.zone)||a.area.localeCompare(b.area)||
    (a.method==="buy"?0:a.method==="train"?1:2)-(b.method==="buy"?0:b.method==="train"?1:2)||a.skill-b.skill);
  const keys=[...new Set(visible.map(x=>x.zone+"|"+x.area))];
  return <section className="gm-wow-professions" aria-label="Wowhead Forever confirmed profession sources">
    <div className="gm-card" style={{padding:16,marginTop:12}}>
      <h3 style={{margin:"0 0 6px"}}>Profession skill-up rescue</h3>
      <p className="gm-note" style={small}>All suggestions below are from Wowhead Forever guides, item pages, or firsthand Forever reports. Updated source review: {VERIFIED_WOWHEAD_FOREVER_REVIEW}. Skill-up colors can change; orange is guaranteed, yellow and green are not.</p>
      <div className="gm-wow-skill-grid">
        {WOW_PROFESSIONS.map(p=><label key={p.id} className="gm-wow-skill-field">
          <span>{p.label}</span>
          <input type="number" inputMode="numeric" min={0} max={300} className="gm-wow-skill-input"
            value={skill(p.id)} onChange={e=>setField(professionField(gameId,"skill-"+p.id),
            String(Math.max(0,Math.min(300,Math.floor(Number(e.target.value)||0)))))}/>
        </label>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,220px),1fr))",gap:10,marginTop:12}}>
        {profs.map(id=>{
          const plan=nextForeverSkillPath(id,skill(id));
          return <div key={id} style={{border:"1px solid var(--border,#ddd)",borderRadius:10,padding:12}}>
            <b>{name(id)} {skill(id)}</b>
            <p style={{...small,margin:"6px 0"}}><b>Next:</b> {plan.name} ({plan.range})</p>
            <p style={{...small,margin:"6px 0"}}>{plan.details}</p>
            <p style={{...small,margin:"6px 0"}}><b>Materials:</b> {plan.materials}</p>
            <a href={WOWHEAD_FOREVER_LEVELING_GUIDES[id]} target="_blank" rel="noopener noreferrer" style={small}>Verify on Wowhead Forever ↗</a>
          </div>;
        })}
      </div>
    </div>
    <div className="gm-card" style={{padding:16,marginTop:12}}>
      <h3 style={{margin:"0 0 5px"}}>📍 Buy, train or farm in this area</h3>
      <p className="gm-note" style={small}>An area shopping checklist for your skill and faction. You will see future-use books on the same visit, but not outdated Classic vendor tables. A Forever guide is source evidence, not a live stock guarantee.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,220px),1fr))",gap:8}}>
        <label style={small}>Area
          <select value={area} onChange={e=>setArea(e.target.value)} style={control}>
            <option value="all">All source-checked areas</option>
            {stops.map(key=><option key={key} value={key}>{key.replace("|"," · ")}</option>)}
          </select>
        </label>
        <label style={small}>Search pattern, vendor or zone
          <input type="search" value={query} onChange={e=>setQuery(e.target.value)} style={control} placeholder="e.g. Ashenvale, book"/>
        </label>
      </div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",margin:"12px 0"}}>
        <label style={small}><input type="checkbox" checked={showFuture} onChange={e=>setShowFuture(e.target.checked)}/> All future skills</label>
        <label style={small}><input type="checkbox" checked={showCompleted} onChange={e=>setShowCompleted(e.target.checked)}/> Include collected</label>
      </div>
      <p className="gm-note" style={small}>{visible.length} verified sources across {keys.length} locations. Source completeness varies by zone.</p>
      {keys.map(key=><div key={key} style={{border:"1px solid var(--border,#ddd)",borderRadius:10,padding:12,marginBottom:10}}>
        <h4 style={{fontSize:15,margin:"0 0 7px"}}>📍 {key.replace("|"," · ")}</h4>
        {visible.filter(item=>item.zone+"|"+item.area===key).map(item=>{
          const done=!!prog.checks[gameId+"|verified-source|"+item.id];
          const current=skill(item.profession);
          const status=item.method==="drop"?"FOREVER-REPORTED DROP":item.method==="train"?"TRAIN HERE":item.skill>current?"BUY FOR LATER":"BUY NOW";
          return <div key={item.id} style={{borderTop:"1px solid var(--border,#ddd)",padding:"9px 0"}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
              <div style={{flex:"1 1 200px"}}>
                <b style={small}>{status} · {item.name}</b>
                <p style={{...small,margin:"4px 0"}}>{name(item.profession)} · required skill {item.skill} · current {current}</p>
                <p style={{...small,margin:"4px 0"}}><b>{item.npc}</b> · {item.note}</p>
                {item.concern&&<p className="gm-note" style={{...small,margin:"4px 0"}}><b>Source caveat:</b> {item.concern}</p>}
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={small}>Open WoW Forever evidence ↗</a>
                {item.waypoint&&<button type="button" className="gm-pill" style={{marginLeft:8}}
                  onClick={async()=>{try{await navigator.clipboard.writeText(item.waypoint||"");setCopyStatus("Copied "+item.waypoint);}
                    catch{setCopyStatus("Copy manually: "+item.waypoint);}}}>TomTom</button>}
              </div>
              <label style={small}><input type="checkbox" checked={done} onChange={e=>setCheck(gameId+"|verified-source|"+item.id,e.target.checked)}/>
                {item.method==="train"?"Visited":item.method==="drop"?"Obtained":"Purchased"}</label>
            </div>
          </div>;
        })}
      </div>)}
      {!visible.length&&<p className="gm-note" style={small}>No matching source-checked items at this skill. Turn on “All future skills” or search another area; this does not mean there are no other drops.</p>}
      {copyStatus&&<p className="gm-note" role="status" style={small}>{copyStatus}</p>}
    </div>
  </section>;
}
