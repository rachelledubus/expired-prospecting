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
  minMob?:number;maxMob?:number;waypoint?:string;
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
  return leads.filter(l=>l.item.toLowerCase()===name.toLowerCase()).map(l=>({
    ...l,
    zone:l.method==="vendor"&&faction==="alliance"
      ?"Stormwind / Ironforge / Darnassus":l.zone,
    advice:l.method==="vendor"&&faction==="alliance"
      ?"Wowhead Forever lists this item at Alliance-city suppliers. Confirm the individual merchant and current stock before traveling."
      :l.advice,
    reviewedAt
  }));
}
