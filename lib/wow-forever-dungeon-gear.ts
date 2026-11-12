/**
 * Curated, gear-aware WoW Forever dungeon targets for a ranged/BM Hunter.
 * These are potential upgrades, not comparisons with the player's equipped items.
 * Classic-baseline boss assignments may move in Forever.
 *
 * Level bands describe recommended group runs, not guaranteed entry requirements.
 * Keep target IDs stable to preserve "Already have" checkboxes.
 */
export type HunterLootTarget = {
  id: string;
  name: string;
  slot: "ranged" | "melee" | "head" | "shoulders" | "chest" | "hands" | "wrist" | "legs" | "back" | "feet" | "ring" | "neck" | "waist";
  requiredLevel: number;
  priority: number; // Curated Hunter relevance; ranged is most valuable.
  from: string;
  kind: "boss" | "trash" | "quest";
  faction?: "horde" | "alliance"; // Restrict faction-specific quest reward claims
  note?: string;
};
export type HunterDungeon = {
  id: string;
  name: string;
  min: number;
  max: number;
  region: string;
  sourceUrl: string;
  loot: HunterLootTarget[];
  travelNote?: string;
  sourceNote?: string;
};
const wiki = "https://forever.undrwrldcub.com/warband/orc-hunter/dungeons/";
const classGuide = "https://theforeverera.com/en/guides/classes/hunter/";
const gearGuide = "https://aistat.app/wowforever/hunter/reference.en.html";
export const WOW_HUNTER_DUNGEONS: HunterDungeon[] = [
  {id:"ragefire",name:"Ragefire Chasm",min:13,max:18,region:"Orgrimmar",sourceUrl:wiki,loot:[
    {id:"barbaric-crossbow",name:"Barbaric Crossbow",slot:"ranged",requiredLevel:13,priority:7,from:"Oggleflint",kind:"boss"},
    {id:"chasm-walkers",name:"Chasm Walkers",slot:"feet",requiredLevel:13,priority:2,from:"Bazzalan",kind:"boss"},
  ]},
  {id:"hall-thanes",name:"Hall of Thanes",min:13,max:18,region:"Ironforge",sourceUrl:wiki,loot:[],travelNote:"Deep within Alliance-controlled Ironforge: risky access for Horde.",sourceNote:"Hunter-specific upgrade value has not been established from currently available data."},
  {id:"wailing",name:"Wailing Caverns",min:17,max:24,region:"The Barrens",sourceUrl:classGuide,loot:[
    {id:"glowing-lizardscale-cloak",name:"Glowing Lizardscale Cloak",slot:"back",requiredLevel:18,priority:4,from:"Skum",kind:"boss",note:"Hunter leveling-gear pick; verify drops after patches."},
    {id:"gloves-fang",name:"Gloves of the Fang",slot:"hands",requiredLevel:14,priority:4,from:"Dungeon trash",kind:"trash",note:"Hunter leveling-gear pick; verify drops after patches."},
    {id:"serpents-shoulders",name:"Serpent's Shoulders",slot:"shoulders",requiredLevel:18,priority:3,from:"Lady Anacondra",kind:"boss"},
    {id:"venomstrike",name:"Venomstrike",slot:"ranged",requiredLevel:19,priority:8,from:"Lord Serpentis",kind:"boss"},
  ]},
  {id:"deadmines",name:"The Deadmines",min:17,max:26,region:"Westfall",sourceUrl:classGuide,travelNote:"Alliance-zone travel through Westfall can be inconvenient or dangerous as Horde.",loot:[
    {id:"blackened-defias-belt",name:"Blackened Defias Belt",slot:"waist",requiredLevel:17,priority:4,from:"Dungeon drop (check boss)",kind:"boss"},
    {id:"cruel-barb",name:"Cruel Barb",slot:"melee",requiredLevel:19,priority:2,from:"Edwin VanCleef",kind:"boss"},
  ]},
  {id:"ruins-lordaeron",name:"Ruins of Lordaeron",min:15,max:20,region:"Tirisfal Glades",sourceUrl:wiki,loot:[],sourceNote:"Loot coverage is incomplete; not ranked as a strong Hunter gear farm."},
  {id:"shadowfang",name:"Shadowfang Keep",min:22,max:30,region:"Silverpine Forest",sourceUrl:wiki,loot:[
    {id:"seal-sylvanas",name:"Seal of Sylvanas",slot:"ring",requiredLevel:22,priority:3,from:"Horde dungeon quest reward (source unverified)",kind:"quest",faction:"horde",note:"Horde-only reward; confirm the Forever quest before entering."},
  ]},
  {id:"blackfathom",name:"Blackfathom Deeps",min:24,max:32,region:"Ashenvale / Zoram Strand",sourceUrl:wiki,loot:[
    {id:"naga-heartpiercer",name:"Naga Heartpiercer",slot:"ranged",requiredLevel:22,priority:7,from:"Lady Sarevess",kind:"boss"},
    {id:"ring-precision",name:"Ring of Precision",slot:"ring",requiredLevel:22,priority:3,from:"Trash mobs",kind:"trash"},
  ]},
  {id:"excavation",name:"Excavation Site: Wetlands",min:26,max:32,region:"Wetlands",sourceUrl:gearGuide,loot:[
    {id:"golemsight-long-gun",name:"Golemsight Long Gun",slot:"ranged",requiredLevel:28,priority:7,from:"Relic Guardian",kind:"boss",note:"Forever item stats reported; verify current loot source."},
  ],travelNote:"Wetlands is Alliance-leaning territory; check your travel route."},
  {id:"city-dalaran",name:"City of Dalaran",min:28,max:34,region:"Alterac Mountains",sourceUrl:gearGuide,loot:[
    {id:"felbough-arm",name:"Felbough Arm",slot:"melee",requiredLevel:29,priority:3,from:"Fel Ancient",kind:"boss",note:"Agility-oriented stat stick; source should be checked in current patch."},
  ],sourceNote:"Partial Hunter loot coverage only."},
  {id:"gnomeregan",name:"Gnomeregan",min:29,max:38,region:"Dun Morogh",sourceUrl:gearGuide,loot:[
    {id:"glass-shooter",name:"Glass Shooter",slot:"ranged",requiredLevel:30,priority:8,from:"Dark Iron Ambassador",kind:"boss",note:"Forever stats verified separately from boss location; confirm current boss drop."},
    {id:"petrolspill-leggings",name:"Petrolspill Leggings",slot:"legs",requiredLevel:25,priority:4,from:"Gnomeregan trash (very rare)",kind:"trash",note:"Forever stats verified; very rare world/dungeon drop, so do not assume a specific boss drops it."},
  ],travelNote:"The dungeon entrance is in Alliance territory; choose a safe route as Horde."},
  {id:"sm-graveyard",name:"Scarlet Monastery: Graveyard",min:30,max:38,region:"Tirisfal Glades",sourceUrl:wiki,loot:[
    {id:"ebon-vise",name:"Ebon Vise",slot:"hands",requiredLevel:30,priority:4,from:"Fallen Champion (rare)",kind:"boss"},
    {id:"ironspines-eye",name:"Ironspine's Eye",slot:"ring",requiredLevel:30,priority:4,from:"Ironspine (rare)",kind:"boss"},
    {id:"ghostshard-talisman",name:"Ghostshard Talisman",slot:"neck",requiredLevel:30,priority:3,from:"Azshir the Sleepless (rare)",kind:"boss"},
  ],sourceNote:"Rare bosses may not appear on every run."},
  {id:"sm-library",name:"Scarlet Monastery: Library",min:30,max:41,region:"Tirisfal Glades",sourceUrl:wiki,loot:[
    {id:"dog-training-gloves",name:"Dog Training Gloves",slot:"hands",requiredLevel:29,priority:2,from:"Houndmaster Loksey",kind:"boss"},
  ]},
  {id:"razorfen-kraul",name:"Razorfen Kraul",min:29,max:38,region:"Southern Barrens",sourceUrl:gearGuide,loot:[
    {id:"quilboar-blaster",name:"Quilboar Blaster",slot:"ranged",requiredLevel:29,priority:9,from:"Dungeon quest reward",kind:"quest",note:"Check the exact faction-specific quest before entering; reported quest names differ by faction."},
    {id:"nightstalker-bow",name:"Nightstalker Bow",slot:"ranged",requiredLevel:29,priority:8,from:"Blind Hunter (rare)",kind:"boss",note:"Rare boss; check current Forever loot."},
    {id:"ferine-leggings",name:"Ferine Leggings",slot:"legs",requiredLevel:29,priority:4,from:"Agathelos the Raging",kind:"boss"},
    {id:"armor-piercer",name:"Armor Piercer",slot:"melee",requiredLevel:24,priority:3,from:"Razorfen Spearhide",kind:"trash",note:"Agility stat stick in the sourced Hunter leveling list."},
  ]},
  {id:"sm-armory",name:"Scarlet Monastery: Armory",min:36,max:46,region:"Tirisfal Glades",sourceUrl:wiki,loot:[
    {id:"herods-shoulder",name:"Herod's Shoulder",slot:"shoulders",requiredLevel:37,priority:4,from:"Herod",kind:"boss"},
    {id:"raging-berserkers-helm",name:"Raging Berserker's Helm",slot:"head",requiredLevel:37,priority:3,from:"Herod",kind:"boss"},
  ]},
  {id:"sm-cathedral",name:"Scarlet Monastery: Cathedral",min:36,max:46,region:"Tirisfal Glades",sourceUrl:wiki,loot:[
    {id:"branded-leather-bracers",name:"Branded Leather Bracers",slot:"wrist",requiredLevel:37,priority:2,from:"High Inquisitor Fairbanks",kind:"boss"},
    {id:"mograine-might",name:"Mograine's Might",slot:"melee",requiredLevel:39,priority:2,from:"Scarlet Commander Mograine",kind:"boss"},
  ]},
  {id:"razorfen-downs",name:"Razorfen Downs",min:37,max:46,region:"Southern Barrens",sourceUrl:classGuide,loot:[
    {id:"quillward-harness",name:"Quillward Harness",slot:"chest",requiredLevel:34,priority:5,from:"Razorfen Downs trash",kind:"trash",note:"Classic-baseline trash-drop source; verify Forever loot before farming."},
    {id:"fleshhide-shoulders",name:"Fleshhide Shoulders",slot:"shoulders",requiredLevel:37,priority:3,from:"Glutton",kind:"boss"},
  ]},
  {id:"kroldok",name:"Krol'dok Stronghold",min:40,max:45,region:"Riverglades",sourceUrl:wiki,loot:[],sourceNote:"New Forever dungeon. Hunter-specific drops are not yet verified."},
  {id:"uldaman",name:"Uldaman",min:41,max:51,region:"Badlands",sourceUrl:wiki,loot:[
    {id:"galganns-fireblaster",name:"Galgann's Fireblaster",slot:"ranged",requiredLevel:42,priority:8,from:"Galgann Firehammer",kind:"boss"},
    {id:"oilskin-leggings",name:"Oilskin Leggings",slot:"legs",requiredLevel:42,priority:3,from:"Grimlok",kind:"boss"},
  ]},
  {id:"zulfarrak",name:"Zul'Farrak",min:44,max:54,region:"Tanaris",sourceUrl:wiki,loot:[
    {id:"embrace-lycan",name:"Embrace of the Lycan",slot:"head",requiredLevel:45,priority:3,from:"Chief Ukorz Sandscalp",kind:"boss"},
  ]},
  {id:"maraudon",name:"Maraudon",min:46,max:55,region:"Desolace",sourceUrl:wiki,loot:[
    {id:"megashot-rifle",name:"Megashot Rifle",slot:"ranged",requiredLevel:48,priority:8,from:"Tinkerer Gizlock",kind:"boss"},
    {id:"phytoskin-spaulders",name:"Phytoskin Spaulders",slot:"shoulders",requiredLevel:46,priority:4,from:"Razorlash",kind:"boss"},
    {id:"blackstone-ring",name:"Blackstone Ring",slot:"ring",requiredLevel:49,priority:4,from:"Princess Theradras",kind:"boss"},
    {id:"fungus-shroud-armor",name:"Fungus Shroud Armor",slot:"chest",requiredLevel:46,priority:4,from:"Meshlok the Harvester (rare)",kind:"boss"},
  ]},
  {id:"alcaz",name:"Alcaz Prison",min:48,max:53,region:"Dustwallow Marsh",sourceUrl:wiki,loot:[],sourceNote:"New Forever dungeon. Hunter-specific loot remains unverified."},
  {id:"sunken-temple",name:"Sunken Temple",min:50,max:60,region:"Swamp of Sorrows",sourceUrl:wiki,loot:[
    {id:"dragons-eye",name:"Dragon's Eye",slot:"neck",requiredLevel:51,priority:3,from:"Shade of Eranikus",kind:"boss"},
    {id:"wingveil-cloak",name:"Wingveil Cloak",slot:"back",requiredLevel:47,priority:3,from:"Spawn of Hakkar",kind:"boss"},
  ]},
  {id:"blackrock-depths",name:"Blackrock Depths",min:52,max:60,region:"Blackrock Mountain",sourceUrl:wiki,loot:[
    {id:"houndmasters-bow",name:"Houndmaster's Bow",slot:"ranged",requiredLevel:48,priority:8,from:"Houndmaster Grebmar",kind:"boss"},
    {id:"fleetfoot-greaves",name:"Fleetfoot Greaves",slot:"feet",requiredLevel:48,priority:4,from:"Houndmaster Grebmar",kind:"boss"},
    {id:"blisterbane-wrap",name:"Blisterbane Wrap",slot:"hands",requiredLevel:52,priority:3,from:"Dungeon source unverified",kind:"boss",note:"Hunter guide pick; check the current Forever loot table."},
  ]},
  {id:"blackmaw-hold",name:"Blackmaw Hold",min:55,max:60,region:"Unknown / high level",sourceUrl:wiki,loot:[],sourceNote:"New Forever dungeon; Hunter loot not yet verified."},
  {id:"lower-blackrock-spire",name:"Lower Blackrock Spire",min:55,max:60,region:"Blackrock Mountain",sourceUrl:wiki,loot:[],sourceNote:"Hunter-specific item prioritization is pending in the current catalog."},
  {id:"scholomance",name:"Scholomance",min:58,max:60,region:"Western Plaguelands",sourceUrl:wiki,loot:[],sourceNote:"Hunter-specific item prioritization is pending in the current catalog."},
  {id:"stratholme",name:"Stratholme",min:58,max:60,region:"Eastern Plaguelands",sourceUrl:wiki,loot:[],sourceNote:"Hunter-specific item prioritization is pending in the current catalog."},
  {id:"dire-maul",name:"Dire Maul",min:54,max:60,region:"Feralas",sourceUrl:wiki,loot:[],sourceNote:"Hunter-specific item prioritization is pending in the current catalog."},
];

export const dungeonLootOwnedKey = (gameId: string, dungeonId: string, targetId: string) =>
  gameId + "|dungeon-gear|" + dungeonId + "|" + targetId;

export type HunterDungeonAssessment = {
  dungeon: HunterDungeon;
  score: number;
  gearTargets: HunterLootTarget[];
  upcomingTargets: HunterLootTarget[];
  acquiredCount: number;
  band: "current" | "soon" | "past";
};

/**
 * Only current-level gear contributes to priority.
 * Player-confirmed owned targets do not contribute. Unknown loot is not "bad loot":
 * the UI places unverified dungeons below evidenced targets, with a label.
 */
export function rankHunterDungeons(
  level: number,
  owned: (dungeonId: string, itemId: string) => boolean,
  faction: "horde" | "alliance" = "horde",
): HunterDungeonAssessment[] {
  const assessments: HunterDungeonAssessment[] = [];
  for (const dungeon of WOW_HUNTER_DUNGEONS) {
    const band: HunterDungeonAssessment["band"] = level < dungeon.min ? "soon" : level > dungeon.max ? "past" : "current";
    // Show dungeons relevant to the present and immediately next level bracket.
    if (level < dungeon.min - 4 || level > dungeon.max + 2) continue;
    const loot = dungeon.loot.filter(item => !item.faction || item.faction === faction);
    const gearTargets = loot.filter(item => item.requiredLevel <= level && !owned(dungeon.id, item.id));
    const upcomingTargets = loot.filter(item => item.requiredLevel > level && item.requiredLevel <= level + 4 && !owned(dungeon.id, item.id));
    const acquiredCount = loot.filter(item => owned(dungeon.id, item.id)).length;
    const gearValue = gearTargets.reduce((sum, item) => sum + item.priority, 0);
    // Level appropriate run first; near-future runs are displayed but not "run now".
    // Late older dungeons get downweighted; their loot may still be useful if missing.
    const score = band === "soon" ? 0 : band === "past" ? Math.max(0, gearValue - 6) : Math.max(0, gearValue - Math.max(0, level - (dungeon.max - 2)));
    assessments.push({dungeon,score,gearTargets,upcomingTargets,acquiredCount,band});
  }
  return assessments.sort((a,b) => {
    const bandOrder = {current:0,soon:1,past:2};
    if (bandOrder[a.band] !== bandOrder[b.band]) return bandOrder[a.band] - bandOrder[b.band];
    if (a.band === "soon") return a.dungeon.min - b.dungeon.min || b.upcomingTargets.length - a.upcomingTargets.length;
    if (a.score !== b.score) return b.score - a.score;
    if (a.gearTargets.length !== b.gearTargets.length) return b.gearTargets.length - a.gearTargets.length;
    return a.dungeon.min - b.dungeon.min;
  });
}
