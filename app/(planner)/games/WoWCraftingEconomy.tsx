"use client";
import { useMemo, useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import { WOW_RECIPES, recipeLearnedKey, type WowProfessionId, type WowRecipe } from "@/lib/wow-forever-professions";
import { wowExtraField, wowMaterialKey } from "@/lib/wow-portal-extras";
type Props={gameId:string;profession:WowProfessionId;prog:GameProgress;setField:(key:string,value:string)=>void};
const inp:React.CSSProperties={width:"100%",minWidth:0,padding:"8px 10px",borderRadius:8,border:"1px solid var(--border,#ccc)",background:"var(--panel,#fff)",color:"var(--text,#222)",font:"inherit"};
const small:React.CSSProperties={fontSize:13,opacity:.86,lineHeight:1.5};
const toNum=(v:string)=>{const n=Number(v);return Number.isFinite(n)&&n>=0?n:0;};
const g=(n:number)=>n.toFixed(2)+"g";
export default function WoWCraftingEconomy({gameId,profession,prog,setField}:Props){
 const [selected,setSelected]=useState("");
 const [batch,setBatch]=useState("1");
 const [fee,setFee]=useState("5");
 const field=(value:string)=>wowExtraField(gameId,value);
 const read=(k:string)=>prog.fields[field(k)]??"";
 const save=(k:string,v:string)=>setField(field(k),v);
 const learned=useMemo(()=>WOW_RECIPES.filter(r=>r.profession===profession&&!!prog.checks[recipeLearnedKey(gameId,r.id)])
  .sort((a,b)=>(a.learnAt??999)-(b.learnAt??999)||a.name.localeCompare(b.name)),[profession,gameId,prog.checks]);
 const chosen=learned.find(r=>r.id===selected)??learned[0];
 const materialId=(name:string)=>wowMaterialKey(name);
 const saleKey=(r:WowRecipe)=>"sale-"+r.id;
 const priced=(r:WowRecipe)=>{
  if(read(saleKey(r))==="")return null;
  if(!r.reagents.every(m=>read("price-"+materialId(m.name))!==""))return null;
  const total=r.reagents.reduce((sum,m)=>sum+m.quantity*toNum(read("price-"+materialId(m.name))),0);
  const sale=toNum(read(saleKey(r)));
  const rate=Math.min(100,toNum(fee))/100;
  return {cost:total,netSale:sale*(1-rate),margin:sale*(1-rate)-total,rawNet:total*(1-rate),advantage:sale*(1-rate)-total*(1-rate)};
 };
 const ranked=learned.map(r=>({recipe:r,profit:priced(r)})).filter(row=>row.profit!==null)
   .sort((a,b)=>b.profit!.margin-a.profit!.margin).slice(0,5);
 const count=Math.min(999,Math.max(1,Math.floor(toNum(batch)||1)));
 return <section className="gm-card" style={{padding:16,marginTop:12}} aria-label="Crafting profit and materials">
  <div className="gm-panel-label">Craft next for profit · manual prices</div>
  <h3 style={{margin:"6px 0"}}>Leatherworking / crafting calculator</h3>
  <p style={small}>Enter prices from Auctionator or your Auction House. The portal has no live AH connection. Prices are in <b>gold per item</b>; fee defaults to 5% and excludes deposit, listing failures, and other costs.</p>
  {!learned.length?<p style={small}>Mark a recipe Learned in the Recipe Finder to price its crafting materials here.</p>:<>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,160px),1fr))",gap:8}}>
    <label style={small}>Learned recipe
     <select style={inp} value={chosen?.id??""} onChange={e=>setSelected(e.target.value)}>
      {learned.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
     </select>
    </label>
    <label style={small}>Batch size
     <input style={inp} type="number" min={1} max={999} step={1} value={batch} onChange={e=>setBatch(e.target.value)}/>
    </label>
    <label style={small}>Auction House fee %
     <input style={inp} type="number" min={0} max={100} step="0.5" value={fee} onChange={e=>setFee(e.target.value)}/>
    </label>
    <label style={small}>Expected sale price (g) per craft
     <input style={inp} type="number" min={0} step=".01" value={chosen?read(saleKey(chosen)):""} onChange={e=>{if(chosen)save(saleKey(chosen),e.target.value);}}/>
    </label>
   </div>
   {chosen&&<div style={{marginTop:12}}>
     <b>Materials for {count} craft{count===1?"":"s"}</b>
     <div style={{display:"grid",gap:8,marginTop:9}}>
      {chosen.reagents.map(m=>{
       const id=materialId(m.name);const owned=read("stock-"+id);
       const needed=m.quantity*count;const missing=owned===""?null:Math.max(0,needed-toNum(owned));
       return <div key={m.name} style={{border:"1px solid var(--border,#ddd)",padding:10,borderRadius:9}}>
        <p style={{...small,margin:"0 0 7px"}}><b>{m.name}</b> · Need {needed} {missing===null?"· Stock not entered":"· Buy "+missing}</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:9}}>
         <label style={small}>Price per unit (g)
          <input style={inp} type="number" min={0} step=".01" value={read("price-"+id)} onChange={e=>save("price-"+id,e.target.value)}/>
         </label>
         <label style={small}>Already have (units)
          <input style={inp} type="number" min={0} step={1} value={owned} onChange={e=>save("stock-"+id,e.target.value)}/>
         </label>
        </div>
       </div>;
      })}
     </div>
     {priced(chosen)?<div style={{marginTop:12,padding:12,borderRadius:10,background:"var(--panel,#fff)",border:"1px solid var(--border,#ddd)"}}>
       <p style={{...small,margin:"0 0 6px"}}>Market value of all crafting materials: <b>{g(priced(chosen)!.cost*count)}</b></p>
       <p style={{...small,margin:"0 0 6px"}}>Net sale proceeds after entered fee: <b>{g(priced(chosen)!.netSale*count)}</b></p>
       <p style={{...small,margin:"0 0 6px"}}>Estimated crafting margin (vs market value of materials): <b>{g(priced(chosen)!.margin*count)}</b></p>
       <p style={{...small,margin:"0 0 6px"}}>Extra proceeds vs selling raw materials on AH: <b>{g(priced(chosen)!.advantage*count)}</b></p>
       <p style={small}>Buying cost of missing ingredients: {chosen.reagents.every(m=>read("stock-"+materialId(m.name))!=="")?g(chosen.reagents.reduce((n,m)=>n+Math.max(0,m.quantity*count-toNum(read("stock-"+materialId(m.name))))*toNum(read("price-"+materialId(m.name))),0)):"Enter your inventory to calculate"}.</p>
     </div>:<p style={small}>Enter an expected sale price and every material price to calculate profit. Do not mistake an unpriced recipe for an unprofitable one.</p>}
   </div>}
   <details style={{marginTop:14}}><summary style={{fontWeight:700,cursor:"pointer"}}>My priced learned recipes ({ranked.length} ranked)</summary>
    {ranked.length?<div style={{display:"grid",gap:8,marginTop:10}}>
      {ranked.map(({recipe,profit})=><button type="button" key={recipe.id} className="gm-pill" onClick={()=>setSelected(recipe.id)} style={{textAlign:"left"}}>
        {recipe.name} · {g(profit!.margin)} estimated margin / craft
      </button>)}
    </div>:<p style={small}>No complete pricing yet. Add sale and ingredient prices above to rank your learned crafts.</p>}
   </details>
  </>}
  <p style={{...small,marginTop:12}}>Some Forever recipes produce multiple items or require specialty reagents. Verify yield, stock, and bind-on-pickup rules in-game. This calculator assumes one sellable output per craft and no deposit losses.</p>
 </section>;
}
