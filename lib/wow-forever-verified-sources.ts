/**
 * Curated WoW Forever-specific Wowhead sources, reviewed 2026-11-20.
 * Never merge with Classic / retail vendor locations or assume live stock.
 * Each actionable location has an exact Wowhead Forever source URL.
 */
export type VerifiedProfession = "leatherworking" | "first-aid" | "cooking";
export type VerifiedAcquisition = {
  id: string;
  name: string;
  profession: VerifiedProfession;
  zone: string;
  area: string;
  npc: string;
  faction: "horde" | "alliance" | "neutral";
  method: "buy" | "drop" | "train";
  skill: number;
  sourceUrl: string;
  guideUrl?: string;
  waypoint?: string;
  note: string;
  // Required skill to use the item; not a promise of an orange craft.
  nextUse?: number;
  concern?: string;
  verifiedBy?: "forever-guide" | "forever-item" | "forever-player-report";
};
export const VERIFIED_WOWHEAD_FOREVER_REVIEW = "2026-11-23";
export const VERIFIED_WOWHEAD_FOREVER_STOPS: VerifiedAcquisition[] = [
  {id:"h-fa-book",name:"Expert First Aid - Under Wraps",profession:"first-aid",zone:"Dustwallow Marsh",area:"Brackenwall Village",npc:"Balai Lok'Wein",faction:"horde",method:"buy",skill:125,nextUse:125,waypoint:"/way Dustwallow Marsh 36.4 30.4",sourceUrl:"https://www.wowhead.com/forever/item=16084/expert-first-aid-under-wraps",guideUrl:"https://www.wowhead.com/forever/guide/professions/first-aid/overview",note:"Buy with the two bandage manuals on the same visit. Expert cap is 225."},
  {id:"h-fa-heavy-silk",name:"Manual: Heavy Silk Bandage",profession:"first-aid",zone:"Dustwallow Marsh",area:"Brackenwall Village",npc:"Balai Lok'Wein",faction:"horde",method:"buy",skill:180,waypoint:"/way Dustwallow Marsh 36.4 30.4",sourceUrl:"https://www.wowhead.com/forever/item=16112/manual-heavy-silk-bandage",guideUrl:"https://www.wowhead.com/forever/guide/professions/first-aid/overview",note:"Buy now for later, use at First Aid 180."},
  {id:"h-fa-mageweave",name:"Manual: Mageweave Bandage",profession:"first-aid",zone:"Dustwallow Marsh",area:"Brackenwall Village",npc:"Balai Lok'Wein",faction:"horde",method:"buy",skill:210,waypoint:"/way Dustwallow Marsh 36.4 30.4",sourceUrl:"https://www.wowhead.com/forever/guide/professions/first-aid/overview",note:"Buy now for later, use at First Aid 210."},
  {id:"a-fa-book",name:"Expert First Aid - Under Wraps",profession:"first-aid",zone:"Arathi Highlands",area:"Stromgarde Keep",npc:"Deneb Walker",faction:"alliance",method:"buy",skill:125,nextUse:125,waypoint:"/way Arathi Highlands 27.0 58.8",sourceUrl:"https://www.wowhead.com/forever/guide/professions/first-aid/overview",note:"Buy with both bandage manuals on the same visit."},
  {id:"a-fa-heavy-silk",name:"Manual: Heavy Silk Bandage",profession:"first-aid",zone:"Arathi Highlands",area:"Stromgarde Keep",npc:"Deneb Walker",faction:"alliance",method:"buy",skill:180,waypoint:"/way Arathi Highlands 27.0 58.8",sourceUrl:"https://www.wowhead.com/forever/guide/professions/first-aid/overview",note:"Buy now for later, use at 180."},
  {id:"a-fa-mageweave",name:"Manual: Mageweave Bandage",profession:"first-aid",zone:"Arathi Highlands",area:"Stromgarde Keep",npc:"Deneb Walker",faction:"alliance",method:"buy",skill:210,waypoint:"/way Arathi Highlands 27.0 58.8",sourceUrl:"https://www.wowhead.com/forever/guide/professions/first-aid/overview",note:"Buy now for later, use at 210."},
  {id:"h-cook-book",name:"Expert Cookbook",profession:"cooking",zone:"Desolace",area:"Shadowprey Village",npc:"Wulan",faction:"horde",method:"buy",skill:125,waypoint:"/way Desolace 26.2 69.8",sourceUrl:"https://www.wowhead.com/forever/item=16072/expert-cookbook",guideUrl:"https://www.wowhead.com/forever/guide/professions/cooking/overview-leveling",note:"Raise the Cooking cap to 225 when you reach 125."},
  {id:"a-cook-book",name:"Expert Cookbook",profession:"cooking",zone:"Ashenvale",area:"Silverwind Refuge",npc:"Shandrina",faction:"alliance",method:"buy",skill:125,waypoint:"/way Ashenvale 49.6 67.0",sourceUrl:"https://www.wowhead.com/forever/guide/professions/cooking/overview-leveling",note:"Raise the Cooking cap to 225 when you reach 125."},
  {id:"h-cook-lizard",name:"Recipe: Crispy Lizard Tail",profession:"cooking",zone:"The Barrens",area:"The Crossroads",npc:"Tari'qa",faction:"horde",method:"buy",skill:100,waypoint:"/way The Barrens 52 30",sourceUrl:"https://www.wowhead.com/forever/item=5488/recipe-crispy-lizard-tail",note:"Uses Thunder Lizard Tail + Hot Spices. Alternative to the fish-based leveling route."},
  {id:"h-cook-stew",name:"Recipe: Strider Stew",profession:"cooking",zone:"The Barrens",area:"The Crossroads",npc:"Tari'qa",faction:"horde",method:"buy",skill:50,waypoint:"/way The Barrens 52 30",sourceUrl:"https://www.wowhead.com/forever/npc=3482/tariqa",note:"Optional collection recipe; check your skill-up color before buying for leveling."},
  {id:"h-cook-catfish",name:"Recipe: Bristle Whisker Catfish",profession:"cooking",zone:"Thunder Bluff",area:"Thunder Bluff",npc:"Naal Mistrunner",faction:"horde",method:"buy",skill:100,waypoint:"/way Thunder Bluff 51.0 52.8",sourceUrl:"https://www.wowhead.com/forever/item=6330/recipe-bristle-whisker-catfish",guideUrl:"https://www.wowhead.com/forever/guide/professions/cooking/overview-leveling",note:"Wowhead's 100–150 Cooking path. Raw fish can be acquired without learning Fishing."},
  {id:"h-cook-trout",name:"Recipe: Mithril Head Trout",profession:"cooking",zone:"Orgrimmar",area:"Orgrimmar",npc:"Shankys",faction:"horde",method:"buy",skill:175,waypoint:"/way Orgrimmar 70.0 30.6",sourceUrl:"https://www.wowhead.com/forever/guide/professions/cooking/overview-leveling",note:"Purchase for the 175–225 Cooking step."},
  {id:"neutral-cook-yellowtail",name:"Recipe: Spotted Yellowtail",profession:"cooking",zone:"Tanaris",area:"Steamwheedle Port",npc:"Gikkix",faction:"neutral",method:"buy",skill:225,waypoint:"/way Tanaris 66.6 22.0",sourceUrl:"https://www.wowhead.com/forever/guide/professions/cooking/overview-leveling",note:"Purchase during a Tanaris visit for the 225–300 Cooking step."},
  {id:"h-lw-trainer-tb",name:"Barbaric Shoulders (trainer) — no pattern to buy",profession:"leatherworking",zone:"Thunder Bluff",area:"Middle Rise",npc:"Una",faction:"horde",method:"train",skill:150,sourceUrl:"https://www.wowhead.com/forever/spell=7151/barbaric-shoulders",note:"Wowhead Forever explicitly lists Una as a trainer for Barbaric Shoulders at Leatherworking 150; also visit Cooking and First Aid while in Thunder Bluff."},
  {id:"h-lw-trainer-desolace",name:"Expert Leatherworking trainer",profession:"leatherworking",zone:"Desolace",area:"Desolace",npc:"Narv Hidecrafter",faction:"horde",method:"train",skill:150,sourceUrl:"https://www.wowhead.com/forever/npc=8153/narv-hidecrafter",note:"Wowhead Forever identifies this NPC as an Expert Leathercrafter. Check the available trainer recipes at your skill."},
  {id:"h-fa-trainer-uc",name:"Journeyman First Aid / Wool Bandage",profession:"first-aid",zone:"Undercity",area:"Rogues' Quarter",npc:"Mary Edras",faction:"horde",method:"train",skill:80,waypoint:"/way Undercity 73.6 55.6",sourceUrl:"https://www.wowhead.com/forever/guide/professions/first-aid/overview",note:"Your First Aid 87 rescue: learn Wool Bandage from the trainer; craft with Wool Cloth."},
  {id:"h-fa-trainer-og",name:"Journeyman First Aid / Wool Bandage",profession:"first-aid",zone:"Orgrimmar",area:"Valley of Spirits",npc:"Arnok",faction:"horde",method:"train",skill:80,waypoint:"/way Orgrimmar 34.0 84.4",sourceUrl:"https://www.wowhead.com/forever/guide/professions/first-aid/overview",note:"Alternative trainer for your First Aid 87 rescue."},
  {id:"h-fa-trainer-tb",name:"Journeyman First Aid / Wool Bandage",profession:"first-aid",zone:"Thunder Bluff",area:"Spirit Rise",npc:"Pand Stonebinder",faction:"horde",method:"train",skill:80,waypoint:"/way Thunder Bluff 29.6 21.4",sourceUrl:"https://www.wowhead.com/forever/guide/professions/first-aid/overview",note:"You can get the First Aid trainer step while buying your Cooking recipe in Thunder Bluff."},
  {id:"h-fa-triage",name:"Triage (Artisan First Aid)",profession:"first-aid",zone:"Arathi Highlands",area:"Hammerfall",npc:"Doctor Gregory Victor",faction:"horde",method:"train",skill:225,waypoint:"/way Arathi Highlands 73.4 36.8",sourceUrl:"https://www.wowhead.com/forever/guide/professions/first-aid/overview",note:"Artisan quest at character level 35 and First Aid 225. This NPC also teaches later bandages."},
  {id:"a-fa-triage",name:"Triage (Artisan First Aid)",profession:"first-aid",zone:"Dustwallow Marsh",area:"Theramore Isle",npc:"Doctor Gustaf VanHowzen",faction:"alliance",method:"train",skill:225,waypoint:"/way Dustwallow Marsh 67.6 48.8",sourceUrl:"https://www.wowhead.com/forever/guide/professions/first-aid/overview",note:"Artisan quest at character level 35 and First Aid 225."},
  {id:"neutral-lw-belt",name:"Pattern: Gem-studded Leather Belt",profession:"leatherworking",zone:"Stranglethorn Vale",area:"Booty Bay",npc:"Rikqiz",faction:"neutral",method:"buy",skill:160,waypoint:"/way Stranglethorn Vale 28 76",sourceUrl:"https://www.wowhead.com/forever/item=14635/pattern-gem-studded-leather-belt",guideUrl:"https://www.wowhead.com/forever/profession-leveling-guides/leatherworking",note:"Wowhead Forever leveling guide names Rikqiz as the source for the 160–180 path. Limited stock; no confirmed live stock at this moment.",concern:"Forever guide and item page name Rikqiz; older comments conflict. Check before planning a special trip."},
  {id:"h-lw-artisan-feralas",name:"Artisan Leatherworking + Nightscape Pants",profession:"leatherworking",zone:"Feralas",area:"Camp Mojache",npc:"Hahrana Ironhide",faction:"horde",method:"train",skill:200,waypoint:"/way Feralas 74 43",sourceUrl:"https://www.wowhead.com/forever/npc=11098/hahrana-ironhide",note:"At character level 35 and Leatherworking 200, train Artisan (cap 300). Learn Nightscape Pants before crafting beyond 225."},
  {id:"a-lw-artisan-hinterlands",name:"Artisan Leatherworking + Nightscape Pants",profession:"leatherworking",zone:"The Hinterlands",area:"Aerie Peak",npc:"Drakk Stonehand",faction:"alliance",method:"train",skill:200,sourceUrl:"https://www.wowhead.com/forever/profession-leveling-guides/leatherworking?guide=5",note:"At character level 35 and Leatherworking 200, learn Artisan and Nightscape Pants."},
  {id:"h-lw-wicked-gauntlets",name:"Pattern: Wicked Leather Gauntlets",profession:"leatherworking",zone:"Tirisfal Glades",area:"The Bulwark",npc:"Werg Thickblade",faction:"horde",method:"buy",skill:235,sourceUrl:"https://www.wowhead.com/forever/npc=12943/werg-thickblade",guideUrl:"https://www.wowhead.com/forever/profession-leveling-guides/leatherworking?guide=5",note:"One limited-stock vendor pattern for the 235–265 route: 8 Rugged Leather + Black Dye + Rune Thread per craft. Stock is not live-confirmed.",concern:"Vendor availability is limited; do not make a special trip assuming it is currently stocked."},
  {id:"a-lw-wicked-gauntlets",name:"Pattern: Wicked Leather Gauntlets",profession:"leatherworking",zone:"Western Plaguelands",area:"Chillwind Camp",npc:"Leonard Porter",faction:"alliance",method:"buy",skill:235,sourceUrl:"https://www.wowhead.com/forever/profession-leveling-guides/leatherworking?guide=5",note:"Alliance seller on Wowhead Forever\u2019s 235–265 route; vendor stock not confirmed.",concern:"Check current stock before traveling."},
  {id:"neutral-lw-runic-headband",name:"Pattern: Runic Leather Headband",profession:"leatherworking",zone:"Eastern Plaguelands",area:"Light\u0027s Hope Chapel",npc:"Jase Farlane",faction:"neutral",method:"buy",skill:265,sourceUrl:"https://www.wowhead.com/forever/item=15756/pattern-runic-leather-headband",guideUrl:"https://www.wowhead.com/forever/profession-leveling-guides/leatherworking?guide=5",note:"Buy for the 265–300 route. 14 Rugged Leather + 10 Runecloth + 1 Rune Thread each. Limited stock; do not assume it is available now.",concern:"Unlike a live inventory check, Wowhead identifies the vendor but cannot guarantee stock."},
  {id:"h-lw-bracers-drop",name:"Pattern: Barbaric Bracers",profession:"leatherworking",zone:"Ashenvale",area:"North of Raynewood Retreat",npc:"Withered Ancient",faction:"neutral",method:"drop",skill:130,sourceUrl:"https://www.wowhead.com/forever/item=18949/pattern-barbaric-bracers",note:"Recent Forever live comments report a world drop from Withered Ancients. Do NOT send the player to the old Undercity vendor.",concern:"Community-confirmed live drop, not a guaranteed drop; Wowhead's vendor table still shows stale locations."},
];

/**
 * Budget-first leveling purchases: the minimum source-checked books/recipes on
 * Wowhead Forever's fish-and-bandage leveling route, plus helpful trainers.
 *
 * This is NOT an assertion about cheapest server/AH prices. In particular, the
 * Gem-studded Leather Belt uses expensive gems and is not a default purchase.
 * Drop-only or completionist recipes never become shopping recommendations.
 */
export const FOREVER_BUDGET_LEVELING_SOURCE_IDS:ReadonlySet<string> = new Set([
  "h-fa-book","h-fa-heavy-silk","h-fa-mageweave",
  "a-fa-book","a-fa-heavy-silk","a-fa-mageweave",
  "h-cook-catfish","h-cook-book","a-cook-book","h-cook-trout",
  "neutral-cook-yellowtail",
  "h-lw-trainer-desolace","h-lw-trainer-tb","h-lw-artisan-feralas","a-lw-artisan-hinterlands",
  "h-lw-wicked-gauntlets","a-lw-wicked-gauntlets","neutral-lw-runic-headband","h-fa-trainer-uc","h-fa-trainer-og","h-fa-trainer-tb",
  "h-fa-triage","a-fa-triage"
]);

export const FOREVER_BUDGET_LEVELING_NOTES:Readonly<Record<string,string>> = {
  "h-fa-book":"Required to train Expert First Aid at 125; one book for the 150–225 bandage route.",
  "a-fa-book":"Required to train Expert First Aid at 125; one book for the 150–225 bandage route.",
  "h-fa-heavy-silk":"Required for the cheap bandage path at 180. Buy with the Expert book if already visiting this vendor.",
  "a-fa-heavy-silk":"Required for the cheap bandage path at 180. Buy with the Expert book if already visiting this vendor.",
  "h-fa-mageweave":"Required for the cheap bandage path at 210. Buy with the other manuals if already visiting this vendor.",
  "a-fa-mageweave":"Required for the cheap bandage path at 210. Buy with the other manuals if already visiting this vendor.",
  "h-cook-catfish":"Buy once for the Wowhead Forever 100–175 fish route. Check raw fish prices before committing to batches.",
  "h-cook-book":"Required to raise Cooking's skill cap beyond 150; no need to buy immediately at 104 unless nearby.",
  "a-cook-book":"Required to raise Cooking's skill cap beyond 150; no need to buy immediately unless nearby.",
  "h-cook-trout":"Buy when approaching Cooking 175; uses one raw fish per craft.",
  "neutral-cook-yellowtail":"Buy when approaching Cooking 225; uses one raw fish per craft.",
  "h-lw-trainer-desolace":"Optional alternate trainer route; no pattern purchase needed.",
  "h-lw-artisan-feralas":"Required skill-cap and trainer unlock for 200–300 at character level 35. Train at Camp Mojache before reaching 225.",
  "a-lw-artisan-hinterlands":"Required Artisan skill cap at level 35 and Leatherworking 200.",
  "h-lw-wicked-gauntlets":"One budget-baseline vendor pattern for 235–265. Check limited stock; no gem-heavy alternatives.",
  "a-lw-wicked-gauntlets":"Alliance vendor for the same 235–265 pattern.",
  "neutral-lw-runic-headband":"Second baseline vendor pattern for 265–300. Uses Rugged Leather, Runecloth and Rune Thread; compare AH costs before buying.",
  "h-lw-trainer-tb":"BEST COMBINED STOP: Learn Barbaric Shoulders at 150. Also buy Bristle Whisker Catfish from Naal Mistrunner and learn Wool Bandage from Pand Stonebinder in this city.",
  "h-fa-trainer-uc":"Trainer visit — Wool Bandage for First Aid 80–115; no manual purchase.",
  "h-fa-trainer-og":"Trainer visit — Wool Bandage for First Aid 80–115; no manual purchase.",
  "h-fa-trainer-tb":"Trainer visit — Wool Bandage for First Aid 80–115; no manual purchase.",
  "h-fa-triage":"Required quest at First Aid 225, not a pattern purchase.",
  "a-fa-triage":"Required quest at First Aid 225, not a pattern purchase."
};

export const WOWHEAD_FOREVER_LEVELING_GUIDES = {
  leatherworking:"https://www.wowhead.com/forever/profession-leveling-guides/leatherworking",
  "first-aid":"https://www.wowhead.com/forever/guide/professions/first-aid/overview",
  cooking:"https://www.wowhead.com/forever/guide/professions/cooking/overview-leveling",
} as const;

/** A two-vendor-pattern, non-specialization baseline for late Leatherworking.
 * This is NOT an AH-price optimizer; other patterns can cost less with local prices.
 * Recipe and locations are from Wowhead Forever, not generic Classic.
 * Craft estimates include possible extra yellow/green attempts; buy in small batches.
 */
export const FOREVER_LATE_LEATHERWORKING_STEPS = [
  {from:225,to:235,name:"Nightscape Pants",materials:"14 Thick Leather + 4 Silken Thread per craft",where:"Train Artisan Leatherworking at 200 (level 35) from Hahrana Ironhide in Camp Mojache, Feralas; learn Nightscape Pants there.",how:"Craft up to skill 235. Stop when the recipe turns unproductive; save your materials for the Rugged Leather step.",url:"https://www.wowhead.com/forever/profession-leveling-guides/leatherworking?guide=5",purchase:"Trainer only; no pattern purchase"},
  {from:235,to:265,name:"Wicked Leather Gauntlets",materials:"8 Rugged Leather + 1 Black Dye + 1 Rune Thread per craft",where:"Horde: buy Pattern: Wicked Leather Gauntlets from Werg Thickblade at the Bulwark in Tirisfal Glades. Alliance: Leonard Porter in Western Plaguelands.",how:"Orange to 255, then yellow/green. Roughly 36 crafts for 235–265 on one published Forever route, but skill-ups vary. Buy materials in small batches, not all 36 upfront.",url:"https://www.wowhead.com/forever/spell=19049/wicked-leather-gauntlets",purchase:"One limited-stock vendor pattern"},
  {from:265,to:300,name:"Runic Leather Headband",materials:"14 Rugged Leather + 10 Runecloth + 1 Rune Thread per craft",where:"Buy Pattern: Runic Leather Headband from Jase Farlane at Light's Hope Chapel, Eastern Plaguelands.",how:"Orange to 285, yellow through 294, green from 295. About 49 crafts in one published Forever route; actual number varies. Buy in batches, especially for 295–300.",url:"https://www.wowhead.com/forever/item=15756/pattern-runic-leather-headband",purchase:"One limited-stock vendor pattern"},
] as const;

export function nextForeverSkillPath(profession:VerifiedProfession, skill:number) {
  if (profession==="first-aid") {
    if (skill<80) return {name:"Heavy Linen Bandage",range:"40–80",details:"Check a First Aid trainer.",materials:"2 Linen Cloth per bandage"};
    if (skill<115) return {name:"Wool Bandage",range:"80–115",details:"Trainer at First Aid 80.",materials:"1 Wool Cloth"};
    if (skill<150) return {name:"Heavy Wool Bandage",range:"115–150",details:"Trainer at First Aid 115.",materials:"2 Wool Cloth"};
    if (skill<180) return {name:"Silk Bandage",range:"150–180",details:"Read Expert First Aid – Under Wraps to raise skill cap.",materials:"1 Silk Cloth"};
    if (skill<210) return {name:"Heavy Silk Bandage",range:"180–210",details:"Manual sold in Brackenwall Village (Horde) or Stromgarde Keep (Alliance).",materials:"2 Silk Cloth"};
    if (skill<240) return {name:"Mageweave Bandage",range:"210–240",details:"Manual sold by the same First Aid book vendor.",materials:"1 Mageweave Cloth"};
    if (skill<260) return {name:"Heavy Mageweave Bandage",range:"240–260",details:"Artisan First Aid Triage quest and trainer.",materials:"2 Mageweave Cloth"};
    if (skill<290) return {name:"Runecloth Bandage",range:"260–290",details:"Artisan First Aid trainer.",materials:"1 Runecloth"};
    if(skill>=300)return {name:"Max skill reached",range:"300/300",details:"First Aid is complete at 300. Keep crafting bandages only when useful.",materials:"None required"};
    return {name:"Heavy Runecloth Bandage",range:"290–300",details:"Artisan First Aid trainer.",materials:"2 Runecloth"};
  }
  if (profession==="cooking") {
    if (skill<100)return {name:"Longjaw Mud Snapper",range:"50–100",details:"Forever leveling guide; fish or Auction House.",materials:"Raw Longjaw Mud Snapper"};
    if (skill<150)return {name:"Bristle Whisker Catfish",range:"100–150",details:"Buy recipe from Naal Mistrunner, Thunder Bluff (Horde). Crispy Lizard Tail is an alternative.",materials:"Raw Bristle Whisker Catfish"};
    if (skill<175)return {name:"Bristle Whisker Catfish",range:"150–175",details:"Buy Expert Cookbook first to raise the skill cap.",materials:"Raw Bristle Whisker Catfish"};
    if (skill<225)return {name:"Mithril Headed Trout",range:"175–225",details:"Buy recipe from Shankys in Orgrimmar (Horde).",materials:"Raw Mithril Head Trout"};
    if(skill>=300)return {name:"Max skill reached",range:"300/300",details:"Cooking is complete at 300.",materials:"None required"};
    return {name:"Spotted Yellowtail",range:"225–300",details:"Complete Clamlette Surprise for Artisan and buy recipe at Steamwheedle Port.",materials:"Raw Spotted Yellowtail (1 per craft)."};
  }
  if(skill<145)return {name:"Cured Heavy Hide / Dark Leather Belt",range:"125–145",details:"Trainer recipes first; avoid purchasing collection patterns.",materials:"Heavy Hide, Salt, Fine Leather Belt, Cured Medium Hide"};
  if(skill<150)return {name:"Toughened Leather Gloves",range:"145–150 · chance",details:"Trainer recipe. Compare available materials with other learned recipes before spending.",materials:"Medium Leather, Cured Medium Hide, Elixir of Lesser Defense, Spider's Silk, Fine Thread"};
  if(skill<165)return {name:"Barbaric Shoulders",range:"150–170 · orange until 170",details:"Train at skill 150. Guaranteed +1 while orange. No vendor pattern purchase required.",materials:"8 Heavy Leather, 1 Cured Heavy Hide, 2 Fine Thread"};
  if(skill<180)return {name:"Guardian Gloves",range:"165–185 · orange until 185",details:"Trainer recipe: 4 Heavy Leather per craft instead of 8 for Barbaric Shoulders. Compare thread/material prices; no pattern purchase.",materials:"4 Heavy Leather, 1 Cured Heavy Hide, 1 Silken Thread"};
  if(skill<200)return {name:"Nightscape Headband",range:"180–200 · orange until 200",details:"Trainer recipe from Forever, uses Thick Leather and thread; avoids buying a gem-heavy pattern. Compare leather on hand.",materials:"5 Thick Leather, 2 Silken Thread"};
  if(skill<205)return {name:"Nightscape Headband",range:"200–205 · yellow",details:"Trainer recipe. Skill-up chance; Thick Armor Kit is also available at 200 but is yellow immediately. Compare materials and tooltip color.",materials:"5 Thick Leather, 2 Silken Thread"};
  const late=FOREVER_LATE_LEATHERWORKING_STEPS.find(step=>skill<step.to);
  if(late)return {name:late.name,range:late.from+"–"+late.to,details:late.where+" "+late.how,materials:late.materials};
  return {name:"Max skill reached",range:"300/300",details:"Leatherworking is complete at 300. No more skill-up patterns needed.",materials:"None required"};
}
