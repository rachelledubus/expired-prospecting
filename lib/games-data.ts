// Game progression checklists for the /games planner page.
// To add a game: append one object to GAMES. It gets its own chip on the page and its own saved progress.
// Phases and boxes are matched to saved progress by text, so renaming a box un-checks it.

export type GameGroup = {
  label: string;
  note?: string;
  items: string[];
  after?: string;
  /** A fill-in blank shown above the boxes, e.g. which character you picked. */
  field?: string;
  /** A short "how to trigger it" line shown under an item, keyed by the exact item text. Hidden once the box is checked. */
  how?: Record<string, string>;
  /** Items the roadmap does not show because the quest board or the Community Center tab already tracks them. */
  hidden?: string[];
};

export type GamePhase = {
  id: string;
  title: string;
  when: string;
  callout?: { lead: string; text: string };
  groups: GameGroup[];
  footer?: { warn?: boolean; lead: string; text: string };
};

export type GameQuestBucket = "deadline" | "now" | "toward" | "waiting";
export type GameImportance = "required" | "recommended" | "optional";

export type GameQuestStep = {
  id: string;
  label: string;
  how?: string;
  location?: string;
  reward?: string;
  why?: string;
  bucket: GameQuestBucket;
  priority?: number;
  importance?: GameImportance;
  /** Calendar-only gate. Story prerequisites belong in requires. */
  gate?: {
    year?: number;
    seasons?: string[];
    minDay?: number;
    maxDay?: number;
    minTotalDay?: number;
    weather?: ("sunny" | "rain" | "storm" | "snow")[];
  };
  /** Other quest-board steps that must be checked first, formatted as storylineId:stepId. */
  requires?: string[];
  unlock?: string;
  /** Reuse an existing phase checkbox so old progress is preserved. */
  legacy?: { phaseId: string; groupLabel: string; text: string };
};

export type GameStoryline = {
  id: string;
  title: string;
  mod: string;
  note?: string;
  importance?: GameImportance;
  steps: GameQuestStep[];
};

export type ProgressionItem = {
  label: string;
  why?: string;
  ref: { gameId: string; phaseId: string; groupLabel: string; text: string };
};

export type ProgressionSection = {
  id: string;
  title: string;
  note?: string;
  items: ProgressionItem[];
};

export type GameQuestBoard = {
  storylines: GameStoryline[];
};

/** A checklist with a live quest board plus a long-term roadmap. */
export type ChecklistGame = {
  kind: "checklist";
  id: string;
  tab: string;
  title: string;
  mods: string;
  saveLabel: string;
  saveDefault: string;
  rule: { text: string; notLabel: string; not: string[] };
  /** Live, non-linear quest board: the main play direction. The phases below are only a folded long-term roadmap. */
  questBoard: GameQuestBoard;
  /** General how-tos shown on the page: how events trigger, and what to do with a finished day. */
  guide: { events: string[]; early: string[] };
  phases: GamePhase[];
};

export const SEASONS = ["Spring", "Summer", "Fall", "Winter"] as const;
export type Season = (typeof SEASONS)[number];

export type BundleItem = {
  name: string;
  /** Only needed when two slots in one bundle share a name, e.g. two stacks of Wood. */
  id?: string;
  qty?: number;
  quality?: string;
  /** Seasons this item can be gotten in, or "any" for year-round. */
  seasons: Season[] | "any";
  note?: string;
};

export type Bundle = {
  id: string;
  room: string;
  name: string;
  /** How many of the items must be given. Equal to items.length when every item is required. */
  need: number;
  items: BundleItem[];
};

/** A bundle tracker: items are grouped by the season they can be gotten in. */
export type BundleGame = {
  kind: "bundles";
  id: string;
  tab: string;
  title: string;
  mods: string;
  defaultSeason: Season;
  rooms: string[];
  bundles: Bundle[];
  footnotes: string[];
  progression?: ProgressionSection[];
};

export type CompletionCategory = {
  id: string;
  title: string;
  defaultTotal: number;
  unit: string;
  note?: string;
  sourceHint?: string;
};

export type CompletionSection = {
  id: string;
  title: string;
  note?: string;
  categories: CompletionCategory[];
};

export type CompletionGame = {
  kind: "completion";
  id: string;
  tab: string;
  title: string;
  mods: string;
  sections: CompletionSection[];
};

export type Game = ChecklistGame | BundleGame | CompletionGame;

export type GameProgress = {
  checks: Record<string, true>;
  fields: Record<string, string>;
};

/** A change to saved progress. checks: true sets a box, false clears it. reset wipes the game first. */
export type GameProgressPatch = {
  reset?: boolean;
  checks?: Record<string, boolean>;
  fields?: Record<string, string>;
};

export const emptyProgress = (): GameProgress => ({ checks: {}, fields: {} });

export const itemKey = (gameId: string, phaseId: string, groupLabel: string, text: string) =>
  [gameId, phaseId, groupLabel, text].join("|");
export const questKey = (gameId: string, storylineId: string, stepId: string) =>
  [gameId, "quest", storylineId, stepId].join("|");
export const fieldKey = (gameId: string, phaseId: string, name: string) => `${gameId}|${phaseId}|field|${name}`;
export const saveKey = (gameId: string) => `${gameId}|save`;
export const weatherKey = (gameId: string) => `${gameId}|weather`;
export const mainQuestKey = (gameId: string) => `${gameId}|main-quest`;

export const seasonKey = (gameId: string) => `${gameId}|season`;
export const bundleItemKey = (gameId: string, bundleId: string, item: BundleItem) =>
  [gameId, bundleId, item.id ?? item.name].join("|");
export const completionCountKey = (gameId: string, categoryId: string) => `${gameId}|completion|${categoryId}|count`;
export const completionTotalKey = (gameId: string, categoryId: string) => `${gameId}|completion|${categoryId}|total`;
export const completionTargetsKey = (gameId: string, categoryId: string) => `${gameId}|completion|${categoryId}|targets`;

export const isBundleGame = (game: Game): game is BundleGame => game.kind === "bundles";
export const isCompletionGame = (game: Game): game is CompletionGame => game.kind === "completion";

/** Every box key a game can have, used to reject anything else on save. */
export function knownCheckKeys(game: Game): Set<string> {
  const keys = new Set<string>();
  if (isCompletionGame(game)) return keys;
  if (isBundleGame(game)) {
    game.bundles.forEach((b) => b.items.forEach((i) => keys.add(bundleItemKey(game.id, b.id, i))));
    return keys;
  }
  game.questBoard.storylines.forEach((story) =>
    story.steps.forEach((step) => {
      if (!step.legacy) keys.add(questKey(game.id, story.id, step.id));
    }),
  );
  game.phases.forEach((p) =>
    p.groups.forEach((g) => g.items.forEach((t) => keys.add(itemKey(game.id, p.id, g.label, t)))),
  );
  return keys;
}

/** Every text-field key a game can have. */
export function knownFieldKeys(game: Game): Set<string> {
  if (isCompletionGame(game)) {
    const keys = new Set<string>();
    game.sections.forEach((section) =>
      section.categories.forEach((category) => {
        keys.add(completionCountKey(game.id, category.id));
        keys.add(completionTotalKey(game.id, category.id));
        keys.add(completionTargetsKey(game.id, category.id));
      }),
    );
    return keys;
  }
  if (isBundleGame(game)) return new Set<string>([seasonKey(game.id)]);
  const keys = new Set<string>([saveKey(game.id), weatherKey(game.id), mainQuestKey(game.id)]);
  game.phases.forEach((p) => p.groups.forEach((g) => g.field && keys.add(fieldKey(game.id, p.id, g.field))));
  return keys;
}

// Community Center, standard (not remixed) bundles. Item lists come from the Stardew Valley Wiki and two
// community guides. Fish and foraging seasons were each checked against that item's wiki page. Crop seasons
// are the base game ones. Renaming an item un-checks it, same as the other checklists.
const S = (...seasons: Season[]): Season[] => seasons;
const ANY = "any" as const;

const communityCenter: BundleGame = {
  kind: "bundles",
  id: "community-center",
  tab: "Farm & Progression",
  title: "Stardew — Farm & Progression",
  mods: "Community Center • tools • mining • farm infrastructure",
  defaultSeason: "Spring",
  rooms: ["Crafts Room", "Pantry", "Fish Tank", "Boiler Room", "Bulletin Board", "Vault"],
  footnotes: [
    "These are the standard bundles. Remixed bundles use different items.",
    "Seasons are the base game seasons. The Greenhouse grows crops all year, and Ginger Island lets you catch some fish in any season.",
    "Several fish need rain or a time of day. The note under each fish says where to find it and when.",
    "Crab pots unlock at Fishing level 3 and need bait every day. Fruit trees need a clear 3 by 3 patch of ground.",
    "The notes use base game locations and shop prices. Mods can change a few of them.",
    "If a bundle needs fewer items than it lists, finishing it hides the rest.",
  ],
  progression: [
    {
      id: "story-unlocks",
      title: "Story-relevant unlocks",
      note: "These only surface because they unlock or materially support a storyline.",
      items: [
        {
          label: "Upgrade Axe to Steel",
          why: "Unlocks the north entrance from The Ridge into Ridge Forest.",
          ref: { gameId: "stardew-mega-mod", phaseId: "p4", groupLabel: "Farm Infrastructure", text: "Upgrade Axe to Steel" },
        },
        {
          label: "Reach Mine Floor 120",
          why: "Finishes the regular Mines and gives the Skull Key.",
          ref: { gameId: "stardew-mega-mod", phaseId: "p3", groupLabel: "Mining Progression", text: "Reach Mine Floor 120" },
        },
        {
          label: "Obtain the Skull Key",
          why: "Unlocks Skull Cavern once the bus is repaired.",
          ref: { gameId: "stardew-mega-mod", phaseId: "p3", groupLabel: "Mining Progression", text: "Obtain the Skull Key" },
        },
      ],
    },
    {
      id: "tools-mining",
      title: "Tools & mining",
      note: "Support goals, not mandatory daily chores.",
      items: [
        {
          label: "Reach Mine Floor 40",
          ref: { gameId: "stardew-mega-mod", phaseId: "p1", groupLabel: "Main Progression", text: "Reach Mine Floor 40" },
        },
        {
          label: "Upgrade Pickaxe to Copper",
          ref: { gameId: "stardew-mega-mod", phaseId: "p1", groupLabel: "Main Progression", text: "Upgrade Pickaxe to Copper" },
        },
        {
          label: "Reach Mine Floor 80",
          ref: { gameId: "stardew-mega-mod", phaseId: "p2", groupLabel: "Mining Progression", text: "Reach Mine Floor 80" },
        },
        {
          label: "Upgrade Pickaxe to Steel",
          ref: { gameId: "stardew-mega-mod", phaseId: "p2", groupLabel: "Mining Progression", text: "Upgrade Pickaxe to Steel when affordable" },
        },
      ],
    },
    {
      id: "farm-basics",
      title: "Farm development",
      note: "Build these because they support your play, not because the guide says the calendar demands them.",
      items: [
        {
          label: "Build a Silo",
          ref: { gameId: "stardew-mega-mod", phaseId: "p2", groupLabel: "Farm", text: "Build a Silo" },
        },
        {
          label: "Build a Coop or Barn",
          ref: { gameId: "stardew-mega-mod", phaseId: "p2", groupLabel: "Farm", text: "Build a Coop OR Barn" },
        },
        {
          label: "Begin producing artisan goods",
          ref: { gameId: "stardew-mega-mod", phaseId: "p2", groupLabel: "Farm", text: "Begin producing some artisan goods" },
        },
        {
          label: "Build a reliable mining-food supply",
          ref: { gameId: "stardew-mega-mod", phaseId: "p2", groupLabel: "Farm", text: "Have a reliable source of food for mining" },
        },
        {
          label: "Mostly Quality Sprinklers or better",
          ref: { gameId: "stardew-mega-mod", phaseId: "p4", groupLabel: "Farm Infrastructure", text: "Have mostly Quality Sprinklers or better" },
        },
      ],
    },
  ],
  bundles: [
    // Crafts Room
    {
      id: "spring-foraging", room: "Crafts Room", name: "Spring Foraging Bundle", need: 4,
      items: [
        { name: "Wild Horseradish", seasons: S("Spring"), note: "Forage. Secret Woods, Cindersap Forest, Backwoods, Mountain." },
        { name: "Daffodil", seasons: S("Spring"), note: "Forage. Always in Pelican Town; also Bus Stop and Railroad." },
        { name: "Leek", seasons: S("Spring"), note: "Forage. Backwoods, Mountain, Bus Stop, Railroad." },
        { name: "Dandelion", seasons: S("Spring"), note: "Forage. Cindersap Forest, Bus Stop, Railroad." },
      ],
    },
    {
      id: "summer-foraging", room: "Crafts Room", name: "Summer Foraging Bundle", need: 3,
      items: [
        { name: "Grape", seasons: S("Summer"), note: "Forage. Backwoods, Mountain, Bus Stop, Railroad." },
        { name: "Spice Berry", seasons: S("Summer"), note: "Forage anywhere outdoors in the valley." },
        { name: "Sweet Pea", seasons: S("Summer"), note: "Forage. Mostly Pelican Town; also Cindersap Forest, Bus Stop, Railroad." },
      ],
    },
    {
      id: "fall-foraging", room: "Crafts Room", name: "Fall Foraging Bundle", need: 4,
      items: [
        { name: "Common Mushroom", seasons: S("Fall"), note: "Forage in Fall, or in the Secret Woods in Spring and Fall." },
        { name: "Wild Plum", seasons: S("Fall"), note: "Forage anywhere outdoors in the valley." },
        { name: "Hazelnut", seasons: S("Fall"), note: "Forage. Shaking a Maple tree on Fall 15 to 28 can also drop one." },
        { name: "Blackberry", seasons: S("Fall"), note: "Forage. Bushes bear berries on Fall 8 to 11." },
      ],
    },
    {
      id: "winter-foraging", room: "Crafts Room", name: "Winter Foraging Bundle", need: 4,
      items: [
        { name: "Winter Root", seasons: S("Winter"), note: "Dig with a Hoe. Artifact spots (the wiggling worms) have the best odds; tilling soil away from the farm is about 4%." },
        { name: "Crystal Fruit", seasons: S("Winter"), note: "Forage. Dust Sprites on Mines floors 41 to 79 can also drop one." },
        { name: "Snow Yam", seasons: S("Winter"), note: "Dig with a Hoe in the snow. Artifact spots have the best odds." },
        { name: "Crocus", seasons: S("Winter"), note: "Forage. Pelican Town, Railroad, Bus Stop, Mountain, Cindersap Forest, Backwoods." },
      ],
    },
    {
      id: "construction", room: "Crafts Room", name: "Construction Bundle", need: 4,
      items: [
        { name: "Wood", id: "Wood-1", qty: 99, seasons: ANY, note: "Chop trees, or buy from Robin at 10g each." },
        { name: "Wood", id: "Wood-2", qty: 99, seasons: ANY, note: "Second stack of 99. Chop trees, or buy from Robin at 10g each." },
        { name: "Stone", qty: 99, seasons: ANY, note: "Break rocks on the farm or in the Mines." },
        { name: "Hardwood", qty: 10, seasons: ANY, note: "Large stumps need a Copper Axe or better. Six respawn daily in the Secret Woods (its entrance log needs a Steel Axe)." },
      ],
    },
    {
      id: "exotic-foraging", room: "Crafts Room", name: "Exotic Foraging Bundle", need: 5,
      items: [
        { name: "Coconut", seasons: ANY, note: "Forage in the Calico Desert (needs the bus repaired). The Oasis sells it on Mondays for 200g." },
        { name: "Cactus Fruit", seasons: ANY, note: "Forage in the Calico Desert. The Oasis sells it on Tuesdays for 150g." },
        { name: "Cave Carrot", seasons: ANY, note: "Forage in the Mines." },
        { name: "Red Mushroom", seasons: ANY, note: "Mines mushroom floors from floor 81. Secret Woods in Summer and Fall. Also from the Mushroom Cave." },
        { name: "Purple Mushroom", seasons: ANY, note: "Mines mushroom floors 81 to 119 (a chance). Also from the Mushroom Cave." },
        { name: "Maple Syrup", seasons: ANY, note: "Tap a Maple tree (the Tapper needs Foraging level 4). Ready every 9 nights." },
        { name: "Oak Resin", seasons: ANY, note: "Tap an Oak tree. Ready every 7 nights." },
        { name: "Pine Tar", seasons: ANY, note: "Tap a Pine tree. Ready every 5 nights." },
        { name: "Morel", seasons: S("Spring"), note: "Forage in the Secret Woods in Spring, or grow on a Mushroom Log." },
      ],
    },
    // Pantry
    {
      id: "spring-crops", room: "Pantry", name: "Spring Crops Bundle", need: 4,
      items: [
        { name: "Parsnip", seasons: S("Spring"), note: "Pierre's, Parsnip Seeds 20g. Grows in 4 days." },
        { name: "Green Bean", seasons: S("Spring"), note: "Pierre's, Bean Starter 60g. Grows in 10 days, then keeps producing." },
        { name: "Cauliflower", seasons: S("Spring"), note: "Pierre's, Cauliflower Seeds 80g. Grows in 12 days." },
        { name: "Potato", seasons: S("Spring"), note: "Pierre's, Potato Seeds 50g. Grows in 6 days." },
      ],
    },
    {
      id: "summer-crops", room: "Pantry", name: "Summer Crops Bundle", need: 4,
      items: [
        { name: "Tomato", seasons: S("Summer"), note: "Pierre's, Tomato Seeds 50g. Grows in 11 days." },
        { name: "Hot Pepper", seasons: S("Summer"), note: "Pierre's, Pepper Seeds 40g. Grows in 5 days." },
        { name: "Blueberry", seasons: S("Summer"), note: "Pierre's, Blueberry Seeds 80g. Grows in 13 days." },
        { name: "Melon", seasons: S("Summer"), note: "Pierre's, Melon Seeds 80g. Grows in 12 days." },
      ],
    },
    {
      id: "fall-crops", room: "Pantry", name: "Fall Crops Bundle", need: 4,
      items: [
        { name: "Corn", seasons: S("Summer", "Fall"), note: "Pierre's, Corn Seeds 150g (Summer and Fall). Grows in 14 days." },
        { name: "Eggplant", seasons: S("Fall"), note: "Pierre's, Eggplant Seeds 20g. Grows in 5 days." },
        { name: "Pumpkin", seasons: S("Fall"), note: "Pierre's, Pumpkin Seeds 100g. Grows in 13 days." },
        { name: "Yam", seasons: S("Fall"), note: "Pierre's, Yam Seeds 60g. Grows in 10 days." },
      ],
    },
    {
      id: "quality-crops", room: "Pantry", name: "Quality Crops Bundle", need: 3,
      items: [
        { name: "Parsnip", qty: 5, quality: "Gold", seasons: S("Spring"), note: "Needs Gold quality. Keep the best ones; Quality Fertilizer and Farming level help." },
        { name: "Melon", qty: 5, quality: "Gold", seasons: S("Summer"), note: "Needs Gold quality. Keep the best ones; Quality Fertilizer and Farming level help." },
        { name: "Pumpkin", qty: 5, quality: "Gold", seasons: S("Fall"), note: "Needs Gold quality. Keep the best ones; Quality Fertilizer and Farming level help." },
        { name: "Corn", qty: 5, quality: "Gold", seasons: S("Summer", "Fall"), note: "Needs Gold quality. Keep the best ones; Quality Fertilizer and Farming level help." },
      ],
    },
    {
      id: "animal", room: "Pantry", name: "Animal Bundle", need: 5,
      items: [
        { name: "Large Milk", seasons: ANY, note: "A Cow in a Barn. Cows give it once they are happy and friendly." },
        { name: "Large Egg (Brown)", seasons: ANY, note: "A brown Chicken in a Coop. Happy chickens lay large eggs." },
        { name: "Large Egg (White)", seasons: ANY, note: "A white Chicken in a Coop. Happy chickens lay large eggs." },
        { name: "Large Goat Milk", seasons: ANY, note: "A Goat in a Big Barn. Goats give it once they are happy and friendly." },
        { name: "Wool", seasons: ANY, note: "A Rabbit (Deluxe Coop) or a Sheep (Deluxe Barn)." },
        { name: "Duck Egg", seasons: ANY, note: "A Duck in a Big Coop." },
      ],
    },
    {
      id: "artisan", room: "Pantry", name: "Artisan Bundle", need: 6,
      items: [
        { name: "Truffle Oil", seasons: ANY, note: "Oil Maker (Farming level 8) with a Truffle." },
        { name: "Cloth", seasons: ANY, note: "Loom (Farming level 7) with Wool." },
        { name: "Goat Cheese", seasons: ANY, note: "Cheese Press (Farming level 6) with Goat Milk." },
        { name: "Cheese", seasons: ANY, note: "Cheese Press (Farming level 6) with Milk." },
        { name: "Honey", seasons: ANY, note: "Bee House (Farming level 3). Ready every 4 days, not in Winter." },
        { name: "Jelly", seasons: ANY, note: "Preserves Jar (Farming level 4) with a fruit." },
        { name: "Apple", seasons: S("Fall"), note: "Sapling at Pierre's, 4,000g. 28 days to mature, then fruits in Fall." },
        { name: "Apricot", seasons: S("Spring"), note: "Sapling at Pierre's, 2,000g. 28 days to mature, then fruits in Spring." },
        { name: "Orange", seasons: S("Summer"), note: "Sapling at Pierre's, 4,000g. 28 days to mature, then fruits in Summer." },
        { name: "Peach", seasons: S("Summer"), note: "Sapling at Pierre's, 6,000g. 28 days to mature, then fruits in Summer." },
        { name: "Pomegranate", seasons: S("Fall"), note: "Sapling at Pierre's, 6,000g. 28 days to mature, then fruits in Fall." },
        { name: "Cherry", seasons: S("Spring"), note: "Sapling at Pierre's, 3,400g. 28 days to mature, then fruits in Spring." },
      ],
    },
    // Fish Tank
    {
      id: "river-fish", room: "Fish Tank", name: "River Fish Bundle", need: 4,
      items: [
        { name: "Sunfish", seasons: S("Spring", "Summer"), note: "River (Town or Forest). Sunny or windy, 6am to 7pm." },
        { name: "Catfish", seasons: S("Spring", "Fall"), note: "River (Town or Forest), also the Secret Woods pond. Rain, 6am to 12am." },
        { name: "Shad", seasons: S("Spring", "Summer", "Fall"), note: "River (Town or Forest). Rain, 9am to 2am." },
        { name: "Tiger Trout", seasons: S("Fall", "Winter"), note: "River (Town or Forest). 6am to 7pm." },
      ],
    },
    {
      id: "lake-fish", room: "Fish Tank", name: "Lake Fish Bundle", need: 4,
      items: [
        { name: "Largemouth Bass", seasons: ANY, note: "Mountain Lake. 6am to 7pm." },
        { name: "Carp", seasons: ANY, note: "Secret Woods pond or the Sewers, any season. Mountain Lake in Spring, Summer, Fall. Any time." },
        { name: "Bullhead", seasons: ANY, note: "Mountain Lake. Any time." },
        { name: "Sturgeon", seasons: S("Summer", "Winter"), note: "Mountain Lake. 6am to 7pm." },
      ],
    },
    {
      id: "ocean-fish", room: "Fish Tank", name: "Ocean Fish Bundle", need: 4,
      items: [
        { name: "Sardine", seasons: S("Spring", "Fall", "Winter"), note: "Ocean. 6am to 7pm." },
        { name: "Tuna", seasons: S("Summer", "Winter"), note: "Ocean. 6am to 7pm." },
        { name: "Red Snapper", seasons: S("Summer", "Fall"), note: "Ocean. Rain, 6am to 7pm. Works in Winter with a Rain Totem." },
        { name: "Tilapia", seasons: S("Summer", "Fall"), note: "Ocean. 6am to 2pm." },
      ],
    },
    {
      id: "night-fishing", room: "Fish Tank", name: "Night Fishing Bundle", need: 3,
      items: [
        { name: "Walleye", seasons: S("Fall"), note: "River, Mountain Lake or the Cindersap Forest pond. Rain, 12pm to 2am. Works in Winter with a Rain Totem." },
        { name: "Bream", seasons: ANY, note: "River (Town or Forest). 6pm to 2am." },
        { name: "Eel", seasons: S("Spring", "Fall"), note: "Ocean. Rain, 4pm to 2am." },
      ],
    },
    {
      id: "crab-pot", room: "Fish Tank", name: "Crab Pot Bundle", need: 5,
      items: [
        { name: "Lobster", seasons: ANY, note: "Crab pot in the ocean." },
        { name: "Crayfish", seasons: ANY, note: "Crab pot in a river or lake." },
        { name: "Crab", seasons: ANY, note: "Crab pot in the ocean." },
        { name: "Cockle", seasons: ANY, note: "Crab pot in the ocean." },
        { name: "Mussel", seasons: ANY, note: "Crab pot in the ocean." },
        { name: "Shrimp", seasons: ANY, note: "Crab pot in the ocean." },
        { name: "Snail", seasons: ANY, note: "Crab pot in a river or lake." },
        { name: "Periwinkle", seasons: ANY, note: "Crab pot in a river or lake." },
        { name: "Oyster", seasons: ANY, note: "Crab pot in the ocean." },
        { name: "Clam", seasons: ANY, note: "Crab pot in the ocean." },
      ],
    },
    {
      id: "specialty-fish", room: "Fish Tank", name: "Specialty Fish Bundle", need: 4,
      items: [
        { name: "Pufferfish", seasons: S("Summer"), note: "Ocean. Sunny, 12pm to 4pm." },
        { name: "Ghostfish", seasons: ANY, note: "Mines floors 20 and 60, any time." },
        { name: "Sandfish", seasons: ANY, note: "Calico Desert. 6am to 8pm." },
        { name: "Woodskip", seasons: ANY, note: "Secret Woods pond. Any time." },
      ],
    },
    // Boiler Room
    {
      id: "blacksmiths", room: "Boiler Room", name: "Blacksmith's Bundle", need: 3,
      items: [
        { name: "Copper Bar", seasons: ANY, note: "Furnace: 5 Copper Ore and 1 Coal. Copper ore is on Mines floors 2 to 39." },
        { name: "Iron Bar", seasons: ANY, note: "Furnace: 5 Iron Ore and 1 Coal. Iron ore is on Mines floors 41 to 79." },
        { name: "Gold Bar", seasons: ANY, note: "Furnace: 5 Gold Ore and 1 Coal. Gold ore is on Mines floor 80 and below." },
      ],
    },
    {
      id: "geologists", room: "Boiler Room", name: "Geologist's Bundle", need: 4,
      items: [
        { name: "Quartz", seasons: ANY, note: "Forage in the Mines or the Quarry Mine." },
        { name: "Earth Crystal", seasons: ANY, note: "Forage in the Mines, mostly floors 1 to 39. Also from Duggies on floors 1 to 29, and geodes." },
        { name: "Frozen Tear", seasons: ANY, note: "Forage in the Mines on floors 40 to 79. Also from Frozen Geodes and Dust Sprites." },
        { name: "Fire Quartz", seasons: ANY, note: "Forage in the Mines on floor 80 and below. Also from Magma Geodes." },
      ],
    },
    {
      id: "adventurers", room: "Boiler Room", name: "Adventurer's Bundle", need: 2,
      items: [
        { name: "Slime", qty: 99, seasons: ANY, note: "Slimes drop up to 2 each (green ones on Mines floors 1 to 29). Krobus sells 50 each Monday for 10g once you have the Rusty Key." },
        { name: "Bat Wing", qty: 10, seasons: ANY, note: "Bats on Mines floors 31 to 39, Frost Bats on floors 41 to 79." },
        { name: "Solar Essence", seasons: ANY, note: "Ghosts on Mines floors 51 to 79, or Metal Heads on floors 81 to 119." },
        { name: "Void Essence", seasons: ANY, note: "Shadow Brutes and Shadow Shamans on Mines floors 81 to 119." },
      ],
    },
    // Bulletin Board
    {
      id: "chefs", room: "Bulletin Board", name: "Chef's Bundle", need: 6,
      items: [
        { name: "Maple Syrup", seasons: ANY, note: "Tap a Maple tree (the Tapper needs Foraging level 4). Ready every 9 nights." },
        { name: "Fiddlehead Fern", seasons: S("Summer"), note: "Forage in the Secret Woods in Summer." },
        { name: "Truffle", seasons: ANY, note: "A Pig outside its barn digs them up, Spring to Fall. Pigs need a Deluxe Barn." },
        { name: "Poppy", seasons: S("Summer"), note: "Pierre's, Poppy Seeds 100g. Grows in 7 days." },
        { name: "Maki Roll", seasons: ANY, note: "Cook any fish, Seaweed and Rice. Recipe: Gus for 300g, or the Queen of Sauce on Summer 21, Year 1." },
        { name: "Fried Egg", seasons: ANY, note: "Cook 1 Egg in your kitchen. You already know the recipe." },
      ],
    },
    {
      id: "dye", room: "Bulletin Board", name: "Dye Bundle", need: 6,
      items: [
        { name: "Red Mushroom", seasons: ANY, note: "Mines mushroom floors from floor 81. Secret Woods in Summer and Fall. Also from the Mushroom Cave." },
        { name: "Sea Urchin", seasons: ANY, note: "Beach tide pools, east of the wooden footbridge. Any season." },
        { name: "Sunflower", seasons: S("Summer", "Fall"), note: "Pierre's, Sunflower Seeds 200g (Summer and Fall). Grows in 8 days." },
        { name: "Duck Feather", seasons: ANY, note: "A Duck in a Big Coop, once it likes you enough." },
        { name: "Aquamarine", seasons: ANY, note: "Aquamarine and gem nodes in the Mines from floor 40." },
        { name: "Red Cabbage", seasons: S("Summer"), note: "Seeds at Pierre's from Year 2. In Year 1 try the Traveling Cart or Skull Cavern. Grows in 9 days." },
      ],
    },
    {
      id: "field-research", room: "Bulletin Board", name: "Field Research Bundle", need: 4,
      items: [
        { name: "Purple Mushroom", seasons: ANY, note: "Mines mushroom floors 81 to 119 (a chance). Also from the Mushroom Cave." },
        { name: "Nautilus Shell", seasons: S("Winter"), note: "Forage on the Beach in Winter. Demetrius sometimes mails one." },
        { name: "Chub", seasons: ANY, note: "Mountain Lake or the Forest river. Any time." },
        { name: "Frozen Geode", seasons: ANY, note: "Mines floors 41 to 79, or on the farm in Winter. Do not crack it open." },
      ],
    },
    {
      id: "fodder", room: "Bulletin Board", name: "Fodder Bundle", need: 3,
      items: [
        { name: "Wheat", qty: 10, seasons: S("Summer", "Fall"), note: "Pierre's, Wheat Seeds 10g (Summer and Fall). Grows in 4 days." },
        { name: "Hay", qty: 10, seasons: ANY, note: "Marnie sells it for 50g, or cut grass with a scythe once you have a Silo." },
        { name: "Apple", qty: 3, seasons: S("Fall"), note: "Sapling at Pierre's, 4,000g. 28 days to mature, then fruits in Fall." },
      ],
    },
    {
      id: "enchanters", room: "Bulletin Board", name: "Enchanter's Bundle", need: 4,
      items: [
        { name: "Oak Resin", seasons: ANY, note: "Tap an Oak tree. Ready every 7 nights." },
        { name: "Wine", seasons: ANY, note: "Keg (Farming level 8) with a fruit." },
        { name: "Rabbit's Foot", seasons: ANY, note: "A Rabbit (Deluxe Coop) with enough friendship and luck. Serpents in Skull Cavern drop it rarely." },
        { name: "Pomegranate", seasons: S("Fall"), note: "Sapling at Pierre's, 6,000g. 28 days to mature, then fruits in Fall." },
      ],
    },
    // Vault
    { id: "vault-2500", room: "Vault", name: "2,500g Bundle", need: 1, items: [{ name: "Pay 2,500g", seasons: ANY }] },
    { id: "vault-5000", room: "Vault", name: "5,000g Bundle", need: 1, items: [{ name: "Pay 5,000g", seasons: ANY }] },
    { id: "vault-10000", room: "Vault", name: "10,000g Bundle", need: 1, items: [{ name: "Pay 10,000g", seasons: ANY }] },
    { id: "vault-25000", room: "Vault", name: "25,000g Bundle", need: 1, items: [{ name: "Pay 25,000g", seasons: ANY }] },
  ],
};

const completionTracker: CompletionGame = {
  kind: "completion",
  id: "stardew-completion",
  tab: "Completion",
  title: "Stardew — Completion",
  mods: "Collections • Museum • Perfection • modded totals editable",
  sections: [
    {
      id: "collections",
      title: "Collections",
      note: "Use the totals shown by your actual modded save when they differ from vanilla. The defaults are the current vanilla 1.6 baseline.",
      categories: [
        {
          id: "fish",
          title: "Fishing",
          defaultTotal: 72,
          unit: "fish caught",
          note: "Catch every entry in the Fish collection. Add the fish you are actively hunting to Next targets.",
          sourceHint: "Collections → Fish",
        },
        {
          id: "artifacts",
          title: "Artifacts",
          defaultTotal: 42,
          unit: "artifacts donated",
          note: "Track unique artifacts donated to the Museum.",
          sourceHint: "Museum / Collections → Artifacts",
        },
        {
          id: "minerals",
          title: "Minerals",
          defaultTotal: 53,
          unit: "minerals donated",
          note: "Track unique minerals donated to the Museum.",
          sourceHint: "Museum / Collections → Minerals",
        },
        {
          id: "cooking",
          title: "Cooking",
          defaultTotal: 81,
          unit: "recipes cooked",
          note: "A recipe counts when you have actually cooked it, not merely learned it.",
          sourceHint: "Collections → Cooking",
        },
        {
          id: "crafting",
          title: "Crafting",
          defaultTotal: 149,
          unit: "recipes crafted",
          note: "For vanilla Perfection, every required crafting recipe must be crafted at least once.",
          sourceHint: "Advanced Crafting Information / Perfection Tracker",
        },
        {
          id: "shipping",
          title: "Shipping",
          defaultTotal: 154,
          unit: "items shipped",
          note: "Ship one of every entry in Items Shipped. Selling directly to a shop does not fill the shipping collection.",
          sourceHint: "Collections → Items Shipped",
        },
      ],
    },
    {
      id: "perfection",
      title: "Perfection & Endgame",
      note: "These stay separate from Story & Quests so completion work never takes over your day unless you choose it.",
      categories: [
        {
          id: "monster-goals",
          title: "Monster Slayer Goals",
          defaultTotal: 12,
          unit: "goals complete",
          sourceHint: "Adventurer's Guild",
        },
        {
          id: "stardrops",
          title: "Stardrops",
          defaultTotal: 7,
          unit: "found",
        },
        {
          id: "golden-walnuts",
          title: "Golden Walnuts",
          defaultTotal: 130,
          unit: "found",
          sourceHint: "Ginger Island",
        },
        {
          id: "skills",
          title: "Skills at Level 10",
          defaultTotal: 5,
          unit: "skills maxed",
          note: "Farming, Mining, Foraging, Fishing, and Combat.",
        },
        {
          id: "obelisks",
          title: "Obelisks",
          defaultTotal: 4,
          unit: "built",
          note: "Earth, Water, Desert, and Island Obelisks.",
        },
        {
          id: "gold-clock",
          title: "Golden Clock",
          defaultTotal: 1,
          unit: "built",
        },
        {
          id: "friendships",
          title: "Great Friends",
          defaultTotal: 34,
          unit: "villagers maxed",
          note: "Vanilla baseline is 34. Change the total to whatever your modded Perfection tracker expects.",
          sourceHint: "Perfection Tracker / Social tab",
        },
      ],
    },
  ],
};

export const GAMES: Game[] = [
  {
    kind: "checklist",
    id: "stardew-mega-mod",
    tab: "Story & Quests",
    title: "Stardew — Story & Quests",
    mods: "Stardew Valley Expanded • Ridgeside Village • East Scarp • Sword & Sorcery",
    saveLabel: "Current save",
    saveDefault: "Spring 10, Year 1",
    rule: {
      text: "Follow whichever storyline is actually available. The roadmap is a guide, not a rule.",
      notLabel: "You do NOT need to:",
      not: [
        "Treat the roadmap like a hard gate",
        "Befriend everyone",
        "Visit every region every week",
        "Clear your entire quest journal",
        "Optimize every day",
      ],
    },
    questBoard: {
      storylines: [
        {
          id: "andy-spring",
          title: "Andy — Year 1 Strawberry Seeds",
          mod: "Stardew Valley Expanded",
          importance: "optional",
          note: "This is here only because the early event is Year 1 Spring-only and gives a useful reward. Andy's later friendship scenes are optional and are not part of core progression.",
          steps: [
            {
              id: "meet",
              label: "Talk to Andy at least once",
              how: "Needed for his Year 1 Spring strawberry event.",
              bucket: "deadline",
              priority: 100,
              gate: { year: 1, seasons: ["Spring"], minDay: 4 },
            },
            {
              id: "strawberries",
              label: "Trigger Andy's Year 1 Spring strawberry event",
              how: "Enter Cindersap Forest 7 AM–5 PM on a sunny Spring day. It only occurs in Year 1 after day 3, once you have spoken to Andy.",
              location: "Cindersap Forest",
              reward: "3 Strawberry Seeds",
              why: "A missable Year 1 Spring reward. After this event, you can stop prioritizing Andy unless you want his personal story.",
              bucket: "deadline",
              priority: 100,
              gate: { year: 1, seasons: ["Spring"], minDay: 4, weather: ["sunny"] },
              unlock: "Year 1 Spring only",
            },
          ],
        },
        {
          id: "sophia-year1",
          title: "Sophia — Scarlett/Pondwood Unlock",
          mod: "Stardew Valley Expanded",
          importance: "recommended",
          note: "Progression goal: reach Sophia's 8-heart event. That event, plus Community Center/Joja completion, unlocks Scarlett as a full NPC and Pondwood/Grampleton content. Stop here unless you personally want Sophia's romance/story scenes.",
          steps: [
            {
              id: "sprinkler",
              label: "Trigger Sophia's vineyard introduction and get the Quality Sprinkler",
              how: "Enter Blue Moon Vineyard 6 AM–3 PM in Spring or Summer, Year 1, with one empty inventory slot.",
              location: "Blue Moon Vineyard",
              reward: "Quality Sprinkler + access to Sophia's vineyard ledger",
              why: "Useful early farm upgrade and a Year 1-only event.",
              bucket: "deadline",
              priority: 98,
              gate: { year: 1, seasons: ["Spring", "Summer"] },
              unlock: "Year 1 Spring or Summer",
            },
            {
              id: "two-hearts",
              label: "Reach 2 hearts with Sophia and see her vineyard event",
              how: "Blue Moon Vineyard, 8 AM–4 PM, Spring/Summer/Fall, any weather, with one empty inventory slot.",
              location: "Blue Moon Vineyard",
              bucket: "now",
              priority: 58,
              gate: { seasons: ["Spring", "Summer", "Fall"] },
            },
            {
              id: "four-hearts",
              label: "Reach 4 hearts with Sophia and see her Pelican Town event",
              how: "Enter Pelican Town 8 AM–4 PM on a sunny Spring/Summer/Fall day after her 2-heart event.",
              location: "Pelican Town",
              bucket: "now",
              priority: 57,
              gate: { seasons: ["Spring", "Summer", "Fall"], weather: ["sunny"] },
            },
            {
              id: "six-hearts-1",
              label: "Reach 6 hearts with Sophia and see Part I",
              how: "Enter Pelican Town 8 AM–3 PM on a rainy Spring/Summer/Fall day after her 4-heart event.",
              location: "Pelican Town",
              bucket: "now",
              priority: 56,
              gate: { seasons: ["Spring", "Summer", "Fall"], weather: ["rain"] },
            },
            {
              id: "six-hearts-2",
              label: "See Sophia's 6-heart Part II",
              how: "Enter Sophia's house after seeing 6-heart Part I. Any season, any weather.",
              location: "Blue Moon Vineyard house",
              bucket: "now",
              priority: 56,
            },
            {
              id: "eight-hearts",
              label: "Reach 8 hearts with Sophia and see her 8-heart event",
              how: "Enter Pelican Town 10 AM–5 PM on a sunny Friday, Saturday, or Sunday after seeing 6-heart Part II.",
              location: "Pelican Town",
              reward: "Unlock prerequisite for Scarlett as a full NPC and Pondwood/Grampleton access once the Community Center or Joja route is complete",
              why: "This is the progression payoff. You can stop actively pursuing Sophia after this unless you want her optional personal/romance story.",
              bucket: "now",
              priority: 62,
              gate: { weather: ["sunny"] },
            },
          ],
        },
        {
          id: "mateo",
          title: "Mateo — Sword & Sorcery Chapter 1",
          mod: "Sword & Sorcery / East Scarp",
          importance: "required",
          note: "Mateo is Chapter 1, not the whole campaign. The progression endpoint is the 10-heart Railroad event; romance-only follow-ups do not block later Sword & Sorcery chapters.",
          steps: [
            {
              id: "meet",
              label: "Meet Mateo",
              location: "East Scarp",
              why: "Starts Sword & Sorcery's first chapter.",
              bucket: "now",
              priority: 96,
              legacy: { phaseId: "p1", groupLabel: "East Scarp + Sword & Sorcery", text: "Meet Mateo" },
            },
            {
              id: "intro1",
              label: "Watch Mateo Intro Part I at the Museum",
              how: "Museum, any time, any season, any weather.",
              bucket: "now",
              priority: 96,
            },
            {
              id: "intro2",
              label: "Watch Mateo Intro Part II in the Mines",
              how: "Any time after Intro Part I once Marlon has given you the sword. There is no wait after Part I.",
              bucket: "now",
              priority: 96,
            },
            {
              id: "two-hearts",
              label: "Reach 2 hearts with Mateo and see the Town event",
              how: "Town, 8 PM–midnight, sunny, any season. Mateo events are normally three days apart unless noted.",
              location: "Pelican Town",
              gate: { weather: ["sunny"] },
              bucket: "now",
              priority: 92,
            },
            {
              id: "four-hearts",
              label: "Reach 4 hearts with Mateo and see the Beach event",
              how: "Beach, 6 PM–midnight, sunny, any season.",
              location: "The Beach",
              gate: { weather: ["sunny"] },
              bucket: "now",
              priority: 90,
            },
            {
              id: "five-1",
              label: "See Mateo's 5-heart Part I",
              how: "Mines, 6 PM–midnight, any weather, any season. After this, Mateo has an optional missable Saloon scene for only 3 in-game days; the separate Missable Scenes card will warn you without blocking Chapter 1.",
              bucket: "now",
              priority: 90,
            },
            {
              id: "five-3",
              label: "See Mateo's 5-heart Part III",
              how: "Adventurer's Guild, 2–10 PM. Requires 5-heart Part I.",
              bucket: "now",
              priority: 89,
            },
            {
              id: "six-1",
              label: "See Mateo's 6-heart Part I",
              how: "Town, 10 AM–6 PM, sunny, any season.",
              location: "Pelican Town",
              gate: { weather: ["sunny"] },
              bucket: "now",
              priority: 88,
            },
            {
              id: "six-2",
              label: "See Mateo's 6-heart Part II",
              how: "Cindersap Forest, 6 PM–midnight, rain, any season.",
              location: "Cindersap Forest",
              gate: { weather: ["rain", "storm"] },
              bucket: "now",
              priority: 88,
            },
            {
              id: "seven",
              label: "See Mateo's 7-heart Part I after meeting Krobus",
              how: "Hospital, 9 AM–3 PM, any day except Friday. Requires having met Krobus.",
              location: "Clinic",
              bucket: "now",
              priority: 87,
              requires: ["marlon-krobus:meet-krobus"],
              unlock: "Meet Krobus first",
            },
            {
              id: "seven-2",
              label: "See Mateo's 7-heart Part II",
              how: "Town, 8 PM–midnight, sunny, any day except Friday. Wait one week after Part I.",
              location: "Pelican Town",
              gate: { weather: ["sunny"] },
              bucket: "now",
              priority: 86,
            },
            {
              id: "eight",
              label: "See Mateo's 8-heart Part I and accept the guild quest",
              how: "East Scarp, 10 AM–6 PM, sunny. Wait two weeks after the prior event.",
              location: "East Scarp",
              gate: { weather: ["sunny"] },
              bucket: "now",
              priority: 85,
              reward: "Starts the quest that builds the Coastal Adventurer's Guild",
            },
            {
              id: "guild-build",
              label: "Complete Mateo's quest to build the Coastal Adventurer's Guild",
              how: "Follow the quest journal issued by 8-heart Part I. The finished guild becomes Mateo's base in East Scarp.",
              location: "East Scarp beach",
              bucket: "toward",
              priority: 85,
              reward: "Coastal Adventurer's Guild unlocked",
            },
            {
              id: "eight-2",
              label: "See Mateo's 8-heart Part II",
              how: "Return to East Scarp, 10 AM–6 PM, sunny after completing the guild quest.",
              location: "East Scarp",
              gate: { weather: ["sunny"] },
              bucket: "now",
              priority: 84,
            },
            {
              id: "ten",
              label: "See Mateo's 10-heart Railroad event",
              how: "Railroad, 8 PM–midnight, sunny. Choose either platonic or romantic; the platonic choice still completes the progression chapter. A later Deep Mountains event is romance-only.",
              location: "Railroad",
              gate: { weather: ["sunny"] },
              bucket: "now",
              priority: 83,
              reward: "Completes Mateo's progression chapter and opens the path toward Hector",
              why: "This is the progression endpoint. You do not need to romance Mateo to continue Sword & Sorcery.",
            },
          ],
        },
        {
          id: "mateo-missables",
          title: "Mateo — Missable Scenes",
          mod: "Sword & Sorcery / East Scarp",
          importance: "optional",
          note: "These are tracked separately so you get the warning without letting a missed optional scene break the required campaign chain. If a window already passed, check the item off as 'handled/missed'.",
          steps: [
            {
              id: "five-2",
              label: "Handle Mateo's missable 5-heart Saloon scene within 3 days",
              how: "After 5-heart Part I, enter the Saloon noon–midnight within the next 3 in-game days. If the window has already passed, check this off as handled/missed; it does not gate later Mateo events.",
              location: "Stardrop Saloon",
              bucket: "deadline",
              priority: 110,
              requires: ["mateo:five-1"],
              unlock: "Only available for 3 in-game days after Mateo 5-heart Part I",
            },
            {
              id: "guild-bonus",
              label: "Optional missable guild bonus scene before obtaining the Galaxy Sword",
              how: "After Mateo's 8-heart Part II and after the bus is unlocked, enter the Coastal Adventurer's Guild before you obtain the Galaxy Sword. If you already have the Galaxy Sword, mark this handled/missed.",
              location: "Coastal Adventurer's Guild",
              bucket: "toward",
              priority: 45,
              requires: ["mateo:eight-2"],
              unlock: "Requires Mateo 8-heart Part II + bus unlocked; becomes unavailable after Galaxy Sword",
            },
          ],
        },
        {
          id: "sword-sorcery-campaign",
          title: "Sword & Sorcery — Main Campaign",
          mod: "Sword & Sorcery / East Scarp",
          importance: "required",
          note: "This is the campaign after Mateo. Exact event/quest details change across S&S updates, so use the in-game Player's Handbook for each chapter's precise trigger while this tracker keeps the chapter order and major unlocks straight.",
          steps: [
            {
              id: "hector-intro",
              label: "Unlock and meet Hector",
              how: "After Mateo's 10-heart progression event, complete Hector's seasonal quests if that setting is enabled, then enter the Railroad to trigger Hector's introduction.",
              location: "Railroad",
              bucket: "now",
              priority: 82,
              requires: ["mateo:ten"],
              unlock: "Complete Mateo Chapter 1 first",
              reward: "Hector's Tower / Druid chapter begins",
            },
            {
              id: "hector-chapter",
              label: "Complete Hector's chapter through the 10-heart Part II event",
              how: "Follow Hector's events and the quests they issue. Most events are only 1–3 days apart. Use the S&S Player's Handbook for the exact current quest order.",
              bucket: "toward",
              priority: 81,
              reward: "Druidics progression and the next campaign chapter",
            },
            {
              id: "cirrus-intro",
              label: "Meet Cirrus when Hector's chapter introduces the next party member",
              how: "Follow the Player's Handbook after finishing Hector's chapter rather than grinding unrelated East Scarp friendships.",
              bucket: "now",
              priority: 80,
              reward: "Bard chapter begins",
            },
            {
              id: "cirrus-chapter",
              label: "Complete Cirrus's chapter and restore the Lion's Mane",
              how: "Follow Cirrus's event/quest chain in the Player's Handbook.",
              bucket: "toward",
              priority: 79,
              reward: "Bardics and the Lion's Mane campaign location",
            },
            {
              id: "chapter-four",
              label: "Continue Chapter 4 with Roslin, Dandelion, and Solomon",
              how: "Let the campaign introduce them in sequence. Do not pre-grind their friendship before the Player's Handbook points you there.",
              bucket: "now",
              priority: 78,
              reward: "Later magic/class systems, Lion's Mane/armory content, and the route toward the finale",
            },
            {
              id: "deep-dark",
              label: "Progress through the Deep Dark campaign dungeon",
              how: "Use the Player's Handbook as new floors/objectives open. Current S&S includes a 30-floor Deep Dark progression.",
              location: "Deep Dark",
              bucket: "toward",
              priority: 77,
            },
            {
              id: "finale",
              label: "Complete the Sword & Sorcery finale",
              how: "Finish the final campaign objectives and boss sequence after the Deep Dark chapter.",
              bucket: "now",
              priority: 76,
              reward: "Main Sword & Sorcery campaign complete",
            },
          ],
        },
        {
          id: "marlon-krobus",
          title: "Marlon → Krobus — Sewer Access",
          mod: "Stardew Valley Expanded",
          importance: "required",
          note: "Concrete payoff: the Rusty Key opens the Sewers/Krobus and gates Mateo's 7-heart chapter. Stop prioritizing Marlon here unless another later quest explicitly needs him."
          steps: [
            {
              id: "start",
              label: "Start talking to and gifting Marlon",
              bucket: "toward",
              priority: 90,
              legacy: { phaseId: "p1", groupLabel: "Stardew Valley Expanded", text: "Begin giving Marlon gifts" },
            },
            {
              id: "five-hearts",
              label: "Reach 5 hearts with Marlon",
              how: "In Year 1, 5 hearts is the key SVE requirement for Marlon's Rusty Key event.",
              bucket: "toward",
              priority: 90,
              legacy: { phaseId: "p3", groupLabel: "SVE / Marlon", text: "Reach 5 hearts with Marlon" },
            },
            {
              id: "rusty-key",
              label: "Trigger Marlon's Rusty Key event",
              how: "Adventurer Summit, any season/weather once the Year 1 friendship requirement is met.",
              bucket: "now",
              priority: 90,
              legacy: { phaseId: "p3", groupLabel: "SVE / Marlon", text: "Trigger Marlon’s sewer-key event" },
            },
            {
              id: "meet-krobus",
              label: "Enter the Sewers and talk to Krobus",
              how: "Marlon's Rusty Key event introduces Krobus and gives sewer access; enter the Sewers and talk to him so the tracker has an explicit Mateo gate.",
              reward: "Krobus available + Mateo 7-heart prerequisite satisfied",
              bucket: "now",
              priority: 90,
              legacy: { phaseId: "p3", groupLabel: "SVE / Marlon", text: "Meet Krobus" },
            },
          ],
        },
        {
          id: "sve-highlands",
          title: "SVE — Highlands & Monster Crops",
          mod: "Stardew Valley Expanded",
          importance: "required",
          note: "Major SVE area unlock. Lance friendship matters here because 2 hearts opens Marlon's Boat and the Highlands; after the Monster Crops reward, further Lance friendship is optional unless you want his later First Slash content.",
          steps: [
            {
              id: "meet-lance",
              label: "Meet Lance at the Volcano Forge",
              how: "Reach the Forge at the top of the Ginger Island volcano dungeon.",
              location: "Volcano Forge",
              bucket: "toward",
              priority: 64,
              reward: "Lance becomes available and later visits your farm",
            },
            {
              id: "two-hearts",
              label: "Reach 2 hearts with Lance",
              bucket: "toward",
              priority: 64,
              why: "2 hearts is the hard requirement for Marlon's Boat and the Highlands.",
            },
            {
              id: "marlons-boat",
              label: "Complete Marlon's Boat",
              how: "Bring 100 Void Essence, 80 Solar Essence, 50 Slime, 40 Bat Wings, and 30 Bug Meat.",
              location: "Adventurer's Guild",
              bucket: "toward",
              priority: 63,
              reward: "Access to the Highlands",
            },
            {
              id: "enter-highlands",
              label: "Take Marlon's boat to the Highlands and see Lance's 2-heart story",
              location: "The Highlands",
              bucket: "now",
              priority: 63,
              reward: "Highlands fully enters your progression loop",
            },
            {
              id: "monster-crops",
              label: "Complete Lance's Monster Crops quest",
              how: "Grow and turn in one Monster Mushroom, Slime Berry, Monster Fruit, and Void Root. Their seeds come from Highlands monsters and the crops are season-specific.",
              location: "The Highlands",
              bucket: "toward",
              priority: 62,
              reward: "Diamond Wand",
            },
            {
              id: "diamond-wand",
              label: "Receive the Diamond Wand from Lance",
              how: "After the Monster Crops quest, follow Lance's resulting event.",
              bucket: "now",
              priority: 62,
              reward: "Diamond Wand / core Highlands progression complete",
              why: "This is the core progression endpoint. Lance's later heart events are personal/late-location content rather than prerequisites for the Highlands.",
            },
          ],
        },
        {
          id: "lance-first-slash",
          title: "Lance — First Slash Visit",
          mod: "Stardew Valley Expanded",
          importance: "optional",
          note: "Late optional location/story content after the core Highlands quest. It should never make the Highlands main card look unfinished.",
          steps: [
            {
              id: "eight-hearts",
              label: "Continue Lance to 8 hearts and see The First Slash",
              how: "This is late-game: his 8-heart event requires the Highlands, Monster Crops, and the repaired Ginger Island farmhouse. Continue his intervening events naturally rather than grinding this early.",
              location: "Island West",
              bucket: "toward",
              priority: 35,
              requires: ["sve-highlands:diamond-wand"],
              reward: "Visit the First Slash guild and related Fable Reef story content",
            },
          ],
        },
        {
          id: "sve-nexus",
          title: "SVE — Enchanted Grove & Crimson Badlands",
          mod: "Stardew Valley Expanded",
          importance: "required",
          note: "This is SVE's major late-game magic/fast-travel chain. It is separate from Magnus's 4-heart minor-magic unlock.",
          steps: [
            {
              id: "railroad-boulder",
              label: "Remove the Railroad boulder and unlock the Summit",
              how: "After obtaining the Skull Key, complete Clint's Railroad Boulder quest: 20 Iridium Ore and 20 Coal.",
              location: "Railroad",
              bucket: "toward",
              priority: 58,
              reward: "The Summit opens; this also satisfies one Nexus prerequisite",
            },
            {
              id: "galaxy-sword",
              label: "Obtain the Galaxy Sword",
              bucket: "toward",
              priority: 58,
              why: "Required to start the Nexus questline.",
            },
            {
              id: "meet-alesia",
              label: "Meet Alesia at the Adventurer's Guild",
              location: "Adventurer's Guild",
              bucket: "toward",
              priority: 58,
              why: "Required to start the Nexus questline.",
            },
            {
              id: "volcano-caldera",
              label: "Reach the Volcano Caldera and meet Lance",
              location: "Ginger Island Volcano",
              bucket: "toward",
              priority: 58,
              why: "Required to start the Nexus questline.",
            },
            {
              id: "nexus-part1",
              label: "Trigger Magnus's Enchanted Grove Part I",
              how: "Once the four Nexus prerequisites are met, enter your farm in the morning when the event is available.",
              location: "Farm",
              bucket: "now",
              priority: 58,
            },
            {
              id: "nexus-part2",
              label: "Complete Enchanted Grove Part II at the Wizard's Tower",
              location: "Wizard's Tower",
              bucket: "now",
              priority: 58,
            },
            {
              id: "nexus-part3",
              label: "Complete Enchanted Grove Part III in the Backwoods",
              location: "Backwoods / Enchanted Grove",
              bucket: "now",
              priority: 58,
              reward: "Enchanted Grove + Nexus + Warp Magic",
            },
            {
              id: "galdoran-warp",
              label: "Unlock the Galdoran Continent Nexus route",
              how: "Continue activating Nexus destinations until the Galdoran Continent event becomes available. If your SVE version's Year 3 fallback unlocks the Badlands automatically after starting the Nexus chain, check this off when that occurs.",
              location: "Enchanted Grove",
              bucket: "toward",
              priority: 57,
            },
            {
              id: "badlands",
              label: "Enter the Crimson Badlands",
              location: "Galdoran Continent / Castle Village Outpost",
              bucket: "now",
              priority: 57,
              reward: "Crimson Badlands, Castle Village Outpost shops, Treasure Cave and related late-game SVE quests",
            },
          ],
        },
        {
          id: "sve-aurora",
          title: "SVE — Aurora Vineyard & Apples",
          mod: "Stardew Valley Expanded",
          importance: "recommended",
          note: "Community Center route. This unlocks Apples and the Aurora Vineyard story; it is intentionally late-game and should not compete with your current early quests.",
          steps: [
            {
              id: "unlock-quest",
              label: "Become eligible for the Aurora Vineyard quest",
              how: "Complete the Community Center, visit Forest West, and reach at least 138 days played. The quest then triggers at the farmhouse at the start of a day.",
              bucket: "toward",
              priority: 42,
              gate: { minTotalDay: 139 },
              unlock: "Community Center complete + Forest West visited + 138 days played",
            },
            {
              id: "starfruit",
              label: "Gather 200 Starfruit for Aurora Vineyard",
              bucket: "toward",
              priority: 42,
            },
            {
              id: "turn-in",
              label: "Complete the Aurora Vineyard quest",
              location: "Aurora Vineyard",
              bucket: "now",
              priority: 42,
              reward: "Apples appears the next in-game day",
            },
            {
              id: "meet-apples",
              label: "Meet Apples",
              location: "Aurora Vineyard",
              bucket: "now",
              priority: 42,
              reward: "Apples becomes part of the SVE story",
            },
            {
              id: "apples-10",
              label: "Optional later goal: reach Apples's 10-heart event for Starfruit Mastery",
              how: "Community Center route only. Do this for the permanent economic power, not because it gates the main story.",
              bucket: "toward",
              priority: 30,
              importance: "optional",
              reward: "Starfruit sells for 10% more",
            },
          ],
        },
        {
          id: "sve-grandpa-shed",
          title: "SVE — Grandpa's Shed Restoration",
          mod: "Stardew Valley Expanded",
          importance: "recommended",
          note: "Major farm-area project with a concrete payoff: a large cellar plus a second greenhouse. It belongs in progression, but at low priority until your tools/resources make it reasonable.",
          steps: [
            {
              id: "enter-ruins",
              label: "Gain access to and enter Grandpa's ruined Shed",
              how: "Clear the obstruction to the shed using the tool levels required by your farm layout, then enter the ruins.",
              location: "Grandpa's Shed",
              bucket: "toward",
              priority: 44,
            },
            {
              id: "inspection",
              label: "Trigger Robin's shed inspection sequence",
              how: "After first entering the shed, Robin begins the restoration sequence. Follow her inspection and visit her shop when prompted.",
              bucket: "now",
              priority: 44,
            },
            {
              id: "materials",
              label: "Gather 600 Stone, 150 Hardwood, 50 Iron Bars, and 20 Battery Packs",
              bucket: "toward",
              priority: 43,
            },
            {
              id: "restore",
              label: "Deposit all materials and let Robin restore Grandpa's Shed",
              how: "Place the materials in the shed's restoration chest. After the completion sequence, the building is refurbished.",
              location: "Grandpa's Shed",
              bucket: "now",
              priority: 43,
              reward: "Large cellar + upstairs greenhouse",
              legacy: { phaseId: "p7", groupLabel: "Stardew Valley Expanded", text: "Repair Grandpa’s Shed" },
            },
          ],
        },
        {
          id: "sve-late-combat",
          title: "SVE — Badlands Endgame Quests",
          mod: "Stardew Valley Expanded",
          importance: "recommended",
          note: "Post-Badlands permanent-reward quests. These are worth tracking, but they should never outrank an unfinished main campaign chapter.",
          steps: [
            {
              id: "void-soul-ready",
              label: "Prepare for Void Soul Retrieval",
              how: "After the Crimson Badlands and Monster Crops are complete, work toward Krobus's 10-heart event and the Savage Ring requirement.",
              bucket: "toward",
              priority: 38,
              requires: ["sve-nexus:badlands", "sve-highlands:diamond-wand"],
            },
            {
              id: "void-souls",
              label: "Complete Void Soul Retrieval",
              how: "Collect and turn in the 60 Void Souls requested by the quest.",
              bucket: "toward",
              priority: 38,
              reward: "Void spirits become non-hostile and Void Roots can spawn in the Badlands",
            },
            {
              id: "legendary-trio",
              label: "Complete Marlon's Legendary Trio quest when it becomes available",
              how: "This late-game quest requires the Highlands Dwarf shop, Henchman/Treasure Cave progression, and Marlon friendship. Follow the in-game quest for the three legendary targets.",
              bucket: "toward",
              priority: 36,
              reward: "Castle Village Outpost weapon rewards",
            },
          ],
        },
        {
          id: "ridgeside-minecart",
          title: "Ridgeside Minecarts",
          mod: "Ridgeside Village",
          importance: "recommended",
          note: "Talk to Yuuma now; the actual restoration quest waits for the 20-day gate.",
          steps: [
            {
              id: "talk-yuuma",
              label: "Talk to Yuuma at least once",
              bucket: "now",
              priority: 88,
              legacy: { phaseId: "p1", groupLabel: "Ridgeside Village", text: "Talk to Yuuma at least once" },
            },
            {
              id: "trigger",
              label: "Trigger the Ridgeside minecart restoration quest",
              how: "After at least 20 in-game days with Ridgeside installed and after speaking to Yuuma, leave the farmhouse on a sunny morning.",
              bucket: "now",
              priority: 80,
              gate: { minTotalDay: 20 },
              unlock: "20 in-game days played + sunny morning",
              legacy: { phaseId: "p2", groupLabel: "Ridgeside Transportation Quest", text: "Trigger the Ridgeside minecart restoration quest" },
            },
            {
              id: "materials",
              label: "Gather 300 Wood, 10 Iron Bars, and 5 Gold Bars",
              bucket: "toward",
              priority: 72,
            },
            {
              id: "repair",
              label: "Deposit the minecart materials and return the next day",
              bucket: "now",
              priority: 72,
              legacy: { phaseId: "p2", groupLabel: "Ridgeside Transportation Quest", text: "Deposit the materials" },
            },
          ],
        },
        {
          id: "ridgeside-main",
          title: "Ridgeside Main Story — Spirit Realm",
          mod: "Ridgeside Village",
          importance: "required",
          note: "Full Spirit Realm main-story chain, from opening Ridge Forest through cleansing the Spirit Realm and unlocking Summit Farm.",
          steps: [
            {
              id: "steel-axe",
              label: "Upgrade the Axe to Steel",
              how: "This is the tool gate for the Ridge Forest entrance.",
              why: "Unlocks the Ridgeside main-story area.",
              reward: "Access to Ridge Forest",
              bucket: "toward",
              priority: 84,
              legacy: { phaseId: "p4", groupLabel: "Farm Infrastructure", text: "Upgrade Axe to Steel" },
            },
            {
              id: "clear-log",
              label: "Clear the large log and enter the Ridge Forest",
              how: "Take the cable car to Ridgeside, go north through the village into The Ridge (the map with the Ninja House), then walk straight north from where you enter The Ridge. The large log blocks that north exit.",
              location: "North edge of The Ridge",
              reward: "Access to Ridge Forest",
              bucket: "now",
              priority: 84,
            },
            {
              id: "meet-daia",
              label: "Meet Daia and begin the Ridge Forest storyline",
              location: "Ridge Forest / Ninja House story",
              bucket: "now",
              priority: 83,
            },
            {
              id: "preparations",
              label: "Start The Preparations",
              how: "The quest begins after meeting Daia. Read the Ancient Book in the Ninja House for the Cursed Artifact clues.",
              location: "Ninja House",
              bucket: "now",
              priority: 82,
              legacy: { phaseId: "p4", groupLabel: "Ridgeside Main Story Begins", text: "Begin The Preparations when it becomes available" },
            },
            {
              id: "mistbloom",
              label: "Collect the Mountain Mistbloom and Cursed Artifacts required by The Preparations",
              how: "Use your in-game quest log for the exact Mistbloom quantity on your installed version. The Ancient Book gives the relic clues.",
              location: "Ridge Forest",
              bucket: "toward",
              priority: 81,
            },
            {
              id: "turn-in",
              label: "Turn in The Preparations",
              how: "Put the requested quest items in the deposit box in the Ninja House.",
              location: "Ninja House",
              bucket: "now",
              priority: 80,
              legacy: { phaseId: "p4", groupLabel: "The Preparations", text: "Turn in The Preparations" },
            },
            {
              id: "preparations-complete",
              label: "Return to the Ninja House the next day for Preparations Complete!",
              how: "After completing The Preparations, return the following day for further instructions.",
              location: "Ninja House",
              bucket: "now",
              priority: 80,
            },
            {
              id: "note-ninjas",
              label: "Read A Note from the Ninjas and return to The Ridge after 8 PM",
              how: "Read the note at the Ninja House, then come to The Ridge after 8 PM on a clear night.",
              location: "The Ridge",
              bucket: "now",
              priority: 80,
              gate: { weather: ["sunny"] },
              reward: "Meet Belinda and advance the Spirit Realm plot",
            },
            {
              id: "meet-belinda",
              label: "Meet Belinda and receive the next Spirit Realm instructions",
              how: "This happens as the post-Preparations nighttime story advances.",
              bucket: "now",
              priority: 79,
              reward: "More Preparations and the Phantom Greenhouse branch become available",
            },
            {
              id: "more-preparations",
              label: "Complete More Preparations",
              how: "Go to the Ridge Forest on a sunny day before 7 PM after meeting Belinda.",
              location: "Ridge Forest",
              bucket: "now",
              priority: 79,
              gate: { weather: ["sunny"] },
            },
            {
              id: "crystal-quests",
              label: "Complete all seven Crystal Quests",
              how: "Donate 30 items matching each crystal's color to each of the seven crystals in the Ridge Forest.",
              location: "Ridge Forest crystals",
              bucket: "toward",
              priority: 78,
              why: "All seven must be completed before The Unsealing can occur.",
            },
            {
              id: "unsealing",
              label: "Trigger The Unsealing",
              how: "After completing all seven Crystal Quests, wait until the next day, then go to The Ridge after 8 PM on a clear night.",
              location: "The Ridge",
              bucket: "now",
              priority: 78,
              gate: { weather: ["sunny"] },
              reward: "Ridge Falls unlocked",
            },
            {
              id: "ridge-falls",
              label: "Enter Ridge Falls and start Open the Portal",
              how: "Ridge Falls is west of The Ridge after The Unsealing. Belinda and Raeriyala will show you the nine pedestals.",
              location: "Ridge Falls",
              bucket: "now",
              priority: 77,
              reward: "Blessed Artifact pages are added to the Ancient Book",
            },
            {
              id: "blessed-artifacts",
              label: "Collect all nine Blessed Artifacts",
              how: "Use the new Ancient Book pages in the Ninja House. The Blessed Artifacts are scattered around Ridgeside and nearby locations.",
              bucket: "toward",
              priority: 77,
            },
            {
              id: "open-portal",
              label: "Place the nine Blessed Artifacts on the correct pedestals and open the Spirit Realm portal",
              how: "Arrange the nine relics on the Ridge Falls pedestals until the foxes' eyes glow.",
              location: "Ridge Falls",
              bucket: "now",
              priority: 77,
              reward: "Spirit Realm unlocked",
            },
            {
              id: "enter-spirit-realm",
              label: "Enter the Spirit Realm",
              how: "Step through the portal at Ridge Falls.",
              location: "Spirit Realm",
              bucket: "now",
              priority: 76,
            },
            {
              id: "cleanse-spirit-realm",
              label: "Cleanse the Spirit Realm by extinguishing all five Corrupted Flames",
              how: "Navigate the Spirit Realm's one-way crystal network and interact with each of the five purple flames.",
              location: "Spirit Realm",
              bucket: "now",
              priority: 76,
              reward: "Spirit Realm saved • Summit Farm unlocked • Jio and Daia become full NPCs • Belinda's Tasks unlock",
            },
            {
              id: "visit-summit-farm",
              label: "Visit the newly unlocked Summit Farm",
              how: "After the Spirit Realm is saved, the boulders blocking the farm at the top of Ridge Forest are cleared.",
              location: "Top of Ridge Forest",
              bucket: "now",
              priority: 70,
              reward: "Summit Farm becomes usable; its minecart stop is available if the Ridgeside minecarts are repaired",
            },
          ],
        },
        {
          id: "ridgeside-greenhouse-story",
          title: "Ridgeside Story Branch — Phantom Greenhouse",
          mod: "Ridgeside Village",
          importance: "recommended",
          note: "A parallel Ridgeside story branch that opens after meeting Belinda. It is separate from cleansing the Spirit Realm, so you can progress it alongside the main chain.",
          steps: [
            {
              id: "ignorance-bliss",
              label: "Trigger Ignorance and Bliss",
              how: "After meeting Belinda, enter the Hike Trail, then follow Bliss's instruction to visit the abandoned greenhouse after midnight.",
              location: "Hike Trail / abandoned greenhouse",
              bucket: "now",
              priority: 68,
              requires: ["ridgeside-main:meet-belinda"],
              unlock: "Meet Belinda in the main Ridgeside storyline first",
            },
            {
              id: "cursed-greenhouse",
              label: "Complete The Cursed Greenhouse story event",
              how: "Return to the abandoned greenhouse after midnight when the quest directs you back.",
              location: "Phantom Greenhouse",
              bucket: "now",
              priority: 67,
            },
            {
              id: "second-chance",
              label: "Complete A Second Chance",
              how: "After the quest is active, collect 25 Mountain Mistbloom, 10 Sweet Gem Berries, and 5 Rubies.",
              bucket: "toward",
              priority: 66,
            },
            {
              id: "unlock-phantom-greenhouse",
              label: "Return after midnight and unlock the restored Phantom Greenhouse",
              how: "After completing A Second Chance, visit the greenhouse after midnight one more time.",
              location: "Phantom Greenhouse",
              bucket: "now",
              priority: 66,
              reward: "Phantom Greenhouse permanently unlocked",
            },
          ],
        },
        {
          id: "ridgeside-community-greenhouse",
          title: "Lenny — Community Greenhouse",
          mod: "Ridgeside Village",
          importance: "recommended",
          note: "Concrete payoff: this friendship grind exists specifically to restore Ridgeside's Community Greenhouse.",
          steps: [
            {
              id: "lenny-eight",
              label: "Reach 8 hearts with Lenny and 700,000g total earnings",
              how: "Both are required before Lenny's 8-heart greenhouse event can trigger.",
              bucket: "toward",
              priority: 55,
              why: "This is the hard gate for the Community Greenhouse quest.",
            },
            {
              id: "greenhouse-event",
              label: "Trigger Lenny's 8-heart event at the Village Office",
              location: "Ridgeside Village Office",
              bucket: "now",
              priority: 55,
              reward: "Ridgeside Greenhouse! quest",
            },
            {
              id: "materials",
              label: "Gather 60 Hardwood, 100 Stone, and 50 Iron Bars",
              bucket: "toward",
              priority: 54,
            },
            {
              id: "restore",
              label: "Deposit the greenhouse materials in Lenny's office and return the next day",
              location: "Ridgeside Village Office",
              bucket: "now",
              priority: 54,
              reward: "Community Greenhouse restored",
            },
          ],
        },
        {
          id: "undreya",
          title: "Undreya — Abandoned House",
          mod: "Ridgeside Village",
          importance: "optional",
          note: "A real standalone Ridgeside subplot with a permanent NPC/activity unlock, but it does not gate the Spirit Realm main story.",
          steps: [
            {
              id: "first-event",
              label: "Trigger the first Abandoned House event",
              how: "After at least 40 days in game, enter the Hike Trail on a rainy day before 6 PM.",
              location: "Hike Trail",
              gate: { minTotalDay: 41, weather: ["rain", "storm"] },
              bucket: "now",
              priority: 40,
            },
            {
              id: "shadow",
              label: "Return after 11 PM on a clear night and interact with the shadow figure",
              location: "Abandoned House",
              gate: { weather: ["sunny"] },
              bucket: "now",
              priority: 40,
            },
            {
              id: "meet-undreya",
              label: "Wait at least one day, return after 11 PM, and enter the Abandoned House",
              location: "Abandoned House",
              bucket: "now",
              priority: 40,
              reward: "Meet Undreya and begin her hide-and-seek activity",
            },
            {
              id: "third-event",
              label: "See Undreya's third event on a sunny Thursday before 2 PM",
              location: "Hike Trail",
              gate: { weather: ["sunny"] },
              bucket: "now",
              priority: 40,
              reward: "Completes the Abandoned House introduction chain; Undreya's full social/gifting setup is available",
            },
          ],
        },
        {
          id: "magnus",
          title: "Magnus — Minor Magic",
          mod: "Stardew Valley Expanded",
          importance: "recommended",
          note: "Intentional endpoint: Magnus at 4 hearts unlocks mana and minor magic. His later friendship/romance scenes are optional. SVE's larger Warp Magic/Nexus progression is tracked separately.",
          steps: [
            {
              id: "two-hearts",
              label: "Reach 2 hearts with Magnus and see The Barrier",
              how: "Cindersap Forest, 6 AM–6 PM, sunny, any season.",
              location: "Cindersap Forest",
              gate: { weather: ["sunny"] },
              bucket: "now",
              priority: 66,
            },
            {
              id: "four-hearts",
              label: "Reach 4 hearts with Magnus and unlock minor magic",
              how: "After his Shrine of Illusions letter, enter the Wizard's Tower. Any season, any weather.",
              location: "Wizard's Tower",
              reward: "Mana, minor magic, and Shrine of Illusions access",
              why: "This is the useful progression payoff. Stop actively prioritizing Magnus here unless you want his personal/romance story.",
              bucket: "now",
              priority: 66,
            },
          ],
        },
        {
          id: "rosa",
          title: "Rosa → Cherry Orchard & Luma",
          mod: "East Scarp",
          importance: "recommended",
          note: "Progression goal: Rosa's 3-heart event unlocks the Orchard Bridge Special Order. After the bridge, the Orchard Cottage starts Luma's unlock quest. Rosa's later friendship scenes are optional.",
          steps: [
            {
              id: "intro",
              label: "Meet Rosa at the East Scarp Inn",
              how: "Inn, any time, any season, any weather.",
              location: "Scarp Inn",
              bucket: "now",
              priority: 64,
            },
            {
              id: "three-hearts",
              label: "Reach 3 hearts with Rosa and see the East Scarp event",
              how: "East Scarp, 10 AM–4 PM, sunny, Monday/Thursday/Saturday/Sunday.",
              location: "East Scarp",
              gate: { weather: ["sunny"] },
              bucket: "now",
              priority: 64,
              reward: "Unlocks the mailed Special Order to repair the Cherry Orchard bridge",
            },
            {
              id: "orchard-bridge",
              label: "Complete Repair the Orchard Bridge",
              how: "Gather 200 Wood and 20 Hardwood for Rosa's non-expiring Special Order.",
              bucket: "toward",
              priority: 63,
              reward: "Easy access to Cherry Orchard",
            },
            {
              id: "enter-orchard",
              label: "Enter the Cherry Orchard Cottage and meet Luma",
              how: "Enter the cottage after you can reach Cherry Orchard. This adds Bring the Orchard Junimo a Gift to your journal.",
              location: "Cherry Orchard Cottage",
              bucket: "now",
              priority: 63,
            },
            {
              id: "luma-raisins",
              label: "Bring raisins into the Orchard Cottage",
              how: "Take Raisins into the cottage when the quest is active.",
              location: "Cherry Orchard Cottage",
              bucket: "now",
              priority: 63,
              reward: "Luma unlocks as a social NPC",
              why: "This is the progression payoff. You can stop prioritizing Rosa after this unless you want her personal story.",
            },
          ],
        },
        {
          id: "lexi-trading",
          title: "Lexi — Deep-Sea Trading Post",
          mod: "East Scarp",
          importance: "optional",
          note: "Short utility unlock: stop at 4 hearts unless you want Lexi's personal story.",
          steps: [
            {
              id: "intro",
              label: "Trigger Lexi's introduction and enter the Sea Cave",
              how: "The intro begins at the Beach when Vincent is present; enter Lexi's Cave afterward.",
              location: "Beach / Sea Cave",
              bucket: "now",
              priority: 35,
            },
            {
              id: "two-hearts",
              label: "Reach 2 hearts with Lexi and see the Sea Cave event",
              location: "Sea Cave",
              bucket: "now",
              priority: 35,
            },
            {
              id: "four-hearts",
              label: "Reach 4 hearts with Lexi and see the Saturday event",
              how: "Sea Cave on Saturday when it is not raining.",
              location: "Sea Cave",
              bucket: "now",
              priority: 35,
              reward: "Lexi's Saturday trading post unlocks",
              why: "This is the utility payoff. Later Lexi heart events are optional character story.",
            },
          ],
        },
        {
          id: "eyvind",
          title: "Eyvind — East Scarp Goatherd Story",
          mod: "East Scarp",
          importance: "recommended",
          note: "Full Eyvind storyline. The introduction is date-gated; later progression is driven by hearts, season/weather windows, and two late cross-character requirements.",
          steps: [
            {
              id: "intro",
              label: "See Eyvind Introduction Part I",
              how: "Enter East Scarp from 11:50 PM–2 AM, outside Winter, after at least 22 days in game.",
              location: "East Scarp",
              bucket: "now",
              priority: 72,
              gate: { minTotalDay: 23, seasons: ["Spring", "Summer", "Fall"] },
              unlock: "After 22 days in game",
            },
            {
              id: "intro-2",
              label: "See Eyvind Introduction Part II",
              how: "At least 2 days after Part I, enter East Scarp from 7 AM–4 PM on a sunny day. After both intro parts, Eyvind begins appearing normally.",
              location: "East Scarp",
              bucket: "now",
              priority: 72,
              gate: { weather: ["sunny"] },
              reward: "Eyvind becomes a normal befriendable NPC in the Deep Mountains",
            },
            {
              id: "two-hearts",
              label: "Reach 2 hearts with Eyvind and see his Deep Mountains event",
              how: "Deep Mountains, 8 AM–5 PM, sunny, not Winter.",
              location: "Deep Mountains",
              bucket: "now",
              priority: 70,
              gate: { seasons: ["Spring", "Summer", "Fall"], weather: ["sunny"] },
            },
            {
              id: "four-hearts",
              label: "Reach 4 hearts with Eyvind and see his next event",
              how: "Deep Mountains, 8 AM–4 PM, sunny, not Winter.",
              location: "Deep Mountains",
              bucket: "now",
              priority: 69,
              gate: { seasons: ["Spring", "Summer", "Fall"], weather: ["sunny"] },
            },
            {
              id: "six-hearts",
              label: "Reach 6 hearts with Eyvind and see his Summer event",
              how: "Deep Mountains, 10 AM–4 PM, sunny, during Summer.",
              location: "Deep Mountains",
              bucket: "now",
              priority: 68,
              gate: { seasons: ["Summer"], weather: ["sunny"] },
              reward: "Eyvind's garden area unlocks",
            },
            {
              id: "eight-hearts",
              label: "Reach 8 hearts with Eyvind and see his evening event",
              how: "Deep Mountains, 6 PM–midnight, any season and any weather.",
              location: "Deep Mountains",
              bucket: "now",
              priority: 67,
              reward: "Contributes to unlocking Void Goats; George's 6-heart event is also required",
            },
            {
              id: "unlock-vivienne",
              label: "Unlock Vivienne through Eloise's puppy-adoption story",
              how: "After Eloise's puppy-adoption event, enter East Scarp 9 AM–5 PM on a sunny Monday, Thursday, Saturday, or Sunday to trigger Vivienne's unlocking event.",
              location: "East Scarp",
              gate: { weather: ["sunny"] },
              bucket: "toward",
              priority: 67,
              why: "Vivienne must be available before you can build the 10 hearts required for Eyvind's 9-heart Part I.",
            },
            {
              id: "vivienne-ten",
              label: "Reach 10 hearts with Vivienne and see her 10-heart event",
              how: "Eyvind's 9-heart Part I will not trigger until Vivienne's 10-heart event has been seen.",
              bucket: "toward",
              priority: 66,
              why: "This is a hard cross-character requirement for Eyvind's late story.",
            },
            {
              id: "nine-1",
              label: "See Eyvind's 9-heart Part I",
              how: "Deep Mountains, 5–7 PM, sunny. Requires Eyvind's 8-heart event and Vivienne's 10-heart event.",
              location: "Deep Mountains",
              bucket: "now",
              priority: 66,
              gate: { weather: ["sunny"] },
            },
            {
              id: "nine-2",
              label: "See Eyvind's 9-heart Part II",
              how: "Pelican Town, 6–9 AM, any season and any weather, after Part I.",
              location: "Pelican Town",
              bucket: "now",
              priority: 65,
            },
            {
              id: "george-six",
              label: "Reach at least 6 hearts with George",
              how: "Eyvind's 9-heart Part III requires 6+ hearts with George. George's 6-heart event also combines with Eyvind's 8-heart event to unlock Void Goats.",
              bucket: "toward",
              priority: 65,
              reward: "Satisfies Eyvind's finale requirement and the other half of the Void Goat unlock",
            },
            {
              id: "nine-3",
              label: "See Eyvind's 9-heart Part III",
              how: "Pelican Town, 10 AM–6 PM, sunny. Requires Parts I and II plus at least 6 hearts with George.",
              location: "Pelican Town",
              bucket: "now",
              priority: 65,
              gate: { weather: ["sunny"] },
            },
          ],
        },
      ],
    },
    guide: {
      events: [
        "A heart event plays when you walk into its location during its time window, on a day that fits its weather, with enough hearts and the earlier event already seen.",
        "Weather has two settings. Events marked Sunny also play on windy and snowy days. Storms and green rain count as rain.",
        "Some events wait days or weeks after the one before them. If one will not play, check that wait before assuming it is broken.",
        "Buildings are locked on festival days, so do not expect an indoor event then.",
        "Event Lookup (default key N) lists the heart events you can trigger today and how. It covers Stardew Valley Expanded and Ridgeside. I could not confirm it lists East Scarp or Sword & Sorcery events, so for those use the event tables on eastscarp.wiki.gg.",
      ],
      early: [
        "Gifts: one a day, two a week per person, plus a birthday gift on top. Talking once a day gives +20 friendship. When the week's two gifts are given, just talk to them and spend the time elsewhere.",
        "You can go to bed whenever you like and the day ends. Bed before midnight restores full energy. Talk to Marlon and Mateo first if you want the +20.",
        "Seasonal items cannot be gotten early. When this season's items are done, use the Any season tab on the Community Center tracker.",
      ],
    },
    phases: [
      {
        id: "p1",
        title: "Getting started",
        when: "Start here",
        groups: [
          {
            label: "Main Progression",
            how: {"Unlock the Community Center": "Walk into Pelican Town from the Bus Stop on a day it is not raining, from Spring 5, between 8 AM and 1 PM. Lewis opens it in a cutscene."},
            items: [
              "Unlock the Community Center",
              "Buy the first backpack upgrade",
              "Reach Mine Floor 20",
              "Reach Mine Floor 40",
              "Upgrade Pickaxe to Copper",
              "Save iron ore instead of selling it",
              "Save gold ore once I can reach it",
            ],
          },
          {
            label: "Stardew Valley Expanded",
            hidden: ["Find/talk to Marlon"],
            how: {"Find/talk to Marlon": "Adventurer's Guild, up the Mountain trail. Your first visit plays the Guild Initiation, which needs 10 days played and the sword scene at the Mines entrance already seen. On rainy days he guards the mine ladder.", "Begin giving Marlon gifts": "Loves: Roots Platter, slime eggs, Life Elixir, Void Delight, Haste and Armor Elixirs. Likes: Fried Mushroom, Purple Mushroom, Bomb, Beer. Dislikes most forage and hates all flowers."},
            items: [
              "Find/talk to Marlon",
              "Begin giving Marlon gifts",
              "Reach 1 heart with Marlon",
              "Reach 2 hearts with Marlon",
            ],
            after: "Long-term goal: 5 hearts with Marlon.",
          },
          {
            label: "Ridgeside Village",
            hidden: ["Find Yuuma"],
            how: {"Take the cable car to Ridgeside": "The cable car is northeast of the Bus Stop and is always open.", "Talk to Yuuma at least once": "The minecart quest will not start until you have done this."},
            items: [
              "Take the cable car to Ridgeside",
              "Find Yuuma",
              "Talk to Yuuma at least once",
              "Explore the main village enough to understand the layout",
              "Go home",
            ],
            after: "That’s all I need from Ridgeside right now.",
          },
          {
            label: "East Scarp + Sword & Sorcery",
            hidden: ["Find Mateo", "Watch Mateo’s introduction events as they appear"],
            how: {"Visit East Scarp": "Take the path east of the blacksmith in Pelican Town, or cross Shearwater Bridge.", "Find Mateo": "His tent is in the south-east of East Scarp's main area.", "Watch Mateo’s introduction events as they appear": "Part I plays at the Museum, any time or weather. Part II plays in the Mines and needs Part I seen and the sword from Marlon. His daily schedule only starts after Part II.", "Keep the Player’s Handbook": "It is mailed to you when the mod is installed."},
            items: [
              "Visit East Scarp",
              "Find Mateo",
              "Meet Mateo",
              "Watch Mateo’s introduction events as they appear",
              "Keep the Player’s Handbook",
              "Go home",
            ],
          },
        ],
        footer: {
          warn: true,
          lead: "STOP.",
          text: "Do not start deliberately befriending the entire East Scarp or Ridgeside cast yet.",
        },
      },
      {
        id: "p2",
        title: "Mines and farm basics",
        when: "After the intro visits",
        groups: [
          {
            label: "Ridgeside Transportation Quest",
            hidden: ["Collect 300 Wood", "Smelt 10 Iron Bars", "Smelt 5 Gold Bars", "Sleep", "Test the repaired Ridgeside minecarts"],
            how: {"Trigger the Ridgeside minecart restoration quest": "Needs 20 in-game days played with Ridgeside installed and a talk with Yuuma. Then leave the farmhouse on a sunny morning.", "Deposit the materials": "Donation box at the minecarts, next to Heaps.", "Sleep": "The minecarts are fixed the next day."},
            items: [
              "Trigger the Ridgeside minecart restoration quest",
              "Collect 300 Wood",
              "Smelt 10 Iron Bars",
              "Smelt 5 Gold Bars",
              "Deposit the materials",
              "Sleep",
              "Test the repaired Ridgeside minecarts",
            ],
          },
          {
            label: "Mining Progression",
            how: {"Obtain the Firewalker Boots": "Chest on Mine Floor 80. You can also buy them at the Adventurer's Guild for 2,000g after reaching Floor 80."},
            items: [
              "Reach Mine Floor 50",
              "Reach Mine Floor 60",
              "Reach Mine Floor 70",
              "Reach Mine Floor 80",
              "Obtain the Firewalker Boots",
              "Upgrade Pickaxe to Steel when affordable",
            ],
          },
          { label: "Marlon",
            how: {"Reach 4 hearts with Marlon": "The 4-heart event plays at the Railroad on a rainy day, and only after you have reached the bottom of the Mines (Floor 120)."}, items: ["Reach 3 hearts with Marlon", "Reach 4 hearts with Marlon"] },
          {
            label: "Mateo",
            hidden: ["Continue Mateo’s available events", "Reach 2 hearts with Mateo", "Reach 4 hearts with Mateo"],
            how: {"Reach 2 hearts with Mateo": "The 2-heart event plays in Town, 8 PM to midnight, on a sunny day.", "Reach 4 hearts with Mateo": "The 4-heart event plays on the Beach, 6 PM to midnight, on a sunny day."},
            items: [
              "Check Mateo’s Player’s Handbook",
              "Continue Mateo’s available events",
              "Reach 2 hearts with Mateo",
              "Reach 4 hearts with Mateo",
            ],
          },
          {
            label: "Farm",
            items: [
              "Build a Silo",
              "Build a Coop OR Barn",
              "Begin producing some artisan goods",
              "Have a reliable source of food for mining",
            ],
          },
        ],
      },
      {
        id: "p3",
        title: "Finish the regular Mines",
        when: "After Floor 80",
        callout: { lead: "Main goal:", text: "Finish the regular Mines." },
        groups: [
          {
            label: "Mining Progression",
            how: {"Obtain the Skull Key": "Chest on Mine Floor 120."},
            items: [
              "Reach Mine Floor 90",
              "Reach Mine Floor 100",
              "Reach Mine Floor 110",
              "Reach Mine Floor 120",
              "Obtain the Skull Key",
            ],
          },
          {
            label: "SVE / Marlon",
            hidden: ["Receive access to the Sewers"],
            how: {"Trigger Marlon’s sewer-key event": "Wiki: 5 hearts in Year 1, with the Guild Initiation already seen. The wiki lists it two ways, at the Adventurer Summit in any weather or in Town on a rainy day, and players also mention 60 Museum donations. If it will not play, check Event Lookup (N).", "Receive access to the Sewers": "Marlon gives you the key in the same scene.", "Meet Krobus": "Marlon introduces him in that scene.", "Enter the Sewers at least once": "The cover in the south of Pelican Town, or the grates in the south of Cindersap Forest."},
            items: [
              "Reach 5 hearts with Marlon",
              "Trigger Marlon’s sewer-key event",
              "Receive access to the Sewers",
              "Meet Krobus",
              "Enter the Sewers at least once",
            ],
          },
          {
            label: "Sword & Sorcery",
            hidden: ["Continue Mateo’s story", "Watch Mateo events when Event Lookup shows one available", "Complete Mateo quests as they appear", "Continue toward Mateo’s later heart events"],
            how: {"Continue toward Mateo’s later heart events": "5 hearts is three parts: Mines (6 PM to midnight), then the Saloon (you miss it if more than 3 in-game days pass), then the Adventurer's Guild (2 to 10 PM). 6 hearts: Town on a sunny day, then Cindersap Forest on a rainy night. 7 hearts needs Krobus met, on any day but Friday."},
            note: "Now that Krobus is handled:",
            items: [
              "Continue Mateo’s story",
              "Watch Mateo events when Event Lookup shows one available",
              "Complete Mateo quests as they appear",
              "Continue toward Mateo’s later heart events",
              "Unlock the next Sword & Sorcery story content naturally",
            ],
            after: "Do not look up every future S&S character. Let the storyline introduce them.",
          },
        ],
      },
      {
        id: "p4",
        title: "Ridgeside main story opens",
        when: "After the regular Mines",
        groups: [
          {
            label: "Farm Infrastructure",
            items: [
              "Upgrade Axe to Steel",
              "Upgrade Pickaxe to Gold",
              "Have mostly Quality Sprinklers or better",
              "Have a reliable daily income",
              "Have a reliable supply of mining/combat food",
            ],
          },
          {
            label: "Ridgeside Main Story Begins",
            hidden: ["Find the entrance to the Ridge Forest", "Clear the large log blocking access", "Enter the Ridge Forest"],
            how: {"Find the entrance to the Ridge Forest": "Go north through Ridgeside Village into The Ridge (the area with the Ninja House), then walk straight north from where you enter The Ridge. The log blocks that north exit.", "Clear the large log blocking access": "Needs a Steel Axe.", "Find the Ninja House": "East side of The Ridge. Open 8 AM to 8 PM, closed on festival days.", "Read available clues/books": "The red book and the Ancient Book are both in the Ninja House.", "Begin The Preparations when it becomes available": "It starts when you enter the Ninja House after visiting the Ridge Forest. The Seer gives it through her subjects."},
            note: "Your Steel Axe gives you a reason to start exploring more seriously.",
            items: [
              "Find the entrance to the Ridge Forest",
              "Clear the large log blocking access",
              "Enter the Ridge Forest",
              "Explore without worrying about completing everything",
              "Find the Ninja House",
              "Read available clues/books",
              "Begin The Preparations when it becomes available",
            ],
          },
          {
            label: "The Preparations",
            hidden: ["Find the quest’s required cursed artifacts", "Collect required special forage/items"],
            how: {"Find the quest’s required cursed artifacts": "The red book in the Ninja House has the details.", "Collect required special forage/items": "Use the in-game quest log for the exact Mistbloom quantity on your installed Ridgeside version.", "Turn in The Preparations": "Donate the items in the deposit box in the Ninja House."},
            note: "Do these naturally instead of trying to finish everything in one day.",
            items: [
              "Find the quest’s required cursed artifacts",
              "Collect required special forage/items",
              "Turn in The Preparations",
              "Watch the resulting story events",
            ],
          },
          {
            label: "East Scarp",
            how: {"Watch their early events": "Several East Scarp events need the person to be home or present, and often a sunny day. Check their row on eastscarp.wiki.gg."},
            note: "You may now choose ONE East Scarp character besides Mateo.",
            field: "Character",
            items: [
              "Introduce myself",
              "Reach 2 hearts",
              "Watch their early events",
              "Reach 4 hearts",
              "Continue their story only when convenient",
            ],
          },
        ],
      },
      {
        id: "p5",
        title: "Adventure and campaigns",
        when: "Once the farm runs without daily upkeep",
        callout: {
          lead: "",
          text: "Your farm should now be stable enough that you don’t have to spend every day maintaining it.",
        },
        groups: [
          {
            label: "Ridgeside Main Campaign",
            hidden: [
              "Continue quests from the Ninja House",
              "Continue Belinda/Raeriyala-related storyline",
              "Complete available crystal quests",
              "Unlock access toward Ridge Falls",
              "Explore Ridge Falls",
              "Begin searching for Blessed Artifacts",
              "Use the Ancient Book/clues instead of randomly searching",
              "Collect Blessed Artifacts as I find them",
              "Continue toward opening the Spirit Realm",
            ],
            how: {"Continue quests from the Ninja House": "Jio runs the quest board there.", "Continue Belinda/Raeriyala-related storyline": "More Preparations starts once you have met Belinda. Go to the Ridge Forest on a sunny day before 7 PM.", "Complete available crystal quests": "Seven quests arrive together after More Preparations. Donate 30 items of each crystal's color to its crystal in the Ridge Forest.", "Unlock access toward Ridge Falls": "Finish all seven, wait a day, then go to The Ridge on a clear night after 8 PM for The Unsealing. That unlocks Ridge Falls, west of The Ridge.", "Use the Ancient Book/clues instead of randomly searching": "The artifact pages are added after The Unsealing. Ridge Falls adds a second edition with more clues.", "Continue toward opening the Spirit Realm": "The Open the Portal quest: place all nine relics in the right order on the pedestals west of Ridge Falls. The foxes' eyes glow when it is right."},
            items: [
              "Continue quests from the Ninja House",
              "Continue Belinda/Raeriyala-related storyline",
              "Complete available crystal quests",
              "Unlock access toward Ridge Falls",
              "Explore Ridge Falls",
              "Begin searching for Blessed Artifacts",
              "Use the Ancient Book/clues instead of randomly searching",
              "Collect Blessed Artifacts as I find them",
              "Continue toward opening the Spirit Realm",
            ],
          },
          {
            label: "Sword & Sorcery Campaign",
            how: {"Finish remaining Mateo progression": "8 hearts: wait two weeks after 7, and finish the quest from Part I before Part II. 10 hearts: Railroad at night on a sunny day, then the Deep Mountains.", "Meet the next S&S character when introduced": "Wiki: one of them appears at the Railroad after Mateo's 10-heart event. The later ones have no trigger listed yet, so let the mod introduce them."},
            items: [
              "Finish remaining Mateo progression",
              "Meet the next S&S character when introduced",
              "Learn the new skill/mechanic they introduce",
              "Complete their quests",
              "Watch their storyline",
              "Meet the next S&S character",
              "Continue the campaign in the order the mod presents it",
            ],
          },
          {
            label: "Regular Progression",
            how: {"Repair the Bus": "Finish all four Vault bundles (42,500g in total).", "Visit the Desert": "Needs the bus repaired.", "Enter Skull Cavern": "Needs the Skull Key from Mine Floor 120."},
            items: [
              "Repair the Bus",
              "Visit the Desert",
              "Enter Skull Cavern",
              "Obtain an Iridium Bar",
              "Begin collecting Iridium",
              "Work toward the Galaxy Sword",
            ],
          },
        ],
      },
      {
        id: "p6",
        title: "Story content",
        when: "Once the campaigns are underway",
        callout: { lead: "", text: "This stage is for story content." },
        groups: [
          {
            label: "Ridgeside",
            hidden: [
              "Continue Blessed Artifact hunt",
              "Finish prerequisites for the Spirit Realm",
              "Open the Spirit Realm portal",
              "Enter the Spirit Realm",
              "Progress the Spirit Realm story",
              "Save/cleanse the Spirit Realm",
              "Unlock Summit Farm",
              "Visit Summit Farm",
              "Activate/use its minecart stop",
            ],
            how: {"Enter the Spirit Realm": "Step into the portal at Ridge Falls. The pink crystals inside take you back out.", "Save/cleanse the Spirit Realm": "Extinguish the five Corrupted Flames.", "Unlock Summit Farm": "Saving the Spirit Realm unlocks it. Raeriyala clears the boulders at the top of the Ridge Forest."},
            items: [
              "Continue Blessed Artifact hunt",
              "Finish prerequisites for the Spirit Realm",
              "Open the Spirit Realm portal",
              "Enter the Spirit Realm",
              "Progress the Spirit Realm story",
              "Save/cleanse the Spirit Realm",
              "Unlock Summit Farm",
              "Visit Summit Farm",
              "Activate/use its minecart stop",
            ],
          },
          {
            label: "Sword & Sorcery",
            items: [
              "Continue the current character’s storyline",
              "Unlock the next S&S character",
              "Learn their skill",
              "Complete their major quests",
              "Continue toward the later S&S campaign",
              "Explore newly unlocked S&S locations",
              "Begin preparing for its tougher combat content",
            ],
          },
          {
            label: "East Scarp: Character #2",
            note: "Choose another character ONLY after finishing/progressing the previous one.",
            field: "Character #2",
            items: [
              "Meet them",
              "Reach 2 hearts",
              "Watch their story events",
              "Reach 4 hearts",
              "Continue their storyline",
            ],
          },
          {
            label: "East Scarp: Character #3",
            field: "Character #3",
            items: [
              "Meet them",
              "Reach 2 hearts",
              "Watch their story events",
              "Continue only if I’m enjoying them",
            ],
          },
          {
            label: "Vanilla/SVE",
            items: [
              "Finish the Community Center OR be down to seasonal items",
              "Progress Skull Cavern / reach Floor 100 if desired",
              "Obtain Galaxy Sword",
              "Upgrade important tools toward Iridium",
              "Prepare for Ginger Island progression",
            ],
          },
        ],
      },
      {
        id: "p7",
        title: "Big mod projects",
        when: "Once the story content is done",
        callout: { lead: "", text: "Now you’re allowed to start chasing the giant mod projects." },
        groups: [
          {
            label: "Stardew Valley Expanded",
            items: [
              "Repair Grandpa’s Shed",
              "Complete Grandpa’s Shed interior renovation",
              "Use the upstairs greenhouse",
              "Continue SVE character storylines",
              "Progress Wizard/Magnus content",
              "Progress Adventurer’s Guild content",
              "Complete major SVE special orders",
              "Continue toward Highlands content",
              "Continue toward Crimson Badlands content",
            ],
          },
          {
            label: "Ginger Island",
            items: [
              "Repair Willy’s Boat",
              "Reach Ginger Island",
              "Unlock Island Farm",
              "Unlock Island Trader",
              "Unlock Dig Site",
              "Progress Volcano Dungeon",
              "Reach Volcano Floor 10",
              "Unlock Ginger Island Resort",
            ],
          },
          {
            label: "Ridgeside",
            items: [
              "Develop Summit Farm if I want to",
              "Complete Belinda’s Tasks",
              "Explore post-Spirit-Realm content",
              "Work on Ridgeside friendships",
              "Complete character stories I care about",
              "Unlock Community Greenhouse when eligible",
              "Complete optional village projects",
            ],
          },
          {
            label: "Sword & Sorcery",
            items: [
              "Continue unlocking S&S characters",
              "Develop S&S skills",
              "Complete major character campaigns",
              "Explore the Deep Dark when unlocked",
              "Complete the major dungeon content",
              "Progress toward the S&S finale",
              "Complete the finale",
            ],
          },
          {
            label: "East Scarp",
            note: "At this point:",
            items: [
              "Choose characters based on who interests me",
              "Complete their heart-event storylines",
              "Do East Scarp special orders",
              "Explore secrets as I encounter clues",
              "Stop worrying about doing East Scarp “in order”",
            ],
          },
        ],
      },
      {
        id: "p8",
        title: "SVE Endgame",
        when: "When Ginger Island and your adventuring build are well established",
        groups: [
          {
            label: "Endgame",
            items: [
              "Meet the requirements for the Nexus questline",
              "Start the Nexus quest",
              "Unlock the Enchanted Grove",
              "Unlock Nexus warp points",
              "Progress Highlands content",
              "Progress Lance’s storyline",
              "Unlock Crimson Badlands",
              "Explore Crimson Badlands",
              "Complete late-game Adventurer’s Guild quests",
              "Complete major SVE endgame storylines",
            ],
          },
        ],
      },
      {
        id: "p9",
        title: "Completionist",
        when: "Only when I actually want completionism",
        groups: [
          {
            label: "Relationships",
            items: [
              "Befriend remaining Pelican Town NPCs",
              "Befriend remaining SVE NPCs",
              "Befriend remaining Ridgeside NPCs",
              "Befriend remaining East Scarp NPCs",
              "Befriend remaining Sword & Sorcery NPCs",
            ],
          },
          {
            label: "Collections",
            items: [
              "Museum",
              "Fish collection",
              "Shipping collection",
              "Cooking",
              "Crafting",
              "Stardrops",
              "Golden Walnuts",
              "Monster Eradication Goals",
              "Mod-specific collections",
            ],
          },
          {
            label: "Big Projects",
            items: [
              "Finish farm layout",
              "Finish Ginger Island farm",
              "Finish Summit Farm",
              "Finish Grandpa’s Shed",
              "Finish all desired village upgrades",
              "Finish remaining mod quests",
              "Work toward Perfection",
            ],
          },
        ],
      },
    ],
  },
  communityCenter,
  completionTracker,
];
