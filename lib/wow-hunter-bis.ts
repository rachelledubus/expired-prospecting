/**
 * Curated Hunter *leveling* BiS contenders, NOT proven endgame BiS.
 * Sources checked 2026-11-16 against Forever-specific item pages / dungeon journals.
 * recommendedLevel = when it is sensible to pursue, not the equip requirement.
 * Never assume that a level threshold alone guarantees a dungeon clear.
 */
import { WOW_HUNTER_DUNGEONS, type HunterLootTarget } from "./wow-forever-dungeon-gear";

export type HunterBisLead={
  id:string;name:string;slot:HunterLootTarget["slot"]|"offhand"|"ring2"|"trinket1"|"trinket2";
  minEquipLevel:number;recommendedLevel:number;
  source:string;location:string;sourceUrl:string;
  tier:"leveling-bis-candidate"|"strong-leveling-option";
  dungeonId?:string;targetId?:string;
  method:"quest"|"dungeon boss"|"crafted"|"world drop / Auction House"|"reputation vendor"|"rare outdoor enemy";
  evidence?:"game-client"|"forever-item"|"classic-baseline";
  faction?:"horde"|"alliance";
  note:string;
};
/** Equipment layout is fixed; two-handed weapons use main hand and occupy off hand. */
export const WOW_HUNTER_BIS_SLOTS=[
  ["head","Head"],["neck","Neck"],["shoulders","Shoulders"],["back","Back / Cloak"],
  ["chest","Chest"],["wrist","Wrists"],["hands","Hands"],["waist","Waist"],
  ["legs","Legs"],["feet","Feet"],["ring","Ring 1"],["ring2","Ring 2"],
  ["trinket1","Trinket 1"],["trinket2","Trinket 2"],
  ["melee","Main hand / Two-handed"],["offhand","Off-hand (when dual wielding)"],
  ["ranged","Ranged weapon"]
] as const;

export const WOW_HUNTER_BIS_REVIEW_DATE="2026-11-16";
export const WOW_HUNTER_BIS_LEADS:readonly HunterBisLead[]=[
  {
    id:"nightscape-headband",name:"Nightscape Headband",slot:"head",
    minEquipLevel:36,recommendedLevel:40,
    source:"Leatherworking trainer, Nightscape Headband recipe",location:"Leatherworking trainer / craft with Thick Leather; check profession recipe",
    sourceUrl:"https://theforeverera.com/en/recipes/leatherworking/nightscape-headband/",tier:"strong-leveling-option",method:"crafted",
    evidence:"game-client",
    note:"Practical agility leather head piece. The highest-ranked Warden's Wizard Hat has only a Classic-era rare-drop lead; do not assume that source is confirmed in Forever."
  },
  {
    id:"scouts-medallion",name:"Scout's Medallion",slot:"neck",
    minEquipLevel:38,recommendedLevel:40,
    source:"Kelm Hargunth, Warsong Supply Officer; PvP reputation",location:"Horde Warsong Gulch reputation quartermaster (confirm item tier and required standing)",
    sourceUrl:"https://theforeverera.com/en/bis/hunter/beast-mastery/40/",tier:"leveling-bis-candidate",method:"reputation vendor",
    evidence:"classic-baseline",faction:"horde",
    note:"Level-40 BM ranked neck pick, but the vendor / reputation data is Classic-derived. Check availability in Forever before traveling."
  },
  {
    id:"dark-hooded-cape",name:"Dark Hooded Cape",slot:"back",
    minEquipLevel:32,recommendedLevel:40,
    source:"Nimar the Slayer (rare)",location:"Arathi Highlands (Classic-era rare spawn; verify current Forever drop)",
    sourceUrl:"https://theforeverera.com/en/bis/hunter/beast-mastery/40/",tier:"strong-leveling-option",method:"rare outdoor enemy",
    evidence:"classic-baseline",
    note:"Practical, older alternative to level-40 top cloak whose current source is unknown. Do not plan a long hunt until the rare's loot is verified."
  },
  {
    id:"nightscape-tunic",name:"Nightscape Tunic",slot:"chest",
    minEquipLevel:36,recommendedLevel:40,
    source:"Leatherworking trainer (around skill 200), crafted by you or another player",location:"Leatherworking trainer, Tanning/crafting materials, or Auction House",
    sourceUrl:"https://theforeverera.com/en/recipes/leatherworking/nightscape-tunic/",tier:"strong-leveling-option",method:"crafted",
    evidence:"game-client",
    note:"+15 Agility and +6 Stamina in Forever. Practical alternative to Quillward Harness, whose boss/trash drop data is Classic-only."
  },
  {
    id:"branded-leather-bracers",name:"Branded Leather Bracers",slot:"wrist",
    minEquipLevel:37,recommendedLevel:40,
    source:"High Inquisitor Fairbanks",location:"Scarlet Monastery: Cathedral, Tirisfal Glades",
    sourceUrl:"https://theforeverera.com/en/bis/hunter/beast-mastery/40/",tier:"strong-leveling-option",method:"dungeon boss",
    evidence:"classic-baseline",dungeonId:"sm-cathedral",targetId:"branded-leather-bracers",
    note:"Existing dungeon catalog lead. Confirm that Fairbanks drops it in Forever; top rank-40 PvP bracers may require faction-specific vendor access."
  },
  {
    id:"dragonscale-gauntlets",name:"Dragonscale Gauntlets",slot:"hands",
    minEquipLevel:40,recommendedLevel:40,
    source:"Leatherworking trainer; skill approximately 220; requires Tanning Rack",location:"Craft with Leatherworking or have another crafter make them; compare Auction House",
    sourceUrl:"https://theforeverera.com/en/items/8347/",tier:"leveling-bis-candidate",method:"crafted",
    evidence:"game-client",
    note:"Ranked top BM hands at level 40. Forever recipe: Thick Leather, Worn Dragonscale, Heavy Silken Thread and Cured Thick Hide."
  },
  {
    id:"defilers-chain-girdle",name:"Defiler's Chain Girdle",slot:"waist",
    minEquipLevel:40,recommendedLevel:40,
    source:"Rutherford Twing, The Defilers Supply Officer; PvP reputation",location:"The Defilers (Horde Arathi Basin faction) quartermaster; check needed standing",
    sourceUrl:"https://theforeverera.com/en/bis/hunter/beast-mastery/40/",tier:"leveling-bis-candidate",method:"reputation vendor",
    evidence:"classic-baseline",faction:"horde",
    note:"Horde equivalent of ranked level-40 Highlander's belt; Classic reputation source is not confirmed on Forever."
  },
  {
    id:"basilisk-hide-pants",name:"Basilisk Hide Pants",slot:"legs",
    minEquipLevel:38,recommendedLevel:40,
    source:"Rare world drop; usually sought on Auction House",location:"Auction House / random loot (no verified targeted Forever mob)",
    sourceUrl:"https://theforeverera.com/en/bis/hunter/beast-mastery/40/",tier:"leveling-bis-candidate",method:"world drop / Auction House",
    evidence:"classic-baseline",
    note:"Ranked top level-40 BM leg piece. Very rare world drop; do not claim a reliable farming location or price."
  },
  {
    id:"stalkers-mail-boots",name:"Stalker's Mail Boots",slot:"feet",
    minEquipLevel:40,recommendedLevel:40,
    source:"Leatherworking pattern, skill 200; requires Tanning Rack",location:"Learn Pattern: Stalker's Mail Boots; craft using Heavy Leather, Cured Medium Hide and Elemental Air",
    sourceUrl:"https://theforeverera.com/en/recipes/leatherworking/stalkers-mail-boots/",tier:"leveling-bis-candidate",method:"crafted",
    evidence:"game-client",
    note:"Ranked best level-40 BM boots; bind on pickup, so verify whether you must craft these yourself before buying a pattern."
  },
  {
    id:"assault-band",name:"Assault Band",slot:"ring",
    minEquipLevel:39,recommendedLevel:40,
    source:"Rare world drop, Auction House",location:"Auction House / random world drops (no verified dedicated farm)",
    sourceUrl:"https://theforeverera.com/en/bis/hunter/beast-mastery/40/",tier:"leveling-bis-candidate",method:"world drop / Auction House",
    evidence:"classic-baseline",
    note:"Ranked level-40 BM ring 2. Item is Unique; do not expect to wear two copies."
  },
  {
    id:"ironspines-eye",name:"Ironspine's Eye",slot:"ring2",
    minEquipLevel:30,recommendedLevel:40,
    source:"Ironspine, rare spawn boss",location:"Scarlet Monastery: Graveyard, Tirisfal Glades",
    sourceUrl:"https://www.wowforever.info/bis?class=hunter",tier:"strong-leveling-option",method:"dungeon boss",
    evidence:"classic-baseline",dungeonId:"sm-graveyard",targetId:"ironspines-eye",
    note:"Accessible second-ring alternative if you cannot find another good ring. Ironspine is a rare boss, and Forever drops require in-game checking."
  },
  {
    id:"defilers-talisman",name:"Defiler's Talisman",slot:"trinket1",
    minEquipLevel:38,recommendedLevel:40,
    source:"Rutherford Twing, The Defilers supply officer; PvP reputation",location:"Horde Arathi Basin reputation vendor",
    sourceUrl:"https://theforeverera.com/en/items/21116/",tier:"strong-leveling-option",method:"reputation vendor",
    evidence:"classic-baseline",faction:"horde",
    note:"A sourced obtainable alternative to ranked Enriched Seal / Darkspear Voodoo Seal, whose origins remain unknown."
  },
  {
    id:"dog-whistle",name:"Dog Whistle",slot:"trinket2",
    minEquipLevel:25,recommendedLevel:40,
    source:"Houndmaster Loksey",location:"Scarlet Monastery: Library, Tirisfal Glades",
    sourceUrl:"https://www.wowforever.info/bis?class=hunter",tier:"strong-leveling-option",method:"dungeon boss",
    evidence:"classic-baseline",
    note:"Pet/utility trinket, NOT mathematically best DPS in slot. A practical second trinket if your current slot is empty."
  },
  {
    id:"staff-of-jordan",name:"Staff of Jordan",slot:"melee",
    minEquipLevel:35,recommendedLevel:40,
    source:"Extremely rare world drop, trade or Auction House",location:"Auction House / random world drops (no verified target)",
    sourceUrl:"https://theforeverera.com/en/bis/hunter/beast-mastery/40/",tier:"leveling-bis-candidate",method:"world drop / Auction House",
    evidence:"forever-item",
    note:"Ranked top level-40 BM two-handed stat stick; server item sighting exists. When equipped, off-hand must remain empty. Compare hit / ranged benefit against your current gear."
  },
  {
    id:"jade-serpentblade",name:"Jade Serpentblade",slot:"offhand",
    minEquipLevel:30,recommendedLevel:40,
    source:"Blacksmithing Plans: Jade Serpentblade, skill 150",location:"Craft with Blacksmithing (requires Anvil) or buy crafted sword on Auction House",
    sourceUrl:"https://theforeverera.com/en/items/3850/",tier:"strong-leveling-option",method:"crafted",
    evidence:"game-client",
    note:"OPTIONAL one-hand setup only. A two-handed staff occupies the off-hand; there is no second BiS off-hand when using a two-hander."
  },
  {
    id:"truthseekers-bow",name:"Truthseeker's Bow",slot:"ranged",
    minEquipLevel:40,recommendedLevel:40,
    source:"Greater Friend of the Library (25 library books)",
    location:"Horde: Owen Thadd, Magic Quarter, Undercity / Alliance: Garion Wendell, Mage Tower, Stormwind",
    sourceUrl:"https://www.wowhead.com/forever/item=277254/truthseekers-bow",
    tier:"leveling-bis-candidate",evidence:"forever-item",method:"quest",
    note:"Choose the bow as the 25-book quest reward. The quest and item levels differ; bow requires level 40 to equip. Do not replace a better equipped weapon without checking tooltip DPS."
  },
  {
    id:"galganns-fireblaster",name:"Galgann's Fireblaster",slot:"ranged",
    minEquipLevel:42,recommendedLevel:44,
    source:"Galgann Firehammer",location:"Uldaman, Badlands",
    sourceUrl:"https://www.wowhead.com/forever/item=9412/galganns-fireblaster",
    tier:"leveling-bis-candidate",evidence:"forever-item",method:"dungeon boss",dungeonId:"uldaman",targetId:"galganns-fireblaster",
    note:"Level 42 to equip; around level 44 is a group-run planning recommendation, not a dungeon requirement. Compare against Truthseeker's Bow before farming."
  },
  {
    id:"fleshhide-shoulders",name:"Fleshhide Shoulders",slot:"shoulders",
    minEquipLevel:37,recommendedLevel:40,
    source:"Glutton",location:"Razorfen Downs, Southern Barrens",
    sourceUrl:"https://www.wowhead.com/forever/item=10774/fleshhide-shoulders",
    tier:"strong-leveling-option",evidence:"forever-item",method:"dungeon boss",dungeonId:"razorfen-downs",targetId:"fleshhide-shoulders",
    note:"Confirmed Forever dungeon-journal boss source; leather shoulder option while leveling. Actual BiS depends on your equipped stats."
  },
  {
    id:"oilskin-leggings",name:"Oilskin Leggings",slot:"legs",
    minEquipLevel:42,recommendedLevel:44,
    source:"Grimlok",location:"Uldaman, Badlands",
    sourceUrl:"https://www.wowhead.com/forever/item=9414/oilskin-leggings",
    tier:"strong-leveling-option",evidence:"forever-item",method:"dungeon boss",dungeonId:"uldaman",targetId:"oilskin-leggings",
    note:"Forever tooltip reports +18 Agility. Level 42 to equip; recommended group run about level 44."
  },
  {
    id:"megashot-rifle",name:"Megashot Rifle",slot:"ranged",
    minEquipLevel:48,recommendedLevel:49,
    source:"Tinkerer Gizlock",location:"Maraudon, Desolace",
    sourceUrl:"https://www.wowhead.com/forever/item=17717/megashot-rifle",
    tier:"leveling-bis-candidate",evidence:"forever-item",method:"dungeon boss",dungeonId:"maraudon",targetId:"megashot-rifle",
    note:"Level 48 to equip. A later ranged weapon option, not an upgrade guaranteed over a quest bow in your bags."
  }
] as const;

export const hunterBisLeadForDungeonItem=(dungeonId:string,targetId:string)=>
  WOW_HUNTER_BIS_LEADS.find(x=>x.dungeonId===dungeonId&&x.targetId===targetId);

/** Manual source review catches stale aliases and misassigned loot without inventing records. */
export function hunterBisSourceWarnings():string[]{
  return WOW_HUNTER_BIS_LEADS.flatMap(lead=>{
    if(!lead.dungeonId||!lead.targetId)return [];
    const dungeon=WOW_HUNTER_DUNGEONS.find(d=>d.id===lead.dungeonId);
    const item=dungeon?.loot.find(t=>t.id===lead.targetId);
    return item&&item.name===lead.name?[]:[`BiS source missing or mismatched: ${lead.id}`];
  });
}
