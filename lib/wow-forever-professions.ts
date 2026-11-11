/**
 * Small, source-linked WoW Forever profession starter catalog.
 *
 * Thresholds are from Forever client-derived recipe sources, NOT Classic Era.
 * "Yellow at" is the exclusive end of orange (guaranteed) skill-ups.
 * Green thresholds are estimates where the client does not publish them;
 * null means show a conservative "chance" state instead of guessing.
 *
 * Expand with individually verified recipes; never silently assume that
 * Classic availability, vendor stock, or auction prices match Forever.
 */
export const WOW_PROFESSIONS = [
  { id: "leatherworking", label: "Leatherworking", initial: 152 },
  { id: "skinning", label: "Skinning", initial: 222 },
  { id: "cooking", label: "Cooking", initial: 104 },
  { id: "first-aid", label: "First Aid", initial: 87 },
] as const;

export type WowProfessionId = (typeof WOW_PROFESSIONS)[number]["id"];
export type RecipeAcquisition = "kalimdor" | "auction" | "trainer";

export type WowRecipe = {
  id: string;
  profession: Exclude<WowProfessionId, "skinning">;
  name: string;
  learnAt: number;
  yellowAt: number;
  greenAt: number | null;
  grayAt: number;
  reagents: { name: string; quantity: number }[];
  acquisition: RecipeAcquisition;
  source: string;
  sourceUrl: string;
  waypoint?: string;
};

export const WOW_RECIPES: WowRecipe[] = [
  {
    id: "barbaric-leggings", profession: "leatherworking", name: "Barbaric Leggings",
    learnAt: 145, yellowAt: 165, greenAt: 175, grayAt: 185,
    reagents: [{ name: "Heavy Leather", quantity: 10 }, { name: "Fine Thread", quantity: 2 }, { name: "Moss Agate", quantity: 1 }],
    acquisition: "kalimdor",
    source: "Pattern: Barbaric Leggings — Jandia, Freewind Post (Thousand Needles). Vendor stock can vary.",
    waypoint: "/way Thousand Needles 46.2 51.5",
    sourceUrl: "https://theforeverera.com/en/recipes/leatherworking/barbaric-leggings/",
  },
  {
    id: "guardian-belt", profession: "leatherworking", name: "Guardian Belt",
    learnAt: 145, yellowAt: 165, greenAt: 175, grayAt: 185,
    reagents: [{ name: "Cured Heavy Hide", quantity: 2 }, { name: "Heavy Leather", quantity: 4 }, { name: "Fine Thread", quantity: 1 }, { name: "Iron Buckle", quantity: 1 }],
    acquisition: "auction",
    source: "Pattern: Guardian Belt — check your Auction House for a Kalimdor-accessible copy; availability is not guaranteed.",
    sourceUrl: "https://theforeverera.com/en/recipes/leatherworking/guardian-belt/",
  },
  {
    id: "raptor-hide-harness", profession: "leatherworking", name: "Raptor Hide Harness",
    learnAt: 140, yellowAt: 160, greenAt: 170, grayAt: 180,
    reagents: [{ name: "Raptor Hide", quantity: 6 }, { name: "Heavy Leather", quantity: 4 }, { name: "Fine Thread", quantity: 2 }],
    acquisition: "auction",
    source: "Pattern: Raptor Hide Harness — check your Auction House; original vendor routes may require leaving Kalimdor.",
    sourceUrl: "https://theforeverera.com/en/recipes/leatherworking/raptor-hide-harness/",
  },
  {
    id: "raptor-hide-belt", profession: "leatherworking", name: "Raptor Hide Belt",
    learnAt: 140, yellowAt: 160, greenAt: 170, grayAt: 180,
    reagents: [{ name: "Raptor Hide", quantity: 4 }, { name: "Heavy Leather", quantity: 4 }, { name: "Fine Thread", quantity: 2 }],
    acquisition: "auction",
    source: "Pattern: Raptor Hide Belt — look on your Auction House; vendor source is in Arathi Highlands.",
    sourceUrl: "https://theforeverera.com/en/recipes/leatherworking/raptor-hide-belt/",
  },
  {
    id: "strider-stew", profession: "cooking", name: "Strider Stew",
    learnAt: 50, yellowAt: 90, greenAt: 110, grayAt: 130,
    reagents: [{ name: "Strider Meat", quantity: 1 }, { name: "Shiny Red Apple", quantity: 1 }],
    acquisition: "kalimdor",
    source: "Recipe: Strider Stew — Tari'qa at The Crossroads, The Barrens.",
    waypoint: "/way The Barrens 51.6 30.0",
    sourceUrl: "https://theforeverera.com/en/items/5477/",
  },
  {
    id: "crispy-lizard-tail", profession: "cooking", name: "Crispy Lizard Tail",
    learnAt: 100, yellowAt: 140, greenAt: 160, grayAt: 180,
    reagents: [{ name: "Thunder Lizard Tail", quantity: 1 }, { name: "Hot Spices", quantity: 1 }],
    acquisition: "kalimdor",
    source: "Recipe: Crispy Lizard Tail — Tari'qa at The Crossroads, The Barrens.",
    waypoint: "/way The Barrens 51.6 30.0",
    sourceUrl: "https://www.foreverdb.app/en/forever/spells/6418/crispy-lizard-tail",
  },
  {
    id: "roast-raptor", profession: "cooking", name: "Roast Raptor",
    learnAt: 175, yellowAt: 215, greenAt: 235, grayAt: 255,
    reagents: [{ name: "Raptor Flesh", quantity: 1 }, { name: "Hot Spices", quantity: 1 }],
    acquisition: "kalimdor",
    source: "Recipe: Roast Raptor — Kalimdor vendors; verify current stock or check your Auction House.",
    sourceUrl: "https://theforeverera.com/en/items/12210/",
  },
  {
    id: "wool-bandage", profession: "first-aid", name: "Wool Bandage",
    learnAt: 80, yellowAt: 115, greenAt: null, grayAt: 150,
    reagents: [{ name: "Wool Cloth", quantity: 1 }],
    acquisition: "trainer",
    source: "First Aid trainer — skill 80. Green transition not verified: check its in-game color after 114.",
    sourceUrl: "https://theforeverera.com/en/recipes/first-aid/wool-bandage/",
  },
  {
    id: "heavy-wool-bandage", profession: "first-aid", name: "Heavy Wool Bandage",
    learnAt: 115, yellowAt: 150, greenAt: null, grayAt: 185,
    reagents: [{ name: "Wool Cloth", quantity: 2 }],
    acquisition: "trainer",
    source: "First Aid trainer — skill 115. Green transition not verified: check the game.",
    sourceUrl: "https://theforeverera.com/en/recipes/first-aid/heavy-wool-bandage/",
  },
];

export const professionField = (gameId: string, id: string) => gameId + "|profession-" + id;
export const recipeLearnedKey = (gameId: string, id: string) => gameId + "|learned-recipe|" + id;

export type RecipeStatus = "locked" | "orange" | "yellow" | "green" | "chance" | "gray";

export function recipeStatus(recipe: WowRecipe, skill: number): RecipeStatus {
  if (skill < recipe.learnAt) return "locked";
  if (skill < recipe.yellowAt) return "orange";
  if (skill >= recipe.grayAt) return "gray";
  if (recipe.greenAt === null) return "chance";
  if (skill < recipe.greenAt) return "yellow";
  return "green";
}
