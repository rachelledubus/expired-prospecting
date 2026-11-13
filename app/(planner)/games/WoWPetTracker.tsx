"use client";
import { useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import { WOW_PET_FAMILIES, wowExtraField } from "@/lib/wow-portal-extras";
type Props={gameId:string;prog:GameProgress;setField:(key:string,value:string)=>void};
const textField:React.CSSProperties={background:"var(--panel,#fff)",color:"var(--text,#222)",border:"1px solid var(--border,#ccc)",borderRadius:8,padding:10,font:"inherit",width:"100%",minWidth:0};
const hint:React.CSSProperties={fontSize:13,lineHeight:1.5,opacity:.85};
export default function WoWPetTracker({gameId,prog,setField}:Props){
 const [expanded,setExpanded]=useState(0);
 const field=(id:string)=>wowExtraField(gameId,id);
 const val=(slot:number,name:string)=>prog.fields[field("pet-"+slot+"-"+name)]??"";
 const save=(slot:number,name:string,v:string)=>setField(field("pet-"+slot+"-"+name),v);
 const familyNames=WOW_PET_FAMILIES.map(p=>p.name);
 return <section className="gm-card" style={{padding:16,marginTop:12}} aria-label="Hunter pet roster">
  <div className="gm-panel-label">Hunter pet management</div>
  <h3 style={{margin:"6px 0"}}>Pet roster and threat control</h3>
  <p style={hint}>Track your active pet and up to two stabled alternatives. These are personal notes; pet abilities and stable capacity must be confirmed in your Forever client.</p>
  <div style={{display:"grid",gap:9}}>
   {[0,1,2].map(slot=><section key={slot} style={{border:"1px solid var(--border,#ddd)",borderRadius:10,padding:12}}>
    <button type="button" style={{border:0,background:"none",color:"inherit",cursor:"pointer",width:"100%",textAlign:"left",font:"inherit",fontWeight:700}}
      aria-expanded={expanded===slot} onClick={()=>setExpanded(expanded===slot?-1:slot)}>
      {slot===0?"Active pet":"Stable slot "+slot} · {val(slot,"name")||"Not recorded"} {expanded===slot?"▾":"▸"}
    </button>
    {expanded===slot&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,170px),1fr))",gap:10,marginTop:10}}>
      <label style={hint}>Pet name<input style={textField} value={val(slot,"name")} maxLength={70}
       onChange={e=>save(slot,"name",e.target.value)} placeholder="Pet's name"/></label>
      <label style={hint}>Family<select style={textField} value={val(slot,"family")} onChange={e=>save(slot,"family",e.target.value)}>
       <option value="">Select family</option>{familyNames.map(n=><option key={n}>{n}</option>)}
       <option value="Other">Other / custom</option>
      </select></label>
      <label style={hint}>Pet level<input style={textField} type="number" min={1} max={60} value={val(slot,"level")} onChange={e=>save(slot,"level",e.target.value)}/></label>
      <label style={hint}>Role<select style={textField} value={val(slot,"role")} onChange={e=>save(slot,"role",e.target.value)}>
       <option value="">Choose role</option><option>Solo tank</option><option>Dungeon DPS</option><option>Multi-mob threat</option><option>Utility</option>
      </select></label>
      <label style={hint}>Growl rank<input style={textField} value={val(slot,"growl")} onChange={e=>save(slot,"growl",e.target.value)} placeholder="Rank / not learned"/></label>
      <label style={hint}>Special ability and rank<input style={textField} value={val(slot,"special")} onChange={e=>save(slot,"special",e.target.value)} placeholder="Claw, Bite, Screech…"/></label>
      <label style={{...hint,gridColumn:"1/-1"}}>Taming / trainer notes<input style={textField} value={val(slot,"notes")} maxLength={350} onChange={e=>save(slot,"notes",e.target.value)} placeholder="Where found; next rank to learn"/></label>
    </div>}
   </section>)}
  </div>
  <details style={{marginTop:14}}>
   <summary style={{cursor:"pointer",fontWeight:700}}>Which pet fits my goal?</summary>
   <div style={{display:"grid",gap:8,marginTop:10}}>
    {WOW_PET_FAMILIES.map(p=><p key={p.name} style={{...hint,margin:0}}><b>{p.name} — {p.purpose}:</b> {p.note}</p>)}
   </div>
  </details>
  <details style={{marginTop:12}}>
   <summary style={{cursor:"pointer",fontWeight:700}}>Pet won't hold several enemies?</summary>
   <ol style={{...hint,paddingLeft:22}}>
    <li>Confirm Growl is trained to the highest usable rank and enabled for <b>solo</b> play.</li>
    <li>Consider an appropriate Screech-capable pet if available in Forever; verify its ability rank.</li>
    <li>Pull small packs, let the pet establish threat before Multi-Shot, and use Mend Pet early.</li>
    <li>In a dungeon with your Paladin tank: Growl <b>OFF</b>, assist his target, and avoid pulling extra packs.</li>
    <li>If the pet returns after each kill, verify its stance and whether the next enemy is being targeted; macros cannot force permanent combat when no hostile target remains.</li>
   </ol>
   <p style={hint}>A pet distraction macro cannot guarantee the pet stays behind or holds all enemy aggro while you escape.</p>
  </details>
 </section>;
}
