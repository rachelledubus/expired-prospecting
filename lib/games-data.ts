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

export type Game = {
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

/** Every box key a game can have, used to reject anything else on save. */
export function knownCheckKeys(game: Game): Set<string> {
  const keys = new Set<string>();
  game.objectives.next.forEach((t) => keys.add(objKey(game.id, t)));
  game.phases.forEach((p) =>
    p.groups.forEach((g) => g.items.forEach((t) => keys.add(itemKey(game.id, p.id, g.label, t)))),
  );
  return keys;
}

/** Every text-field key a game can have. */
export function knownFieldKeys(game: Game): Set<string> {
  const keys = new Set<string>([saveKey(game.id)]);
  game.phases.forEach((p) => p.groups.forEach((g) => g.field && keys.add(fieldKey(game.id, p.id, g.field))));
  return keys;
}

export const GAMES: Game[] = [
  {
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
];
