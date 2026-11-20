/** WoW Forever Hunter pre-raid and PvP level-60 candidates. Reviewed Nov 20, 2026.
 * PvE ranking: Wowhead Forever Beast Mastery guide updated Nov 19.
 * PvP: curated practical targets from Wowhead Forever PvP overview, item pages
 * and faction reputation rewards. This is NOT a proven definitive PvP simulation.
 * No Classic or future raid-only gear is presented as currently obtainable.
 */
export type ForeverBisSlot="head"|"neck"|"shoulders"|"back"|"chest"|"wrist"|"hands"|"waist"|"legs"|"feet"|"ring"|"ring2"|"trinket1"|"trinket2"|"melee"|"offhand"|"ranged";
export type ForeverEndgameItem={
 slot:ForeverBisSlot;name:string;itemId:number;where:string;how:string;note:string;
 faction?:"horde"|"alliance";kind:"bis"|"candidate"|"situational"|"conditional";warning?:string;
};
export const FOREVER_ENDGAME_REVIEW_DATE="2026-11-20";
export const FOREVER_PVE_BIS_GUIDE="https://www.wowhead.com/forever/guide/classes/hunter/beast-mastery/bis-gear";
export const FOREVER_PVP_REWARDS_GUIDE="https://www.wowhead.com/forever/guide/pvp-overview-ranking-rewards";
export const FOREVER_HUNTER_GEAR_PLANNER="https://www.wowhead.com/forever/gear-planner/hunter";
export const FOREVER_PVE60_BIS:ForeverEndgameItem[]=[
  {
    "slot": "head",
    "name": "Black Dragonscale Helm",
    "itemId": 252605,
    "where": "Leatherworking / Auction House",
    "how": "Craft Black Dragonscale Helm; collect rare leatherworking materials.",
    "note": "WoW Forever pre-raid BiS head.",
    "kind": "bis"
  },
  {
    "slot": "neck",
    "name": "Mark of Fordring",
    "itemId": 15411,
    "where": "Western Plaguelands",
    "how": "Complete the In Dreams quest chain.",
    "note": "Quest pre-raid BiS.",
    "kind": "bis"
  },
  {
    "slot": "shoulders",
    "name": "Darkspear Epaulets",
    "itemId": 272106,
    "where": "The Barrens · Darkspear Raiders quartermaster",
    "how": "Earn Darkspear Raiders Exalted; buy from Creeg Bothunk north of Ratchet.",
    "note": "Horde version of the level-60 mail shoulder reward.",
    "faction": "horde",
    "kind": "bis"
  },
  {
    "slot": "shoulders",
    "name": "Theramore Epaulets",
    "itemId": 271956,
    "where": "The Barrens · Theramore Expeditionary Force quartermaster",
    "how": "Earn Theramore Expeditionary Force Exalted; buy from Bryanna Embreeze behind Northwatch Hold.",
    "note": "Alliance-only equivalent.",
    "faction": "alliance",
    "kind": "bis"
  },
  {
    "slot": "back",
    "name": "Cape of the Black Baron",
    "itemId": 13340,
    "where": "Stratholme",
    "how": "Loot from Baron Rivendare.",
    "note": "Dungeon drop; chance is not guaranteed.",
    "kind": "bis"
  },
  {
    "slot": "chest",
    "name": "Dawn Armor",
    "itemId": 252483,
    "where": "Leatherworking / Auction House",
    "how": "Craft via Leatherworking; check recipe/material cost.",
    "note": "New-in-Forever pre-raid chest.",
    "kind": "bis"
  },
  {
    "slot": "wrist",
    "name": "Beastmaster's Bindings",
    "itemId": 22011,
    "where": "Hunter Beastmaster Armor quest chain",
    "how": "Complete the related class armor quest; verify its prerequisites on the item page.",
    "note": "Quest progression can take longer than the item requirement.",
    "kind": "bis"
  },
  {
    "slot": "hands",
    "name": "Devilsaur Gauntlets",
    "itemId": 15063,
    "where": "Leatherworking / Auction House",
    "how": "Craft or buy Devilsaur Gauntlets.",
    "note": "Devilsaur set can pair with leggings.",
    "kind": "bis"
  },
  {
    "slot": "waist",
    "name": "Warpwood Binding",
    "itemId": 18393,
    "where": "Dire Maul",
    "how": "Defeat Tendris Warpwood.",
    "note": "Boss loot.",
    "kind": "bis"
  },
  {
    "slot": "legs",
    "name": "Devilsaur Leggings",
    "itemId": 15062,
    "where": "Leatherworking / Auction House",
    "how": "Craft or buy Devilsaur Leggings.",
    "note": "Pairs with Devilsaur Gauntlets.",
    "kind": "bis"
  },
  {
    "slot": "feet",
    "name": "Beastmaster's Treads",
    "itemId": 226881,
    "where": "Beastmaster Armor quest / vendor",
    "how": "Review Forever item page and quest prerequisites; exact acquisition may change.",
    "note": "Wowhead's ranked pre-raid feet.",
    "kind": "bis"
  },
  {
    "slot": "ring",
    "name": "Cutthroat's Signet",
    "itemId": 272408,
    "where": "Stranglethorn Vale · Pix Xizzix",
    "how": "Purchase through Tarnished Undermine Real currency vendor after meeting the item requirements.",
    "note": "Wowhead Forever lists vendor location; check actual cost before travel.",
    "kind": "bis"
  },
  {
    "slot": "ring2",
    "name": "Tarnished Elven Ring",
    "itemId": 18500,
    "where": "Dire Maul",
    "how": "Seek dungeon-zone drops or Auction House if tradeable.",
    "note": "Cannot equip a second unique Cutthroat's Signet.",
    "kind": "bis"
  },
  {
    "slot": "trinket1",
    "name": "Blackhand's Breadth",
    "itemId": 13965,
    "where": "Horde quest chain · Blackrock Spire",
    "how": "Complete For The Horde! quest series.",
    "note": "Horde quest-reward candidate.",
    "faction": "horde",
    "kind": "bis"
  },
  {
    "slot": "trinket1",
    "name": "Cleansed Vilebranch Medallion",
    "itemId": 270275,
    "where": "The Hinterlands · Saving Sharpbeak",
    "how": "Complete the Saving Sharpbeak quest.",
    "note": "Alliance-facing alternative instead of the Horde quest-reward item.",
    "faction": "alliance",
    "kind": "candidate"
  },
  {
    "slot": "trinket2",
    "name": "Rune of the Guard Captain",
    "itemId": 19120,
    "where": "Revantusk Village · The Hinterlands",
    "how": "Complete Job Opening: Guard Captain of Revantusk Village.",
    "note": "Horde-only trinket; verify updated Forever tooltip and quest.",
    "faction": "horde",
    "kind": "candidate"
  },
  {
    "slot": "trinket2",
    "name": "Cleansed Vilebranch Medallion",
    "itemId": 270275,
    "where": "The Hinterlands · Saving Sharpbeak",
    "how": "Complete Saving Sharpbeak.",
    "note": "Forever-biased trinket; biome-based effect is situational.",
    "faction": "alliance",
    "kind": "bis"
  },
  {
    "slot": "melee",
    "name": "Legionite Glaive",
    "itemId": 250619,
    "where": "Blacksmithing 300 / BoP",
    "how": "Requires crafted Blacksmithing glaive; binds on pickup. Verify that your character can obtain it.",
    "note": "Not a practical route for your current Skinning/Leatherworking character if BoP requires crafting it yourself.",
    "kind": "bis",
    "warning": "BoP crafting restriction — check profession eligibility."
  },
  {
    "slot": "offhand",
    "name": "Tooth of the Matriarch",
    "itemId": 280021,
    "where": "Direhorn Matriarch",
    "how": "Optional one-handed weapon drop when dual wielding.",
    "note": "Only relevant with one-handed weapons; a two-handed glaive uses both slots.",
    "kind": "conditional"
  },
  {
    "slot": "ranged",
    "name": "Bloodseeker",
    "itemId": 19107,
    "where": "Alterac Valley quest reward",
    "how": "Complete your faction's Alterac Valley quest chain.",
    "note": "Strong PvE crossbow and shared PvP candidate.",
    "kind": "bis"
  }
];
export const FOREVER_PVP60_TARGETS:ForeverEndgameItem[]=[
  {
    "slot": "head",
    "name": "Beastmaster's Cap",
    "itemId": 22013,
    "where": "Level-60 Beastmaster Armor quest chain",
    "how": "Complete Saving the Best for Last (faction-specific quest).",
    "note": "Stamina plus pet health makes it a practical PvP option.",
    "kind": "candidate"
  },
  {
    "slot": "neck",
    "name": "Medallion of the Dawn",
    "itemId": 22659,
    "where": "Eastern Plaguelands · Argent Dawn",
    "how": "Complete an Epic Armaments of Battle quest and select this reward.",
    "note": "Quest choices matter: confirm other potential rewards before accepting.",
    "kind": "candidate"
  },
  {
    "slot": "shoulders",
    "name": "Darkspear Epaulets",
    "itemId": 272106,
    "where": "The Barrens · Creeg Bothunk (Horde)",
    "how": "Reach Darkspear Raiders Exalted in Darkspear Islands and buy this item.",
    "note": "Mail armor; agility, stamina and crit.",
    "faction": "horde",
    "kind": "candidate"
  },
  {
    "slot": "shoulders",
    "name": "Theramore Epaulets",
    "itemId": 271956,
    "where": "The Barrens · Bryanna Embreeze (Alliance)",
    "how": "Reach Theramore Expeditionary Force Exalted via Darkspear Islands.",
    "note": "Alliance equivalent.",
    "faction": "alliance",
    "kind": "candidate"
  },
  {
    "slot": "back",
    "name": "Deathguard's Cloak",
    "itemId": 20068,
    "where": "Arathi Basin · The Defilers",
    "how": "Earn The Defilers Exalted.",
    "note": "Horde PvP reputation cloak.",
    "faction": "horde",
    "kind": "candidate"
  },
  {
    "slot": "back",
    "name": "Cloak of the Honor Guard",
    "itemId": 20073,
    "where": "Arathi Basin · League of Arathor",
    "how": "Earn The League of Arathor Exalted.",
    "note": "Alliance PvP reputation cloak.",
    "faction": "alliance",
    "kind": "candidate"
  },
  {
    "slot": "chest",
    "name": "Dawn Armor",
    "itemId": 252483,
    "where": "Leatherworking / Auction House",
    "how": "Craft or buy Dawn Armor.",
    "note": "High-value non-rank PvP damage option; PvP honor armor offers stamina/set alternatives.",
    "kind": "candidate"
  },
  {
    "slot": "wrist",
    "name": "Bracers of Subterfuge",
    "itemId": 22668,
    "where": "Eastern Plaguelands · Argent Dawn quests",
    "how": "Choose from eligible Epic Armaments of Battle quest rewards.",
    "note": "Verify exact quest reward selection before turning it in.",
    "kind": "candidate"
  },
  {
    "slot": "hands",
    "name": "Devilsaur Gauntlets",
    "itemId": 15063,
    "where": "Leatherworking / Auction House",
    "how": "Craft or buy Devilsaur Gauntlets.",
    "note": "Damage pick; compare with your rare/epic honor set bonus.",
    "kind": "candidate"
  },
  {
    "slot": "waist",
    "name": "Defiler's Chain Girdle",
    "itemId": 20150,
    "where": "Arathi Basin · The Defilers",
    "how": "Earn Honored with The Defilers and purchase PvP belt.",
    "note": "Horde reputation item; confirm the correct level tier.",
    "faction": "horde",
    "kind": "candidate"
  },
  {
    "slot": "waist",
    "name": "Highlander's Chain Girdle",
    "itemId": 20043,
    "where": "Arathi Basin · League of Arathor",
    "how": "Earn Honored with The League of Arathor and purchase PvP belt.",
    "note": "Alliance counterpart; confirm the correct level tier.",
    "faction": "alliance",
    "kind": "candidate"
  },
  {
    "slot": "legs",
    "name": "Leggings of the Plague Hunter",
    "itemId": 22690,
    "where": "Eastern Plaguelands · Argent Dawn",
    "how": "Select from Superior Armaments of Battle quest rewards.",
    "note": "Compare with upgraded epic honor legs for survivability.",
    "kind": "candidate"
  },
  {
    "slot": "feet",
    "name": "Beastmaster's Boots",
    "itemId": 22061,
    "where": "Hunter class armor quest chain",
    "how": "Complete Anthion's Parting Words (faction-specific version).",
    "note": "Quest source, not automatically an instant purchase.",
    "kind": "candidate"
  },
  {
    "slot": "ring",
    "name": "Insurgent's Band",
    "itemId": 272064,
    "where": "The Barrens · Creeg Bothunk",
    "how": "Earn Darkspear Raiders Honored from Darkspear Islands.",
    "note": "Horde Forever-specific PvP reputation ring.",
    "faction": "horde",
    "kind": "candidate"
  },
  {
    "slot": "ring",
    "name": "Theramore Signet",
    "itemId": 271974,
    "where": "The Barrens · Bryanna Embreeze",
    "how": "Earn Theramore Expeditionary Force Honored from Darkspear Islands.",
    "note": "Alliance ring; check source page before travel.",
    "faction": "alliance",
    "kind": "candidate"
  },
  {
    "slot": "ring2",
    "name": "Band of Earthen Might",
    "itemId": 21182,
    "where": "Silithus",
    "how": "Complete Might of Cenarius / connected quest rewards.",
    "note": "Useful second ring; actual quest rewards require a choice.",
    "kind": "candidate"
  },
  {
    "slot": "trinket1",
    "name": "Insignia of the Horde",
    "itemId": 18846,
    "where": "Orgrimmar · PvP vendor",
    "how": "Reach Rank 2 (Grunt) and buy the Hunter-class PvP insignia.",
    "note": "CC-break utility; check its current Forever tooltip.",
    "faction": "horde",
    "kind": "situational"
  },
  {
    "slot": "trinket1",
    "name": "Insignia of the Alliance",
    "itemId": 18856,
    "where": "Stormwind · PvP vendor",
    "how": "Reach Rank 2 (Corporal) and buy the Hunter-class PvP insignia.",
    "note": "CC-break utility; check its current Forever tooltip.",
    "faction": "alliance",
    "kind": "situational"
  },
  {
    "slot": "trinket2",
    "name": "Defiler's Talisman",
    "itemId": 20072,
    "where": "Arathi Basin · The Defilers",
    "how": "Reach Friendly reputation; buy PvP trinket.",
    "note": "Horde alternative to Engineering-only active trinkets.",
    "faction": "horde",
    "kind": "situational"
  },
  {
    "slot": "trinket2",
    "name": "Arcanite Dragonling",
    "itemId": 16022,
    "where": "Engineering profession",
    "how": "Engineering-crafted combat trinket.",
    "note": "Requires Engineering to use; optional for your Leatherworking build.",
    "faction": "alliance",
    "kind": "situational",
    "warning": "Profession-restricted."
  },
  {
    "slot": "melee",
    "name": "Ice Barbed Spear",
    "itemId": 19106,
    "where": "Alterac Valley quest",
    "how": "Complete Alterac Valley victory quest and choose the polearm.",
    "note": "Accessible 2H PvP option without Blacksmithing. Quest reward is a choice.",
    "kind": "candidate"
  },
  {
    "slot": "offhand",
    "name": "Tooth of the Matriarch",
    "itemId": 280021,
    "where": "Direhorn Matriarch",
    "how": "One-handed alternative if you switch from a 2H weapon.",
    "note": "Conditional only; not a second item when using Ice Barbed Spear.",
    "kind": "conditional"
  },
  {
    "slot": "ranged",
    "name": "The Purifier",
    "itemId": 22656,
    "where": "Eastern Plaguelands · Argent Dawn quests",
    "how": "Take The Purifier as an Epic Armaments of Battle quest reward.",
    "note": "PvP-focused crit gun; compare actual weapon DPS and Auto Shot speed with Bloodseeker.",
    "kind": "candidate"
  }
];
