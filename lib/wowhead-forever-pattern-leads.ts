/**
 * Individual Wowhead Forever pattern item pages reviewed November 14, 2026.
 * Source tables are observations, not guaranteed drops or live vendor stock.
 * The original recipe catalog contains spell/item output IDs, which differ
 * from a pattern scroll's item ID: do not link output ID as the pattern ID.
 */
export type ForeverPatternLead={
  name:string;
  patternItemId:number;
  itemUrl:string;
  details:string;
  levelHint?:string;
  factionWarning?:string;
  confidence:"wowhead-reported";
};
export const WOWHEAD_FOREVER_PATTERN_LEADS:Readonly<Record<string,ForeverPatternLead>>={
  "Hillman's Leather Boots":{
    name:"Hillman's Leather Boots",patternItemId:252804,
    itemUrl:"https://www.wowhead.com/forever/item=252804/pattern-hillmans-leather-boots",
    details:"Reported drop: Shadowhorn Stag in Ashenvale; the Forever item table lists the creature as level 22–23. Drop chance varies and is not guaranteed.",
    levelHint:"Level 22–23 target (gray expected at Hunter level 34; verify in-game)",confidence:"wowhead-reported"
  },
  "Herbalist's Gloves":{
    name:"Herbalist's Gloves",patternItemId:7361,
    itemUrl:"https://www.wowhead.com/forever/item=7361/pattern-herbalists-gloves",
    details:"Wowhead lists Shadethicket Raincaller (Ashenvale, level 22–23) as a possible drop and an Ashenvale vendor. The vendor is reported Alliance-only in historical comments.",
    factionWarning:"Horde: do not plan to purchase from the Alliance-only vendor; treat the NPC drop or Auction House as possibilities.",
    confidence:"wowhead-reported"
  },
  "Gem-studded Leather Belt":{
    name:"Gem-studded Leather Belt",patternItemId:14635,
    itemUrl:"https://www.wowhead.com/forever/item=14635/pattern-gem-studded-leather-belt",
    details:"Reported drop: Haunting Phantasm, Scarlet Monastery (about level 32–33 elite); Wowhead also lists vendors in Desolace and Stranglethorn Vale, but current stock is not confirmed.",
    levelHint:"Scarlet Monastery farming is not a no-XP candidate for a level-34 Hunter.",
    confidence:"wowhead-reported"
  },
  "Brawler's Leather Helm":{
    name:"Brawler's Leather Helm",patternItemId:252814,
    itemUrl:"https://www.wowhead.com/forever/item=252814/pattern-brawlers-leather-helm",
    details:"Wowhead Forever lists Gnomeregan enemies including Electrocutioner 6000 and Dark Iron Ambassador, plus Old Serra'kis in Blackfathom Deeps, among possible drops.",
    confidence:"wowhead-reported"
  },
  "Totemic Leather Hood":{
    name:"Totemic Leather Hood",patternItemId:252801,
    itemUrl:"https://www.wowhead.com/forever/item=252801/pattern-totemic-leather-hood",
    details:"Forever page reports Ghamoo-ra (Blackfathom Deeps), Edwin VanCleef (The Deadmines) and Shadow Charger (Shadowfang Keep). It also lists Barrens and Redridge vendor areas; check faction and stock.",
    confidence:"wowhead-reported"
  },
  "Thick Murloc Armor":{
    name:"Thick Murloc Armor",patternItemId:5788,
    itemUrl:"https://www.wowhead.com/forever/item=5788/pattern-thick-murloc-armor",
    details:"Wowhead Forever lists vendor locations in Stranglethorn Vale and Hillsbrad Foothills, plus possible drops from Kurzen Commando and Captain Halyndor. None is guaranteed.",
    confidence:"wowhead-reported"
  }
};
