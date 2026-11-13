"use client";
import type { GameProgress } from "@/lib/games-data";
import { WOW_RECIPES, recipeLearnedKey, recipeHiddenKey } from "@/lib/wow-forever-professions";
import { WOW_DUNGEON_PROFESSION_DROPS } from "@/lib/wow-forever-dungeon-professions";
import { WOW_HUNTER_DUNGEONS } from "@/lib/wow-forever-dungeon-gear";
import { WOW_FARMS, WOW_PET_FAMILIES } from "@/lib/wow-portal-extras";
import { ALL_RECIPE_MATERIALS, materialRoutes } from "@/lib/wow-material-farms";
import type { WowGame } from "@/lib/wow-forever-data";
type Destination="roadmap"|"professions"|"gear"|"gold"|"materials"|"pets"|"combat";
type Props={game:WowGame;prog:GameProgress;query:string;onQuery:(v:string)=>void;onOpen:(v:Destination,term:string)=>void};
const small:React.CSSProperties={fontSize:13,opacity:.86,lineHeight:1.5};
const abilities=[
 ["Auto Shot","Ranged auto-attack / main damage"],
 ["Scorpid Sting","Debuff a target; check your learned rank"],
 ["Arcane Shot","Instant ranged shot"],
 ["Serpent Sting","Damage over time"],
 ["Aimed Shot","Strong single-target shot"],
 ["Multi-Shot","Area damage; beware extra pulls"],
 ["Concussive Shot","Slow an approaching enemy"],
 ["Intimidation","Pet stun used for threat/control"],
 ["Feign Death","Threat reduction and escape"],
 ["Mend Pet","Keep your pet healed"],
 ["Growl","Pet solo threat ability; disable with player tanks"],
 ["Hunter's Mark","Mark longer-lived targets"],
 ["Freezing Trap","Single-target crowd control"],
 ["Frost Trap","Area control"],
 ["Summon Hawk","Forever Beast Mastery talent"],
 ["Bestial Wrath","Beast Mastery pet burst"]
] as const;
export default function WoWUnifiedSearch({game,prog,query,onQuery,onOpen}:Props){
 const q=query.toLowerCase().trim();
 const steps=q?game.stages.flatMap(s=>s.steps.filter(t=>(t.title+" "+t.how+" "+s.place+" "+s.title).toLowerCase().includes(q))
  .map(t=>({title:t.title,detail:s.place+" · "+t.how,id:s.id+"-"+t.id}))).slice(0,12):[];
 const recipes=q?WOW_RECIPES.filter(r=>!prog.checks[recipeLearnedKey(game.id,r.id)]&&
   (r.name+" "+r.profession+" "+r.reagents.map(m=>m.name).join(" ")+" "+r.sourceLocations.map(l=>l.area+" "+l.zone+" "+l.npc).join(" ")).toLowerCase().includes(q)).slice(0,20):[];
 const materials=q?ALL_RECIPE_MATERIALS.filter(name=>name.toLowerCase().includes(q)).slice(0,20):[];
 const gear=q?WOW_HUNTER_DUNGEONS.flatMap(d=>d.loot.filter(t=>(d.name+" "+t.name+" "+t.from+" "+t.slot).toLowerCase().includes(q)).map(t=>({id:d.id+"-"+t.id,title:t.name,detail:d.name+" · "+t.from+" · level "+t.requiredLevel}))).slice(0,12):[];
 const dungeonProfessions=q?WOW_DUNGEON_PROFESSION_DROPS.filter(item=>
   (!item.recipe||(!prog.checks[recipeLearnedKey(game.id,item.recipe.id)]&&!prog.checks[recipeHiddenKey(game.id,item.recipe.id)]))&&
   (item.itemName+" "+item.source+" "+item.professions.join(" ")+" "+WOW_HUNTER_DUNGEONS.find(d=>d.id===item.dungeonId)?.name)
     .toLowerCase().includes(q)).slice(0,20):[];
 const farms=q?WOW_FARMS.filter(f=>(f.name+" "+f.zone+" "+f.rewards.join(" ")).toLowerCase().includes(q)):[],
  pets=q?WOW_PET_FAMILIES.filter(f=>(f.name+" "+f.purpose+" "+f.note).toLowerCase().includes(q)):[],
  matchingAbilities=q?abilities.filter(([name,detail])=>(name+" "+detail).toLowerCase().includes(q)):[];
 const groups:{name:string;destination:Destination;entries:{id:string;title:string;detail:string}[]}[]=[
  {name:"Guide objectives",destination:"roadmap",entries:steps},
  {name:"Unlearned profession recipes",destination:"professions",entries:recipes.map(r=>({id:r.id,title:r.name,detail:r.profession+" · "+(r.learnAt===null?"unknown learn skill":"learn at "+r.learnAt)+" · "+r.reagents.map(m=>m.name).join(", ")}))},
  {name:"Materials and where to farm them",destination:"materials",entries:materials.map(name=>({
    id:name,title:name,detail:materialRoutes(name).length+" mapped farming leads · open to inspect locations"
  }))},
  {name:"Dungeon Hunter gear",destination:"gear",entries:gear},
  {name:"Dungeon profession drops",destination:"gear",entries:dungeonProfessions.map(item=>({
    id:item.id,title:item.itemName,
    detail:(WOW_HUNTER_DUNGEONS.find(d=>d.id===item.dungeonId)?.name||"Dungeon")+" · "+item.source+" · "+item.professions.join(", ")
  }))},
  {name:"Gold farming routes",destination:"gold",entries:farms.map(f=>({id:f.id,title:f.name,detail:f.zone+" · mobs "+f.minMob+"–"+f.maxMob+" · "+f.rewards.join(", ")}))},
  {name:"Hunter pet families",destination:"pets",entries:pets.map(f=>({id:f.name,title:f.name,detail:f.purpose+" · "+f.note}))},
  {name:"Hunter abilities",destination:"combat",entries:matchingAbilities.map(([name,detail])=>({id:name,title:name,detail}))}
 ];
 const total=groups.reduce((sum,g)=>sum+g.entries.length,0);
 return <section className="gm-card" style={{padding:16,marginTop:12}}>
  <div className="gm-panel-label">Search across WoW Forever</div>
  <h3 style={{margin:"6px 0"}}>Find crafting materials, recipes, dungeon drops, Hunter gear and farming routes</h3>
  <label style={small}>Search everything indexed in this personal guide
   <input type="search" value={query} onChange={e=>onQuery(e.target.value)}
    placeholder="e.g. Medium Leather, Razorfen, Screech, Fang"
    style={{display:"block",marginTop:7,width:"100%",minWidth:0,background:"var(--panel,#fff)",color:"var(--text,#222)",border:"1px solid var(--border,#ccc)",borderRadius:8,padding:12,font:"inherit"}}/>
  </label>
  {!q?<p style={{...small,marginTop:10}}>Search stays within your portal's catalog. Learned recipes remain in Recommended Next rather than showing in these general search results.</p>:
   <><p style={small}>{total} results displayed · sections are capped for readability.</p>
    {groups.map(g=>g.entries.length?<section key={g.name} style={{marginTop:14}}>
      <h4 style={{margin:"0 0 5px"}}>{g.name} ({g.entries.length})</h4>
      {g.entries.map(x=><div key={x.id} style={{borderBottom:"1px solid var(--border,#ddd)",padding:"7px 0"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
         <strong style={{fontSize:14}}>{x.title}</strong>
         <button type="button" className="gm-pill" onClick={()=>onOpen(g.destination,x.title)}>Open {g.destination}</button>
        </div>
        <p style={{...small,margin:"3px 0"}}>{x.detail}</p>
      </div>)}
    </section>:null)}
    {total===0&&<p style={small}>Nothing matched in the indexed catalog. Try a shorter term; the database is not a complete live-game index.</p>}
   </>}
 </section>;
}
