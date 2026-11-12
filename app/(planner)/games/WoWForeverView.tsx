"use client";

import { useMemo, useState } from "react";
import { questKey, type GameProgress } from "@/lib/games-data";
import { WOW_SOURCES, WOW_TALENT_PATH, type WowGame, type WowStage, type WowStep } from "@/lib/wow-forever-data";
import WoWProfessions from "./WoWProfessions";

type Props = {
  game: WowGame;
  prog: GameProgress;
  setCheck: (key: string, value: boolean) => void;
  setField: (key: string, value: string) => void;
};
type View = "next" | "roadmap" | "zones" | "talents" | "combat" | "pets" | "skyborne" | "gear" | "professions" | "lookup";
const VIEWS: { id: View; label: string; help: string }[] = [
  {id:"next",label:"🎯 Play next",help:"One clear task and your immediate objectives"},
  {id:"professions",label:"🧵 Professions",help:"Saved skills, patterns, recipes, and crafting recommendations"},
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
const BASE_MACROS = [
  {title:"Scroll up · Pet Attack",code:"#showtooltip\n/petattack\n/cast Dash\n/cast Dive\n/cast Charge",help:"Send your pet to the selected target; try an available pet movement ability."},
  {title:"Scroll down · Pet Recall",code:"#showtooltip\n/petpassive\n/petfollow",help:"Stop attacking, switch your pet to Passive, and call it back."},
  {title:"Mouse 4 / key 1 · Target + Auto Shot",code:"#showtooltip Auto Shot\n/cleartarget [dead]\n/targetenemy [noharm]\n/cast !Auto Shot",help:"If the current target is dead, friendly or missing, select a nearby enemy and start shooting. Repeated presses do not toggle Auto Shot off."},
  {title:"Mouse 5 / key 2 · Arcane Shot + Auto Shot",code:"#showtooltip Arcane Shot\n/cleartarget [dead]\n/targetenemy [noharm]\n/cast Arcane Shot\n/cast !Auto Shot",help:"Cast Arcane Shot, then keep Auto Shot active. Also acquires a new enemy when you have no valid hostile target."},
  {title:"Key 3 · Aimed Shot + Auto Shot",code:"#showtooltip Aimed Shot\n/cleartarget [dead]\n/targetenemy [noharm]\n/cast Aimed Shot\n/cast !Auto Shot",help:"Single-target ranged attack at level 20; keeps Auto Shot active. Do not expect it to fire while moving."},
  {title:"Key E · Serpent Sting + Auto Shot",code:"#showtooltip Serpent Sting\n/cleartarget [dead]\n/targetenemy [noharm]\n/cast Serpent Sting\n/cast !Auto Shot",help:"Apply the damage-over-time effect on longer-lived targets, and start or maintain Auto Shot."}
];
const KEY_PRIMARY = [
  ["1","Target + Auto Shot"],["2","Arcane + Auto"],["3","Aimed + Auto"],["4","Multi-Shot"],["5","Volley"],
  ["Q","Summon Hawk"],["E","Serpent Sting"],["R","Mend Pet"],["T","Hunter's Mark"],
  ["F","Intimidation"],["G","Wing Clip"],["Z","Aspect of the Hawk"],["X","Aspect of the Cheetah"],
  ["C","Feign Death"],["V","Concussive Shot"],["Wheel ↑","Pet Attack"],["Wheel ↓","Pet Recall"],["Mouse 4","Target + Auto Shot"],["Mouse 5","Arcane + Auto"]
];
const KEY_SHIFT = [
  ["Shift+1","Bestial Wrath"],["Shift+2","Rapid Fire"],["Shift+3","Health potion"],
  ["Shift+4","Raptor Strike"],["Shift+Q","Freezing Trap"],["Shift+E","Frost Trap"],
  ["Shift+R","Revive Pet"],["Shift+F","Explosive Trap"],["Shift+G","Immolation Trap"],
  ["Shift+Z","Aspect of the Monkey"],["Shift+C","Disengage"],["Shift+V","Pet Move To"],
  ["Shift+Space","Walk on Air"],["Shift+T","Read Ley Line / Skysight"]
];
const SPELLS = [
  {name:"Auto Shot",level:1,usage:"Your repeating ranged attack; stand still briefly so it fires."},
  {name:"Arcane Shot",level:6,usage:"Instant ranged damage. Shares a cooldown with Summon Hawk."},
  {name:"Concussive Shot",level:8,usage:"Slow an approaching enemy to create room."},
  {name:"Tame Beast",level:10,usage:"Hunter class quest; unlock permanent pet management."},
  {name:"Mend Pet",level:10,usage:"Heal your pet before it becomes dangerously low."},
  {name:"Serpent Sting",level:0,usage:"Damage over time. Best when the target lives long enough."},
  {name:"Aimed Shot",level:20,usage:"Strong single-target shot; shares a cooldown with Multi-Shot."},
  {name:"Aspect of the Cheetah",level:20,usage:"Travel faster; swap to Hawk before damage can daze you."},
  {name:"Summon Hawk",level:25,usage:"BM talent; sustained hawk damage. Two active at once; shares Arcane Shot cooldown."},
  {name:"Intimidation",level:30,usage:"BM pet-delivered stun; helpful when pressured or interrupting."},
  {name:"Feign Death",level:30,usage:"Drop threat / stop a bad pull when it succeeds."},
  {name:"Bestial Wrath",level:40,usage:"BM pet burst cooldown for hard encounters."},
  {name:"Multi-Shot",level:0,usage:"Damage several enemies; shares Aimed Shot cooldown."},
  {name:"Frost Trap",level:0,usage:"Slow an area; traps share a cooldown in Forever."},
  {name:"Freezing Trap",level:0,usage:"Control one enemy; traps share a cooldown in Forever."},
  {name:"Hunter's Mark",level:0,usage:"Mark a longer-lived target before pulling."},
  {name:"Disengage",level:0,usage:"Classic-style threat reduction in melee; not a backward leap."}
];
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
  const [showAllTalent,setShowAllTalent]=useState(false);
  const [copied,setCopied]=useState("");
  const currentLevel=Math.max(1,Math.min(60,Number(prog.fields[F(game.id,"level")]||"1")||1));
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
  const taskMatches=useMemo(()=>{
    const q=filter.toLowerCase().trim();
    return q?game.stages.flatMap(s=>s.steps.filter(t=>(t.title+" "+t.how+" "+s.title+" "+s.place).toLowerCase().includes(q)).map(t=>({stage:s,step:t}))).slice(0,50):[];
  },[filter,game.stages]);
  const spellMatches=filter.trim()?SPELLS.filter(x=>(x.name+" "+x.usage).toLowerCase().includes(filter.toLowerCase().trim())):[];
  const copy=async(code:string,title:string)=>{try{await navigator.clipboard.writeText(code);setCopied(title);}catch{setCopied("Unable to copy. Select the macro text instead.");}};
  return <div className="gm-wow-guide" style={{marginTop:14}}>
    <div className="gm-card" style={{...card,marginTop:0}}>
      <div className="gm-panel-label">🌬️ Your playthrough · Skyborne Beast Mastery</div>
      <h2 style={{margin:"7px 0"}}>Hunter field guide</h2>
      <p className="gm-note" style={note}>A low-pressure route from Zephras Isle to level 60. Your next objective is based on your level; each checkbox saves with the other Games trackers.</p>
      <div style={{display:"flex",flexWrap:"wrap",alignItems:"end",gap:12,marginTop:14}}>
        <label style={{display:"grid",gap:5,fontSize:13}}>My level
          <input type="number" inputMode="numeric" min={1} max={60} value={prog.fields[F(game.id,"level")]??"1"}
            onChange={e=>setField(F(game.id,"level"),String(Math.max(1,Math.min(60,Number(e.target.value)||1))))}
            style={{...uiInput,width:90}} aria-label="Hunter level"/>
        </label>
        <label style={{display:"grid",gap:5,fontSize:13}}>Skyborne faction
          <select value={faction} onChange={e=>setField(F(game.id,"faction"),e.target.value)} style={{...uiInput,minWidth:170}} aria-label="Skyborne faction">
            <option value="horde">Horde · Windshaper</option><option value="alliance">Alliance · High Order</option>
          </select>
        </label>
        <label style={{display:"grid",gap:5,fontSize:13}}>My pet's name (optional)
          <input type="text" maxLength={70} value={prog.fields[F(game.id,"pet-name")]||""} placeholder="My companion"
            onChange={e=>setField(F(game.id,"pet-name"),e.target.value)} style={{...uiInput,width:160}}/>
        </label>
      </div>
      <Counter done={count} total={total}/>
      <p className="gm-note" style={{fontSize:12}}>Patch note: WoW Forever systems and talent tuning are still changing. The talent path is a Nov 4 published 1–60 leveling build, not a promise of permanent best-in-slot.</p>
    </div>
    <nav aria-label="WoW Forever guide sections" className="gm-chips gm-wow-nav" style={{display:"flex",gap:8,margin:"16px 0"}}>
      {VIEWS.map(v=><button key={v.id} type="button" className={"gm-chip"+(view===v.id?" on":"")} aria-pressed={view===v.id} title={v.help}
        onClick={()=>setView(v.id)} style={chip}>{v.label}</button>)}
    </nav>

    {view==="next" && <>
      <div className="gm-card" style={card}>
        <div className="gm-panel-label">Your next move · level {currentLevel}</div>
        <h3 style={{margin:"7px 0"}}>{nextUnfinished?nextUnfinished.title:"Chapter finished!"}</h3>
        <p className="gm-note" style={note}>{nextUnfinished?nextUnfinished.how:"Open the roadmap to check earlier goals or move on to your next level."}</p>
        <p className="gm-note">Recommended chapter: <strong>{stageNow.title}</strong></p>
        {currentLevel>=10 && <p className="gm-note">For combat: Scroll up = pet attack; scroll down = recall; Mouse 4 / key 1 = target + Auto Shot; Mouse 5 / key 2 = Arcane Shot. R = Mend Pet.</p>}
        {currentLevel<10 && <p className="gm-note">Big power spike ahead: your first permanent pet at level 10.</p>}
      </div>
      <StageTasks game={game} stage={stageNow} prog={prog} setCheck={setCheck} focused/>
      <SmallInfo title={"Where to quest next · level "+currentLevel}>
        <p><b>Suggested areas:</b> {faction==="horde"?zoneAtLevel.horde:zoneAtLevel.alliance}</p>
        <p><b>Dungeon options:</b> {zoneAtLevel.dungeons}</p>
        <p style={{marginBottom:0}}>{zoneAtLevel.tip}</p>
      </SmallInfo>
      <SmallInfo title="Simple fight routine">
        <ol style={{paddingLeft:20,margin:"6px 0"}}>
          <li>Choose one target. Mark it for a longer fight.</li>
          <li>Scroll up to send your pet (after level 10).</li>
          <li>Click Mouse 4 (or key 1) to select a new nearby enemy and start Auto Shot. Mouse 5 (or key 2) adds Arcane Shot; use Aimed Shot once learned.</li>
          <li>Serpent Sting for targets living long enough; save Hawk for sustained fights after level 25.</li>
          <li>Use R to heal your pet; scroll down to recall it before moving.</li>
        </ol>
        <p style={{marginBottom:0}}>With your Paladin partner: let the person tanking establish threat before sending your pet to a different enemy.</p>
      </SmallInfo>
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
      {ZONE_ROUTES.map(z=><div key={z.min} className="gm-card" style={{...card,border:z===zoneAtLevel?"2px solid var(--accent,#659e8b)":undefined}}>
        <div className="gm-panel-label">Levels {z.min}–{z.max}{z===zoneAtLevel?" · YOUR CURRENT BRACKET":""}</div>
        <h3 style={{margin:"7px 0"}}>{faction==="horde"?"Horde":"Alliance"} questing route</h3>
        <p style={note}><b>Go to:</b> {faction==="horde"?z.horde:z.alliance}</p>
        <p style={note}><b>Dungeons:</b> {z.dungeons}</p>
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
      <SmallInfo title="Combat priority · not a rigid rotation">
        <p><b>Short fights:</b> Send pet → Auto Shot → Arcane Shot → Aimed Shot when available. Add Serpent Sting if the target will live long enough.</p>
        <p><b>Long fights / elites (25+):</b> Mark first → send pet → keep Auto Shot and pet attacks active → Aimed Shot → use Summon Hawk for sustained damage (up to two Hawks). Hawk shares Arcane Shot cooldown.</p>
        <p><b>Several enemies:</b> Use Multi-Shot instead of Aimed Shot. AoE traps/Volley are situational and mana hungry. Aimed and Multi share a cooldown; all traps now share one cooldown.</p>
        <p><b>In trouble:</b> Mend Pet (R), Intimidation (F at 30), Concussive Shot (V), Feign Death (C at 30), or scroll down to recall.</p>
      </SmallInfo>
      <SmallInfo title="WASD + scroll wheel pet control + two attack side buttons">
        <p>Use A/D to strafe and hold the right mouse button to turn. Scroll UP sends your pet; scroll DOWN recalls it. Mouse 4 starts a new target and Auto Shot; Mouse 5 uses Arcane Shot and keeps Auto Shot active. Keep 1 and 2 as keyboard backups. Unbind ordinary camera zoom from wheel up/down, or move zoom to modified wheel bindings.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,200px),1fr))",gap:7}}>
          {KEY_PRIMARY.map(([key,spell])=><div key={key} style={{display:"flex",gap:12,alignItems:"center",padding:"7px 9px",borderRadius:8,background:"rgba(128,128,128,.08)"}}>
            <kbd style={{fontWeight:700,minWidth:58}}>{key}</kbd><span>{spell}</span></div>)}
        </div>
        <details style={{marginTop:14}}><summary style={{cursor:"pointer",fontWeight:700}}>Show my Shift binds ({KEY_SHIFT.length})</summary>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,200px),1fr))",gap:7,marginTop:10}}>
            {KEY_SHIFT.map(([key,spell])=><div key={key} style={{display:"flex",gap:12,padding:7,borderRadius:7,background:"rgba(128,128,128,.08)"}}>
              <kbd style={{fontWeight:700,minWidth:88}}>{key}</kbd><span>{spell}</span></div>)}
          </div>
        </details>
        <p className="gm-note" style={{marginTop:12}}>These are suggested bindings, not Forever defaults. Some replace familiar shortcuts (C, R, V). Leave an ability's slot empty until you learn it.</p>
      </SmallInfo>
      <SmallInfo title="Scroll-wheel pet + auto-target shooting macros · tap to copy">
        {BASE_MACROS.map(m=><div key={m.title} style={{marginTop:14}}>
          <b>{m.title}</b><p className="gm-note">{m.help}</p>
          <pre style={{whiteSpace:"pre-wrap",background:"rgba(128,128,128,.1)",padding:12,borderRadius:8,fontSize:12}}>{m.code}</pre>
          <button type="button" className="gm-pill" onClick={()=>void copy(m.code,m.title)}>Copy macro</button>
        </div>)}
        {copied && <p role="status" className="gm-note">{copied==="Unable to copy. Select the macro text instead."?copied:("Copied: "+copied)}</p>}
        <p className="gm-note" style={{marginTop:12}}>Type /macro → New → paste → drag each macro to an action bar slot. In Options → Keybindings → Action Bars, bind Pet Attack to Mouse Wheel Up, Pet Recall to Mouse Wheel Down, Target + Auto Shot to Mouse 4 or 1, and Arcane + Auto to Mouse 5 or 2. Clear the default camera zoom wheel bindings first. In dungeons, be careful: automatic enemy selection can pick a nearby enemy you did not intend to pull. The !Auto Shot prefix works in documented Classic macros but has not been verified here in your current Forever client. Test on a safe training target.</p>
      </SmallInfo>
    </>}

    {view==="pets" && <>
      <SmallInfo title="First pet: get one at level 10">
        <ol style={{paddingLeft:20,margin:0}}>
          <li>Speak to a Hunter trainer and finish the Tame Beast class quest.</li>
          <li>Tame a nearby useful pet first; don't delay leveling to camp a rare spawn.</li>
          <li>Keep it fed, monitor happiness, and learn Mend Pet / Revive Pet.</li>
          <li>Train Growl and appropriate Claw or Bite ranks; recheck skill ranks as you level.</li>
          <li>Bind Pet Attack to scroll up, Pet Passive/Follow to scroll down, and Target + Auto Shot / Arcane + Auto to your two mouse side buttons.</li>
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
        <p><b>With your Paladin:</b> If your partner is tanking, consider Growl OFF; use your pet as an additional damage dealer.</p>
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

    {view==="professions" && <WoWProfessions gameId={game.id} prog={prog} setCheck={setCheck} setField={setField}/>}

    {view==="gear" && <>
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
      <SmallInfo title="Search Hunter skills or progression steps">
        <label style={{display:"grid",gap:8}}>What are you looking for?
          <input type="search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="e.g. Tame Beast, Intimidation, pylon, pet, ammo"
            style={{...uiInput,width:"100%"}}/>
        </label>
        {!filter.trim()?<p className="gm-note">Search by quest, location, objective or ability. No need to switch between guides.</p>:
          <>
            <p className="gm-note">{taskMatches.length} related guide actions · {spellMatches.length} abilities</p>
            {taskMatches.map(({stage,step})=><div key={stage.id+step.id} style={{padding:"9px 0",borderBottom:"1px solid var(--border,#ddd)"}}>
              <b>{step.title}</b> <span className="gm-note">· level {stage.from}–{stage.to}</span>
              <p className="gm-note" style={{margin:"4px 0 0"}}>{step.how}</p>
              <Action gameId={game.id} stage={stage} step={step} done={done(stage,step)} setCheck={setCheck}/>
            </div>)}
            {spellMatches.map(spell=><div key={spell.name} style={{padding:"9px 0",borderBottom:"1px solid var(--border,#ddd)"}}>
              <b>{spell.name}</b> <span className="gm-note">{spell.level?"· level "+spell.level:"· level varies / trainer"}</span>
              <p className="gm-note" style={{margin:"5px 0 0"}}>{spell.usage}</p>
            </div>)}
            {!taskMatches.length&&!spellMatches.length&&<p className="gm-note">No matches. Try a shorter name or use one of the source directories below.</p>}
          </>}
      </SmallInfo>
      <SmallInfo title="Reference library · quest specifics & updates">
        <p>This personal guide summarizes major milestones. For all individual Skyborne side quests, detailed maps, complete pet ability databases and current beta tuning, use these original references:</p>
        <div style={{display:"grid",gap:9}}>
          {WOW_SOURCES.map(s=><a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a>)}
          <a href="https://www.wowhead.com/forever/guide/dungeons-overview-locations-details" target="_blank" rel="noopener noreferrer">Wowhead: Forever dungeon levels ↗</a>
          <a href="https://topbuilds.gg/wow-forever/leveling-zones/" target="_blank" rel="noopener noreferrer">WoW Forever leveling zone overview ↗</a>
        </div>
        <p className="gm-note" style={{marginTop:12}}>Updated guide research: November 6, 2026. Check game tooltips for differences from published guides.</p>
      </SmallInfo>
    </>}
  </div>;
}
