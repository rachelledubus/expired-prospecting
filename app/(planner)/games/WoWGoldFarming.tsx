"use client";

import { useMemo, useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import { WOW_FARMS, grayMobThreshold, wowExtraField } from "@/lib/wow-portal-extras";

type Props = {
  gameId:string; level:number; prog:GameProgress;
  setField:(key:string,value:string)=>void; compact?:boolean;
};
const input:React.CSSProperties={padding:"8px 10px",border:"1px solid var(--border,#bbb)",borderRadius:8,background:"var(--panel,#fff)",color:"var(--text,#222)",minWidth:0,width:"100%",font:"inherit"};
const note:React.CSSProperties={fontSize:13,opacity:.82,lineHeight:1.5};
const parse=(value:string|undefined)=>{const n=Number(value);return Number.isFinite(n)&&n>=0?n:0;};

export default function WoWGoldFarming({gameId,level,prog,setField,compact=false}:Props){
  const [noXpOnly,setNoXpOnly]=useState(true);
  const [kind,setKind]=useState("all");
  const [copied,setCopied]=useState("");
  const grayAt=grayMobThreshold(level);
  const field=(name:string)=>wowExtraField(gameId,name);
  const gold=(id:string)=>prog.fields[field("farm-"+id+"-gold")];
  const minutes=(id:string)=>prog.fields[field("farm-"+id+"-minutes")];
  const earnings=(id:string)=>{
    const g=gold(id),t=minutes(id);
    return g!==undefined&&t!==undefined&&parse(t)>0?60*parse(g)/parse(t):null;
  };
  const farms=useMemo(()=>WOW_FARMS.filter(f=>(!noXpOnly||f.maxMob<=grayAt)&&(kind==="all"||kind===f.kind)).sort((a,b)=>{
    const av=earnings(a.id),bv=earnings(b.id);
    if(av!==null||bv!==null)return (bv??-1)-(av??-1);
    return a.maxMob-b.maxMob;
  }),[grayAt,noXpOnly,kind,prog.fields]);
  const list=compact?farms.slice(0,2):farms;
  const copy=(value:string)=>{void navigator.clipboard.writeText(value).then(()=>setCopied("Waypoint copied")).catch(()=>setCopied("Copy unavailable; select waypoint text manually."));};
  return <section className="gm-card" style={{padding:16,marginTop:12}} aria-label="XP-safe gold farming">
    <div className="gm-panel-label">Gold farming · character level {level}</div>
    <h3 style={{margin:"7px 0"}}>Earn gold without character XP</h3>
    <p style={note}>Classic-style conservative gray cutoff: mobs <strong>level {grayAt} or lower</strong> should award no kill XP at your level. <strong>Verify gray enemy names in Forever before every pull.</strong> Dungeon ranges are approximate; quests, exploration and grouped kills can award XP. No fishing farms.</p>
    <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:12,margin:"10px 0"}}>
      <label style={{display:"inline-flex",gap:7,alignItems:"center"}}>
        <input type="checkbox" checked={noXpOnly} onChange={e=>setNoXpOnly(e.target.checked)}/>
        Only gray-level farms
      </label>
      {!compact&&<label style={{display:"inline-flex",alignItems:"center",gap:7}}>Type
        <select value={kind} onChange={e=>setKind(e.target.value)} style={{...input,width:"auto"}}>
          <option value="all">All</option><option value="dungeon">Dungeons</option><option value="outdoors">Outdoor</option>
        </select>
      </label>}
    </div>
    {list.length===0&&<p style={note}>No farms in this curated list meet that mob-level cutoff. Turn off the filter only if you are willing to inspect individual gray mobs.</p>}
    <div style={{display:"grid",gap:10}}>
      {list.map(f=><article key={f.id} style={{padding:12,border:"1px solid var(--border,#ddd)",borderRadius:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
          <div><b>{f.name}</b><p style={{...note,margin:"5px 0 0"}}>{f.zone} · Approx. mobs {f.minMob}–{f.maxMob} · {f.kind==="dungeon"?"Dungeon":"Outdoors"}</p></div>
          <span style={{fontSize:12,fontWeight:700}}>{f.maxMob<=grayAt?"Gray range expected":"XP risk — check mobs"}</span>
        </div>
        <p style={{...note,margin:"7px 0"}}><b>Sell:</b> {f.rewards.join(" · ")}</p>
        <details><summary style={{cursor:"pointer",fontWeight:600,fontSize:13}}>Route, risk &amp; earnings</summary>
          <p style={note}>{f.note}</p>
          {f.hordeWarning&&<p style={note}><b>Travel caution:</b> {f.hordeWarning}</p>}
          {f.waypoint&&<p style={note}><code>{f.waypoint}</code> <button type="button" className="gm-pill" onClick={()=>copy(f.waypoint!)}>Copy TomTom</button></p>}
          <p style={note}><a href={f.sourceUrl} target="_blank" rel="noopener noreferrer">Check reference route ↗</a> · Server XP and drop rates not verified live.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:9}}>
            <label style={note}>Gold earned (one session)
              <input style={input} type="number" min={0} step=".01" placeholder="Enter gold" value={gold(f.id)??""} onChange={e=>setField(field("farm-"+f.id+"-gold"),e.target.value)}/>
            </label>
            <label style={note}>Minutes spent
              <input style={input} type="number" min={0} step="1" placeholder="20" value={minutes(f.id)??""} onChange={e=>setField(field("farm-"+f.id+"-minutes"),e.target.value)}/>
            </label>
          </div>
          <p style={note}>{earnings(f.id)===null?"Enter one measured session to compare actual gold/hour.":"Your recorded pace: "+earnings(f.id)!.toFixed(2)+" gold/hour (not a forecast)."}</p>
        </details>
      </article>)}
    </div>
    {compact&&<p style={{...note,marginTop:10}}>Open <b>Gold farms</b> for all routes, dungeon directions and your measured gold/hour comparisons.</p>}
    {copied&&<p role="status" style={note}>{copied}</p>}
  </section>;
}
