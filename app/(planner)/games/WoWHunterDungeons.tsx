"use client";

import type { GameProgress } from "@/lib/games-data";
import {
  rankHunterDungeons,
  dungeonLootOwnedKey,
  type HunterDungeonAssessment,
  type HunterLootTarget,
} from "@/lib/wow-forever-dungeon-gear";

type Props = {
  gameId: string;
  level: number;
  prog: GameProgress;
  setCheck: (key: string, value: boolean) => void;
  mode?: "summary" | "full";
};

const slotLabels: Record<HunterLootTarget["slot"], string> = {
  ranged: "Ranged weapon", melee: "Melee stat stick", head: "Head",
  shoulders: "Shoulders", chest: "Chest", hands: "Hands",
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
      <span>{slotLabels[item.slot]} · Requires level {item.requiredLevel} · {item.kind === "quest" ? "Quest reward" : item.from}</span>
      {item.note && <span className="gm-wow-dungeon-source-note">{item.note}</span>}
    </span>
    <span className="gm-wow-dungeon-owned-state">{owned ? "Have it" : "Already have?"}</span>
  </label>;
}

function DungeonCard({
  result,gameId,level,prog,setCheck,featured=false,
}: {
  result: HunterDungeonAssessment;gameId:string;level:number;
  prog:GameProgress;setCheck:Props["setCheck"];featured?:boolean;
}) {
  const d=result.dungeon;
  const unownedFuture=d.loot.filter(item=>item.requiredLevel>level && !prog.checks[dungeonLootOwnedKey(gameId,d.id,item.id)]);
  const remaining=d.loot.filter(item=>!prog.checks[dungeonLootOwnedKey(gameId,d.id,item.id)]);
  const gearSummary=result.gearTargets.length
    ? result.gearTargets.slice(0,2).map(x=>x.name).join(" · ")
    : d.loot.length && remaining.length===0
      ? "All listed Hunter targets marked acquired"
      : result.band==="soon" ? "Coming up as you level" : "No documented current-level target";
  return <article className={"gm-wow-dungeon-card" + (featured?" featured":"")}>
    <details>
      <summary className="gm-wow-dungeon-summary">
        <div className="gm-wow-dungeon-heading">
          <b>{d.name}</b>
          <span>Level {d.min}–{d.max} · {d.region}</span>
          <span className="gm-wow-dungeon-preview">{gearSummary}</span>
        </div>
        <span className="gm-wow-dungeon-priority">
          {result.band==="soon" ? "Soon" :
            result.band==="past" ? "Older" :
            result.gearTargets.length ? "Hunter gear" :
            remaining.length===0 && d.loot.length ? "Gear collected" : "Loot unknown"}
        </span>
      </summary>
      <div className="gm-wow-dungeon-body">
        {result.band==="soon" && <p>Coming soon: your level is below the recommended dungeon group range. Don't attempt this solely for its gear yet.</p>}
        {result.band==="past" && <p>This dungeon's recommended level band is behind you. Check for missed items before revisiting.</p>}
        <p className="gm-wow-dungeon-caption">
          {d.loot.length
            ? "Potential Hunter gear targets (not verified upgrades over your equipped items). Tick Already have once you own a piece."
            : "Hunter-specific loot has not been verified for ranking. This does not mean the dungeon has no useful drops."}
        </p>
        {d.loot.length > 0 && <>
          <div className="gm-wow-dungeon-targets">
            {d.loot
              .slice()
              .sort((a,b)=>b.priority-a.priority || a.requiredLevel-b.requiredLevel)
              .map(item=><TargetRow key={item.id} gameId={gameId} dungeonId={d.id} item={item} prog={prog} setCheck={setCheck}/>)}
          </div>
          {unownedFuture.length>0 && <p className="gm-wow-dungeon-caption">
            {unownedFuture.length} target{unownedFuture.length===1?"":"s"} require{unownedFuture.length===1?"s":""} a higher character level than {level}.
          </p>}
          <p className="gm-wow-dungeon-caption">Tracked: {result.acquiredCount} of {d.loot.length} gear targets acquired.</p>
        </>}
        {d.travelNote && <p className="gm-wow-dungeon-caution"><b>Travel:</b> {d.travelNote}</p>}
        {d.sourceNote && <p className="gm-wow-dungeon-caution">{d.sourceNote}</p>}
        <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer">Review dungeon loot source ↗</a>
      </div>
    </details>
  </article>;
}

export default function WoWHunterDungeons({gameId,level,prog,setCheck,mode="full"}:Props) {
  const ranked=rankHunterDungeons(level,(dId,itemId)=>!!prog.checks[dungeonLootOwnedKey(gameId,dId,itemId)]);
  const current=ranked.filter(x=>x.band==="current");
  const currentWithTargets=current.filter(x=>x.gearTargets.length>0);
  const soon=ranked.filter(x=>x.band==="soon");
  const strongest=currentWithTargets.slice(0,mode==="summary"?2:6);
  const otherCurrent=mode==="full" ? current.filter(x=>!strongest.includes(x)) : [];
  return <section className="gm-card gm-wow-dungeon-planner" aria-label="Hunter-gear dungeon recommendations">
    <div className="gm-panel-label">Dungeon priorities · Hunter gear</div>
    <h3 style={{margin:"6px 0"}}>Where to run for gear at level {level}</h3>
    <p className="gm-note">
      Prioritized by your level and <b>uncollected Hunter gear</b>. Ranged weapons matter most,
      followed by Agility/Attack Power gear. These are possible upgrades; the site cannot read your equipped items.
    </p>
    {current.length===0 && <p className="gm-note">No dungeons in your current level band. Quest and level up, then check the recommendations again.</p>}
    {current.length>0 && currentWithTargets.length===0 && <p className="gm-note">
      No remaining documented Hunter gear targets in your current dungeon band.
      Dungeons listed below may still offer quests, XP and unverified drops.
    </p>}
    <div className="gm-wow-dungeon-list">
      {strongest.map((r,i)=><DungeonCard key={r.dungeon.id} result={r} gameId={gameId} level={level} prog={prog} setCheck={setCheck} featured={i===0}/>)}
    </div>
    {mode==="full" && <>
      {otherCurrent.length>0 && <details className="gm-wow-dungeon-more">
        <summary>Other dungeons in your level range ({otherCurrent.length})</summary>
        <div className="gm-wow-dungeon-list">{otherCurrent.map(r=><DungeonCard key={r.dungeon.id} result={r} gameId={gameId} level={level} prog={prog} setCheck={setCheck}/>)}</div>
      </details>}
      {soon.length>0 && <details className="gm-wow-dungeon-more">
        <summary>Coming up soon ({soon.length})</summary>
        <div className="gm-wow-dungeon-list">{soon.map(r=><DungeonCard key={r.dungeon.id} result={r} gameId={gameId} level={level} prog={prog} setCheck={setCheck}/>)}</div>
      </details>}
    </>}
    <p className="gm-wow-dungeon-footnote">
      Dungeon ranges are approximate; named loot and boss sources may change with Forever patches.
      An unlisted item does not mean the dungeon lacks Hunter gear.
      When your current bow/gun is better than a listed item, mark that target as already covered to lower its priority.
    </p>
  </section>;
}
