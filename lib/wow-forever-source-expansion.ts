/**
 * Focused WoW Forever material source review: 2026-11-14.
 * Every link is a real Wowhead Forever item or spell page, but a Forever
 * item record does NOT imply that its Classic-era comments describe current
 * server drops or rates. Never invent TomTom coordinates or drop percentages.
 *
 * "wowhead-item-page" is appropriate for item identity / supplier category
 * and explicit profession recipes. Historical player farming comments are
 * kept as "classic-reference", even if they appear on the Forever page.
 */
import type {MaterialRoute,MaterialMethod} from "./wow-material-farms";

type Lead = {
  item:string; id:string; zone:string; target:string; advice:string;
  sourceUrl:string; method:MaterialMethod; evidence:MaterialRoute["evidence"];
  minMob?:number;maxMob?:number;waypoint?:string;requiredSkill?:number;
};
const reviewedAt="2026-11-14";
const supplier = (item:string,id:number,target:string="Trade or drink supplier"):Lead =>({
  item,id:"forever-supplier-"+id,zone:"Orgrimmar / Undercity / Thunder Bluff",
  target,
  advice:"Wowhead Forever lists this item for sale in Horde cities. Check a nearby trade or general supplier; the exact NPC and current stock are not verified.",
  sourceUrl:"https://www.wowhead.com/forever/item="+id,
  method:"vendor",evidence:"wowhead-item-page"
});
const fromOtherProfession=(item:string,id:string,profession:string,details:string,url:string):Lead=>({
  item,id,zone:"Auction House / another player",target:"Ask a "+profession+" or check the Auction House",
  advice:details+" You do not have this production profession on the current character. No enemy farm or NPC stock is implied.",
  sourceUrl:url,method:"other-profession",evidence:"wowhead-item-page"
});
const classic=(item:string,id:string,zone:string,target:string,advice:string,url:string,
  more:Partial<Lead>={}):Lead=>({
    item,id,zone,target,advice,sourceUrl:url,method:"mob",evidence:"classic-reference",...more
  });
const leads:Lead[]=[
  // Additional Wowhead Forever item pages reviewed 2026-11-14.
  // Drop information below is historical or unverified for current Forever.
  // Forever-only Excavation Site: Wetlands creature entries on the Medium Leather
  // item's "Skinned from" table. The listing reports recorded samples, not
  // a guaranteed drop or solo-safe route. This is a custom dungeon, not the
  // outdoor Wetlands zone. NPC levels without a verified range stay unknown.
  {
    item:"Medium Leather",id:"medium-forever-excavation-marsh-skulker",
    zone:"Excavation Site: Wetlands (custom dungeon)",
    target:"Marsh Skulker (elite)",
    advice:"Wowhead Forever identifies this as a NEW custom-dungeon skinnable source of Medium Leather. Kill, fully loot and skin when permitted; no reliable mob level or solo safety is established. This is not an outdoor Wetlands route.",
    sourceUrl:"https://www.wowhead.com/forever/item=2319/medium-leather",
    method:"skinning",evidence:"forever-reported"
  },
  {
    item:"Medium Leather",id:"medium-forever-excavation-young-riptooth",
    zone:"Excavation Site: Wetlands (custom dungeon)",
    target:"Young Riptooth",
    advice:"Listed as a NEW skinnable Medium Leather source in Wowhead Forever's custom dungeon. Fully loot before skinning. Check the instance difficulty, faction access, and whether your party can clear it.",
    sourceUrl:"https://www.wowhead.com/forever/item=2319/medium-leather",
    method:"skinning",evidence:"forever-reported"
  },
  {
    item:"Medium Leather",id:"medium-forever-excavation-thicket-lurker",
    zone:"Excavation Site: Wetlands (custom dungeon)",
    target:"Thicket Lurker (elite)",
    advice:"Wowhead Forever's custom-dungeon skinning list includes Thicket Lurker for Medium Leather. Recorded samples do not promise your next skin; avoid planning an XP-free solo route without verifying enemy levels.",
    sourceUrl:"https://www.wowhead.com/forever/item=2319/medium-leather",
    method:"skinning",evidence:"forever-reported"
  },
  {
    item:"Medium Leather",id:"medium-forever-excavation-marsh-crocolisk",
    zone:"Excavation Site: Wetlands (custom dungeon)",
    target:"Marsh Crocolisk (level 26)",
    advice:"A NEW level-26 skinnable source appears in the Forever Medium Leather table. Fully loot then skin. Dungeon accessibility and XP still depend on actual in-game conditions.",
    sourceUrl:"https://www.wowhead.com/forever/item=2319/medium-leather",
    method:"skinning",minMob:26,maxMob:26,evidence:"forever-reported"
  },
  {
    item:"Medium Leather",id:"medium-forever-excavation-young-crocolisk",
    zone:"Excavation Site: Wetlands (custom dungeon)",
    target:"Young Crocolisk",
    advice:"Listed as a NEW Medium Leather skinnable source inside the Forever custom Excavation Site: Wetlands dungeon. Confirm the mob level and dungeon entrance before traveling; source is not a guaranteed drop.",
    sourceUrl:"https://www.wowhead.com/forever/item=2319/medium-leather",
    method:"skinning",evidence:"forever-reported"
  },
  // Additional NEW skinnable sources in the Forever Medium Leather item table.
  {
    item:"Medium Leather",id:"medium-forever-excavation-highland-snapper",
    zone:"Excavation Site: Wetlands (custom dungeon)",
    target:"Highland Snapper (elite)",
    advice:"Listed in the Forever Medium Leather skinning table as a new dungeon source. Fully loot before skinning; sampled outcomes and dungeon safety may vary by patch.",
    sourceUrl:"https://www.wowhead.com/forever/item=2319/medium-leather",
    method:"skinning",evidence:"forever-reported"
  },
  {
    item:"Medium Leather",id:"medium-forever-excavation-elder-crocolisk",
    zone:"Excavation Site: Wetlands (custom dungeon)",
    target:"Elder Crocolisk (level 27 elite)",
    advice:"Listed as a NEW level-27 elite source for Medium Leather. Check enemy color before pulling; expect additional enemies within the dungeon.",
    sourceUrl:"https://www.wowhead.com/forever/item=2319/medium-leather",
    method:"skinning",minMob:27,maxMob:27,evidence:"forever-reported"
  },
  {
    item:"Medium Leather",id:"medium-forever-excavation-thicket-matriarch",
    zone:"Excavation Site: Wetlands (custom dungeon)",
    target:"Thicket Matriarch (elite)",
    advice:"The Forever item table lists this as a NEW skinnable Medium Leather source. Nearby thicket enemies may join the fight; do not assume a safe solo or XP-free pull.",
    sourceUrl:"https://www.wowhead.com/forever/item=2319/medium-leather",
    method:"skinning",evidence:"forever-reported"
  },
  {
    item:"Medium Leather",id:"medium-forever-excavation-thicket-hunter",
    zone:"Excavation Site: Wetlands (custom dungeon)",
    target:"Thicket Hunter (elite)",
    advice:"Listed among new Forever skinning sources for Medium Leather. Clear safely with a group, loot fully, then skin if eligible. No guaranteed result.",
    sourceUrl:"https://www.wowhead.com/forever/item=2319/medium-leather",
    method:"skinning",evidence:"forever-reported"
  },
  classic("Medium Leather","medium-bfd-snapjaw","Blackfathom Deeps, Ashenvale",
    "Aku'mai Snapjaw (level 26–27 elite)",
    "Wowhead Forever's Medium Leather item listing names Aku'mai Snapjaw among skinnable creatures. Fully loot, then skin; the listed rate is a mixed-reference observation, not a guaranteed current drop.",
    "https://www.wowhead.com/forever/item=2319/medium-leather",
    {method:"skinning",minMob:26,maxMob:27}),
  classic("Medium Leather","medium-sfk-ragetooth","Shadowfang Keep, Silverpine Forest",
    "Shadowfang Ragetooth (level 23–24 elite)",
    "The Forever Medium Leather page lists this worg as a skinnable source. Loot and skin; avoid assuming each corpse will yield Medium Leather.",
    "https://www.wowhead.com/forever/item=2319/medium-leather",
    {method:"skinning",minMob:23,maxMob:24}),
  classic("Medium Leather","medium-wc-skum","Wailing Caverns, The Barrens",
    "Skum (level 21 elite)",
    "The Forever Medium Leather page includes Skum in its drop/skin table. This is an instance boss, not a repeatable outdoor skinning loop. Confirm skinning eligibility in-game.",
    "https://www.wowhead.com/forever/item=2319/medium-leather",
    {method:"skinning",minMob:21,maxMob:21}),
  classic("Light Leather","light-silverpine-worgen","Silverpine Forest, Deep Elem Mine area",
    "Moonrage worgen",
    "Historical comments on the Wowhead Forever Light Leather page describe skinning Moonrage worgen in this area, but the amount of Ruined Leather Scraps may exceed Light Leather. Not a confirmed current drop rate.",
    "https://www.wowhead.com/forever/item=2318/light-leather",
    {method:"skinning"}),
  classic("Linen Cloth","linen-rfc","Ragefire Chasm, Orgrimmar",
    "Ragefire humanoid enemies",
    "Historical player reports on Wowhead Forever describe linen from Ragefire Chasm runs. This is a convenient Horde instance, but the reported stacks per run are not current Forever evidence.",
    "https://www.wowhead.com/forever/item=2589/linen-cloth",
    {method:"dungeon"}),
  classic("Wool Cloth","wool-sfk","Shadowfang Keep, Silverpine Forest",
    "Shadowfang Keep humanoid enemies",
    "Wowhead Forever's Wool Cloth page contains older recommendations for farming SFK humanoids. Loot drops vary; this is a historical route, not a confirmed live amount.",
    "https://www.wowhead.com/forever/item=2592/wool-cloth",
    {method:"dungeon"}),
  classic("Silk Cloth","silk-desolace-centaur","Desolace, Kolkar camps",
    "Kolkar centaur",
    "Historical farming comments on Wowhead Forever mention silk from level-31-ish Desolace centaurs. This is likely to award kill XP at level 34; check enemy colors first.",
    "https://www.wowhead.com/forever/item=4306/silk-cloth",
    {minMob:30,maxMob:33}),
  classic("Moss Agate","moss-wc-random","Wailing Caverns, The Barrens",
    "Incidental loot during Wailing Caverns runs",
    "A historical Wowhead Forever comment reports Moss Agate appearing as random dungeon loot. No exact mob or current drop chance is established: do not treat this as a dedicated guaranteed gem farm.",
    "https://www.wowhead.com/forever/item=1206/moss-agate",
    {method:"dungeon"}),
  {
    item:"Kingsblood",id:"kingsblood-wowhead-herb",zone:"Hillsbrad Foothills / Stonetalon Mountains",
    target:"Kingsblood herb nodes (Herbalism 125)",
    advice:"Wowhead Forever's Herbalism leveling guide places Kingsblood among the skill 115–170 herb routes and specifies gathering at skill 125. You currently use Skinning and Leatherworking, so you would need a Herbalist or a trade/Auction House purchase.",
    method:"herbalism",requiredSkill:125,evidence:"wowhead-item-page",
    sourceUrl:"https://www.wowhead.com/forever/guide/professions/herbalism/overview-leveling"
  },
  fromOtherProfession("Kingsblood","kingsblood-ask-herbalist","Herbalist",
    "Kingsblood requires Herbalism 125 for gathering. The Forever Herbalism guide names Hillsbrad Foothills, Wetlands and Stonetalon Mountains as example regions. You cannot gather it with Skinning.",
    "https://www.wowhead.com/forever/guide/professions/herbalism/overview-leveling"),
  {
    item:"Medium Leather",id:"medium-leather-mulgore-supplier",zone:"Mulgore",
    target:"Medium Leather vendor listing (exact NPC unknown)",
    advice:"The Wowhead Forever Medium Leather item page lists Mulgore as a vendor region. Vendor identity, location and current stock are unverified. Check the specific listing before making a trip.",
    method:"vendor",evidence:"wowhead-item-page",
    sourceUrl:"https://www.wowhead.com/forever/item=2319/medium-leather"
  },
  supplier("Green Dye",2605,"Dye / trade goods merchant"),
  supplier("Bleach",2324,"Dye / trade goods merchant"),
  supplier("Ice Cold Milk",1179,"Food and drink merchant"),
  supplier("Melon Juice",1205,"Food and drink merchant"),
  supplier("Simple Wood",4470,"Trade goods or general supply merchant"),
  supplier("Empty Vial",3371,"Trade goods / alchemy supply merchant"),
  supplier("Leaded Vial",3372,"Trade goods / alchemy supply merchant"),
  fromOtherProfession("Cerulean Dye","alchemist-cerulean-dye","Alchemist",
    "Forever Alchemy creates this reagent. The profession guide lists the trainer recipe at skill 40; check the output yield in-game.",
    "https://www.wowhead.com/forever/item=249409/cerulean-dye"),
  fromOtherProfession("Sulfuric Acid","alchemist-sulfuric-acid","Alchemist",
    "The Forever spell uses 2× Pyrite and 1× Empty Vial and lists a two-item output. The Alchemy guide lists a trainer recipe at skill 40; recheck the spell and output.",
    "https://www.wowhead.com/forever/spell=1249633/sulfuric-acid"),
  fromOtherProfession("Iron Buckle","blacksmith-iron-buckle","Blacksmith",
    "The Forever Iron Buckle recipe uses 1× Iron Bar and a Blacksmith Hammer and produces 2 buckles per cast.",
    "https://www.wowhead.com/forever/spell=8768/iron-buckle"),
  classic("Thick Murloc Scale","forever-classic-murloc-dustwallow","Dustwallow Marsh, northeastern coast",
    "Coastal murlocs, including Mirefin murlocs",
    "Historical comments on the Wowhead Forever item page report murlocs along the northeastern shoreline as a possible source. Players mention roughly level 36–38 enemies, so this is not XP-safe at level 34. Loot drop, not Skinning.",
    "https://www.wowhead.com/forever/item=5785/thick-murloc-scale",{minMob:36,maxMob:38}),
  classic("Raptor Hide","forever-classic-raptor-hide-arathi","Arathi Highlands",
    "Highland raptors",
    "Older player comments on the Forever item page say Raptor Hide comes from normal corpse loot—not skinning. Enemy levels and current Forever drop rates have not been confirmed.",
    "https://www.wowhead.com/forever/item=4461/raptor-hide"),
  classic("Small Venom Sac","forever-classic-small-venom","Redridge Mountains, Alther's Mill",
    "Greater Tarantula",
    "A historical player farming comment on the Wowhead Forever page names Greater Tarantulas near Alther's Mill. Alliance-zone travel is inconvenient for Horde; verify the route and creature levels in game. Drop frequency is not guaranteed.",
    "https://www.wowhead.com/forever/item=1475/small-venom-sac"),
  classic("Large Venom Sac","forever-classic-large-venom","Wetlands, Thelgen Rock",
    "Cave spiders",
    "Older player reports describe Large Venom Sacs from spiders in and around Thelgen Rock cave. This is not a confirmed Forever drop or an XP-safe route.",
    "https://www.wowhead.com/forever/item=1288/large-venom-sac"),
  classic("Lean Wolf Flank","forever-classic-wolf-sfk","Silverpine Forest → Shadowfang Keep",
    "Werewolves and wolf-type enemies",
    "Historical Wowhead Forever comments cite dungeon runs yielding Lean Wolf Flanks. Confirm the exact enemy and whether you can complete the instance solo; no drop is guaranteed.",
    "https://www.wowhead.com/forever/item=1015/lean-wolf-flank",{method:"dungeon"}),
  classic("Bear Meat","forever-classic-bear-silverpine","Silverpine Forest",
    "Wild bears",
    "Historic Wowhead Forever player reports describe a low-chance Bear Meat drop from Silverpine bears. Confirm the creature and current server drops before long farming sessions.",
    "https://www.wowhead.com/forever/item=3173/bear-meat"),
  classic("Murloc Fin","forever-classic-murloc-fin-wetlands","Wetlands, murloc camps",
    "Murloc enemies",
    "Older item-page comments report Murloc Fins from Wetlands murlocs. The older Horde recipe-access warning may not apply to Forever custom cooking: inspect your learned recipe first.",
    "https://www.wowhead.com/forever/item=1468/murloc-fin"),
  classic("Thick Spider's Silk","forever-classic-thick-silk-sos","Swamp of Sorrows",
    "Deathstrike Tarantula",
    "The Forever item page names Deathstrike Tarantulas and its listing shows about level 40–41. This is not a gray mob farm for a level-34 Hunter; low-frequency drop.",
    "https://www.wowhead.com/forever/item=4337/thick-spiders-silk",{minMob:40,maxMob:41}),
  classic("Tender Crocolisk Meat","forever-classic-tender-croc-stv","Stranglethorn Vale, north of Lake Nazferiti",
    "River Crocolisks",
    "Historical comments on the Forever item page recommend River Crocolisks in northern Stranglethorn. No guaranteed rate or level range; verify before farming.",
    "https://www.wowhead.com/forever/item=3667/tender-crocolisk-meat"),
  classic("Shadowgem","forever-classic-shadowgem-world-drop","The Barrens",
    "Thunderhead mobs / random level-appropriate drops",
    "An old player report on the Wowhead Forever item page mentions a Shadowgem dropping from a Barrens thunderhead. Treat as an incidental world-drop lead, not a reliable dedicated farm.",
    "https://www.wowhead.com/forever/item=1210/shadowgem")
];

/** Source leads include faction-specific supplier zones; no unverified NPC coords. */
export const FOREVER_MATERIAL_REVIEW_DATE=reviewedAt;
export const FOREVER_REVIEWED_MATERIAL_LEADS:ReadonlyArray<Lead>=leads;

export function reviewedMaterialRoutes(name:string,faction:"horde"|"alliance"):MaterialRoute[]{
  return leads.filter(l=>l.item.toLowerCase()===name.toLowerCase()&&
    !(l.id==="medium-leather-mulgore-supplier"&&faction!=="horde")).map(l=>({
    ...l,
    zone:l.method==="vendor"&&faction==="alliance"
      ?"Stormwind / Ironforge / Darnassus":l.zone,
    advice:l.method==="vendor"&&faction==="alliance"
      ?"Wowhead Forever lists this item at Alliance-city suppliers. Confirm the individual merchant and current stock before traveling."
      :l.advice,
    reviewedAt
  }));
}
