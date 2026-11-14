/**
 * Recipe-material farming lookups for WoW Forever.
 *
 * The recipe list is derived directly from the site's dated game-client catalog.
 * Routes are separately researched: an unmapped material is NOT silently assigned
 * a made-up mob or coordinate. Classic sources can differ in Forever.
 */
import { WOW_RECIPES, type WowRecipe } from "./wow-forever-professions";
import { WOW_DUNGEON_PROFESSION_DROPS } from "./wow-forever-dungeon-professions";
import { WOW_HUNTER_DUNGEONS } from "./wow-forever-dungeon-gear";
import { WOWHEAD_FOREVER_HORDE_VENDOR_ITEMS, wowheadForeverItemUrl } from "./wowhead-forever-items";
import { reviewedMaterialRoutes } from "./wow-forever-source-expansion";

export type MaterialMethod = "mob" | "dungeon" | "skinning" | "mining" | "herbalism" | "vendor" | "crafting" | "other-profession";
export type MaterialRoute = {
  id:string;
  item:string;
  method:MaterialMethod;
  zone:string;
  target:string;
  advice:string;
  waypoint?:string;
  minMob?:number;
  maxMob?:number;
  requiredSkill?:number;
  reviewedAt?:string;
  sourceUrl:string;
  evidence:"classic-reference"|"forever-reported"|"wowhead-item-page"|"client-recipe";
};
const sourceMoss = "https://forever-codex.com/items/?id=1206";
const sourceMossMobs = "https://metabot.gg/en/wow-forever/items/moss-agate";
const sourceMining = "https://www.wowhead.com/classic/guide/classic-mining-best-farming-basics-early-ores";
const sourceCloth = "https://www.warcrafttavern.com/wow-classic/guides/cloth-farming";
const sourceLeather = "https://www.wowhead.com/classic/guide/classic-leather-farming-early-leather";
const sourceGems = "https://warcraft.wiki.gg/wiki/Raw_gem";
const m = (item:string,id:string,zone:string,target:string,advice:string,sourceUrl:string,
  extras:Partial<Omit<MaterialRoute,"item"|"id"|"zone"|"target"|"advice"|"sourceUrl">>={}):MaterialRoute=>
  ({item,id,zone,target,advice,sourceUrl,method:"mob",evidence:"classic-reference",...extras});

export const CURATED_MATERIAL_ROUTES:MaterialRoute[] = [
  // Character-level 34, no Mining and no fishing: place gray enemy farms first.
  m("Moss Agate","moss-drone","The Barrens","Venture Co. Drone (level 22)",
    "Northern Barrens / Sludge Fen area. Kill and loot the Drones, then loop back as they respawn. Uncommon world drop; no guaranteed agate per run. This is a drop-based option that does not require Mining.",
    sourceMoss,{waypoint:"/way The Barrens 54.9 6.0",minMob:22,maxMob:22}),
  m("Moss Agate","moss-buck","Ashenvale","Wild Buck (levels 18–19)",
    "Kill/loot Wild Bucks where you find them in Ashenvale. Reported as a possible Moss Agate world drop, not a guaranteed or high-volume source.",
    sourceMossMobs,{minMob:18,maxMob:19}),
  m("Moss Agate","moss-defias","Westfall → The Deadmines","Defias Squallshaper (levels 19–20)",
    "Horde travel is inconvenient and the actual dungeon is deeper inside the entrance mine. A possible low-chance drop while running the instance.",
    sourceMossMobs,{minMob:19,maxMob:20,method:"dungeon"}),
  m("Moss Agate","moss-bfd","Ashenvale → Blackfathom Deeps","Blackfathom Sea Witch (levels 23–24)",
    "Possible world-drop-type loot from this enemy in the dungeon; verify each enemy is gray before pulling.",
    sourceMossMobs,{minMob:23,maxMob:24,method:"dungeon"}),
  m("Moss Agate","moss-tin","The Barrens","Tin Vein",
    "Tin spawns throughout appropriate parts of The Barrens. Moss Agate is a low-chance bonus when Mining tin. This requires Mining skill 65, not Skinning.",
    sourceMining,{method:"mining",requiredSkill:65}),
  m("Moss Agate","moss-silver","The Barrens / Hillsbrad Foothills","Silver Vein",
    "Rare tin-area spawn. Moss Agate is a possible bonus from Mining silver; this is not useful without Mining.",
    sourceMining,{method:"mining",requiredSkill:75}),

  m("Wool Cloth","wool-durnholde","Hillsbrad Foothills","Syndicate mobs at Durnholde Keep",
    "Repeat a loop of gray Syndicate humanoids near Durnholde; Classic wool/linen drops vary by mob.",
    "https://www.wowhead.com/forever/item=2592/wool-cloth",{waypoint:"/way Hillsbrad Foothills 76 47",minMob:20,maxMob:25}),
  m("Wool Cloth","wool-hillsbrad","Hillsbrad Foothills","Farmers, Peasants and Footmen",
    "The fields west of Tarren Mill are a Classic wool farm. Some guards and nearby mobs may be higher level; verify gray names first.",
    sourceCloth,{waypoint:"/way Hillsbrad Foothills 33 49",minMob:24,maxMob:27}),
  m("Wool Cloth","wool-barrens","The Barrens","Bael'dun dwarves",
    "Classic Horde-friendly farming option near the Bael'dun excavation south in The Barrens.",
    sourceCloth,{waypoint:"/way The Barrens 48 84",minMob:23,maxMob:26}),
  m("Linen Cloth","linen-barrens","The Barrens","Southsea pirates near Ratchet",
    "Farm low-level humanoids around the pirate camp south of Ratchet. Loot cloth and vendor trash.",
    "https://www.wowhead.com/classic/guide/classic-cloth-farming-linen-wool",{minMob:12,maxMob:16}),
  m("Linen Cloth","linen-razormane","The Barrens","Razormane camps near The Crossroads",
    "Low-level humanoid cloth farm; check their drops and sell excess cloth.",
    "https://www.wowhead.com/classic/guide/classic-cloth-farming-linen-wool",{minMob:10,maxMob:14}),
  m("Light Leather","light-wc","The Barrens → Wailing Caverns","Skinnable Deviate beasts",
    "Kill, fully loot, then skin beasts in the outer cave and dungeon. Access to the actual dungeon portal requires going deeper into the cave.",
    "https://www.wowhead.com/forever/item=2318/light-leather",{method:"skinning",minMob:17,maxMob:24,waypoint:"/way The Barrens 46.0 36.3"}),
  m("Medium Leather","medium-wc","The Barrens → Wailing Caverns","Skinnable Deviate beasts",
    "Some skinnable dungeon beasts yield Medium Leather, although others still yield Light. Fully loot before skinning.",
    sourceLeather,{method:"skinning",minMob:17,maxMob:24,waypoint:"/way The Barrens 46.0 36.3"}),
  m("Deviate Scale","scale-wc","The Barrens → Wailing Caverns","Deviate beasts",
    "Kill and skin Deviate beasts in the outer cave or instance; scales are not guaranteed. Check the exact creature loot.",
    "https://www.wowhead.com/classic/guide/classic-leather-farming-specialty-scales",
    {method:"skinning",minMob:17,maxMob:24,waypoint:"/way The Barrens 46.0 36.3"}),
  m("Perfect Deviate Scale","scale-perfect","The Barrens → Wailing Caverns","Deviate beasts",
    "An uncommon scale outcome, not from every beast. Loot and skin; repeat a short loop rather than assuming a guaranteed drop.",
    "https://www.wowhead.com/classic/guide/classic-leather-farming-specialty-scales",
    {method:"skinning",minMob:17,maxMob:24,waypoint:"/way The Barrens 46.0 36.3"}),
  m("Raptor Egg","egg-wetlands","Wetlands","Raptors (levels 22–28)",
    "Kill and loot raptors across the Wetlands. Some at level 27–28 could still award XP to a level 34 character; check enemy color.",
    "https://www.wowhead.com/forever/item=3685/raptor-egg",{minMob:22,maxMob:28}),
  m("Raptor Flesh","raptor-arathi","Arathi Highlands","Raptors near Hammerfall / Refuge Pointe",
    "Loot raptors for flesh and eggs, then skin their corpses for Heavy Leather. These raptors tend to be 30+, so this is NOT a no-XP farm at level 34.",
    "https://www.wowhead.com/forever/item=12184/raptor-flesh",{method:"skinning",minMob:30,maxMob:37}),
  m("Raptor Flesh","raptor-stv","Stranglethorn Vale","Jungle Stalkers near Gurubashi Arena",
    "Loot raptors near the arena, keeping away from the PvP arena itself. The mobs are above your XP-safe range.",
    "https://www.wow-farming.info/classic/farming-raptor-flesh/",{minMob:30,maxMob:35,waypoint:"/way Stranglethorn Vale 29 45"}),
  m("Shadowgem","shadow-tin","The Barrens / Hillsbrad Foothills","Tin and Silver Veins",
    "Uncommon Mining bonus. Without Mining, try mob/loot chest drops or buy from the Auction House rather than traveling to ore nodes.",
    "https://www.wowhead.com/forever/item=1210/shadowgem",{method:"mining",requiredSkill:65}),
  m("Lesser Moonstone","moon-tin","The Barrens / Hillsbrad Foothills","Tin and Silver Veins",
    "Uncommon Mining bonus. Requires Mining, not Skinning; direct mob sources have not been mapped here.",
    "https://www.wowhead.com/forever/item=1705/lesser-moonstone",{method:"mining",requiredSkill:65}),
  m("Jade","jade-tin","The Barrens / Hillsbrad Foothills","Tin Veins",
    "Rare Mining bonus. Do not plan around finding one on every node.",
    "https://www.wowhead.com/forever/item=1529/jade",{method:"mining",requiredSkill:65}),
  m("Malachite","malachite-copper","Durotar / The Barrens","Copper Veins",
    "Occasional Mining bonus from Copper Veins. Requires Mining skill, not Skinning.",
    sourceGems,{method:"mining",requiredSkill:1}),
  m("Tigerseye","tiger-copper","Durotar / The Barrens","Copper Veins",
    "Occasional Mining bonus from Copper Veins. Requires Mining skill, not Skinning.",
    sourceGems,{method:"mining",requiredSkill:1}),
  // Forever-specific materials: the item page records observed loot and community
  // comments, but sample rates/older Classic comments are NOT live-server guarantees.
  m("Pristine Leather","pristine-riverglades","Riverglades","Rare-material vendor (exact NPC unverified)",
    "Wowhead Forever lists Pristine Leather as purchasable in Riverglades. Check the vendor and your gold before traveling; the item can be scarce and player comments about prices may be outdated.",
    "https://www.wowhead.com/forever/item=249427/pristine-leather",
    {method:"vendor",evidence:"wowhead-item-page"}),
  m("Pristine Leather","pristine-zhevra","The Barrens","Zhevra Charger (levels 17–18)",
    "Wowhead Forever lists this as an extremely rare drop from these beasts. Loot then skin. The item is scarce; many kills may produce none. Don't substitute a made-up per-hour rate.",
    "https://www.wowhead.com/forever/item=249427/pristine-leather",
    {method:"skinning",minMob:17,maxMob:18,evidence:"forever-reported"}),
  m("Pristine Leather","pristine-moonrage","Silverpine Forest","Moonrage Darkrunner (levels 11–12)",
    "Listed among Pristine Leather drop sources on Wowhead Forever. Very low observed frequency; some player comments instead describe obtaining it by skinning worgen.",
    "https://www.wowhead.com/forever/item=249427/pristine-leather",
    {method:"skinning",minMob:11,maxMob:12,evidence:"forever-reported"}),
  m("Pristine Leather","pristine-wc","The Barrens → Wailing Caverns","Deviate beasts near/inside the cave",
    "Players report rare Pristine Leather from skinning Wailing Caverns beasts. This is a Forever-specific item and must not be treated like routine Light Leather.",
    "https://www.wowhead.com/forever/item=249427/pristine-leather",
    {method:"skinning",minMob:17,maxMob:24,waypoint:"/way The Barrens 46.0 36.3",evidence:"forever-reported"}),
  m("Pristine Hide","pristine-kraul","The Barrens → Razorfen Kraul","Kraul Bat / Greater Kraul Bat (levels 30–32 elites)",
    "The Wowhead Forever item page lists observed rare drops from both Kraul Bat types. The sample rates are very low, and this is NOT a gray-level farm at level 34.",
    "https://www.wowhead.com/forever/item=249428/pristine-hide",
    {method:"dungeon",minMob:30,maxMob:32,evidence:"forever-reported"}),
  m("Pristine Hide","pristine-bfd","Ashenvale → Blackfathom Deeps","Aku'mai Snapjaw (levels 26–27 elites)",
    "Rare reported item source in the Forever item table. Low sample frequency, not guaranteed; check mob color before pulling.",
    "https://www.wowhead.com/forever/item=249428/pristine-hide",
    {method:"dungeon",minMob:26,maxMob:27,evidence:"forever-reported"}),
  m("Light Hide","light-hide-silverpine","Silverpine Forest","Moonrage worgen / Grizzly Bears",
    "A historical community report on Wowhead Forever lists skinning these creatures for Light Hide. Fully loot before skinning; not confirmed on the current Forever patch.",
    "https://www.wowhead.com/forever/item=783/light-hide",
    {method:"skinning"}),
  m("Medium Hide","medium-hide-stonetalon","Stonetalon Mountains","Blackened Basilisk",
    "A historical player report on the Forever item page cites skinning Blackened Basilisks. Rare hide outcome; the exact current spawn and drop chance aren't verified.",
    "https://www.wowhead.com/forever/item=4232/medium-hide",
    {method:"skinning"}),
  m("Spider's Silk","silk-deepmoss","Stonetalon Mountains","Deepmoss Spiders",
    "A historical Leatherworking farmer recommends Deepmoss spiders as a Spider's Silk hotspot. Uncommon drop; the Forever page includes older Classic comments, not live confirmation.",
    "https://www.wowhead.com/forever/item=3182/spiders-silk"),
  m("Small Lustrous Pearl","pearl-hillsbrad","Hillsbrad Foothills","Naga on the southeast coast by Southshore",
    "Loot clams dropped by naga, then OPEN the clams for a chance at Small Lustrous Pearl. Historical source noted on Wowhead Forever; Horde travel is easier from Tarren Mill, but avoid guards.",
    "https://www.wowhead.com/forever/item=5498/small-lustrous-pearl"),
  m("Iridescent Pearl","pearl-wetlands","Wetlands","Coastal murlocs dropping clams",
    "Kill coastal murlocs, loot their clams and open them. Iridescent Pearls are a low-chance clam content. This area involves Alliance travel; the page records older player experiences.",
    "https://www.wowhead.com/forever/item=5500/iridescent-pearl"),
  m("Elemental Earth","earth-arathi","Arathi Highlands","Earth elementals near Circle of Inner Binding",
    "Historical Wowhead reports cite the elementals around this region. Expect XP at level 34, as these aren't a verified gray-mob route. No guaranteed yield.",
    "https://www.wowhead.com/forever/item=7067/elemental-earth",
    {waypoint:"/way Arathi Highlands 35 58"}),
  m("Deeprock Salt","deeprock-badlands","Badlands","Rock / Lesser Rock Elementals (approx. levels 39–40)",
    "Historical reports on the Forever item page mention Badlands rock elementals. Not XP-safe for your level 34 Hunter.",
    "https://www.wowhead.com/forever/item=8150/deeprock-salt",
    {waypoint:"/way Badlands 41 80",minMob:39,maxMob:40}),
  m("Elemental Water","water-stv","Stranglethorn Vale","Lesser Water Elementals (approx. levels 36–37)",
    "Historical Wowhead reports cite the water elementals off the northern Stranglethorn coast. These may award XP at level 34.",
    "https://www.wowhead.com/forever/item=7070/elemental-water",
    {minMob:36,maxMob:37}),
  m("Raptor Egg","egg-mottled","Wetlands","Mottled Screechers",
    "A historical Wowhead comment specifically recommends Mottled Screechers over Mottled Raptors for Raptor Eggs. Loot the corpses; rates on Forever may differ.",
    "https://www.wowhead.com/forever/item=3685/raptor-egg",
    {minMob:22,maxMob:27}),
  m("Thick Leather","thick-feralas","Feralas","Longtooth Runners (approx. levels 40–41)",
    "Historical skinning reports cite the Longtooth Runners. You will likely gain XP at level 34. Skinning yield is not guaranteed.",
    "https://www.wowhead.com/forever/item=4304/thick-leather",
    {method:"skinning",minMob:40,maxMob:41}),
  m("Rugged Leather","rugged-epl","Eastern Plaguelands","Frenzied Plaguehounds / Monstrous Plaguebats",
    "Historical skinning suggestions on the Forever item page. Much higher level than you currently are; do not attempt this as a level-34 farming route.",
    "https://www.wowhead.com/forever/item=8170/rugged-leather",
    {method:"skinning",minMob:55,maxMob:60}),
  m("Heavy Leather","heavy-stv","Stranglethorn Vale","Skinnable raptors and cats",
    "Classic-style skinning source; quality depends on mob level. The zone includes XP-awarding creatures at level 34, so check each enemy.",
    "https://www.wowhead.com/forever/item=4234/heavy-leather",
    {method:"skinning",minMob:30,maxMob:38}),
  m("Raptor Flesh","raptor-arathi-forever","Arathi Highlands","Raptors (approximately level 30+)",
    "Wowhead Forever's Raptor Flesh page includes older reports of farming raptors in Arathi. Skinning also yields leather; XP likely at level 34.",
    "https://www.wowhead.com/forever/item=12184/raptor-flesh",
    {method:"mob",minMob:30,maxMob:37})

];

/** Server-independent vendor zones from individual Wowhead Forever item pages. */
const FOREVER_VENDOR_MATERIALS = new Set<string>(WOWHEAD_FOREVER_HORDE_VENDOR_ITEMS);
const vendorRoute=(name:string,faction:"horde"|"alliance"):MaterialRoute|null=>{
  const url=wowheadForeverItemUrl(name);
  if(!url||!FOREVER_VENDOR_MATERIALS.has(name))return null;
  return m(name,"forever-vendor-"+name.toLowerCase().replace(/[^a-z0-9]+/g,"-"),
    faction==="horde"?"Orgrimmar / Undercity / Thunder Bluff":"Stormwind / Ironforge / Darnassus","Trade, leatherworking, tailoring or cooking supply merchant",
    "Wowhead Forever lists the supply in these "+(faction==="horde"?"Horde":"Alliance")+" cities. Check a local trade or profession supplier; exact NPC, current stock and travel distance are unverified.",
    url,{method:"vendor",evidence:"wowhead-item-page"});
};
/** A production route is derived only from an actual recipe in this site's client snapshot. */
const craftRoutes=(name:string):MaterialRoute[]=>WOW_RECIPES.filter(r=>r.name.toLowerCase()===name.toLowerCase())
  .map(r=>m(name,"craft-"+r.id,"Your "+r.profession+" profession",
    "Craft "+r.name,
    "Client-derived recipe uses "+r.reagents.map(x=>x.quantity+"× "+x.name).join(", ")+
    ". "+(r.learnAt===null?"Learn skill or availability is not confirmed; check your trainer/recipe.":
      "Learn skill "+r.learnAt+"; confirm the recipe is unlocked and produces the expected item in Forever.")+
    " Requires your profession, not a mob drop.",
    r.sourceUrl,{method:"crafting",evidence:"client-recipe"}));

/** All reagents in the existing client-snapshot recipes are searchable, even if no route is verified. */
export const ALL_RECIPE_MATERIALS = [...new Set(WOW_RECIPES.flatMap(r=>r.reagents.map(m=>m.name)))].sort((a,b)=>a.localeCompare(b));
export const materialRecipes = (name:string):{recipe:WowRecipe;quantity:number}[] =>
  WOW_RECIPES.flatMap(recipe=>recipe.reagents.filter(x=>x.name.toLowerCase()===name.toLowerCase())
    .map(reagent=>({recipe,quantity:reagent.quantity})));

export const materialRoutes = (name:string,faction:"horde"|"alliance"="horde"):MaterialRoute[] => {
  const exact=CURATED_MATERIAL_ROUTES.filter(r=>r.item.toLowerCase()===name.toLowerCase());
  const dungeon=WOW_DUNGEON_PROFESSION_DROPS.filter(d=>d.kind==="material"&&d.itemName.toLowerCase()===name.toLowerCase())
    .map(drop=>{
      const d=WOW_HUNTER_DUNGEONS.find(x=>x.id===drop.dungeonId);
      return m(name,"dungeon-"+drop.dungeonId,d?.region||"Dungeon",d?.name||drop.dungeonId,
        drop.source+". "+(drop.note||"Not a guaranteed material drop; see the dungeon guide."),
        drop.sourceUrl,{method:drop.method==="skin"?"skinning":"dungeon",evidence:drop.reliability==="forever-reported"?"forever-reported":"classic-reference"});
    });
  const vendor=vendorRoute(name,faction);
  const reviewed=reviewedMaterialRoutes(name,faction);
  return [...exact,...reviewed,...(vendor?[vendor]:[]),...craftRoutes(name),
    ...dungeon.filter(d=>!exact.some(r=>r.zone===d.zone&&r.target===d.target))];
};
/** The search link is a fallback, not a claim that a precise in-game farm is known. */
export const externalMaterialLookup = (name:string) =>
  "https://www.wowhead.com/forever/search?q="+encodeURIComponent(name);
