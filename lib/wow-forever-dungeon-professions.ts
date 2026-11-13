/**
 * Curated WoW Forever dungeon profession drops.
 *
 * Pattern entries are REPORTS from dated community acquisition listings, not guaranteed loot.
 * Generic material sources use Classic-baseline mob families/cloth levels and may differ in Forever.
 * Do not invent drop rates, boss assignments, or sources for new custom instances.
 */
import { WOW_RECIPES, type WowProfessionId, type WowRecipe } from "./wow-forever-professions";

export type DungeonProfessionDrop = {
  id: string;
  dungeonId: string;
  itemName: string;
  kind: "pattern" | "material";
  professions: WowProfessionId[];
  source: string;
  method: "boss" | "mob" | "skin" | "loot";
  reliability: "forever-reported" | "classic-reference";
  sourceUrl: string;
  note?: string;
  recipe?: WowRecipe;
};

const lwSource = "https://www.zockify.com/forever/professions/leatherworking/recipes/";
const cookSource = "https://www.zockify.com/forever/professions/cooking/recipes/";
const clothSource = "https://www.wowhead.com/classic/guide/classic-cloth-farming-linen-wool";
const higherClothSource = "https://www.wowhead.com/classic/guide/classic-cloth-farming-silk-mageweave-runecloth-felcloth";
const scaleSource = "https://www.wowhead.com/classic/guide/classic-leather-farming-specialty-scales";
const skinSource = "https://www.wowhead.com/classic/guide/classic-leather-farming-early-leather";

/** Specific pattern / blueprint drop reports, with a named boss only where documented. */
const reportedPatterns: { recipe: string; dungeon: string; from: string; note?: string }[] = [
  {recipe:"Wisdom's Leather Gloves",dungeon:"ragefire",from:"Oggleflint, Taragaman the Hungerer or Bazzalan"},
  {recipe:"Stormrider's Leather Gloves",dungeon:"ragefire",from:"Oggleflint"},
  {recipe:"Totemic Leather Gloves",dungeon:"ragefire",from:"Bazzalan"},

  {recipe:"Stormrider's Leather Gloves",dungeon:"wailing",from:"Deviate Faerie Dragon"},
  {recipe:"Trapper's Leather Gloves",dungeon:"wailing",from:"Lord Cobrahn (and other reported drops)"},
  {recipe:"Trapper's Leather Hood",dungeon:"wailing",from:"Dungeon drop; specific creature unconfirmed",
    note:"Reported in Forever recipe data, but the boss/mob was not identified."},
  {recipe:"Journeyman Campfire",dungeon:"wailing",from:"Lord Serpentis"},

  {recipe:"Wisdom's Leather Gloves",dungeon:"deadmines",from:"Gilnid or Mr. Smite"},
  {recipe:"Stormrider's Leather Gloves",dungeon:"deadmines",from:"Mr. Smite"},
  {recipe:"Totemic Leather Gloves",dungeon:"deadmines",from:"Gilnid or Mr. Smite"},
  {recipe:"Defender's Leather Gloves",dungeon:"deadmines",from:"Mr. Smite or Cookie"},
  {recipe:"Trapper's Leather Gloves",dungeon:"deadmines",from:"Gilnid or Cookie"},
  {recipe:"Brawler's Leather Gloves",dungeon:"deadmines",from:"Gilnid"},
  {recipe:"Wisdom's Leather Hood",dungeon:"deadmines",from:"Edwin VanCleef"},
  {recipe:"Totemic Leather Hood",dungeon:"deadmines",from:"Edwin VanCleef"},
  {recipe:"Defender's Leather Hood",dungeon:"deadmines",from:"Edwin VanCleef"},
  {recipe:"Trapper's Leather Hood",dungeon:"deadmines",from:"Edwin VanCleef"},
  {recipe:"Murloc Scale Belt",dungeon:"deadmines",from:"Defias Squallshaper (reported pattern source)"},
  {recipe:"Murloc Scale Breastplate",dungeon:"deadmines",from:"Defias Pirate (reported pattern source)"},

  {recipe:"Toxin Study",dungeon:"shadowfang",from:"Commander Springvale",
    note:"First Aid blueprint; reported source, check current Forever loot table."},
  {recipe:"Tanning Rack",dungeon:"shadowfang",from:"Razorclaw the Butcher",
    note:"Special Leatherworking camping blueprint; reported low drop chance."},
  {recipe:"Wisdom's Leather Gloves",dungeon:"shadowfang",from:"Fel Steed / Shadow Charger"},
  {recipe:"Stormrider's Leather Gloves",dungeon:"shadowfang",from:"Fel Steed / Shadow Charger"},
  {recipe:"Wisdom's Leather Hood",dungeon:"shadowfang",from:"Fel Steed / Shadow Charger"},
  {recipe:"Totemic Leather Hood",dungeon:"shadowfang",from:"Fel Steed / Shadow Charger"},
  {recipe:"Trapper's Leather Hood",dungeon:"shadowfang",from:"Fel Steed / Shadow Charger"},

  {recipe:"Brawler's Leather Hood",dungeon:"blackfathom",from:"Lady Sarevess"},
  {recipe:"Stormrider's Leather Hood",dungeon:"blackfathom",from:"Ghamoo-ra"},
  {recipe:"Totemic Leather Hood",dungeon:"blackfathom",from:"Ghamoo-ra"},
  {recipe:"Wisdom's Leather Leggings",dungeon:"blackfathom",from:"Gelihast, Old Serra'kis or Twilight Lord Kelris"},
  {recipe:"Stormrider's Leather Kilt",dungeon:"blackfathom",from:"Aku'mai"},
  {recipe:"Totemic Leather Leggings",dungeon:"blackfathom",from:"Twilight Lord Kelris"},
  {recipe:"Defender's Leather Kilt",dungeon:"blackfathom",from:"Baron Aquanis or Twilight Lord Kelris"},
  {recipe:"Trapper's Leather Legguards",dungeon:"blackfathom",from:"Gelihast, Aku'mai or Twilight Lord Kelris"},
  {recipe:"Brawler's Leather Legguards",dungeon:"blackfathom",from:"Gelihast or Twilight Lord Kelris"},

  {recipe:"Defender's Leather Kilt",dungeon:"razorfen-kraul",from:"Aggem Thorncurse, Death Speaker Jargba or Overlord Ramtusk"},
  {recipe:"Trapper's Leather Legguards",dungeon:"razorfen-kraul",from:"Overlord Ramtusk"},
  {recipe:"Brawler's Leather Legguards",dungeon:"razorfen-kraul",from:"Aggem Thorncurse"},

  {recipe:"Defender's Leather Kilt",dungeon:"gnomeregan",from:"Electrocutioner 6000"},
  {recipe:"Brawler's Leather Legguards",dungeon:"gnomeregan",from:"Dark Iron Ambassador"},

  {recipe:"Defender's Leather Kilt",dungeon:"sm-graveyard",from:"Bloodmage Thalnos"},
  {recipe:"Brawler's Leather Legguards",dungeon:"sm-graveyard",from:"Interrogator Vishas, Fallen Champion or Ironspine",
    note:"Fallen Champion and Ironspine are rare spawns."}
];

const recipeByName = new Map(WOW_RECIPES.map(r=>[r.name,r]));
export const WOW_DUNGEON_PATTERN_DROPS: DungeonProfessionDrop[] = reportedPatterns.flatMap(entry=>{
  const recipe=recipeByName.get(entry.recipe);
  // Data changes should cause automated audits to catch missing client recipes;
  // never show an unlinked item as automatically learnable.
  if (!recipe) return [];
  return [{
    id:entry.dungeon+"|pattern|"+recipe.id,
    dungeonId:entry.dungeon,
    itemName:"Pattern / Blueprint: "+recipe.name,
    kind:"pattern" as const,
    professions:[recipe.profession] as WowProfessionId[],
    source:entry.from,
    method:(/Fel Steed|Faerie Dragon|Defias |Dungeon drop/.test(entry.from)?"mob":"boss") as "mob"|"boss",
    reliability:"forever-reported" as const,
    sourceUrl:recipe.profession==="cooking"?cookSource:lwSource,
    note:entry.note,
    recipe
  }];
});

/** Named raw reagents from Classic-style looting/skinning. Not every enemy yields these. */
const materials: {
 dungeon:string; name:string; professions:WowProfessionId[];
 from:string; method:"mob"|"skin"|"loot"; sourceUrl:string; note?:string;
}[] = [
 {dungeon:"ragefire",name:"Linen Cloth",professions:["first-aid"],from:"Eligible humanoid cultists and troggs",method:"loot",sourceUrl:clothSource,
   note:"Check the enemy loot type. Cloth is not a guaranteed drop from every creature."},
 {dungeon:"wailing",name:"Light Leather",professions:["skinning","leatherworking"],from:"Skinnable Deviate beasts",method:"skin",sourceUrl:skinSource},
 {dungeon:"wailing",name:"Medium Leather",professions:["skinning","leatherworking"],from:"Skinnable Deviate beasts",method:"skin",sourceUrl:skinSource,
   note:"Some beasts yield Light Leather instead."},
 {dungeon:"wailing",name:"Deviate Scale",professions:["skinning","leatherworking"],from:"Deviate creatures, including cave approach",method:"skin",sourceUrl:scaleSource,
   note:"Can also appear as loot; the entrance cave may be worthwhile even without entering the instance."},
 {dungeon:"wailing",name:"Perfect Deviate Scale",professions:["skinning","leatherworking"],from:"Deviate creatures, including cave approach",method:"skin",sourceUrl:scaleSource,
   note:"Uncommon. Keep for Leatherworking or check auction prices."},
 {dungeon:"deadmines",name:"Linen Cloth",professions:["first-aid"],from:"Eligible Defias humanoids",method:"loot",sourceUrl:clothSource},
 {dungeon:"deadmines",name:"Wool Cloth",professions:["first-aid"],from:"Eligible higher-level Defias humanoids",method:"loot",sourceUrl:clothSource},
 {dungeon:"shadowfang",name:"Wool Cloth",professions:["first-aid"],from:"Eligible humanoid/undead enemies",method:"loot",sourceUrl:clothSource},
 {dungeon:"blackfathom",name:"Wool Cloth",professions:["first-aid"],from:"Eligible Twilight cultist humanoids, not naga",method:"loot",sourceUrl:clothSource,
   note:"Do not expect cloth from naga or every other dungeon mob."},
 {dungeon:"gnomeregan",name:"Wool Cloth",professions:["first-aid"],from:"Eligible humanoid enemies",method:"loot",sourceUrl:clothSource},
 {dungeon:"gnomeregan",name:"Silk Cloth",professions:["first-aid","leatherworking"],from:"Higher-level eligible humanoids",method:"loot",sourceUrl:higherClothSource,
   note:"Variable yield; lower-level enemies may drop Wool instead."},
 {dungeon:"razorfen-kraul",name:"Boar Ribs",professions:["cooking"],from:"Raging Agam'ar or Rotting Agam'ar",method:"loot",sourceUrl:"https://www.wowhead.com/classic/item=2677/boar-ribs",
   note:"Reported on Agam'ar beasts; loot is not guaranteed."},
 {dungeon:"razorfen-kraul",name:"Silk Cloth",professions:["first-aid","leatherworking"],from:"Quilboar humanoid enemies",method:"loot",sourceUrl:higherClothSource},
 {dungeon:"sm-graveyard",name:"Silk Cloth",professions:["first-aid","leatherworking"],from:"Eligible Scarlet humanoid enemies",method:"loot",sourceUrl:higherClothSource},
 {dungeon:"sm-library",name:"Silk Cloth",professions:["first-aid","leatherworking"],from:"Scarlet humanoid enemies",method:"loot",sourceUrl:higherClothSource},
 {dungeon:"sm-armory",name:"Silk Cloth",professions:["first-aid","leatherworking"],from:"Scarlet humanoid enemies",method:"loot",sourceUrl:higherClothSource},
 {dungeon:"sm-cathedral",name:"Silk Cloth",professions:["first-aid","leatherworking"],from:"Scarlet humanoids (level-dependent)",method:"loot",sourceUrl:higherClothSource},
 {dungeon:"sm-cathedral",name:"Mageweave Cloth",professions:["first-aid"],from:"Higher-level Scarlet humanoids (level-dependent)",method:"loot",sourceUrl:higherClothSource},
 {dungeon:"razorfen-downs",name:"Silk Cloth",professions:["first-aid","leatherworking"],from:"Eligible quilboar/undead enemies",method:"loot",sourceUrl:higherClothSource},
 {dungeon:"razorfen-downs",name:"Mageweave Cloth",professions:["first-aid"],from:"Higher-level eligible enemies",method:"loot",sourceUrl:higherClothSource},
 {dungeon:"uldaman",name:"Mageweave Cloth",professions:["first-aid"],from:"Eligible Shadowforge/Dark Iron humanoids",method:"loot",sourceUrl:higherClothSource},
 {dungeon:"zulfarrak",name:"Mageweave Cloth",professions:["first-aid"],from:"Sandfury troll humanoids",method:"loot",sourceUrl:higherClothSource},
 {dungeon:"blackrock-depths",name:"Mageweave Cloth",professions:["first-aid"],from:"Eligible lower-level Dark Iron humanoids",method:"loot",sourceUrl:higherClothSource},
 {dungeon:"blackrock-depths",name:"Runecloth",professions:["first-aid"],from:"Eligible higher-level humanoids",method:"loot",sourceUrl:higherClothSource},
 {dungeon:"scholomance",name:"Runecloth",professions:["first-aid"],from:"Eligible undead and humanoid mobs",method:"loot",sourceUrl:higherClothSource},
 {dungeon:"stratholme",name:"Runecloth",professions:["first-aid"],from:"Eligible undead mobs",method:"loot",sourceUrl:higherClothSource},
 {dungeon:"lower-blackrock-spire",name:"Runecloth",professions:["first-aid"],from:"Eligible orc humanoids",method:"loot",sourceUrl:higherClothSource},
 {dungeon:"dire-maul",name:"Runecloth",professions:["first-aid"],from:"Eligible humanoid/satyr mobs",method:"loot",sourceUrl:higherClothSource}
];

export const WOW_DUNGEON_PROFESSION_DROPS: DungeonProfessionDrop[] = [
  ...WOW_DUNGEON_PATTERN_DROPS,
  ...materials.map(m=>({
    id:m.dungeon+"|material|"+m.name.toLowerCase().replace(/[^a-z0-9]+/g,"-"),
    dungeonId:m.dungeon,itemName:m.name,kind:"material" as const,
    professions:m.professions,source:m.from,method:m.method,
    reliability:"classic-reference" as const,sourceUrl:m.sourceUrl,note:m.note
  }))
];

export const dungeonProfessionDrops = (dungeonId:string) =>
  WOW_DUNGEON_PROFESSION_DROPS.filter(x=>x.dungeonId===dungeonId);
