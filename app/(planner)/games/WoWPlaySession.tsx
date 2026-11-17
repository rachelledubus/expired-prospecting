"use client";

import { useMemo, useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import WoWProfessionRun from "./WoWProfessionRun";
import { rankHunterDungeons, dungeonLootOwnedKey } from "@/lib/wow-forever-dungeon-gear";
import { WOW_HUNTER_BIS_LEADS } from "@/lib/wow-hunter-bis";
import { ALL_RECIPE_MATERIALS, externalMaterialLookup, materialRoutes } from "@/lib/wow-material-farms";
import { rankMaterialRoutes } from "@/lib/wow-material-route-ranking";
import { rankLevelSkinning } from "@/lib/wow-level-skinning";
import { professionField } from "@/lib/wow-forever-professions";
import { measureFarm } from "@/lib/wow-gold-session-metrics";
import { wowheadForeverItemUrl } from "@/lib/wowhead-forever-items";
import { grayMobThreshold, wowExtraField, wowMaterialKey, WOW_FARMS } from "@/lib/wow-portal-extras";

type Mode = "gold" | "professions" | "gear" | "leveling" | "skin-xp";
type Props = {
  gameId: string;
  prog: GameProgress;
  level: number;
  faction: "horde" | "alliance";
  mode: Mode;
  setField: (key: string, value: string) => void;
  onOpen: (view: "gold" | "professions" | "gear") => void;
  onFindMaterial: (name: string) => void;
};
const helper: React.CSSProperties = { fontSize: 13, lineHeight: 1.5, opacity: .84 };
const input: React.CSSProperties = {
  display: "block", width: "100%", minWidth: 0, minHeight: 44,
  padding: "9px 11px", border: "1px solid var(--border,#bbb)",
  borderRadius: 9, font: "inherit", background: "var(--panel,#fff)", color: "var(--text,#222)"
};
const formatAmount = (value: string | undefined) =>
  value === undefined ? null : Number.isFinite(Number(value)) ? Math.max(0,Number(value)) : null;

export default function WoWPlaySession({ gameId, prog, level, faction, mode, setField, onOpen, onFindMaterial }: Props) {
  const activeKey = wowExtraField(gameId, "session-material");
  const savedMaterial = prog.fields[activeKey] ?? "";
  const [draft, setDraft] = useState(savedMaterial);
  const [copyStatus, setCopyStatus] = useState("");
  const currentMaterial = savedMaterial.trim();
  const cutoff = grayMobThreshold(level);
  const skinningXp=useMemo(()=>rankLevelSkinning(level,faction),[level,faction]);
  const skinningSkill=prog.fields[professionField(gameId,"skill-skinning")];
  // Use exactly the same no-XP, faction and Skinning ranking as Farm Materials.
  const routeAdvice = useMemo(() => rankMaterialRoutes(materialRoutes(currentMaterial,faction),{
    level,faction,noXp:true,includeGathering:false,includeHistorical:true
  }),[currentMaterial,level,faction]);
  const bestAdvice=routeAdvice.find(x=>x.usable==="direct");
  const bestSource=bestAdvice?.route;
  const foreverItemUrl = wowheadForeverItemUrl(currentMaterial);
  const owned = currentMaterial ? formatAmount(prog.fields[wowExtraField(gameId,"stock-"+wowMaterialKey(currentMaterial))]) : null;
  const rankedGear = rankHunterDungeons(level,(d,i)=>!!prog.checks[dungeonLootOwnedKey(gameId,d,i)],faction);
  const nextGear = rankedGear.find(r=>r.band==="current"&&r.gearTargets.length>0);
  const nextBis=[...WOW_HUNTER_BIS_LEADS].filter(item=>{
    if(item.faction&&item.faction!==faction)return false;
    const has=item.dungeonId&&item.targetId
      ?!!prog.checks[dungeonLootOwnedKey(gameId,item.dungeonId,item.targetId)]
      :prog.fields[wowExtraField(gameId,"bis-owned-"+item.id)]==="yes";
    return !has&&item.recommendedLevel>=Math.max(1,level-12)&&item.recommendedLevel<=level+8;
  }).sort((a,b)=>{
    const aReady=a.recommendedLevel<=level?0:1,bReady=b.recommendedLevel<=level?0:1;
    return aReady-bReady||(a.slot==="ranged"?-1:b.slot==="ranged"?1:0)
      ||Math.abs(a.recommendedLevel-level)-Math.abs(b.recommendedLevel-level);
  })[0];
  const safeFarms = WOW_FARMS.filter(r=>r.maxMob<=cutoff).sort((a,b)=>{
    const rate=(farmId:string)=>measureFarm(k=>prog.fields[wowExtraField(gameId,k)],farmId)?.netPerHour??null;
    const ar=rate(a.id),br=rate(b.id);
    if(ar!==null||br!==null)return (br??-1)-(ar??-1);
    if(Boolean(a.requiresSkinning)!==Boolean(b.requiresSkinning))return a.requiresSkinning?-1:1;
    return a.maxMob-b.maxMob;
  });
  const nextGold=safeFarms[0];
  const copy = (value:string) => {
    void navigator.clipboard.writeText(value)
      .then(()=>setCopyStatus("Waypoint copied. Paste it in WoW with TomTom enabled."))
      .catch(()=>setCopyStatus("Copy unavailable. Select the waypoint text manually."));
  };
  const materialIsKnown=ALL_RECIPE_MATERIALS.some(name=>name.toLowerCase()===currentMaterial.toLowerCase());
  return <section className="gm-card gm-wow-session" aria-label="In-game play session dashboard">
    <div className="gm-panel-label">Your in-game field card · level {level}</div>
    <h3 style={{margin:"5px 0 8px"}}>One objective, one next action</h3>
    <div className="gm-wow-session-stats">
      <span>Hunter · {faction==="horde"?"Horde":"Alliance"}</span>
      <span>{mode==="gold"?"Gold without XP":mode==="professions"?"Improve professions":mode==="gear"?"Find Hunter gear":mode==="skin-xp"?"Level + Skin":"Leveling"}</span>
      {mode==="gold"&&<span>Gray estimate: level {cutoff} or lower</span>}
    </div>
    {mode==="professions"&&<WoWProfessionRun gameId={gameId} level={level} faction={faction}
      prog={prog} setField={setField} onFindMaterial={onFindMaterial}
      onOpenProfessions={()=>onOpen("professions")}/>}
    {mode==="gear"&&<div className="gm-wow-session-focus">
      <h4>Current Hunter gear lead</h4>
      {nextBis&&<div style={{border:"1px solid var(--accent,#659e8b)",borderRadius:9,padding:10,marginBottom:12}}>
        <b>★ {nextBis.tier==="leveling-bis-candidate"?"Leveling BiS contender":"Strong leveling pick"}: {nextBis.name}</b>
        <p style={helper}>From {nextBis.source} · {nextBis.location}</p>
        <p style={helper}>Pursue around level {nextBis.recommendedLevel}; requires level {nextBis.minEquipLevel} to equip.</p>
        <a href={nextBis.sourceUrl} target="_blank" rel="noopener noreferrer">Check Forever source ↗</a>
      </div>}
      {nextGear ? <>
        <p><b>{nextGear.dungeon.name}</b> · {nextGear.dungeon.region}</p>
        <p style={helper}>{nextGear.gearTargets.slice(0,2).map(r=>r.name).join(" · ")} are unmarked targets in your guide—not verified upgrades over your equipment.</p>
      </>:<p style={helper}>No documented unmarked Hunter target in your current dungeon range. Look at upcoming dungeons or your equipment comparison.</p>}
      <button className="gm-pill ghost" type="button" onClick={()=>onOpen("gear")}>Open BiS targets, dungeon and equipment guides</button>
    </div>}
    {mode==="leveling"&&<p style={helper}>Your next leveling milestone and recommended area are displayed below.</p>}
    {mode==="skin-xp"&&<div className="gm-wow-session-focus" aria-label="XP and Skinning leveling routes">
      <h4>Level up while skinning</h4>
      <p style={helper}>Choose outdoor skinnable creatures near level {level}. Avoid gray enemies when your goal is kill XP. Loot every corpse before skinning; leather and Skinning skill-ups aren't guaranteed.</p>
      <p style={helper}><b>Recorded Skinning skill:</b> {skinningSkill===undefined?"Not entered":skinningSkill}. Check in-game whether your skill is high enough to skin each target; mob level alone does not establish skinning eligibility.</p>
      {skinningXp.length ? <>
        <div style={{display:"grid",gap:9,marginTop:10}}>
          {skinningXp.slice(0,4).map(({route,grade,notes},i)=><article key={route.id}
            style={{padding:12,border:"1px solid var(--border,#ddd)",borderRadius:10}}>
            <div className="gm-panel-label">{i===0?"Best documented starting lead":i===1?"Alternative":"Other documented lead"} · {grade==="level-appropriate"?"Near your level":grade==="mixed-levels"?"Mixed levels":"Lower-level XP option"}</div>
            <p style={{margin:"5px 0"}}><b>{route.target}</b> · {route.zone}</p>
            <p style={helper}>Listed mob levels {route.minMob}–{route.maxMob}. {route.advice}</p>
            <p style={helper}>{notes.join(" · ")}</p>
            <div className="gm-wow-session-actions">
              {route.waypoint&&<button type="button" className="gm-pill ghost" onClick={()=>copy(route.waypoint!)}>Copy TomTom</button>}
              <a href={route.sourceUrl} className="gm-pill ghost" target="_blank" rel="noopener noreferrer">Verify source ↗</a>
              <button type="button" className="gm-pill ghost" onClick={()=>onFindMaterial(route.item)}>Farm {route.item}</button>
            </div>
          </article>)}
        </div>
      </>:<p style={helper}>No documented outdoor skinning target has a suitable level range in the current catalog. Check a nearby questing area for level-appropriate skinnable beasts and verify the creature on Wowhead Forever before traveling.</p>}
      <p style={helper}><b>Simple loop:</b> Kill a suitable beast → loot everything → skin → move to the next beast. If the enemy is gray, choose a higher-level target for XP. If it is too dangerous, move down a level or two.</p>
      <a href="https://www.wowhead.com/forever/search?q=skinning" target="_blank" rel="noopener noreferrer">Research more skinning sources on Wowhead Forever ↗</a>
    </div>}

    {mode==="gold"&&<div className="gm-wow-session-focus">
      <h4>Recommended gold farm without XP</h4>
      {nextGold ? <>
        <p><b>{nextGold.name}</b> · {nextGold.zone}</p>
        <p style={helper}>Approx. mobs {nextGold.minMob}–{nextGold.maxMob}. {nextGold.note}</p>
        {nextGold.waypoint&&<div className="gm-wow-session-waypoint">
          <code>{nextGold.waypoint}</code><button className="gm-pill" type="button" onClick={()=>copy(nextGold.waypoint!)}>Copy waypoint</button>
        </div>}
      </>:<p style={helper}>No curated farm is entirely in the estimated gray range. Check mob colors in game before farming.</p>}
      <button className="gm-pill ghost" type="button" onClick={()=>onOpen("gold")}>Compare all gold farms</button>
    </div>}
    {mode==="gold"&&<details className="gm-wow-session-focus">
      <summary style={{cursor:"pointer",fontWeight:700}}>Optional · Look up a specific crafting material</summary>
      <div className="gm-wow-session-entry">
        <label>Search or enter any item
          <input style={input} list="wow-session-material-list" value={draft}
            onChange={e=>setDraft(e.target.value.slice(0,120))} placeholder="e.g. Moss Agate"/>
        </label>
        <datalist id="wow-session-material-list">
          {ALL_RECIPE_MATERIALS.map(name=><option key={name} value={name}/>)}
        </datalist>
        <button className="gm-pill" type="button" disabled={!draft.trim()||draft.trim()===savedMaterial}
          onClick={()=>{setField(activeKey,draft.trim());setCopyStatus("");}}>Set focus</button>
      </div>
      <p style={helper}><b>Current focus:</b> {currentMaterial||"None chosen"}{owned===null?"":" · Have "+owned}{!materialIsKnown?" · Outside your recipe catalog":""}</p>
      {bestSource ? <>
        <p style={{margin:"7px 0 4px"}}><b>{bestSource.target}</b> · {bestSource.zone}</p>
        <p style={helper}>{bestSource.advice}</p>
        {bestAdvice&&<p style={helper}><b>Route cautions:</b> {bestAdvice.notes.join(" · ")||"Verify the source in-game"}</p>}
        {bestSource.maxMob!==undefined&&<p style={helper}>
          Mob level {bestSource.minMob}–{bestSource.maxMob} · {bestAdvice?.xp==="gray-expected"?"Gray expected; verify in game":"XP status needs checking"}
        </p>}
        <p style={helper}>
          {bestSource.method==="other-profession"?"Created by another profession. Ask a crafter or check Auction House.":
           bestSource.method==="vendor"?"Buy from a profession or trade supplier. Confirm NPC and current stock.":
            bestSource.method==="crafting"?"Recipe exists in the client catalog; check skill and unlock before crafting.":
            bestSource.evidence==="forever-reported"?"Forever-reported rare source; drops are not guaranteed.":
            "Classic / historical farming lead; drop rates are not verified for Forever."}
        </p>
        <p style={helper}><a href={bestSource.sourceUrl} target="_blank" rel="noopener noreferrer">Check this specific source ↗</a></p>
        {bestSource.waypoint&&<div className="gm-wow-session-waypoint">
          <code>{bestSource.waypoint}</code>
          <button className="gm-pill" type="button" onClick={()=>copy(bestSource.waypoint!)}>Copy TomTom</button>
        </div>}
      </>:<p style={helper}>No documented direct route meets your no-XP preference. Open all farming routes to see unverified or XP-producing options, or search Wowhead Forever.</p>}
      <div className="gm-wow-session-actions">
        <button className="gm-pill ghost" type="button" disabled={!currentMaterial} onClick={()=>onFindMaterial(currentMaterial)}>See all farming routes</button>
        <a className="gm-pill gm-wowhead-search" target="_blank" rel="noopener noreferrer"
          href={foreverItemUrl||externalMaterialLookup(currentMaterial||draft.trim()||"leather")}>
          {foreverItemUrl?"Open exact Wowhead Forever item ↗":"Search Wowhead Forever ↗"}
        </a>
      </div>
    </details>}
    {copyStatus&&<p role="status" style={helper}>{copyStatus}</p>}
  </section>;
}
