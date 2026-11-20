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
export const VERIFIED_WOWHEAD_FOREVER_REVIEW = "2026-11-20";
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
  {id:"h-lw-trainer-desolace",name:"Expert Leatherworking trainer",profession:"leatherworking",zone:"Desolace",area:"Desolace",npc:"Narv Hidecrafter",faction:"horde",method:"train",skill:150,sourceUrl:"https://www.wowhead.com/forever/npc=8153/narv-hidecrafter",note:"Wowhead Forever identifies this NPC as an Expert Leathercrafter. Check the available trainer recipes at your skill."},
  {id:"h-fa-trainer-uc",name:"Journeyman First Aid / Wool Bandage",profession:"first-aid",zone:"Undercity",area:"Rogues' Quarter",npc:"Mary Edras",faction:"horde",method:"train",skill:80,waypoint:"/way Undercity 73.6 55.6",sourceUrl:"https://www.wowhead.com/forever/guide/professions/first-aid/overview",note:"Your First Aid 87 rescue: learn Wool Bandage from the trainer; craft with Wool Cloth."},
  {id:"h-fa-trainer-og",name:"Journeyman First Aid / Wool Bandage",profession:"first-aid",zone:"Orgrimmar",area:"Valley of Spirits",npc:"Arnok",faction:"horde",method:"train",skill:80,waypoint:"/way Orgrimmar 34.0 84.4",sourceUrl:"https://www.wowhead.com/forever/guide/professions/first-aid/overview",note:"Alternative trainer for your First Aid 87 rescue."},
  {id:"h-fa-trainer-tb",name:"Journeyman First Aid / Wool Bandage",profession:"first-aid",zone:"Thunder Bluff",area:"Spirit Rise",npc:"Pand Stonebinder",faction:"horde",method:"train",skill:80,waypoint:"/way Thunder Bluff 29.6 21.4",sourceUrl:"https://www.wowhead.com/forever/guide/professions/first-aid/overview",note:"You can get the First Aid trainer step while buying your Cooking recipe in Thunder Bluff."},
  {id:"h-fa-triage",name:"Triage (Artisan First Aid)",profession:"first-aid",zone:"Arathi Highlands",area:"Hammerfall",npc:"Doctor Gregory Victor",faction:"horde",method:"train",skill:225,waypoint:"/way Arathi Highlands 73.4 36.8",sourceUrl:"https://www.wowhead.com/forever/guide/professions/first-aid/overview",note:"Artisan quest at character level 35 and First Aid 225. This NPC also teaches later bandages."},
  {id:"a-fa-triage",name:"Triage (Artisan First Aid)",profession:"first-aid",zone:"Dustwallow Marsh",area:"Theramore Isle",npc:"Doctor Gustaf VanHowzen",faction:"alliance",method:"train",skill:225,waypoint:"/way Dustwallow Marsh 67.6 48.8",sourceUrl:"https://www.wowhead.com/forever/guide/professions/first-aid/overview",note:"Artisan quest at character level 35 and First Aid 225."},
  {id:"neutral-lw-belt",name:"Pattern: Gem-studded Leather Belt",profession:"leatherworking",zone:"Stranglethorn Vale",area:"Booty Bay",npc:"Rikqiz",faction:"neutral",method:"buy",skill:160,waypoint:"/way Stranglethorn Vale 28 76",sourceUrl:"https://www.wowhead.com/forever/item=14635/pattern-gem-studded-leather-belt",guideUrl:"https://www.wowhead.com/forever/profession-leveling-guides/leatherworking",note:"Wowhead Forever leveling guide names Rikqiz as the source for the 160–180 path. Limited stock; no confirmed live stock at this moment.",concern:"Forever guide and item page name Rikqiz; older comments conflict. Check before planning a special trip."},
  {id:"h-lw-bracers-drop",name:"Pattern: Barbaric Bracers",profession:"leatherworking",zone:"Ashenvale",area:"North of Raynewood Retreat",npc:"Withered Ancient",faction:"neutral",method:"drop",skill:130,sourceUrl:"https://www.wowhead.com/forever/item=18949/pattern-barbaric-bracers",note:"Recent Forever live comments report a world drop from Withered Ancients. Do NOT send the player to the old Undercity vendor.",concern:"Community-confirmed live drop, not a guaranteed drop; Wowhead's vendor table still shows stale locations."},
];

export const WOWHEAD_FOREVER_LEVELING_GUIDES = {
  leatherworking:"https://www.wowhead.com/forever/profession-leveling-guides/leatherworking",
  "first-aid":"https://www.wowhead.com/forever/guide/professions/first-aid/overview",
  cooking:"https://www.wowhead.com/forever/guide/professions/cooking/overview-leveling",
} as const;

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
    return {name:"Heavy Runecloth Bandage",range:"290–300",details:"Artisan First Aid trainer.",materials:"2 Runecloth"};
  }
  if (profession==="cooking") {
    if (skill<100)return {name:"Longjaw Mud Snapper",range:"50–100",details:"Forever leveling guide; fish or Auction House.",materials:"Raw Longjaw Mud Snapper"};
    if (skill<150)return {name:"Bristle Whisker Catfish",range:"100–150",details:"Buy recipe from Naal Mistrunner, Thunder Bluff (Horde). Crispy Lizard Tail is an alternative.",materials:"Raw Bristle Whisker Catfish"};
    if (skill<175)return {name:"Bristle Whisker Catfish",range:"150–175",details:"Buy Expert Cookbook first to raise the skill cap.",materials:"Raw Bristle Whisker Catfish"};
    if (skill<225)return {name:"Mithril Headed Trout",range:"175–225",details:"Buy recipe from Shankys in Orgrimmar (Horde).",materials:"Raw Mithril Head Trout"};
    return {name:"Spotted Yellowtail",range:"225–300",details:"Complete Clamlette Surprise for Artisan and buy recipe at Steamwheedle Port.",materials:"Raw Spotted Yellowtail"};
  }
  if(skill<145)return {name:"Cured Heavy Hide / Dark Leather Belt",range:"125–145",details:"Ask an Expert Leatherworking trainer about these recipes.",materials:"Heavy Hide, Salt, Fine Leather Belt, Cured Medium Hide"};
  if(skill<150)return {name:"Toughened Leather Gloves",range:"145–150 · skill-up chance",details:"Wowhead Forever's tested route. These gloves are green in this range; skill-ups are not guaranteed.",materials:"4 Medium Leather, 2 Cured Medium Hide, 2 Elixir of Lesser Defense, 2 Spider's Silk, 2 Fine Thread"};
  if(skill<170)return {name:"Barbaric Shoulders",range:"150–170 · orange, guaranteed +1",details:"LEARN NOW at Leatherworking 150 from an Expert trainer. Wowhead Forever lists orange 150–169; this is a better guaranteed skill-up at 152 than green gloves.",materials:"8 Heavy Leather, 1 Cured Heavy Hide, 2 Fine Thread"};
  if(skill<180)return {name:"Barbaric Shoulders",range:"170–180 · yellow, skill-up chance",details:"This remains a trainer recipe but can fail to award skill after 170.",materials:"8 Heavy Leather, 1 Cured Heavy Hide, 2 Fine Thread"};
  if(skill<190)return {name:"Gem-studded Leather Belt",range:"180–190 · guide route",details:"Wowhead Forever's route lists Rikqiz as the vendor; limited-stock availability has not been verified live. Check before travelling.",materials:"4 Cured Heavy Hide, 2 Iridescent Pearl, 2 Jade, 1 Citrine, 1 Fine Thread"};
  return {name:"Review current Wowhead Forever Leatherworking steps",range:"185+",details:"Use the skill-aware Wowhead guide; do not guess a pattern or vendor.",materials:"Open source"};
}
