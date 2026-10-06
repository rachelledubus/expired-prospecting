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

export type GameQuestStep = {
  id: string;
  label: string;
  how?: string;
  bucket: GameQuestBucket;
  priority?: number;
  /** Calendar-only gate. Story prerequisites belong in requires. */
  gate?: {
    year?: number;
    seasons?: string[];
    minDay?: number;
    maxDay?: number;
    minTotalDay?: number;
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
  steps: GameQuestStep[];
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
  objectives: { next: string[]; after: string[]; closing: string };
  /** Live, non-linear quest board. When present, this replaces calendar phases as the primary play direction. */
  questBoard?: GameQuestBoard;
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
};

export type Game = ChecklistGame | BundleGame;

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
export const objKey = (gameId: string, text: string) => `${gameId}|obj|${text}`;
export const questKey = (gameId: string, storylineId: string, stepId: string) =>
  [gameId, "quest", storylineId, stepId].join("|");
export const fieldKey = (gameId: string, phaseId: string, name: string) => `${gameId}|${phaseId}|field|${name}`;
export const saveKey = (gameId: string) => `${gameId}|save`;

export const seasonKey = (gameId: string) => `${gameId}|season`;
export const bundleItemKey = (gameId: string, bundleId: string, item: BundleItem) =>
  [gameId, bundleId, item.id ?? item.name].join("|");

export const isBundleGame = (game: Game): game is BundleGame => game.kind === "bundles";

/** Every box key a game can have, used to reject anything else on save. */
export function knownCheckKeys(game: Game): Set<string> {
  const keys = new Set<string>();
  if (isBundleGame(game)) {
    game.bundles.forEach((b) => b.items.forEach((i) => keys.add(bundleItemKey(game.id, b.id, i))));
    return keys;
  }
  game.objectives.next.forEach((t) => keys.add(objKey(game.id, t)));
  game.questBoard?.storylines.forEach((story) =>
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
  if (isBundleGame(game)) return new Set<string>([seasonKey(game.id)]);
  const keys = new Set<string>([saveKey(game.id)]);
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
  tab: "Community Center",
  title: "Community Center Bundles",
  mods: "Standard bundles, sorted by the season you can get each item",
  defaultSeason: "Spring",
  rooms: ["Crafts Room", "Pantry", "Fish Tank", "Boiler Room", "Bulletin Board", "Vault"],
  footnotes: [
    "These are the standard bundles. Remixed bundles use different items.",
    "Seasons are the base game seasons. The Greenhouse grows crops all year, and Ginger Island lets you catch some fish in any season.",
    "Several fish need rain or a time of day. The note under each fish says which.",
    "If a bundle needs fewer items than it lists, finishing it hides the rest.",
  ],
  bundles: [
    // Crafts Room
    {
      id: "spring-foraging", room: "Crafts Room", name: "Spring Foraging Bundle", need: 4,
      items: [
        { name: "Wild Horseradish", seasons: S("Spring") },
        { name: "Daffodil", seasons: S("Spring") },
        { name: "Leek", seasons: S("Spring") },
        { name: "Dandelion", seasons: S("Spring") },
      ],
    },
    {
      id: "summer-foraging", room: "Crafts Room", name: "Summer Foraging Bundle", need: 3,
      items: [
        { name: "Grape", seasons: S("Summer") },
        { name: "Spice Berry", seasons: S("Summer") },
        { name: "Sweet Pea", seasons: S("Summer") },
      ],
    },
    {
      id: "fall-foraging", room: "Crafts Room", name: "Fall Foraging Bundle", need: 4,
      items: [
        { name: "Common Mushroom", seasons: S("Fall") },
        { name: "Wild Plum", seasons: S("Fall") },
        { name: "Hazelnut", seasons: S("Fall") },
        { name: "Blackberry", seasons: S("Fall") },
      ],
    },
    {
      id: "winter-foraging", room: "Crafts Room", name: "Winter Foraging Bundle", need: 4,
      items: [
        { name: "Winter Root", seasons: S("Winter") },
        { name: "Crystal Fruit", seasons: S("Winter") },
        { name: "Snow Yam", seasons: S("Winter") },
        { name: "Crocus", seasons: S("Winter") },
      ],
    },
    {
      id: "construction", room: "Crafts Room", name: "Construction Bundle", need: 4,
      items: [
        { name: "Wood", id: "Wood-1", qty: 99, seasons: ANY },
        { name: "Wood", id: "Wood-2", qty: 99, seasons: ANY, note: "Second stack of 99" },
        { name: "Stone", qty: 99, seasons: ANY },
        { name: "Hardwood", qty: 10, seasons: ANY },
      ],
    },
    {
      id: "exotic-foraging", room: "Crafts Room", name: "Exotic Foraging Bundle", need: 5,
      items: [
        { name: "Coconut", seasons: ANY },
        { name: "Cactus Fruit", seasons: ANY },
        { name: "Cave Carrot", seasons: ANY },
        { name: "Red Mushroom", seasons: ANY, note: "Mines floor 81 and below. Secret Woods in Summer and Fall." },
        { name: "Purple Mushroom", seasons: ANY },
        { name: "Maple Syrup", seasons: ANY },
        { name: "Oak Resin", seasons: ANY },
        { name: "Pine Tar", seasons: ANY },
        { name: "Morel", seasons: S("Spring"), note: "Forage in the Secret Woods, or grow on a Mushroom Log." },
      ],
    },
    // Pantry
    {
      id: "spring-crops", room: "Pantry", name: "Spring Crops Bundle", need: 4,
      items: [
        { name: "Parsnip", seasons: S("Spring") },
        { name: "Green Bean", seasons: S("Spring") },
        { name: "Cauliflower", seasons: S("Spring") },
        { name: "Potato", seasons: S("Spring") },
      ],
    },
    {
      id: "summer-crops", room: "Pantry", name: "Summer Crops Bundle", need: 4,
      items: [
        { name: "Tomato", seasons: S("Summer") },
        { name: "Hot Pepper", seasons: S("Summer") },
        { name: "Blueberry", seasons: S("Summer") },
        { name: "Melon", seasons: S("Summer") },
      ],
    },
    {
      id: "fall-crops", room: "Pantry", name: "Fall Crops Bundle", need: 4,
      items: [
        { name: "Corn", seasons: S("Summer", "Fall") },
        { name: "Eggplant", seasons: S("Fall") },
        { name: "Pumpkin", seasons: S("Fall") },
        { name: "Yam", seasons: S("Fall") },
      ],
    },
    {
      id: "quality-crops", room: "Pantry", name: "Quality Crops Bundle", need: 3,
      items: [
        { name: "Parsnip", qty: 5, quality: "Gold", seasons: S("Spring") },
        { name: "Melon", qty: 5, quality: "Gold", seasons: S("Summer") },
        { name: "Pumpkin", qty: 5, quality: "Gold", seasons: S("Fall") },
        { name: "Corn", qty: 5, quality: "Gold", seasons: S("Summer", "Fall") },
      ],
    },
    {
      id: "animal", room: "Pantry", name: "Animal Bundle", need: 5,
      items: [
        { name: "Large Milk", seasons: ANY },
        { name: "Large Egg (Brown)", seasons: ANY },
        { name: "Large Egg (White)", seasons: ANY },
        { name: "Large Goat Milk", seasons: ANY },
        { name: "Wool", seasons: ANY },
        { name: "Duck Egg", seasons: ANY },
      ],
    },
    {
      id: "artisan", room: "Pantry", name: "Artisan Bundle", need: 6,
      items: [
        { name: "Truffle Oil", seasons: ANY },
        { name: "Cloth", seasons: ANY },
        { name: "Goat Cheese", seasons: ANY },
        { name: "Cheese", seasons: ANY },
        { name: "Honey", seasons: ANY },
        { name: "Jelly", seasons: ANY },
        { name: "Apple", seasons: S("Fall"), note: "Fruit tree. A sapling takes 28 days to mature." },
        { name: "Apricot", seasons: S("Spring"), note: "Fruit tree. A sapling takes 28 days to mature." },
        { name: "Orange", seasons: S("Summer"), note: "Fruit tree. A sapling takes 28 days to mature." },
        { name: "Peach", seasons: S("Summer"), note: "Fruit tree. A sapling takes 28 days to mature." },
        { name: "Pomegranate", seasons: S("Fall"), note: "Fruit tree. A sapling takes 28 days to mature." },
        { name: "Cherry", seasons: S("Spring"), note: "Fruit tree. A sapling takes 28 days to mature." },
      ],
    },
    // Fish Tank
    {
      id: "river-fish", room: "Fish Tank", name: "River Fish Bundle", need: 4,
      items: [
        { name: "Sunfish", seasons: S("Spring", "Summer"), note: "Sunny or windy, 6am to 7pm" },
        { name: "Catfish", seasons: S("Spring", "Fall"), note: "Rain, 6am to 12am" },
        { name: "Shad", seasons: S("Spring", "Summer", "Fall"), note: "Rain, 9am to 2am" },
        { name: "Tiger Trout", seasons: S("Fall", "Winter"), note: "6am to 7pm" },
      ],
    },
    {
      id: "lake-fish", room: "Fish Tank", name: "Lake Fish Bundle", need: 4,
      items: [
        { name: "Largemouth Bass", seasons: ANY, note: "Mountain Lake, 6am to 7pm" },
        { name: "Carp", seasons: ANY, note: "Secret Woods pond or the Sewers all year. Mountain Lake only in Spring, Summer, Fall." },
        { name: "Bullhead", seasons: ANY, note: "Mountain Lake" },
        { name: "Sturgeon", seasons: S("Summer", "Winter"), note: "Mountain Lake, 6am to 7pm" },
      ],
    },
    {
      id: "ocean-fish", room: "Fish Tank", name: "Ocean Fish Bundle", need: 4,
      items: [
        { name: "Sardine", seasons: S("Spring", "Fall", "Winter"), note: "6am to 7pm" },
        { name: "Tuna", seasons: S("Summer", "Winter"), note: "6am to 7pm" },
        { name: "Red Snapper", seasons: S("Summer", "Fall"), note: "Rain, 6am to 7pm. Works in Winter with a Rain Totem." },
        { name: "Tilapia", seasons: S("Summer", "Fall"), note: "6am to 2pm" },
      ],
    },
    {
      id: "night-fishing", room: "Fish Tank", name: "Night Fishing Bundle", need: 3,
      items: [
        { name: "Walleye", seasons: S("Fall"), note: "Rain, 12pm to 2am. Works in Winter with a Rain Totem." },
        { name: "Bream", seasons: ANY, note: "6pm to 2am" },
        { name: "Eel", seasons: S("Spring", "Fall"), note: "Rain, 4pm to 2am" },
      ],
    },
    {
      id: "crab-pot", room: "Fish Tank", name: "Crab Pot Bundle", need: 5,
      items: [
        { name: "Lobster", seasons: ANY },
        { name: "Crayfish", seasons: ANY },
        { name: "Crab", seasons: ANY },
        { name: "Cockle", seasons: ANY },
        { name: "Mussel", seasons: ANY },
        { name: "Shrimp", seasons: ANY },
        { name: "Snail", seasons: ANY },
        { name: "Periwinkle", seasons: ANY },
        { name: "Oyster", seasons: ANY },
        { name: "Clam", seasons: ANY },
      ],
    },
    {
      id: "specialty-fish", room: "Fish Tank", name: "Specialty Fish Bundle", need: 4,
      items: [
        { name: "Pufferfish", seasons: S("Summer"), note: "Sunny, 12pm to 4pm" },
        { name: "Ghostfish", seasons: ANY, note: "Mines floors 20 and 60" },
        { name: "Sandfish", seasons: ANY, note: "The Desert, 6am to 8pm" },
        { name: "Woodskip", seasons: ANY, note: "Secret Woods pond" },
      ],
    },
    // Boiler Room
    {
      id: "blacksmiths", room: "Boiler Room", name: "Blacksmith's Bundle", need: 3,
      items: [
        { name: "Copper Bar", seasons: ANY },
        { name: "Iron Bar", seasons: ANY },
        { name: "Gold Bar", seasons: ANY },
      ],
    },
    {
      id: "geologists", room: "Boiler Room", name: "Geologist's Bundle", need: 4,
      items: [
        { name: "Quartz", seasons: ANY },
        { name: "Earth Crystal", seasons: ANY },
        { name: "Frozen Tear", seasons: ANY },
        { name: "Fire Quartz", seasons: ANY },
      ],
    },
    {
      id: "adventurers", room: "Boiler Room", name: "Adventurer's Bundle", need: 2,
      items: [
        { name: "Slime", qty: 99, seasons: ANY },
        { name: "Bat Wing", qty: 10, seasons: ANY },
        { name: "Solar Essence", seasons: ANY },
        { name: "Void Essence", seasons: ANY },
      ],
    },
    // Bulletin Board
    {
      id: "chefs", room: "Bulletin Board", name: "Chef's Bundle", need: 6,
      items: [
        { name: "Maple Syrup", seasons: ANY },
        { name: "Fiddlehead Fern", seasons: S("Summer"), note: "Forage in the Secret Woods" },
        { name: "Truffle", seasons: ANY },
        { name: "Poppy", seasons: S("Summer") },
        { name: "Maki Roll", seasons: ANY },
        { name: "Fried Egg", seasons: ANY },
      ],
    },
    {
      id: "dye", room: "Bulletin Board", name: "Dye Bundle", need: 6,
      items: [
        { name: "Red Mushroom", seasons: ANY, note: "Mines floor 81 and below. Secret Woods in Summer and Fall." },
        { name: "Sea Urchin", seasons: ANY, note: "Beach tide pools" },
        { name: "Sunflower", seasons: S("Summer", "Fall") },
        { name: "Duck Feather", seasons: ANY },
        { name: "Aquamarine", seasons: ANY },
        { name: "Red Cabbage", seasons: S("Summer") },
      ],
    },
    {
      id: "field-research", room: "Bulletin Board", name: "Field Research Bundle", need: 4,
      items: [
        { name: "Purple Mushroom", seasons: ANY },
        { name: "Nautilus Shell", seasons: S("Winter"), note: "Found on the Beach in Winter" },
        { name: "Chub", seasons: ANY, note: "Mountain Lake or Cindersap Forest river" },
        { name: "Frozen Geode", seasons: ANY },
      ],
    },
    {
      id: "fodder", room: "Bulletin Board", name: "Fodder Bundle", need: 3,
      items: [
        { name: "Wheat", qty: 10, seasons: S("Summer", "Fall") },
        { name: "Hay", qty: 10, seasons: ANY },
        { name: "Apple", qty: 3, seasons: S("Fall"), note: "Fruit tree. A sapling takes 28 days to mature." },
      ],
    },
    {
      id: "enchanters", room: "Bulletin Board", name: "Enchanter's Bundle", need: 4,
      items: [
        { name: "Oak Resin", seasons: ANY },
        { name: "Wine", seasons: ANY },
        { name: "Rabbit's Foot", seasons: ANY },
        { name: "Pomegranate", seasons: S("Fall"), note: "Fruit tree. A sapling takes 28 days to mature." },
      ],
    },
    // Vault
    { id: "vault-2500", room: "Vault", name: "2,500g Bundle", need: 1, items: [{ name: "Pay 2,500g", seasons: ANY }] },
    { id: "vault-5000", room: "Vault", name: "5,000g Bundle", need: 1, items: [{ name: "Pay 5,000g", seasons: ANY }] },
    { id: "vault-10000", room: "Vault", name: "10,000g Bundle", need: 1, items: [{ name: "Pay 10,000g", seasons: ANY }] },
    { id: "vault-25000", room: "Vault", name: "25,000g Bundle", need: 1, items: [{ name: "Pay 25,000g", seasons: ANY }] },
  ],
};

export const GAMES: Game[] = [
  {
    kind: "checklist",
    id: "stardew-mega-mod",
    tab: "Stardew Mega-Mod",
    title: "Stardew Mega-Mod Progression",
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
    objectives: {
      next: [
        "Talk to Yuuma",
        "Meet Mateo",
        "Talk to/gift Marlon",
        "Reach Mine Floor 40",
        "Work on Spring Community Center items",
      ],
      after: ["Keep mining.", "Keep befriending Marlon.", "Wait for Spring 20."],
      closing: "I do not need to worry about anything else yet.",
    },
    questBoard: {
      storylines: [
        {
          id: "andy-spring",
          title: "Andy — Spring Year 1",
          mod: "Stardew Valley Expanded",
          note: "Time-sensitive early SVE content. Do this before Spring ends.",
          steps: [
            {
              id: "meet",
              label: "Talk to Andy at least once",
              how: "Needed for his early Year 1 Spring event.",
              bucket: "deadline",
              priority: 100,
              gate: { year: 1, seasons: ["Spring"], minDay: 4 },
            },
            {
              id: "strawberries",
              label: "Trigger Andy's Year 1 Spring event",
              how: "Enter Cindersap Forest 7 AM–5 PM on a sunny Spring day. It only occurs in Year 1 after day 3, once you have spoken to Andy.",
              bucket: "deadline",
              priority: 100,
              gate: { year: 1, seasons: ["Spring"], minDay: 4 },
              unlock: "Year 1 Spring only",
            },
            {
              id: "two-hearts",
              label: "Reach 2 hearts with Andy and see his Town event",
              how: "The 2-heart event can play in Spring, Summer, or Fall on a sunny day from 10 AM–4 PM.",
              bucket: "now",
              priority: 52,
              gate: { seasons: ["Spring", "Summer", "Fall"] },
            },
          ],
        },
        {
          id: "sophia-year1",
          title: "Sophia — Early Year 1",
          mod: "Stardew Valley Expanded",
          note: "Her earliest vineyard event gives a Quality Sprinkler and is exclusive to Year 1.",
          steps: [
            {
              id: "sprinkler",
              label: "Trigger Sophia's vineyard introduction and get the Quality Sprinkler",
              how: "Enter Blue Moon Vineyard 6 AM–3 PM in Spring or Summer, Year 1, with one empty inventory slot.",
              bucket: "deadline",
              priority: 98,
              gate: { year: 1, seasons: ["Spring", "Summer"] },
              unlock: "Year 1 Spring or Summer",
            },
            {
              id: "two-hearts",
              label: "Reach 2 hearts with Sophia and see her vineyard event",
              how: "Blue Moon Vineyard, 8 AM–4 PM, Spring/Summer/Fall, any weather, with one empty inventory slot.",
              bucket: "now",
              priority: 58,
              gate: { seasons: ["Spring", "Summer", "Fall"] },
            },
            {
              id: "four-hearts",
              label: "Reach 4 hearts with Sophia and continue her story",
              how: "Enter Pelican Town 8 AM–4 PM on a sunny Spring/Summer/Fall day after her 2-heart event.",
              bucket: "now",
              priority: 56,
              gate: { seasons: ["Spring", "Summer", "Fall"] },
            },
          ],
        },
        {
          id: "mateo",
          title: "Mateo — Sword & Sorcery",
          mod: "Sword & Sorcery / East Scarp",
          note: "This is your main active mod storyline. Most early events are any season; the real early wall is Krobus at 7 hearts.",
          steps: [
            {
              id: "meet",
              label: "Meet Mateo",
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
              bucket: "now",
              priority: 92,
            },
            {
              id: "four-hearts",
              label: "Reach 4 hearts with Mateo and see the Beach event",
              how: "Beach, 6 PM–midnight, sunny, any season.",
              bucket: "now",
              priority: 90,
            },
            {
              id: "five-1",
              label: "See Mateo's 5-heart Part I",
              how: "Mines, 6 PM–midnight, any weather, any season.",
              bucket: "now",
              priority: 90,
            },
            {
              id: "five-2",
              label: "See Mateo's 5-heart Part II within 3 days",
              how: "Saloon, noon–midnight. This event is missable and only triggers within 3 in-game days of Part I.",
              bucket: "deadline",
              priority: 110,
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
              bucket: "now",
              priority: 88,
            },
            {
              id: "six-2",
              label: "See Mateo's 6-heart Part II",
              how: "Cindersap Forest, 6 PM–midnight, rain, any season.",
              bucket: "now",
              priority: 88,
            },
            {
              id: "seven",
              label: "Continue Mateo's 7-heart story after meeting Krobus",
              how: "Hospital, 9 AM–3 PM, any day except Friday. Requires the previous event and having met Krobus.",
              bucket: "now",
              priority: 87,
              requires: ["marlon-krobus:meet-krobus"],
              unlock: "Meet Krobus first",
            },
            {
              id: "eight",
              label: "Continue Mateo's 8-heart story",
              how: "East Scarp, 10 AM–6 PM, sunny. The first part requires two weeks after the previous event; follow the quest it gives before the next part.",
              bucket: "now",
              priority: 84,
            },
            {
              id: "ten",
              label: "Continue Mateo's 10-heart story",
              how: "Railroad at night on a sunny day, then the Deep Mountains. This is where the romance/platonic choice appears.",
              bucket: "now",
              priority: 82,
            },
          ],
        },
        {
          id: "marlon-krobus",
          title: "Marlon → Krobus",
          mod: "Stardew Valley Expanded",
          note: "This is a progression gate for Sword & Sorcery, not a seasonal storyline.",
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
              label: "Meet Krobus",
              bucket: "now",
              priority: 90,
              legacy: { phaseId: "p3", groupLabel: "SVE / Marlon", text: "Meet Krobus" },
            },
          ],
        },
        {
          id: "ridgeside-minecart",
          title: "Ridgeside Minecarts",
          mod: "Ridgeside Village",
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
          title: "Ridge Forest → Ninja Story",
          mod: "Ridgeside Village",
          note: "This storyline is tool-gated, not Late-Summer-gated.",
          steps: [
            {
              id: "steel-axe",
              label: "Upgrade the Axe to Steel",
              how: "A Steel Axe is the real requirement for opening the Ridge Forest.",
              bucket: "toward",
              priority: 84,
              legacy: { phaseId: "p4", groupLabel: "Farm Infrastructure", text: "Upgrade Axe to Steel" },
            },
            {
              id: "clear-log",
              label: "Clear the large log and enter the Ridge Forest",
              how: "The Ridge Forest is north of The Ridge. Clear its blocking log with the Steel Axe.",
              bucket: "now",
              priority: 84,
            },
            {
              id: "meet-daia",
              label: "Meet Daia while beginning the Ridge Forest storyline",
              bucket: "now",
              priority: 82,
            },
            {
              id: "preparations",
              label: "Start The Preparations",
              how: "The quest becomes available after meeting Daia. Use the Ninja House books for its relic clues.",
              bucket: "now",
              priority: 82,
              legacy: { phaseId: "p4", groupLabel: "Ridgeside Main Story Begins", text: "Begin The Preparations when it becomes available" },
            },
            {
              id: "mistbloom",
              label: "Collect 50 Mountain Mistbloom and the four required relics",
              how: "Current Ridgeside quest requirement: 50 Mountain Mistbloom plus Silver Fish Bones, Hollowed Bear, Entombed Ring, and Shell Bracelet.",
              bucket: "toward",
              priority: 80,
            },
            {
              id: "turn-in",
              label: "Turn in The Preparations",
              bucket: "now",
              priority: 80,
              legacy: { phaseId: "p4", groupLabel: "The Preparations", text: "Turn in The Preparations" },
            },
          ],
        },
        {
          id: "magnus",
          title: "Magnus — Magic",
          mod: "Stardew Valley Expanded",
          note: "A season-independent SVE side story that unlocks mana/minor magic at 4 hearts.",
          steps: [
            {
              id: "two-hearts",
              label: "Reach 2 hearts with Magnus and see The Barrier",
              how: "Cindersap Forest, 6 AM–6 PM, sunny, any season.",
              bucket: "now",
              priority: 66,
            },
            {
              id: "four-hearts",
              label: "Reach 4 hearts with Magnus and unlock minor magic",
              how: "After his Shrine of Illusions letter, enter the Wizard's Tower. Any season, any weather.",
              bucket: "now",
              priority: 66,
            },
          ],
        },
        {
          id: "rosa",
          title: "Rosa — East Scarp Side Story",
          mod: "East Scarp",
          note: "Use Rosa as your one active East Scarp side story instead of trying to befriend the whole town.",
          steps: [
            {
              id: "intro",
              label: "Meet Rosa at the East Scarp Inn",
              how: "Inn, any time, any season, any weather.",
              bucket: "now",
              priority: 64,
            },
            {
              id: "two-hearts",
              label: "Reach 2 hearts with Rosa and see her Inn event",
              how: "Scarp Inn, 4–8 PM, any season/weather.",
              bucket: "now",
              priority: 64,
            },
            {
              id: "three-hearts",
              label: "See Rosa's 3-heart event",
              how: "East Scarp, 10 AM–4 PM, sunny, on Monday/Thursday/Saturday/Sunday.",
              bucket: "now",
              priority: 63,
            },
            {
              id: "four-hearts",
              label: "See Rosa's 4-heart event",
              how: "Saloon, noon–6 PM, any season/weather, after her 2-heart event.",
              bucket: "now",
              priority: 63,
            },
            {
              id: "six-hearts",
              label: "See Rosa's 6-heart event",
              how: "Scarp Inn, any time/season/weather, after her 3-heart event.",
              bucket: "now",
              priority: 62,
            },
            {
              id: "seven-hearts",
              label: "See Rosa's rainy 7-heart event",
              how: "Scarp Inn, 5–8 PM, rain, any season.",
              bucket: "now",
              priority: 62,
            },
            {
              id: "eight-hearts",
              label: "See Rosa's 8-heart event",
              how: "Museum, 10 AM–4 PM, sunny, any season.",
              bucket: "now",
              priority: 61,
            },
          ],
        },
        {
          id: "ridgeside-side",
          title: "One Ridgeside Side Story",
          mod: "Ridgeside Village",
          note: "Pick only one resident at a time. Ian, Jeric, Philip, and Ysabelle all have early friendship events that are not locked to a future season.",
          steps: [
            {
              id: "pick",
              label: "Pick one Ridgeside resident: Ian, Jeric, Philip, or Ysabelle",
              bucket: "now",
              priority: 48,
            },
            {
              id: "two-hearts",
              label: "Reach 2 hearts with that resident and see their event",
              how: "Most of these 2-heart events work in any season; Ian's requires a sunny non-Winter morning.",
              bucket: "now",
              priority: 48,
            },
            {
              id: "continue",
              label: "Continue that resident's next heart event when convenient",
              bucket: "now",
              priority: 46,
            },
          ],
        },
        {
          id: "eyvind",
          title: "Eyvind Introduction",
          mod: "East Scarp",
          note: "This one really is date-gated.",
          steps: [
            {
              id: "intro",
              label: "Trigger Eyvind's late-night introduction",
              how: "East Scarp, 11:50 PM–2 AM, not Winter, after 22 days in game.",
              bucket: "now",
              priority: 44,
              gate: { minTotalDay: 23, seasons: ["Spring", "Summer", "Fall"] },
              unlock: "After 22 days in game",
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
            hidden: ["Check which Spring bundle items I still need"],
            how: {"Unlock the Community Center": "Walk into Pelican Town from the Bus Stop on a day it is not raining, from Spring 5, between 8 AM and 1 PM. Lewis opens it in a cutscene."},
            items: [
              "Unlock the Community Center",
              "Check which Spring bundle items I still need",
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
          {
            label: "Community Center",
            hidden: ["Complete Spring Crops Bundle", "Complete Summer Crops Bundle", "Complete Spring Foraging Bundle", "Complete Summer Foraging Bundle", "Complete Construction Bundle", "Make progress on Boiler Room bundles"],
            items: [
              "Complete Spring Crops Bundle",
              "Complete Summer Crops Bundle",
              "Complete Spring Foraging Bundle",
              "Complete Summer Foraging Bundle",
              "Complete Construction Bundle",
              "Make progress on Boiler Room bundles",
            ],
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
            how: {"Find the entrance to the Ridge Forest": "North of The Ridge, behind a large log.", "Clear the large log blocking access": "Needs a Steel Axe.", "Find the Ninja House": "East side of The Ridge. Open 8 AM to 8 PM, closed on festival days.", "Read available clues/books": "The red book and the Ancient Book are both in the Ninja House.", "Begin The Preparations when it becomes available": "It starts when you enter the Ninja House after visiting the Ridge Forest. The Seer gives it through her subjects."},
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
            how: {"Find the quest’s required cursed artifacts": "The red book in the Ninja House has the details.", "Collect required special forage/items": "The quest asks for 50 Mountain Mistbloom.", "Turn in The Preparations": "Donate the items in the deposit box in the Ninja House."},
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
          {
            label: "Community Center",
            hidden: ["Finish Fall Crops", "Finish Fall Foraging", "Finish Boiler Room", "Finish Vault", "Finish Pantry or get very close", "Check remaining Fish Tank items", "Check remaining Bulletin Board items"],
            items: [
              "Finish Fall Crops",
              "Finish Fall Foraging",
              "Finish Boiler Room",
              "Finish Vault",
              "Finish Pantry or get very close",
              "Check remaining Fish Tank items",
              "Check remaining Bulletin Board items",
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
              "Reach the bottom of Skull Cavern at least once if desired",
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
];
