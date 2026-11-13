"use client";
import type { GameProgress } from "@/lib/games-data";
import { WOW_HUNTER_DUNGEONS } from "@/lib/wow-forever-dungeon-gear";
import { WOW_GEAR_SLOTS, wowExtraField } from "@/lib/wow-portal-extras";
type Props={gameId:string;prog:GameProgress;setField:(key:string,value:string)=>void;level:number};
const input:React.CSSProperties={background:"var(--panel,#fff)",color:"var(--text,#222)",border:"1px solid var(--border,#ccc)",borderRadius:8,padding:"8px 10px",font:"inherit",width:"100%",minWidth:0};
const note:React.CSSProperties={fontSize:13,opacity:.85,lineHeight:1.5};
const number=(s:string)=>{const n=Number(s);return Number.isFinite(n)&&n>=0?n:0;};
export default function WoWEquipmentTracker({gameId,prog,setField,level}:Props){
 const field=(id:string)=>wowExtraField(gameId,id);
 const read=(id:string)=>prog.fields[field(id)]??"";
 const save=(id:string,v:string)=>setField(field(id),v);
 const targetOptions=WOW_HUNTER_DUNGEONS.flatMap(d=>d.loot.map(t=>({key:d.id+"-"+t.id,slot:t.slot,name:t.name,dungeon:d.name,level:t.requiredLevel})))
    .filter(t=>t.level<=level+4);
 const chosen=targetOptions.find(t=>t.key===read("compare-target"));
 const current=chosen?{dps:read("gear-"+chosen.slot+"-dps"),agi:read("gear-"+chosen.slot+"-agi"),ap:read("gear-"+chosen.slot+"-ap")}:null;
 const candidate=chosen?{dps:read("target-"+chosen.key+"-dps"),agi:read("target-"+chosen.key+"-agi"),ap:read("target-"+chosen.key+"-ap")}:null;
 const comp=(label:string,a:string|undefined,b:string|undefined)=>!a||!b?"":label+": "+(number(b)-number(a)>=0?"+":"")+(number(b)-number(a)).toFixed(1);
 return <section className="gm-card" style={{padding:16,marginTop:12}}>
   <div className="gm-panel-label">Gear ownership &amp; tooltip comparison</div>
   <h3 style={{margin:"6px 0"}}>What am I wearing?</h3>
   <p style={note}>Save your equipped item names and tooltip numbers below. Forever stats can change, so the portal does not invent item stats or automatically claim a drop is an upgrade.</p>
   <details>
    <summary style={{fontWeight:700,cursor:"pointer"}}>Edit current equipment ({WOW_GEAR_SLOTS.length} slots)</summary>
    <div style={{display:"grid",gap:9,marginTop:12}}>
     {WOW_GEAR_SLOTS.map(([slot,label])=><div key={slot} style={{border:"1px solid var(--border,#ddd)",borderRadius:9,padding:10}}>
       <b style={{fontSize:13}}>{label}</b>
       <label style={{display:"block",marginTop:5,fontSize:12}}>Equipped item<input style={input} value={read("gear-"+slot+"-name")} placeholder="Item name" onChange={e=>save("gear-"+slot+"-name",e.target.value)}/></label>
       <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:7,marginTop:7}}>
        {([["dps","DPS"],["agi","Agility"],["ap","Attack Power"]] as const).map(([stat,title])=><label key={stat} style={{fontSize:12}}>{title}
         <input style={input} type="number" min={0} step=".1" value={read("gear-"+slot+"-"+stat)} onChange={e=>save("gear-"+slot+"-"+stat,e.target.value)}/>
        </label>)}
       </div>
     </div>)}
    </div>
   </details>
   <div style={{marginTop:15}}>
    <h4 style={{margin:"0 0 7px"}}>Compare a dungeon item</h4>
    <label style={note}>Candidate from known dungeon targets
     <select style={{...input,marginTop:5}} value={read("compare-target")} onChange={e=>save("compare-target",e.target.value)}>
      <option value="">Select a potential drop</option>
      {targetOptions.map(t=><option key={t.key} value={t.key}>{t.name} · {t.dungeon}</option>)}
     </select>
    </label>
    {chosen&&<div style={{padding:12,marginTop:9,border:"1px solid var(--border,#ddd)",borderRadius:9}}>
      <p style={{...note,margin:"0 0 9px"}}>Compare <b>{chosen.name}</b> against <b>{read("gear-"+chosen.slot+"-name")||"your "+chosen.slot+" slot"}</b>. Enter values from the actual game tooltip.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:7}}>
       {([["dps","DPS"],["agi","Agility"],["ap","Attack Power"]] as const).map(([stat,title])=><label key={stat} style={{fontSize:12}}>New {title}
        <input style={input} type="number" min={0} step=".1" value={read("target-"+chosen.key+"-"+stat)} onChange={e=>save("target-"+chosen.key+"-"+stat,e.target.value)}/>
       </label>)}
      </div>
      {current&&candidate&&<p style={{...note,marginTop:10}}>
       {([comp("DPS",current.dps,candidate.dps),comp("Agility",current.agi,candidate.agi),comp("AP",current.ap,candidate.ap)].filter(Boolean).join(" · "))||"Enter both current and candidate values for a stat to see the difference."}
      </p>}
      <p style={note}>This is a side-by-side stat difference, <b>not</b> a full damage simulation. If you decide it is not worth farming, use Have / skip in Dungeon Gear to remove it from your priority list.</p>
    </div>}
   </div>
 </section>;
}
