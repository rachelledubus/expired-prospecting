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
};

export type GamePhase = {
  id: string;
  title: string;
  when: string;
  callout?: { lead: string; text: string };
  groups: GameGroup[];
  footer?: { warn?: boolean; lead: string; text: string };
};

/** A phase-by-phase checklist: only the first unfinished phase is open. */
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
      text: "Only work on the first section that still has unchecked boxes.",
      notLabel: "You do NOT need to:",
      not: [
        "Complete every quest immediately",
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
    phases: [
      {
        id: "p1",
        title: "Right Now",
        when: "Spring 10 to 19, Year 1",
        groups: [
          {
            label: "Main Progression",
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
        title: "Late Spring",
        when: "Spring 20 to 28",
        callout: { lead: "", text: "Unlock this section after reaching Spring 20." },
        groups: [
          {
            label: "Ridgeside Transportation Quest",
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
            items: [
              "Reach Mine Floor 50",
              "Reach Mine Floor 60",
              "Reach Mine Floor 70",
              "Reach Mine Floor 80",
              "Obtain the Firewalker Boots",
              "Upgrade Pickaxe to Steel when affordable",
            ],
          },
          { label: "Marlon", items: ["Reach 3 hearts with Marlon", "Reach 4 hearts with Marlon"] },
          {
            label: "Mateo",
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
        title: "Early Summer",
        when: "Summer 1 to 14",
        callout: { lead: "Main goal:", text: "Finish the regular Mines." },
        groups: [
          {
            label: "Mining Progression",
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
        title: "Late Summer",
        when: "Summer 15 to 28",
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
        title: "Fall, Year 1",
        when: "Adventure Season",
        callout: {
          lead: "",
          text: "Your farm should now be stable enough that you don’t have to spend every day maintaining it.",
        },
        groups: [
          {
            label: "Ridgeside Main Campaign",
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
        title: "Winter, Year 1",
        when: "Quest Season",
        callout: { lead: "", text: "Winter is for story content." },
        groups: [
          {
            label: "Ridgeside",
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
        title: "Year 2",
        when: "Expansion Era",
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
        title: "Completionist Era",
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
