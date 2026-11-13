"use client";

import { useState } from "react";
import { questKey, type GameProgress } from "@/lib/games-data";
import { WOW_SOURCES, WOW_TALENT_PATH, type WowGame, type WowStage, type WowStep } from "@/lib/wow-forever-data";
import WoWProfessions from "./WoWProfessions";
import WoWHunterDungeons from "./WoWHunterDungeons";
import WoWGoldFarming from "./WoWGoldFarming";
import WoWCombatControls from "./WoWCombatControls";
import WoWPetTracker from "./WoWPetTracker";
import WoWEquipmentTracker from "./WoWEquipmentTracker";
import WoWUnifiedSearch from "./WoWUnifiedSearch";
import { wowExtraField } from "@/lib/wow-portal-extras";

type Props = {
  game: WowGame;
  prog: GameProgress;
  setCheck: (key: string, value: boolean) => void;
  setField: (key: string, value: string) => void;
};
type View = "next" | "roadmap" | "zones" | "talents" | "combat" | "pets" | "skyborne" | "gear" | "professions" | "gold" | "lookup";
const VIEWS: { id: View; label: string; help: string }[] = [
  {id:"next",label:"🎯 Play next",help:"One clear task and your immediate objectives"},
  {id:"professions",label:"🧵 Professions",help:"Saved skills, patterns, recipe acquisition and market comparisons"},
  {id:"gold",label:"💰 Gold farms",help:"Gray-mob farming routes and personal measured gold per hour"},
  {id:"roadmap",label:"🗺️ 1–60 roadmap",help:"All chapters and checkable tasks"},
  {id:"zones",label:"🧭 Where to go",help:"Zones and dungeon suggestions for your level and faction"},
  {id:"talents",label:"🌿 Talents",help:"Exact leveling point at every level"},
  {id:"combat",label:"🏹 Combat & keys",help:"Rotations, keybinds and macros"},
  {id:"pets",label:"🐾 Pet guide",help:"Taming, training, feeding and control"},
  {id:"skyborne",label:"🌬️ Skyborne",help:"Racials, convergence and faction routes"},
  {id:"gear",label:"🎒 Gear & groups",help:"Stats, professions, dungeons and duo play"},
  {id:"lookup",label:"🔎 Find anything",help:"Search goals, abilities and sources"}
];
const K = (gameId: string, stageId: string, stepId: string) => questKey(gameId, "wow-" + stageId, stepId);
const F = (id: string, key: string) => id + "|" + key;
const uiInput: React.CSSProperties = { background: "var(--panel,#fff)",color:"var(--text,#222)",border:"1px solid var(--border,#ddd)",borderRadius:9,padding:"9px 12px",font:"inherit",maxWidth:"100%" };
const chip: React.CSSProperties = { borderRadius:99, padding:"9px 13px",minHeight:40,fontSize:13 };
const note: React.CSSProperties = { fontSize:14, lineHeight:1.55 };
const card: React.CSSProperties = { padding:16, marginTop:12 };
const ZONE_ROUTES = [
  {min:1,max:12,alliance:"Zephras Isle: Thendal Grove → Shen'dar → Valanaar",horde:"Zephras Isle: Thendal Grove → Shen'dar → Valanaar",dungeons:"None required",tip:"Finish the Skyborne introduction and the level-10 Hunter pet quest."},
  {min:13,max:19,alliance:"Westfall; alternatives: Loch Modan or Darkshore",horde:"The Barrens; alternative: Silverpine Forest",dungeons:"Hall of Thanes / Ragefire Chasm (13–18); Wailing Caverns (15–25); The Deadmines (18–23)",tip:"Get flight paths early and choose the same quest area as your Paladin partner."},
  {min:20,max:29,alliance:"Redridge Mountains → Duskwood / Wetlands / Ashenvale",horde:"Stonetalon Mountains → Ashenvale / Hillsbrad Foothills",dungeons:"Shadowfang Keep (22–30); Blackfathom Deeps (24–32); Excavation Site: Wetlands (24–29); Scarlet Monastery: Graveyard (28–38)",tip:"Pick up a strong ranged-weapon upgrade and train Aimed Shot at level 20."},
  {min:30,max:39,alliance:"Arathi Highlands / Stranglethorn Vale / Desolace / Riverglades",horde:"Thousand Needles / Arathi Highlands / Stranglethorn Vale / Riverglades",dungeons:"Scarlet Monastery (29–45 by wing); Gnomeregan (29–38); Razorfen Kraul (30–40); The Drowned City (35–40)",tip:"Level 30 brings Intimidation and Feign Death; use these before risky elite pulls."},
  {min:40,max:49,alliance:"Dustwallow Marsh → Tanaris / Feralas / Hinterlands / Searing Gorge",horde:"Dustwallow Marsh → Tanaris / Feralas / Hinterlands / Searing Gorge",dungeons:"Krol'dok Stronghold (40–45); Uldaman (42–52); Zul'Farrak (44–54); Maraudon wings (45–57)",tip:"Bestial Wrath at 40; continue your pet-first fighting style."},
  {min:50,max:59,alliance:"Un'Goro Crater / Felwood / Burning Steppes / Western & Eastern Plaguelands / Winterspring",horde:"Un'Goro Crater / Felwood / Burning Steppes / Western & Eastern Plaguelands / Winterspring",dungeons:"Sunken Temple (50–60); Blackrock Depths (52–60); Blackmaw Hold (55–60); Lower Blackrock Spire (55–60)",tip:"Replace outdated ammunition and weapon; get ready for level-60 activities."},
  {min:60,max:60,alliance:"Finish chosen stories, endgame dungeons or Mount Hyjal content",horde:"Finish chosen stories, endgame dungeons or Mount Hyjal content",dungeons:"Scholomance, Stratholme, Dire Maul, Upper Blackrock Spire, Shaper's Terrace",tip:"The leveling build is a starting point; consult the current patch for high-end content."}
];
function Counter({done,total}:{done:number;total:number}) {
  return <div style={{margin:"10px 0 15px"}}>
    <div className="gm-note">{done}/{total} finished · {total ? Math.round(done/total*100) : 0}%</div>
    <div role="progressbar" aria-label="WoW Hunter guide progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}
      style={{height:7,borderRadius:99,overflow:"hidden",background:"rgba(128,128,128,.18)",marginTop:6}}>
      <div style={{width:(total ? done/total*100 : 0)+"%",height:"100%",background:"var(--accent,#659e8b)"}}/>
    </div>
  </div>;
}
function Action({gameId,stage,step,done,setCheck}:{
  gameId:string;stage:WowStage;step:WowStep;done:boolean;setCheck:Props["setCheck"];
}) {
  return <div className="gm-ter-check-wrap">
    <label className="gm-item" style={{cursor:"pointer"}}>
      <input type="checkbox" checked={done} onChange={e=>setCheck(K(gameId,stage.id,step.id),e.target.checked)}/>
      <span className="gm-box" aria-hidden="true"/>
      <span className="gm-txt">
        <span className="gm-name">{step.title}{step.priority==="optional" ? " · optional" : ""}</span>
        {!done && <span className="gm-sub" style={{whiteSpace:"normal"}}>{step.how}</span>}
      </span>
    </label>
  </div>;
}
function StageTasks({game,stage,prog,setCheck,focused=false}:{game:WowGame;stage:WowStage;prog:GameProgress;setCheck:Props["setCheck"];focused?:boolean}) {
  const rest=stage.steps.filter(s=>!prog.checks[K(game.id,stage.id,s.id)]);
  const finished=stage.steps.filter(s=>!!prog.checks[K(game.id,stage.id,s.id)]);
  return <section className="gm-card" style={card}>
    <div className="gm-panel-label">Levels {stage.from}–{stage.to} · {stage.place}</div>
    <h3 style={{margin:"8px 0"}}>{stage.title}</h3>
    <p className="gm-note" style={note}>{stage.summary}</p>
    <Counter done={finished.length} total={stage.steps.length}/>
    {rest.length===0 ? <p className="gm-note">✓ All chapter goals complete.</p> :
      <>
        {focused && <div className="gm-panel-label">Start with this</div>}
        <Action gameId={game.id} stage={stage} step={rest[0]} done={false} setCheck={setCheck}/>
        {rest.length>1 && <details>
          <summary className="gm-note" style={{cursor:"pointer",padding:"12px 0"}}>Remaining actions ({rest.length-1})</summary>
          {rest.slice(1).map(step=><Action key={step.id} gameId={game.id} stage={stage} step={step} done={false} setCheck={setCheck}/>)}
        </details>}
      </>}
    {!!finished.length && <details style={{marginTop:8}}>
      <summary className="gm-note" style={{cursor:"pointer",padding:"12px 0"}}>Completed actions ({finished.length})</summary>
      {finished.map(step=><Action key={step.id} gameId={game.id} stage={stage} step={step} done setCheck={setCheck}/>)}
    </details>}
  </section>;
}
function SmallInfo({title,children}:{title:string;children:React.ReactNode}) {
  return <div className="gm-card" style={card}><h3 style={{margin:"0 0 7px",fontSize:17}}>{title}</h3><div style={note}>{children}</div></div>;
}
export default function WoWForeverView({game,prog,setCheck,setField}:Props) {
  const [view,setView]=useState<View>("next");
  const [filter,setFilter]=useState("");
  const [searchTarget,setSearchTarget]=useState("");
  const [showAllTalent,setShowAllTalent]=useState(false);
  const currentLevel=Math.max(1,Math.min(60,Number(prog.fields[F(game.id,"level")]||"34")||34));
  const playMode=prog.fields[wowExtraField(game.id,"play-mode")]||"gold";
  const faction=prog.fields[F(game.id,"faction")]||"horde";
  const done=(stage:WowStage,step:WowStep)=>!!prog.checks[K(game.id,stage.id,step.id)];
  const count=game.stages.reduce((n,s)=>n+s.steps.filter(t=>done(s,t)).length,0);
  const total=game.stages.reduce((n,s)=>n+s.steps.length,0);
  const zoneAtLevel=ZONE_ROUTES.find(z=>currentLevel>=z.min&&currentLevel<=z.max)??ZONE_ROUTES[0];
  const stageAtLevel=game.stages.find(s=>currentLevel>=s.from&&currentLevel<=s.to) ??
    [...game.stages].reverse().find(s=>currentLevel>=s.from) ?? game.stages[0];
  const stageNow=stageAtLevel.steps.some(s=>!done(stageAtLevel,s))
    ? stageAtLevel : game.stages.find(s=>s.from>stageAtLevel.to && s.steps.some(t=>!done(s,t))) ?? stageAtLevel;
  const nextUnfinished=stageNow.steps.find(s=>!done(stageNow,s));
  const talentsAvailable=WOW_TALENT_PATH.filter(t=>t.level<=currentLevel);
  const nextTalent=WOW_TALENT_PATH.find(t=>t.level>currentLevel);
  return <div className="gm-wow-guide" style={{marginTop:14}}>
    <div className="gm-card gm-wow-intro" style={{...card,marginTop:0}}>
      <div className="gm-panel-label">🌬️ Your playthrough · Skyborne Beast Mastery</div>
      <div className="gm-wow-intro-row">
        <h2 style={{margin:"7px 0"}}>Hunter field guide</h2>
        <label className="gm-wow-level">My level
          <input type="number" inputMode="numeric" min={1} max={60}
            value={prog.fields[F(game.id,"level")]??"34"}
            onChange={e=>setField(F(game.id,"level"),String(Math.max(1,Math.min(60,Number(e.target.value)||1))))}
            style={{...uiInput,width:80}} aria-label="Hunter level"/>
        </label>
      </div>
      <details className="gm-wow-character-settings">
        <summary>Character settings &amp; guide notes</summary>
        <div className="gm-wow-character-fields">
          <label>Skyborne faction
            <select value={faction} onChange={e=>setField(F(game.id,"faction"),e.target.value)} aria-label="Skyborne faction">
              <option value="horde">Horde · Windshaper</option><option value="alliance">Alliance · High Order</option>
            </select>
          </label>
          <label>My pet's name (optional)
            <input type="text" maxLength={70} value={prog.fields[F(game.id,"pet-name")]||""}
              placeholder="My companion" onChange={e=>setField(F(game.id,"pet-name"),e.target.value)}/>
          </label>
        </div>
        <p className="gm-note" style={note}>Your next objective is based on character level. Checkboxes save with the other Games trackers.</p>
        <p className="gm-note" style={{fontSize:12}}>WoW Forever systems may change after patches; the leveling talent path is a dated guide, not a permanent best-in-slot claim.</p>
      </details>
      <Counter done={count} total={total}/>
    </div>
    <nav aria-label="WoW Forever guide sections" className="gm-chips gm-wow-nav" style={{display:"flex",gap:8,margin:"16px 0"}}>
      {VIEWS.map(v=><button key={v.id} type="button" className={"gm-chip"+(view===v.id?" on":"")} aria-pressed={view===v.id} title={v.help}
        onClick={()=>{setSearchTarget("");setView(v.id)}} style={chip}>{v.label}</button>)}
    </nav>
    <p className="gm-wow-nav-hint">Swipe tabs sideways to see more sections →</p>

    {view==="next" && <>
      <div className="gm-card" style={card}>
        <div className="gm-panel-label">What do you want to work on today?</div>
        <label style={{display:"grid",gap:8,fontWeight:700}}>My play goal
          <select value={playMode} onChange={e=>setField(wowExtraField(game.id,"play-mode"),e.target.value)}
            style={{...uiInput,width:"100%"}}>
            <option value="gold">Earn gold without XP</option>
            <option value="professions">Improve professions / crafting</option>
            <option value="gear">Farm Hunter gear</option>
            <option value="leveling">Level my Hunter</option>
          </select>
        </label>
        <p className="gm-note" style={note}>This choice saves for your next visit. The guide no longer assumes leveling is your default goal.</p>
      </div>
      {playMode==="gold"&&<WoWGoldFarming gameId={game.id} level={currentLevel} prog={prog} setField={setField} compact/>}
      {playMode==="professions"&&<WoWProfessions gameId={game.id} prog={prog} setCheck={setCheck} setField={setField}/>}
      {playMode==="gear"&&<WoWHunterDungeons gameId={game.id} level={currentLevel}
        faction={faction==="alliance"?"alliance":"horde"} prog={prog} setCheck={setCheck} mode="summary"/>}
      {playMode==="leveling"&&<>
        <div className="gm-card" style={card}>
          <div className="gm-panel-label">Your next move · level {currentLevel}</div>
          <h3 style={{margin:"7px 0"}}>{nextUnfinished?nextUnfinished.title:"Chapter finished!"}</h3>
          <p className="gm-note" style={note}>{nextUnfinished?nextUnfinished.how:"Review your roadmap to check missed goals."}</p>
          <p className="gm-note">Recommended chapter: <strong>{stageNow.title}</strong></p>
          {currentLevel>=10&&<p className="gm-note">Your current keys: Mouse 4 = Auto Shot · wheel up = pet attacks the tank's target (when configured) · wheel down = recall · R = Feign Death. Your editable combat setup is in Combat &amp; Keys.</p>}
        </div>
        <StageTasks game={game} stage={stageNow} prog={prog} setCheck={setCheck} focused/>
        <SmallInfo title={"Where to quest next · level "+currentLevel}>
          <p><b>Suggested areas:</b> {faction==="horde"?zoneAtLevel.horde:zoneAtLevel.alliance}</p>
          <p style={{marginBottom:0}}>{zoneAtLevel.tip}</p>
        </SmallInfo>
        <SmallInfo title="Simple fight routine">
          <ol style={{paddingLeft:20,margin:"6px 0"}}>
            <li>Allow your tank or pet to establish threat, then attack the same target.</li>
            <li>Start Auto Shot with your current Mouse 4 binding; use your numbered shots as needed.</li>
            <li>Recall your pet with wheel down before shortcuts. R is your Feign Death key.</li>
          </ol>
        </SmallInfo>
      </>}
    </>}

    {view==="roadmap" && <>
      <SmallInfo title="How to use this roadmap">
        Pick up quests from the current hub, finish nearby objectives together, then turn them in. Tasks are milestones rather than a complete list of every repeatable quest. Open <strong>Find anything</strong> for the zone-by-zone quest directory.
      </SmallInfo>
      {game.stages.map(stage=>{
        const finished=stage.steps.filter(t=>done(stage,t)).length;
        return <details key={stage.id} className="gm-card" style={card} open={undefined}>
          <summary style={{cursor:"pointer",fontWeight:700,padding:"4px 0"}}>
            {finished===stage.steps.length?"✓ ":""}Levels {stage.from}–{stage.to} · {stage.title} <span className="gm-note">({finished}/{stage.steps.length})</span>
          </summary>
          <p className="gm-note" style={note}>{stage.place} · {stage.summary}</p>
          {stage.steps.map(step=><Action key={step.id} gameId={game.id} stage={stage} step={step} done={done(stage,step)} setCheck={setCheck}/>)}
        </details>;
      })}
    </>}

    {view==="zones" && <>
      <SmallInfo title="Suggested zone route · choose by your actual level">
        These are flexible areas, not a strict quest-by-quest rail. Choose a nearby zone with quests around your level; if your Paladin partner is there, play together. Dungeon level bands are approximate and may be adjusted in patches.
      </SmallInfo>
      <WoWHunterDungeons gameId={game.id} level={currentLevel} faction={faction==="alliance"?"alliance":"horde"} prog={prog} setCheck={setCheck}/>
      {ZONE_ROUTES.map(z=><div key={z.min} className="gm-card" style={{...card,border:z===zoneAtLevel?"2px solid var(--accent,#659e8b)":undefined}}>
        <div className="gm-panel-label">Levels {z.min}–{z.max}{z===zoneAtLevel?" · YOUR CURRENT BRACKET":""}</div>
        <h3 style={{margin:"7px 0"}}>{faction==="horde"?"Horde":"Alliance"} questing route</h3>
        <p style={note}><b>Go to:</b> {faction==="horde"?z.horde:z.alliance}</p>
        <p style={note}><b>Other bracket dungeon options (not gear-ranked):</b> {z.dungeons}</p>
        <p className="gm-note">{z.tip}</p>
      </div>)}
      <SmallInfo title="Simple travel rules">
        Pick up flight paths, bind your Hearthstone at a useful hub, combine quests in the same subzone, and skip dangerous elite quests until your partner or a group is available. A dungeon is optional, not a mandatory step.
      </SmallInfo>
    </>}

    {view==="talents" && <>
      <SmallInfo title="The recommended leveling build">
        Beast Mastery first, then Marksmanship: <strong>31/20/0 at level 60</strong>. This is one documented leveling route, with pet damage and solo comfort prioritized. You can choose a different build later.
      </SmallInfo>
      <div className="gm-card" style={card}>
        <div className="gm-panel-label">My level {currentLevel}</div>
        <h3 style={{margin:"6px 0"}}>{currentLevel<10?"Talents unlock at level 10":("Latest point: "+(talentsAvailable[talentsAvailable.length-1]?.name||""))}</h3>
        <p className="gm-note">{nextTalent?"Next at level "+nextTalent.level+": "+nextTalent.name:"Leveling path fully unlocked"}</p>
        <div className="gm-panel-label" style={{marginTop:16}}>Points through your level</div>
        {talentsAvailable.slice(-6).map(t=><div key={t.level} style={{display:"flex",gap:15,padding:"9px 0",borderBottom:"1px solid var(--border,#ddd)"}}>
          <span style={{minWidth:36,fontWeight:700}}>Lv {t.level}</span><span><strong>{t.name}</strong><span className="gm-note"> · {t.tree}</span></span>
        </div>)}
        <button type="button" className="gm-pill" onClick={()=>setShowAllTalent(!showAllTalent)} style={{marginTop:15}}>
          {showAllTalent?"Hide full 1–60 build":"Show all 51 talent points"}
        </button>
        {showAllTalent && <div style={{marginTop:12,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,270px),1fr))",gap:"2px 18px"}}>
          {WOW_TALENT_PATH.map(t=><div key={t.level} style={{display:"flex",gap:12,padding:"7px 0",opacity:t.level>currentLevel?.75:1,borderBottom:"1px solid var(--border,#ddd)"}}>
            <b style={{minWidth:42}}>Lv {t.level}</b><span>{t.name}</span></div>)}
        </div>}
      </div>
      <SmallInfo title="Talent milestones">
        <p><b>10–24:</b> Strong Auto Shot, pet upgrades and movement talents.</p>
        <p><b>25:</b> Summon Hawk. <b>30:</b> Intimidation. <b>40:</b> Bestial Wrath.</p>
        <p><b>41–60:</b> Marksmanship support — Lethal Attacks, Careful Aim, Rapid Killing, Hawk Eye, Trueshot Aura and Mortal Shots.</p>
        <p>Talents are not automatically spent by the portal; this is a reference for choosing them in-game.</p>
      </SmallInfo>
    </>}

    {view==="combat" && <>
      <WoWCombatControls gameId={game.id} prog={prog} setField={setField}/>
      <SmallInfo title="Hunter combat reminders">
        <p><b>With a Paladin tank:</b> Assist his target; disable pet Growl and recall before shortcuts.</p>
        <p><b>Solo:</b> Let your pet establish threat, keep Auto Shot running and Mend Pet early.</p>
        <p><b>When threatened:</b> Intimidation, traps, Wing Clip, and Feign Death are situational controls. Test Forever-specific macro commands in a safe place.</p>
      </SmallInfo>
    </>}

    {view==="pets" && <>
      <WoWPetTracker gameId={game.id} prog={prog} setField={setField}/>
      <SmallInfo title="First pet: get one at level 10">
        <ol style={{paddingLeft:20,margin:0}}>
          <li>Speak to a Hunter trainer and finish the Tame Beast class quest.</li>
          <li>Tame a nearby useful pet first; don't delay leveling to camp a rare spawn.</li>
          <li>Keep it fed, monitor happiness, and learn Mend Pet / Revive Pet.</li>
          <li>Train Growl and appropriate Claw or Bite ranks; recheck skill ranks as you level.</li>
          <li>Configure wheel up as your tested tank-target pet attack, wheel down to recall, Mouse 4 to Auto Shot, and your numbered shots in Combat & Keys.</li>
        </ol>
      </SmallInfo>
      <SmallInfo title="Which pet should I use?">
        <p><b>Cat — recommended damage pet:</b> Good damage while you attack from range. The Starving Mountain Lion in Hillsbrad Foothills is a documented fast-attack option. The Rake in Mulgore is a rare alternative, not necessary for success.</p>
        <p><b>Durable pet — comfort option:</b> If your cat keeps dying while soloing, prioritize a sturdier available family and your pet's training rather than chasing theoretical best DPS.</p>
        <p><b>Higher-level pet:</b> Revisit pet ability ranks and special skills. Not every pet ability can simply be bought from the trainer.</p>
      </SmallInfo>
      <SmallInfo title="Pet controls and troubleshooting">
        <p><b>Pet runs away:</b> Scroll down to recall, ensure Passive/Follow worked, and avoid sending it through dense enemy groups.</p>
        <p><b>Pet dies fast:</b> Upgrade training, heal earlier, pull one target, and use a sturdier pet if needed.</p>
        <p><b>Can't hold threat while solo:</b> Growl autocast ON; train its rank and improve your pet's damage.</p>
        <p><b>Pet pulls off the dungeon tank:</b> Turn Growl OFF and attack the tank's chosen enemy.</p>
        <p><b>Pet lacks damage:</b> Check happiness, level, ability ranks, Focus usage and whether it's actually attacking.</p>
        <p><b>With your Paladin:</b> If your partner is tanking, set Growl OFF and have your pet assist his target. Use a tested tank-focus macro rather than allowing your pet to pick unrelated enemies.</p>
      </SmallInfo>
    </>}

    {view==="skyborne" && <>
      <SmallInfo title={faction==="horde"?"Horde · Windshaper racials":"Alliance · High Order racials"}>
        <p><b>Walk on Air:</b> Glide downward for a short time; handy for cliffs and shortcuts. Practice without taking unnecessary falls.</p>
        {faction==="horde" ?
          <><p><b>Skysight:</b> Temporary speed boost. Activate it at an <b>Elemental Convergence</b> to gain the hour-long <b>Charged</b> enhancement. While Charged, future Skysight casts become stronger. The boost isn't always active.</p>
            <p><b>Your starting quest:</b> The Gift of Skysight near Thendal Grove. Later leave via the Valanaar west dock toward Mulgore.</p></>
          : <><p><b>Read Ley Line:</b> Temporary health and mana regeneration. Use it at a ley line to gain an hour-long <b>Attuned</b> boost to later activations.</p>
            <p><b>Your starting quest:</b> Reading the Ley Lines near Thendal Grove. Later leave via the Valanaar east dock toward Dalaran.</p></>}
        <p><b>Passives:</b> Wind Blessed improves haste; Elemental Insight improves damage against elemental creatures. Check your current character tooltip for exact values as patches change.</p>
      </SmallInfo>
      <SmallInfo title="Elemental Convergences — quick answer">
        <p>They are <b>Horde Skyborne power-up locations</b> for Skysight, not an item to loot or a dungeon objective. Use Skysight there once to earn the Charged buff, then continue questing. You do not need to keep standing at the convergence.</p>
        <p>The current fan database lists Skysight as a 15% temporary speed boost, increasing to 30% with Charged for one hour. Confirm the buff duration in your in-game tooltip.</p>
      </SmallInfo>
      <SmallInfo title="Skyborne journey / transportation">
        <p><b>Starting zone:</b> Zephras Isle (roughly levels 1–12). Quest hub order: Thendal Grove → Shen'dar Village / Highlands → West Pylon Watchtower and Falaath Village → Valanaar → nearby pylons, forest and Shrine of Akir.</p>
        <p><b>Exit:</b> Horde west dock to Mulgore/Thunder Bluff; Alliance east dock to Dalaran. Follow the quest What Comes Next and the corresponding ship quest.</p>
        <p>The linked Zephras Isle directory in Find anything has individual quest names, hubs and step requirements for side quests.</p>
      </SmallInfo>
    </>}

    {view==="professions" && <WoWProfessions gameId={game.id} prog={prog} setCheck={setCheck} setField={setField} initialQuery={searchTarget}/>}
    {view==="gold" && <WoWGoldFarming gameId={game.id} level={currentLevel} prog={prog} setField={setField}/>}

    {view==="gear" && <>
      <WoWEquipmentTracker gameId={game.id} level={currentLevel} prog={prog} setField={setField}/>
      <WoWHunterDungeons gameId={game.id} level={currentLevel} faction={faction==="alliance"?"alliance":"horde"} prog={prog} setCheck={setCheck}/>
      <SmallInfo title="Simple leveling gear priorities">
        <ol style={{paddingLeft:20,margin:0}}>
          <li><b>Ranged weapon damage:</b> Check upgrades often; a better bow/gun/crossbow greatly affects Auto Shot.</li>
          <li><b>Ammunition + quiver/pouch:</b> Refill and upgrade; don't head out with an empty bag.</li>
          <li><b>Agility and useful offensive stats:</b> Attack Power, hit and crit become increasingly relevant. Don't drop a major weapon upgrade for a small secondary-stat difference.</li>
          <li><b>Survivability:</b> Stamina can be valuable when you're undergeared or playing solo.</li>
          <li><b>Pet performance:</b> Keep pet skills current because the pet inherits some Hunter stats in Forever.</li>
        </ol>
      </SmallInfo>
      <SmallInfo title="Professions and supplies">
        <p><b>Skinning + Leatherworking:</b> Excellent if you want to craft/use leather gear, quivers and ammo pouches.</p>
        <p><b>Skinning + gathering:</b> Lower effort, useful for gold while questing.</p>
        <p><b>Always pack:</b> Pet food, your food/water, ammunition, and a few health/mana potions if available.</p>
      </SmallInfo>
      <SmallInfo title="Dungeon checklist">
        <p><b>Before:</b> Repair gear, restock ammunition, check your pet is summoned and fed, and <b>turn OFF Growl</b> when a player is tanking.</p>
        <p><b>During:</b> Attack the marked or tanked target, send your pet only where the group is fighting, and recall it before shortcuts. Keep Auto Shot running and use Multi-Shot only when extra enemies are safe to hit.</p>
        <p><b>Control:</b> Frost/Freezing Trap for dangerous packs. In Forever all traps share a cooldown, so choose intentionally.</p>
        <p><b>Your Paladin duo:</b> If they pull and hold threat, follow them rather than initiating extra packs. Use pet damage, Serpent Sting on durable targets, and Mend Pet as needed.</p>
      </SmallInfo>
      <SmallInfo title="Level 60: choose your goal">
        The included 31/20/0 build is for leveling. At endgame, compare current dungeon and raid builds before changing talents; balance and best-in-slot lists may shift as Forever updates.
      </SmallInfo>
    </>}

    {view==="lookup" && <>
      <WoWUnifiedSearch game={game} prog={prog} query={filter} onQuery={setFilter} onOpen={(destination,term)=>{setSearchTarget(term);setView(destination)}}/>
      <SmallInfo title="Reference library · quest specifics & updates">
        <p>This personal guide summarizes major milestones. For all individual Skyborne side quests, detailed maps, complete pet ability databases and current beta tuning, use these original references:</p>
        <div style={{display:"grid",gap:9}}>
          {WOW_SOURCES.map(s=><a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a>)}
          <a href="https://www.wowhead.com/forever/guide/dungeons-overview-locations-details" target="_blank" rel="noopener noreferrer">Wowhead: Forever dungeon levels ↗</a>
          <a href="https://topbuilds.gg/wow-forever/leveling-zones/" target="_blank" rel="noopener noreferrer">WoW Forever leveling zone overview ↗</a>
        </div>
        <p className="gm-note" style={{marginTop:12}}>Guide references are updated as sources are verified; source availability can change. Check game tooltips for differences from published guides.</p>
      </SmallInfo>
    </>}
  </div>;
}
