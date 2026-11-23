"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import { WOW_PROFESSIONS, professionField } from "@/lib/wow-forever-professions";
import { VERIFIED_WOWHEAD_FOREVER_REVIEW, VERIFIED_WOWHEAD_FOREVER_STOPS,
  WOWHEAD_FOREVER_LEVELING_GUIDES, nextForeverSkillPath, FOREVER_LATE_LEATHERWORKING_STEPS, FOREVER_LW_276_OPTIONS, foreverExpectedCrafts, FOREVER_BUDGET_LEVELING_SOURCE_IDS,
  FOREVER_BUDGET_LEVELING_NOTES, type VerifiedProfession } from "@/lib/wow-forever-verified-sources";

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
  const [materialPrices,setMaterialPrices]=useState({
    ruggedLeather:"", heavyScorpidScale:"", curedRuggedHide:"", runeThread:"", leggingsPatternGold:"0"
  });
  const lw276Marker=gameId+"|profession-lw-276-update-20261123";
  const initializedLw276=useRef(false);
  useEffect(()=>{
    if(initializedLw276.current||prog.fields[lw276Marker]==="done")return;
    initializedLw276.current=true;
    const saved=Number(prog.fields[professionField(gameId,"skill-leatherworking")]??152);
    if(!Number.isFinite(saved)||saved<276)setField(professionField(gameId,"skill-leatherworking"),"276");
    setField(lw276Marker,"done");
  },[gameId,lw276Marker,prog.fields,setField]);
  const faction=prog.fields[gameId+"|faction"]==="alliance"?"alliance":"horde";
  const skill=(id:string)=>{
    const p=WOW_PROFESSIONS.find(x=>x.id===id);
    const raw=prog.fields[professionField(gameId,"skill-"+id)];
    return raw===undefined?(p?.initial??0):Math.max(0,Math.min(300,Number(raw)||0));
  };
  // Only source-checked, efficient leveling necessities. No collectible, expensive
  // alternative, or drop-only recipes are displayed as shopping actions.
  const entries=VERIFIED_WOWHEAD_FOREVER_STOPS.filter(item=>
    (item.faction===faction||item.faction==="neutral")&&FOREVER_BUDGET_LEVELING_SOURCE_IDS.has(item.id));
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
  const priceFields=[
    {key:"ruggedLeather",label:"Rugged Leather"},
    {key:"heavyScorpidScale",label:"Heavy Scorpid Scale"},
    {key:"curedRuggedHide",label:"Cured Rugged Hide"},
    {key:"runeThread",label:"Rune Thread"}
  ] as const;
  const hasMaterialPrices=priceFields.every(p=>materialPrices[p.key].trim()!==""&&Number.isFinite(Number(materialPrices[p.key]))&&Number(materialPrices[p.key])>=0);
  const estimates=FOREVER_LW_276_OPTIONS.map(option=>{
    const attempts=foreverExpectedCrafts(skill("leatherworking"),300,option.yellowAt,option.greenAt,option.grayAt);
    const silver=attempts*(option.ruggedLeather*Number(materialPrices.ruggedLeather||0)+
       option.heavyScorpidScale*Number(materialPrices.heavyScorpidScale||0)+
       option.curedRuggedHide*Number(materialPrices.curedRuggedHide||0)+
       option.runeThread*Number(materialPrices.runeThread||0))+
       (option.id==="helm"?250:100*Number(materialPrices.leggingsPatternGold||0));
    return {...option,attempts,estimatedGold:silver/100};
  });
  const cheapest=hasMaterialPrices?estimates.reduce((a,b)=>a.estimatedGold<=b.estimatedGold?a:b):null;
  return <section className="gm-wow-professions" aria-label="Wowhead Forever confirmed profession sources">
    <div className="gm-card" style={{padding:16,marginTop:12}}>
      <h3 style={{margin:"0 0 6px"}}>Profession skill-up rescue</h3>
      <p className="gm-note" style={small}>All suggestions below are from Wowhead Forever guides, item pages, or firsthand Forever reports. Updated source review: {VERIFIED_WOWHEAD_FOREVER_REVIEW}. Skill-up colors can change; orange is guaranteed, yellow and green are not.</p>
      <p className="gm-note" style={small}>
        <b>November 19 Forever hotfix:</b> Vendors now pay less for some crafted Leatherworking armor, so older vendor-profit advice is unreliable. Journeyman Campfire Kit can now be placed at Cooking 90 (previously 140).{" "}
        <a href="https://www.wowhead.com/forever/blue-tracker/news/eu/wow-forever-hotfixes-november-19-2026-world-of-warcraft-blizzard-news-24315281"
          target="_blank" rel="noopener noreferrer">Read the latest Blizzard hotfixes via Wowhead Forever ↗</a>
      </p>
      <div className="gm-wow-skill-grid">
        {WOW_PROFESSIONS.map(p=><label key={p.id} className="gm-wow-skill-field">
          <span>{p.label}</span>
          <input type="number" inputMode="numeric" min={0} max={300} className="gm-wow-skill-input"
            value={skill(p.id)} onChange={e=>setField(professionField(gameId,"skill-"+p.id),
            String(Math.max(0,Math.min(300,Math.floor(Number(e.target.value)||0)))))}/>
        </label>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,240px),1fr))",gap:10,marginTop:12}}>
        {profs.map(id=>{
          const plan=nextForeverSkillPath(id,skill(id));
          return <div key={id} style={{border:"1px solid var(--border,#ddd)",borderRadius:10,padding:12}}>
            <b>{name(id)} {skill(id)}</b>
            <p style={{...small,margin:"6px 0"}}><b>Next:</b> {plan.name} ({plan.range})</p>
            <p style={{...small,margin:"6px 0"}}>{plan.details}</p>
            <p style={{...small,margin:"6px 0"}}><b>Materials:</b> {plan.materials}</p>
            <a href={WOWHEAD_FOREVER_LEVELING_GUIDES[id]} target="_blank" rel="noopener noreferrer" style={small}>Verify on Wowhead Forever ↗</a>
            {id==="leatherworking"&&skill(id)<300&&<details open={skill(id)>=265} style={{marginTop:12,borderTop:"1px solid var(--border,#ddd)",paddingTop:9}}>
              <summary style={{...small,cursor:"pointer",fontWeight:650}}>Leatherworking 276–300 · cheapest gold, not just fewest materials</summary>
              <p className="gm-note" style={small}>You are already at skill 276. Do not buy Wicked Leather Headband or Blue Suede Bracers patterns at inflated AH prices. Compare a farmable Heavy Scorpid Leggings pattern against the 2g 50s vendor Heavy Scorpid Helm pattern. Neither requires Eastern Plaguelands. The lower gold cost depends on your material prices and the time you spend farming.</p>
              {skill(id)>=275&&<div style={{border:"1px solid var(--border,#ddd)",padding:10,borderRadius:8,margin:"9px 0"}}>
                <b style={small}>Compare total gold cost · starting at skill {skill(id)}</b>
                <p style={{...small,margin:"6px 0"}}>Enter your Auctionator buyout prices in <b>silver per item</b>. The calculator includes the pattern and estimated extra yellow/green crafts, not just recipe materials.</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(115px,1fr))",gap:8}}>
                  {priceFields.map(p=><label key={p.key} style={small}>{p.label}
                    <input type="number" min={0} step="0.01" placeholder="Silver per 1" style={{...control,minHeight:36}} value={materialPrices[p.key]}
                      onChange={e=>setMaterialPrices(prev=>({...prev,[p.key]:e.target.value}))}/>
                  </label>)}
                  <label style={small}>Leggings pattern (gold)
                    <input type="number" min={0} step="0.01" style={{...control,minHeight:36}} value={materialPrices.leggingsPatternGold}
                      onChange={e=>setMaterialPrices(prev=>({...prev,leggingsPatternGold:e.target.value}))}/>
                    <span className="gm-note">0 if farming it yourself</span>
                  </label>
                </div>
                {hasMaterialPrices?<div style={{marginTop:10}}>
                  {estimates.map(e=><p key={e.id} style={{...small,margin:"6px 0"}}>
                    <b>{e.name}: {e.estimatedGold.toFixed(2)}g</b> · about {e.attempts} crafts {cheapest?.id===e.id?"· lowest estimated gold":""}
                  </p>)}
                  <p className="gm-note" style={small}>Craft estimates: one per orange point, ~1.5 per yellow, ~3 per green. Actual attempts, pattern-drop time and sales proceeds vary. Recalculate using current market prices.</p>
                </div>:<p className="gm-note" style={{...small,margin:"8px 0 0"}}>Enter all four reagent prices to see which route has the lower estimated total gold.</p>}
              </div>}
              {FOREVER_LATE_LEATHERWORKING_STEPS.filter(step=>step.to>skill(id)).map(step=><div key={step.from} style={{borderTop:"1px solid var(--border,#ddd)",padding:"10px 0"}}>
                <b style={small}>{step.from}–{step.to}: {step.name}</b>
                <p style={{...small,margin:"4px 0"}}><b>Craft:</b> {step.materials}</p>
                <p style={{...small,margin:"4px 0"}}><b>Learn / buy:</b> {step.where}</p>
                <p style={{...small,margin:"4px 0"}}>{step.how}</p>
                <p style={{...small,margin:"4px 0"}}><b>Acquisition:</b> {step.purchase}</p>
                <a href={step.url} target="_blank" rel="noopener noreferrer" style={small}>Forever recipe & evidence ↗</a>
              </div>)}
            </details>}
          </div>;
        })}
        <div style={{border:"1px solid var(--border,#ddd)",borderRadius:10,padding:12}}>
          <b>Skinning {skill("skinning")}</b>
          {skill("skinning")>=300?<p style={small}>Max skill reached · 300/300.</p>:<>
            <p style={{...small,margin:"7px 0"}}><b>Next:</b> Skin fully looted beasts, then move to higher-level beasts as skill rises. At skill {skill("skinning")}, beasts up to about level {Math.floor(skill("skinning")/5)} are skinable without bonuses (level 21+ rule).</p>
            {skill("skinning")<225?<p style={{...small,margin:"7px 0"}}><b>Go to:</b> Stranglethorn Vale, Thousand Needles (Shimmering Flats), or Arathi Highlands for the 175–225 band, then advance to higher-level beasts.</p>:<p style={{...small,margin:"7px 0"}}><b>225–300:</b> Work up through beasts around level {Math.max(40,Math.floor(skill("skinning")/5)-3)}–{Math.floor(skill("skinning")/5)}. As your skill increases, target higher-level beasts; check their levels before committing to a farm. No recipe purchase is needed.</p>}
            <p style={{...small,margin:"7px 0"}}><b>Artisan:</b> Learn at 200 Skinning if your cap is still 225. Horde trainers include Kulleg Stonehorn at Camp Mojache, Feralas (/way 74.4 43.0), and Thuwd in Orgrimmar (/way 63.2 45.2).</p>
            <a href="https://www.wowhead.com/forever/guide/professions/skinning/overview-leveling" target="_blank" rel="noopener noreferrer" style={small}>Wowhead Forever Skinning source ↗</a>
          </>}
        </div>
      </div>
    </div>
    <div className="gm-card" style={{padding:16,marginTop:12}}>
      <h3 style={{margin:"0 0 5px"}}>📍 Only buy what you need to level</h3>
      <p className="gm-note" style={small}>Budget-first area shopping: only required leveling recipes, books, and useful trainer visits. Optional/collectible patterns, reported drops, and the gem-heavy Leatherworking belt are excluded. No live Auction House prices exist in Wowhead Forever, so this is a low-purchase route, not a guaranteed lowest-gold calculation.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,220px),1fr))",gap:8}}>
        <label style={small}>Area
          <select value={area} onChange={e=>setArea(e.target.value)} style={control}>
            <option value="all">Budget leveling areas</option>
            {stops.map(key=><option key={key} value={key}>{key.replace("|"," · ")}</option>)}
          </select>
        </label>
        <label style={small}>Search needed book, trainer or town
          <input type="search" value={query} onChange={e=>setQuery(e.target.value)} style={control} placeholder="e.g. Thunder Bluff, book"/>
        </label>
      </div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",margin:"12px 0"}}>
        <label style={small}><input type="checkbox" checked={showFuture} onChange={e=>setShowFuture(e.target.checked)}/> Needed purchases for future skills</label>
        <label style={small}><input type="checkbox" checked={showCompleted} onChange={e=>setShowCompleted(e.target.checked)}/> Include collected</label>
      </div>
      <p className="gm-note" style={small}>{visible.length} low-purchase leveling stops across {keys.length} locations. Use the Wowhead Forever Easiest planner with your known recipes and your in-game material prices for a true cost comparison.</p>
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
                <p style={{...small,margin:"4px 0"}}><b>{item.npc}</b> · {FOREVER_BUDGET_LEVELING_NOTES[item.id]??item.note}</p>
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
      {!visible.length&&<p className="gm-note" style={small}>No necessary purchases match your current skill and filters. You may only need trainer recipes or more materials. Check future skill requirements if planning ahead.</p>}
      <p className="gm-note" style={{...small,marginTop:12}}>
        <b>Shopping rule:</b> You are already Leatherworking 276: do not buy earlier patterns or overpriced rare drops. The gold-first calculator compares a farmable Burning Steppes pattern and a limited-stock Silithus vendor pattern using your actual material prices. Buy only a few crafts' materials at a time; neither route is a guaranteed cheapest choice without market prices.
      </p>
      {copyStatus&&<p className="gm-note" role="status" style={small}>{copyStatus}</p>}
    </div>
  </section>;
}
