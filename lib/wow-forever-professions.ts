/**
 * WoW Forever recipe planner data contract.
 *
 * The factual recipe catalog comes from a game-client snapshot in
 * wow-forever-recipe-catalog.json (build and provenance in metadata).
 * Vendor whereabouts are curated annotations, not verified live stock.
 */
import catalog from "./wow-forever-recipe-catalog.json";

export const WOW_PROFESSIONS = [
  { id: "leatherworking", label: "Leatherworking", initial: 152 },
  { id: "skinning", label: "Skinning", initial: 222 },
  { id: "cooking", label: "Cooking", initial: 104 },
  { id: "first-aid", label: "First Aid", initial: 87 },
] as const;

export type WowProfessionId = (typeof WOW_PROFESSIONS)[number]["id"];
export type RecipeAcquisition = "trainer" | "pattern" | "unknown";
export type SourceLocation = {
  continent: "kalimdor" | "eastern-kingdoms";
  zone: string;
  npc: string;
  faction: "horde" | "alliance" | "neutral";
  x: number;
  y: number;
  verification: string;
};

export type WowRecipe = {
  id: string;
  spellId: number;
  profession: Exclude<WowProfessionId, "skinning">;
  name: string;
  group: string;
  learnAt: number | null;
  yellowAt: number;
  greenAt: number | null;
  grayAt: number;
  reagents: { name: string; quantity: number }[];
  acquisition: RecipeAcquisition;
  source: string;
  sourceUrl: string;
  sourceLocations: SourceLocation[];
  newInForever: boolean;
  itemId: number | null;
  category: string;
  recipeItemBoP: boolean;
};

export const WOW_RECIPES = catalog.recipes as WowRecipe[];
export const WOW_RECIPE_CATALOG = catalog.metadata;

export const professionField = (gameId: string, id: string) => gameId + "|profession-" + id;
export const recipeLearnedKey = (gameId: string, id: string) => gameId + "|learned-recipe|" + id;

export type RecipeStatus = "locked" | "orange" | "yellow" | "green" | "chance" | "gray";
export function recipeStatus(recipe: WowRecipe, skill: number): RecipeStatus {
  if (recipe.learnAt !== null && skill < recipe.learnAt) return "locked";
  if (skill >= recipe.grayAt) return "gray";
  if (skill < recipe.yellowAt) return "orange";
  if (recipe.greenAt === null) return "chance";
  if (skill < recipe.greenAt) return "yellow";
  return "green";
}
