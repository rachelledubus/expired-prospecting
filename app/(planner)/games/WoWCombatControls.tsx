"use client";
import { useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import { WOW_COMBAT_BINDS, WOW_MACRO_PRESETS, wowExtraField } from "@/lib/wow-portal-extras";
type Props={gameId:string;prog:GameProgress;setField:(key:string,value:string)=>void};
const input:React.CSSProperties={background:"var(--panel,#fff)",color:"var(--text,#222)",border:"1px solid var(--border,#ccc)",borderRadius:8,padding:10,font:"inherit",width:"100%",minWidth:0};
const small:React.CSSProperties={fontSize:13,lineHeight:1.5,opacity:.85};
export default function WoWCombatControls({gameId,prog,setField}:Props){
 const [copied,setCopied]=useState("");
 const key=(id:string)=>wowExtraField(gameId,id);
 const copy=(value:string)=>{void navigator.clipboard.writeText(value).then(()=>setCopied("Macro copied; paste into /macro in game.")).catch(()=>setCopied("Copy blocked. Select the macro text manually."));};
 return <div className="gm-card" style={{padding:16,marginTop:12}}>
  <div className="gm-panel-label">My combat setup</div>
  <h3 style={{margin:"6px 0"}}>Editable keybinds and macros</h3>
  <p style={small}>These defaults match your latest described Hunter setup. Edit any binding and it saves to your portal. The portal cannot change in-game keybindings automatically.</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,220px),1fr))",gap:10,marginTop:12}}>
   {WOW_COMBAT_BINDS.map(([id,k,description])=><label key={id} style={{fontSize:13,fontWeight:650}}>
     <span>{k}</span>
     <input style={{...input,marginTop:5}} maxLength={120} aria-label={"Action for "+k}
       value={prog.fields[key("bind-"+id)]??description}
       onChange={e=>setField(key("bind-"+id),e.target.value)}/>
   </label>)}
  </div>
  <details style={{marginTop:16}}>
   <summary style={{cursor:"pointer",fontWeight:700}}>My copyable macros ({WOW_MACRO_PRESETS.length})</summary>
   <p style={small}>Macro syntax can change with Forever patches. Test each one safely before using it in combat. Your edits are saved.</p>
   <div style={{display:"grid",gap:14}}>
    {WOW_MACRO_PRESETS.map(m=><div key={m.id} style={{padding:12,border:"1px solid var(--border,#ddd)",borderRadius:10}}>
      <b>{m.name}</b><p style={small}>{m.note}</p>
      <textarea rows={Math.max(4,m.script.split("\n").length+1)} aria-label={m.name+" macro"}
        value={prog.fields[key("macro-"+m.id)]??m.script}
        onChange={e=>setField(key("macro-"+m.id),e.target.value)}
        style={{...input,resize:"vertical",fontFamily:"monospace",fontSize:13}}/>
      <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
       <button className="gm-pill" type="button" onClick={()=>copy(prog.fields[key("macro-"+m.id)]??m.script)}>Copy macro</button>
       <button className="gm-pill" type="button" onClick={()=>setField(key("macro-"+m.id),m.script)}>Restore suggested text</button>
      </div>
    </div>)}
   </div>
  </details>
  <p style={{...small,marginTop:12}}>For the tank-target macro: select the tank and use <code>/focus</code> first if your client supports focus targets. Use your own tested macro if Forever handles focus/pet stances differently.</p>
  {copied&&<p role="status" style={small}>{copied}</p>}
 </div>;
}
