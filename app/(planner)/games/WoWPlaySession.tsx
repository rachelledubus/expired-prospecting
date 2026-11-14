"use client";

import { useMemo, useState } from "react";
import type { GameProgress } from "@/lib/games-data";
import WoWProfessionRun from "./WoWProfessionRun";
import { rankHunterDungeons, dungeonLootOwnedKey } from "@/lib/wow-forever-dungeon-gear";
import { ALL_RECIPE_MATERIALS, externalMaterialLookup, materialRoutes, type MaterialRoute } from "@/lib/wow-material-farms";
import { wowheadForeverItemUrl } from "@/lib/wowhead-forever-items";
import { grayMobThreshold, wowExtraField, wowMaterialKey, WOW_FARMS } from "@/lib/wow-portal-extras";

type Mode = "gold" | "professions" | "gear" | "leveling";
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
const isGatheringOnly = (r: MaterialRoute) => r.method === "mining" || r.method === "herbalism";
const sortSources = (level: number, a: MaterialRoute, b: MaterialRoute) => {
  const gray = grayMobThreshold(level);
  const score = (r: MaterialRoute) =>
    (isGatheringOnly(r) ? -100 : r.method==="vendor"||r.method==="other-profession"?45:0) +
    (r.maxMob === undefined ? 0 : r.maxMob <= gray ? 10 : -15) +
    (r.waypoint ? 4 : 0) +
    (r.evidence === "forever-reported" ? 3 : 0);
  return score(b) - score(a);
};
const formatAmount = (value: string | undefined) =>
  value === undefined ? null : Number.isFinite(Number(value)) ? Math.max(0,Number(value)) : null;

export default function WoWPlaySession({ gameId, prog, level, faction, mode, setField, onOpen, onFindMaterial }: Props) {
  const activeKey = wowExtraField(gameId, "session-material");
  const savedMaterial = prog.fields[activeKey] ?? "Moss Agate";
  const [draft, setDraft] = useState(savedMaterial);
  const [copyStatus, setCopyStatus] = useState("");
  const currentMaterial = savedMaterial.trim();
  const cutoff = grayMobThreshold(level);
  const routes = useMemo(() => materialRoutes(currentMaterial,faction).filter(r => !isGatheringOnly(r))
    .sort((a,b) => sortSources(level,a,b)), [currentMaterial,level,faction]);
  const bestSource = routes[0];
  const foreverItemUrl = wowheadForeverItemUrl(currentMaterial);
  const owned = currentMaterial ? formatAmount(prog.fields[wowExtraField(gameId,"stock-"+wowMaterialKey(currentMaterial))]) : null;
  const rankedGear = rankHunterDungeons(level,(d,i)=>!!prog.checks[dungeonLootOwnedKey(gameId,d,i)],faction);
  const nextGear = rankedGear.find(r=>r.band==="current"&&r.gearTargets.length>0);
  const safeFarms = WOW_FARMS.filter(r=>r.maxMob<=cutoff).sort((a,b)=>{
    const rate = (farmId:string) => {
      const gold=formatAmount(prog.fields[wowExtraField(gameId,"farm-"+farmId+"-gold")]);
      const minutes=formatAmount(prog.fields[wowExtraField(gameId,"farm-"+farmId+"-minutes")]);
      return gold!==null&&minutes!==null&&minutes>0 ? 60*gold/minutes:null;
    };
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
      <span>{mode==="gold"?"Gold without XP":mode==="professions"?"Improve professions":mode==="gear"?"Find Hunter gear":"Leveling"}</span>
      {mode==="gold"&&<span>Gray estimate: level {cutoff} or lower</span>}
    </div>
    {mode==="professions"&&<WoWProfessionRun gameId={gameId} level={level} faction={faction}
      prog={prog} setField={setField} onFindMaterial={onFindMaterial}
      onOpenProfessions={()=>onOpen("professions")}/>}
    {mode==="gear"&&<div className="gm-wow-session-focus">
      <h4>Current Hunter gear lead</h4>
      {nextGear ? <>
        <p><b>{nextGear.dungeon.name}</b> · {nextGear.dungeon.region}</p>
        <p style={helper}>{nextGear.gearTargets.slice(0,2).map(r=>r.name).join(" · ")} are unmarked targets in your guide—not verified upgrades over your equipment.</p>
      </>:<p style={helper}>No documented unmarked Hunter target in your current dungeon range. Look at upcoming dungeons or your equipment comparison.</p>}
      <button className="gm-pill ghost" type="button" onClick={()=>onOpen("gear")}>Open dungeon and equipment guides</button>
    </div>}
    {mode==="leveling"&&<p style={helper}>Use the leveling objective below. You can still maintain a material target here for later.</p>}
    <div className="gm-wow-session-focus">
      <h4>{mode==="gold"?"Find a valuable material":mode==="professions"?"Other material to find":"Optional material to find"}</h4>
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
      <p style={helper}><b>Current focus:</b> {currentMaterial||"None"}{owned===null?" · Inventory not recorded":" · Have "+owned}{!materialIsKnown?" · Outside your recipe catalog":""}</p>
      {bestSource ? <>
        <p style={{margin:"7px 0 4px"}}><b>{bestSource.target}</b> · {bestSource.zone}</p>
        <p style={helper}>{bestSource.advice}</p>
        {bestSource.maxMob!==undefined&&<p style={helper}>
          Mob level {bestSource.minMob}–{bestSource.maxMob} · {bestSource.maxMob<=cutoff?"Gray expected":"Potential XP; check the enemy"}
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
      </>:<p style={helper}>No non-Mining farming route is mapped for this item yet. Search Wowhead Forever, or choose a different focus.</p>}
      <div className="gm-wow-session-actions">
        <button className="gm-pill ghost" type="button" disabled={!currentMaterial} onClick={()=>onFindMaterial(currentMaterial)}>See all farming routes</button>
        <a className="gm-pill gm-wowhead-search" target="_blank" rel="noopener noreferrer"
          href={foreverItemUrl||externalMaterialLookup(currentMaterial||draft.trim()||"Moss Agate")}>
          {foreverItemUrl?"Open exact Wowhead Forever item ↗":"Search Wowhead Forever ↗"}
        </a>
      </div>
    </div>
    {mode==="gold"&&<details className="gm-wow-session-focus">
      <summary style={{cursor:"pointer",fontWeight:700}}>Alternative: farm raw gold or leather</summary>
      {nextGold ? <>
        <p><b>{nextGold.name}</b> · {nextGold.zone}</p>
        <p style={helper}>Approx. mobs {nextGold.minMob}–{nextGold.maxMob}. {nextGold.note}</p>
        {nextGold.waypoint&&<div className="gm-wow-session-waypoint">
          <code>{nextGold.waypoint}</code>
          <button className="gm-pill" type="button" onClick={()=>copy(nextGold.waypoint!)}>Copy waypoint</button>
        </div>}
      </>:<p style={helper}>No currently documented farm in this guide is entirely within the estimated gray range. Check mob colors in game before farming.</p>}
      <button className="gm-pill ghost" type="button" onClick={()=>onOpen("gold")}>Compare all gold farms</button>
    </details>}
    <p style={helper}>Your guide cannot read your live bags, equipment, NPC colors, prices or server drops. Saved values are manual. Do not rely on Classic reference locations without checking Forever.</p>
    {copyStatus&&<p role="status" style={helper}>{copyStatus}</p>}
  </section>;
}
