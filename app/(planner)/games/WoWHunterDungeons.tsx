"use client";

import type { GameProgress } from "@/lib/games-data";
import { WOW_HUNTER_DUNGEONS } from "@/lib/wow-forever-dungeon-gear";
import { dungeonProfessionDrops } from "@/lib/wow-forever-dungeon-professions";
import { recipeLearnedKey, recipeHiddenKey } from "@/lib/wow-forever-professions";
import WoWDungeonProfessionDrops from "./WoWDungeonProfessionDrops";
import { WOW_DUNGEON_ENTRANCES } from "@/lib/wow-portal-extras";
import {
  rankHunterDungeons,
  dungeonLootOwnedKey,
  type HunterDungeonAssessment,
  type HunterLootTarget,
} from "@/lib/wow-forever-dungeon-gear";

type Props = {
  gameId: string;
  level: number;
  faction: "horde" | "alliance";
  prog: GameProgress;
  setCheck: (key: string, value: boolean) => void;
  setField: (key: string, value: string) => void;
  mode?: "summary" | "full";
};

const slotLabels: Record<HunterLootTarget["slot"], string> = {
  ranged: "Ranged weapon", melee: "Melee stat stick", head: "Head",
  shoulders: "Shoulders", chest: "Chest", hands: "Hands", wrist: "Wrist",
  legs: "Legs", back: "Back", feet: "Feet", ring: "Ring",
  neck: "Neck", waist: "Waist",
};

function TargetRow({
  gameId, dungeonId, item, prog, setCheck,
}: {
  gameId: string; dungeonId: string; item: HunterLootTarget;
  prog: GameProgress; setCheck: Props["setCheck"];
}) {
  const key = dungeonLootOwnedKey(gameId,dungeonId,item.id);
  const owned = !!prog.checks[key];
  return <label className={"gm-wow-dungeon-target" + (owned ? " owned" : "")}>
    <input type="checkbox" checked={owned} onChange={value => setCheck(key,value.target.checked)}/>
    <span className="gm-wow-dungeon-target-copy">
      <b>{item.name}</b>
      <span>{slotLabels[item.slot]} · {item.kind === "quest" ? "Quest accessible around level " : "Requires level "}{item.requiredLevel} · {item.from}</span>
      {item.note && <span className="gm-wow-dungeon-source-note">{item.note}</span>}
    </span>
    <span className="gm-wow-dungeon-owned-state">{owned ? "Covered" : "Have / skip"}</span>
  </label>;
}

function DungeonCard({
  result,gameId,level,faction,prog,setCheck,setField,featured=false,
}: {
  result: HunterDungeonAssessment;gameId:string;level:number;faction:"horde"|"alliance";
  prog:GameProgress;setCheck:Props["setCheck"];setField:Props["setField"];featured?:boolean;
}) {
  const d=result.dungeon;
  const entrance=WOW_DUNGEON_ENTRANCES[d.id];
  const professionDrops=dungeonProfessionDrops(d.id).filter(x=>!x.recipe||(
    !prog.checks[recipeLearnedKey(gameId,x.recipe.id)]&&!prog.checks[recipeHiddenKey(gameId,x.recipe.id)]));
  const patternCount=professionDrops.filter(x=>x.kind==="pattern").length;
  const materialCount=professionDrops.length-patternCount;
  const loot=d.loot.filter(item=>!item.faction || item.faction===faction);
  const unownedFuture=loot.filter(item=>item.requiredLevel>level && !prog.checks[dungeonLootOwnedKey(gameId,d.id,item.id)]);
  const remaining=loot.filter(item=>!prog.checks[dungeonLootOwnedKey(gameId,d.id,item.id)]);
  const gearSummary=result.gearTargets.length
    ? result.gearTargets.slice(0,2).map(x=>x.name).join(" · ")
    : loot.length && remaining.length===0
      ? "All listed Hunter targets marked acquired"
      : result.band==="soon" ? "Coming up as you level" : "No documented current-level target";
  return <article className={"gm-wow-dungeon-card" + (featured?" featured":"")}>
    <details>
      <summary className="gm-wow-dungeon-summary">
        <div className="gm-wow-dungeon-heading">
          <b>{d.name}</b>
          <span>Level {d.min}–{d.max} · {d.region}</span>
          <span className="gm-wow-dungeon-preview">{gearSummary}</span>
          {professionDrops.length>0&&<span className="gm-wow-dungeon-preview">
            🧵 {patternCount} unlearned patterns · {materialCount} materials
          </span>}
        </div>
        <span className="gm-wow-dungeon-priority">
          {result.band==="soon" ? "Soon" :
            result.band==="past" ? "Older" :
            result.gearTargets.length ? "Hunter gear" :
            remaining.length===0 && loot.length ? "Gear covered" :
            professionDrops.length>0 ? "Profession loot" : "Loot unknown"}
        </span>
      </summary>
      <div className="gm-wow-dungeon-body">
        {result.band==="soon" && <p>Coming soon: your level is below the recommended dungeon group range. Don't attempt this solely for its gear yet.</p>}
        {result.band==="past" && <p>This dungeon's recommended level band is behind you. Check for missed items before revisiting.</p>}
        <p className="gm-wow-dungeon-caption">
          {loot.length
            ? "Potential Hunter gear targets (not verified upgrades over your equipped items). Tick items you already own OR do not need because you have a better piece."
            : "Hunter-specific loot has not been verified for ranking. This does not mean the dungeon has no useful drops."}
        </p>
        {loot.length > 0 && <>
          <div className="gm-wow-dungeon-targets">
            {loot
              .slice()
              .sort((a,b)=>b.priority-a.priority || a.requiredLevel-b.requiredLevel)
              .map(item=><TargetRow key={item.id} gameId={gameId} dungeonId={d.id} item={item} prog={prog} setCheck={setCheck}/>)}
          </div>
          {unownedFuture.length>0 && <p className="gm-wow-dungeon-caption">
            {unownedFuture.length} target{unownedFuture.length===1?"":"s"} require{unownedFuture.length===1?"s":""} a higher character level than {level}.
          </p>}
          <p className="gm-wow-dungeon-caption">Covered: {result.acquiredCount} of {loot.length} listed targets (owned or skipped).</p>
        </>}
        {entrance && <details style={{marginTop:12}}>
          <summary style={{cursor:"pointer",fontWeight:700}}>Find the actual dungeon entrance</summary>
          <p className="gm-wow-dungeon-caption"><b>{entrance.zone}:</b> {entrance.detail}</p>
          {entrance.waypoint && <p className="gm-wow-dungeon-caption">
            <code>{entrance.waypoint}</code>{" "}
            <button type="button" className="gm-pill" onClick={()=>{
              void navigator.clipboard.writeText(entrance.waypoint!).catch(()=>{});
            }}>Copy TomTom</button>
          </p>}
          <p className="gm-wow-dungeon-caption">Coordinates are Classic-style entrance references; some dungeons have a non-instanced approach before the actual portal.{" "}
            <a href={entrance.sourceUrl} target="_blank" rel="noopener noreferrer">Read the route ↗</a>
          </p>
        </details>}
        {!entrance && <p className="gm-wow-dungeon-caption">Detailed entrance route is not yet verified for this dungeon. Use the linked dungeon reference before traveling.</p>}
        <WoWDungeonProfessionDrops dungeonId={d.id} gameId={gameId} prog={prog}
          setCheck={setCheck} setField={setField}/>
        {d.travelNote && <p className="gm-wow-dungeon-caution"><b>Travel:</b> {d.travelNote}</p>}
        {d.sourceNote && <p className="gm-wow-dungeon-caution">{d.sourceNote}</p>}
        <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer">Review dungeon loot source ↗</a>
      </div>
    </details>
  </article>;
}

export default function WoWHunterDungeons({gameId,level,faction,prog,setCheck,setField,mode="full"}:Props) {
  const ranked=rankHunterDungeons(level,(dId,itemId)=>!!prog.checks[dungeonLootOwnedKey(gameId,dId,itemId)],faction);
  const current=ranked.filter(x=>x.band==="current");
  const currentWithTargets=current.filter(x=>x.gearTargets.length>0);
  const soon=ranked.filter(x=>x.band==="soon");
  const recent=ranked.filter(x=>x.band==="past" && (x.gearTargets.length > 0 || dungeonProfessionDrops(x.dungeon.id).length>0));
  // The gear ranking deliberately removes older dungeons. Keep profession farms visible
  // at later character levels instead of hiding Wailing Caverns or Ragefire forever.
  const olderProfessionFarms:HunterDungeonAssessment[]=mode==="full"
    ? WOW_HUNTER_DUNGEONS
      .filter(d=>level>d.max+2 && dungeonProfessionDrops(d.id).length>0 && !ranked.some(a=>a.dungeon.id===d.id))
      .map(d=>({
        dungeon:d,score:0,gearTargets:[],
        upcomingTargets:[],acquiredCount:d.loot.filter(item=>prog.checks[dungeonLootOwnedKey(gameId,d.id,item.id)]).length,
        band:"past" as const
      }))
    : [];
  const strongest=currentWithTargets.slice(0,mode==="summary"?2:6);
  const otherCurrent=mode==="full" ? current.filter(x=>!strongest.includes(x)) : [];
  return <section className="gm-card gm-wow-dungeon-planner" aria-label="Hunter-gear dungeon recommendations">
    <div className="gm-panel-label">Dungeon priorities · Hunter gear + profession drops</div>
    <h3 style={{margin:"6px 0"}}>Where to run for gear and profession items at level {level}</h3>
    <p className="gm-note">
      Prioritized by your level and <b>Hunter gear you still want</b>. Ranged weapons matter most,
      followed by Agility/Attack Power gear. Dungeon cards also list profession materials, patterns,
      reported bosses and current inventory. Older profession farms remain available below.
      These are possible upgrades; the site cannot read your equipped items.
    </p>
    {current.length===0 && <p className="gm-note">No dungeons in your current level band. Quest and level up, then check the recommendations again.</p>}
    {current.length>0 && currentWithTargets.length===0 && <p className="gm-note">
      No remaining documented Hunter gear targets in your current dungeon band.
      Dungeons listed below may still offer profession materials, patterns, quests, XP and unverified drops.
    </p>}
    <div className="gm-wow-dungeon-list">
      {strongest.map((r,i)=><DungeonCard key={r.dungeon.id} result={r} gameId={gameId} level={level} faction={faction} prog={prog} setCheck={setCheck} setField={setField} featured={i===0}/>)}
    </div>
    {mode==="full" && <>
      {otherCurrent.length>0 && <details className="gm-wow-dungeon-more">
        <summary>Other dungeons in your level range ({otherCurrent.length})</summary>
        <div className="gm-wow-dungeon-list">{otherCurrent.map(r=><DungeonCard key={r.dungeon.id} result={r} gameId={gameId} level={level} faction={faction} prog={prog} setCheck={setCheck} setField={setField}/>)}</div>
      </details>}
      {soon.length>0 && <details className="gm-wow-dungeon-more">
        <summary>Coming up soon ({soon.length})</summary>
        <div className="gm-wow-dungeon-list">{soon.map(r=><DungeonCard key={r.dungeon.id} result={r} gameId={gameId} level={level} faction={faction} prog={prog} setCheck={setCheck} setField={setField}/>)}</div>
      </details>}
      {olderProfessionFarms.length>0 && <details className="gm-wow-dungeon-more">
        <summary>Older dungeons with profession drops ({olderProfessionFarms.length})</summary>
        <p className="gm-wow-dungeon-caption">
          Useful for Leatherworking, Cooking or First Aid even after you've outleveled their gear.
          Recommended dungeon level bands do NOT prove every mob is gray to you; verify XP before killing.
        </p>
        <div className="gm-wow-dungeon-list">
          {olderProfessionFarms.map(r=><DungeonCard key={r.dungeon.id} result={r}
            gameId={gameId} level={level} faction={faction} prog={prog}
            setCheck={setCheck} setField={setField}/>)}
        </div>
      </details>}
      {recent.length>0 && <details className="gm-wow-dungeon-more">
        <summary>Recently outleveled — gear or profession drops ({recent.length})</summary>
        <div className="gm-wow-dungeon-list">{recent.map(r=><DungeonCard key={r.dungeon.id} result={r} gameId={gameId} level={level} faction={faction} prog={prog} setCheck={setCheck} setField={setField}/>)}</div>
      </details>}
    </>}
    <p className="gm-wow-dungeon-footnote">
      Dungeon ranges are approximate; named loot and boss sources may change with Forever patches.
      An unlisted item does not mean the dungeon lacks Hunter gear or useful profession drops.
      You can check off a piece you already own <b>or</b> do not need because your current gear is better. The remaining targets update the recommendation order.
    </p>
  </section>;
}
