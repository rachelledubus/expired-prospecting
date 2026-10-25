/** Terraria + Spirit Classic playthrough from new world to Moon Lord.
 * Data sources: Spirit Classic Wiki / Quests / Mod progression / Bosses; official Terraria progression.
 * Every id is stable and is persisted using the existing Games progress API.
 * The order of the route is a suggested play path, not an automatic in-game progression detector.
 */
export type TerrariaStep = { id: string; label: string; how?: string };
export type TerrariaStage = {
 id: string; title: string; chapter: "pre" | "hard" | "end"; track: "route" | "quest" | "side";
 summary: string; steps: TerrariaStep[]; source?: string; boss?: string; unlockAll?: string[]; unlockAny?: string[];
};
export type TerrariaBoss = { name: string; stageId: string; stepId: string; chapter: "pre" | "hard" | "end"; optional: boolean };
export type TerrariaGame = {
 kind: "terraria"; id: string; tab: string; title: string; mods: string;
 stages: TerrariaStage[]; bosses: TerrariaBoss[];
};
export const TERRARIA_GAME: TerrariaGame = {
  "kind": "terraria",
  "id": "terraria-spirit",
  "tab": "Terraria · Spirit",
  "title": "Terraria — Spirit Classic",
  "mods": "Terraria + Spirit Classic",
  "stages": [
    {
      "id": "first-day",
      "title": "Your first day",
      "chapter": "pre",
      "track": "route",
      "summary": "Get settled before searching for Spirit's quests.",
      "steps": [
        {
          "id": "a1",
          "label": "Create a new Terraria world with Spirit Classic enabled in tModLoader."
        },
        {
          "id": "a2",
          "label": "Talk to the Guide and chop enough trees for basic tools and shelter."
        },
        {
          "id": "a3",
          "label": "Build at least two valid NPC houses."
        },
        {
          "id": "a4",
          "label": "Craft a Work Bench, Torches, and a Furnace."
        },
        {
          "id": "a5",
          "label": "Explore the nearby surface and locate a cave entrance."
        },
        {
          "id": "a6",
          "label": "Find a mobility accessory and improve your weapon before descending underground."
        }
      ]
    },
    {
      "id": "briar-adventurer",
      "title": "Find the Adventurer & Quest Book",
      "chapter": "pre",
      "track": "route",
      "summary": "The key unlock for turning Spirit Classic into a questing game.",
      "steps": [
        {
          "id": "a1",
          "label": "Look for the Briar biome's root-like entrance on the surface."
        },
        {
          "id": "a2",
          "label": "Bring ropes, platforms, and torches before descending.",
          "how": "The Underground Briar has a long vertical drop."
        },
        {
          "id": "a3",
          "label": "Explore the Underground Briar's connected tunnels and huts."
        },
        {
          "id": "a4",
          "label": "Find the Ensnared Adventurer in a Briar Hut."
        },
        {
          "id": "a5",
          "label": "Talk to the Adventurer to rescue him."
        },
        {
          "id": "a6",
          "label": "Choose the Adventurer's Quest option to unlock the Quest Book.",
          "how": "Open inventory and find the Quest Book icon near your health bar."
        },
        {
          "id": "a7",
          "label": "Build a home for the Adventurer so you can visit his shop and quest dialogue."
        }
      ],
      "source": "https://spiritmod.wiki.gg/wiki/Adventurer"
    },
    {
      "id": "first-adventure",
      "title": "Spirit quest: The First Adventure",
      "chapter": "pre",
      "track": "route",
      "summary": "A real Spirit main quest that introduces active quests and rewards.",
      "steps": [
        {
          "id": "a1",
          "label": "Open the Quest Book and find The First Adventure."
        },
        {
          "id": "a2",
          "label": "Activate the quest from its Available tab.",
          "how": "Only active quests accumulate progress; you can have up to five active."
        },
        {
          "id": "a3",
          "label": "Explore the Forest surface at night to find Hookbats."
        },
        {
          "id": "a4",
          "label": "Collect 3 Durasilk Sheaves from Hookbats."
        },
        {
          "id": "a5",
          "label": "Obtain or craft the Wayfarer's Hat."
        },
        {
          "id": "a6",
          "label": "Obtain or craft the Wayfarer's Rucksack."
        },
        {
          "id": "a7",
          "label": "Obtain or craft the Wayfarer's Pants."
        },
        {
          "id": "a8",
          "label": "Check the Completed tab and claim the quest reward."
        }
      ],
      "source": "https://spiritmod.wiki.gg/wiki/Quests"
    },
    {
      "id": "desert-scarabeus",
      "title": "The desert and Scarabeus",
      "chapter": "pre",
      "track": "route",
      "summary": "First Spirit boss and a reason to explore the Desert.",
      "steps": [
        {
          "id": "a1",
          "label": "Scout the Desert and gather mobility and healing supplies."
        },
        {
          "id": "a2",
          "label": "Make a level fighting area and set a nearby spawn point."
        },
        {
          "id": "a3",
          "label": "Obtain a Scarab Idol.",
          "how": "Check the Guide's crafting recipes or Spirit Wiki if you lack the materials."
        },
        {
          "id": "a4",
          "label": "Summon Scarabeus in the Desert during daytime."
        },
        {
          "id": "a5",
          "label": "Defeat Scarabeus and collect its drops."
        },
        {
          "id": "a6",
          "label": "Check the Quest Book for newly available assignments."
        }
      ],
      "boss": "Scarabeus",
      "source": "https://spiritmod.wiki.gg/wiki/Bosses"
    },
    {
      "id": "eye-jelly",
      "title": "Eye of Cthulhu & Jelly Deluge",
      "chapter": "pre",
      "track": "route",
      "summary": "Vanilla progression opens Spirit's space event and Moon Jelly Wizard.",
      "steps": [
        {
          "id": "a1",
          "label": "Craft or find a Suspicious Looking Eye, or prepare for the natural Eye spawn."
        },
        {
          "id": "a2",
          "label": "Build a long platform arena with campfires and mobility equipment."
        },
        {
          "id": "a3",
          "label": "Defeat the Eye of Cthulhu."
        },
        {
          "id": "a4",
          "label": "Go to the Space layer at night and watch for Jelly Deluge.",
          "how": "Alternatively, use its summon item when available."
        },
        {
          "id": "a5",
          "label": "Obtain a Dreamlight Jelly during the event."
        },
        {
          "id": "a6",
          "label": "Summon and defeat Moon Jelly Wizard."
        },
        {
          "id": "a7",
          "label": "Claim any quest rewards unlocked by these boss victories."
        }
      ],
      "boss": "Moon Jelly Wizard",
      "source": "https://spiritmod.wiki.gg/wiki/Jelly_Deluge"
    },
    {
      "id": "evil-and-briar",
      "title": "World evil & Briar depths",
      "chapter": "pre",
      "track": "route",
      "summary": "Progress the evil biome boss and return for a major Spirit fight.",
      "steps": [
        {
          "id": "a1",
          "label": "Prepare gear and explore your world's Corruption or Crimson."
        },
        {
          "id": "a2",
          "label": "Destroy Shadow Orbs or Crimson Hearts, or craft the appropriate boss summon."
        },
        {
          "id": "a3",
          "label": "Defeat Eater of Worlds (Corruption) or Brain of Cthulhu (Crimson)."
        },
        {
          "id": "a4",
          "label": "Return to the Briar with improved gear and mobility."
        },
        {
          "id": "a5",
          "label": "Collect Floran Ore and Enchanted Leaves for available upgrades."
        },
        {
          "id": "a6",
          "label": "Find the flower at the bottom of the Briar."
        },
        {
          "id": "a7",
          "label": "Interact with the flower and defeat Vinewrath Bane."
        }
      ],
      "boss": "Vinewrath Bane",
      "source": "https://spiritmod.wiki.gg/wiki/Guide:Mod_progression"
    },
    {
      "id": "sky-and-jungle",
      "title": "Ancient Avian & Jungle",
      "chapter": "pre",
      "track": "route",
      "summary": "A sky boss, Jungle exploration, and more equipment before the Dungeon.",
      "steps": [
        {
          "id": "a1",
          "label": "Improve your jumping or flying mobility for the Space layer."
        },
        {
          "id": "a2",
          "label": "Find the Ancient Avian summoning route.",
          "how": "Check the summon recipe and biome conditions in Spirit's Bosses guide."
        },
        {
          "id": "a3",
          "label": "Defeat Ancient Avian near the Space layer."
        },
        {
          "id": "a4",
          "label": "Explore the Underground Jungle and obtain useful loot."
        },
        {
          "id": "a6",
          "label": "Upgrade armor, healing, and accessories before Skeletron."
        }
      ],
      "boss": "Ancient Avian",
      "source": "https://spiritmod.wiki.gg/wiki/Bosses"
    },
    {
      "id": "dungeon",
      "title": "Skeletron & the Dungeon",
      "chapter": "pre",
      "track": "route",
      "summary": "Unlock Dungeon exploration and major pre-Hardmode equipment.",
      "steps": [
        {
          "id": "a1",
          "label": "Find the Dungeon entrance and set up an arena outside."
        },
        {
          "id": "a2",
          "label": "Talk to the Old Man at night and start the Skeletron encounter."
        },
        {
          "id": "a3",
          "label": "Defeat Skeletron to safely access the Dungeon."
        },
        {
          "id": "a4",
          "label": "Explore the Dungeon and free the Mechanic when found."
        },
        {
          "id": "a5",
          "label": "Search for useful mobility and defensive accessories and a Shadow Key."
        },
        {
          "id": "a6",
          "label": "Collect Dungeon materials for upgrades."
        }
      ],
      "boss": "Skeletron",
      "source": "https://terraria.wiki.gg/wiki/Guide:Game_progression"
    },
    {
      "id": "tide-and-stars",
      "title": "The Tide & Starplate Voyager",
      "chapter": "pre",
      "track": "route",
      "summary": "Complete Spirit's Ocean event and final pre-Hardmode Spirit boss.",
      "steps": [
        {
          "id": "a1",
          "label": "Reach the Ocean and check for Spirit's coastal additions."
        },
        {
          "id": "a2",
          "label": "Obtain or craft a Seabreak Pearl."
        },
        {
          "id": "a3",
          "label": "Trigger The Tide at the Ocean."
        },
        {
          "id": "a4",
          "label": "Survive its waves and defeat the R'lyehian miniboss."
        },
        {
          "id": "a5",
          "label": "Visit the Asteroid Field high above an Ocean."
        },
        {
          "id": "a6",
          "label": "Locate an Astralite Beacon."
        },
        {
          "id": "a7",
          "label": "Summon and defeat Starplate Voyager at the beacon."
        },
        {
          "id": "a8",
          "label": "Collect Astralite materials and review any new quest rewards."
        }
      ],
      "boss": "Starplate Voyager",
      "source": "https://spiritmod.wiki.gg/wiki/Guide:Mod_progression"
    },
    {
      "id": "hardmode-gate",
      "title": "Wall of Flesh: change the world",
      "chapter": "pre",
      "track": "route",
      "summary": "Prepare the base and formally unlock Terraria's second half.",
      "steps": [
        {
          "id": "a1",
          "label": "Explore the Underworld and gather Hellstone or other late pre-Hardmode materials."
        },
        {
          "id": "a2",
          "label": "Upgrade armor, weapons, healing, and mobility."
        },
        {
          "id": "a3",
          "label": "Build a long, unobstructed bridge in the Underworld."
        },
        {
          "id": "a4",
          "label": "Make sure you're ready for stronger enemies and new biomes."
        },
        {
          "id": "a5",
          "label": "Defeat Wall of Flesh by dropping a Guide Voodoo Doll into Underworld lava while the Guide is alive."
        },
        {
          "id": "a6",
          "label": "Collect the Pwnhammer and your new Hardmode loot."
        }
      ],
      "boss": "Wall of Flesh",
      "source": "https://terraria.wiki.gg/wiki/Guide:Game_progression"
    },
    {
      "id": "hardmode-first",
      "title": "Hardmode arrival & Infernon",
      "chapter": "hard",
      "track": "route",
      "summary": "Discover Hardmode materials and Spirit's first Hardmode boss.",
      "steps": [
        {
          "id": "a1",
          "label": "Check your base, NPC housing, and newly spread Hallow and evil biome."
        },
        {
          "id": "a2",
          "label": "Upgrade your weapons and armor with new Hardmode resources."
        },
        {
          "id": "a3",
          "label": "Explore the Hardmode Underworld for new Spirit resources."
        },
        {
          "id": "a4",
          "label": "Obtain or craft the Pain Caller."
        },
        {
          "id": "a5",
          "label": "Summon Infernon in the Underworld."
        },
        {
          "id": "a6",
          "label": "Defeat Infernon and use its Torment Shards for upgrades."
        }
      ],
      "boss": "Infernon",
      "source": "https://spiritmod.wiki.gg/wiki/Bosses"
    },
    {
      "id": "mechs-and-dusking",
      "title": "Mechanical bosses & Dusking",
      "chapter": "hard",
      "track": "route",
      "summary": "Advance ore tiers and unlock the next major game milestones.",
      "steps": [
        {
          "id": "a1",
          "label": "Improve mobility, accessories, buff potions, and arena platforms."
        },
        {
          "id": "a2",
          "label": "Obtain a Mechanical Worm and defeat The Destroyer."
        },
        {
          "id": "a3",
          "label": "Obtain a Mechanical Eye and defeat The Twins."
        },
        {
          "id": "a4",
          "label": "Obtain a Mechanical Skull and defeat Skeletron Prime."
        },
        {
          "id": "a5",
          "label": "Obtain or craft a Dusk Crown."
        },
        {
          "id": "a6",
          "label": "Summon Dusking at night and defeat it."
        },
        {
          "id": "a7",
          "label": "Claim the new Hardmode materials and shop unlocks."
        }
      ],
      "boss": "Dusking",
      "source": "https://spiritmod.wiki.gg/wiki/Bosses"
    },
    {
      "id": "spirit-biome",
      "title": "Explore Spirit biome & Mystic Moon",
      "chapter": "hard",
      "track": "route",
      "summary": "Investigate Spirit's new Hardmode environments and optional night event.",
      "steps": [
        {
          "id": "a1",
          "label": "Look for the Spirit biome and its underground extension."
        },
        {
          "id": "a2",
          "label": "Explore a new structure or cave in the Spirit biome."
        },
        {
          "id": "a3",
          "label": "Collect newly available Spirit materials and loot."
        },
        {
          "id": "a4",
          "label": "Check NPC shops and the Spirit Quest Book for Hardmode quests."
        },
        {
          "id": "a5",
          "label": "Upgrade equipment using a new Spirit recipe."
        }
      ],
      "source": "https://spiritmod.wiki.gg/wiki/Events"
    },
    {
      "id": "jungle-temple",
      "title": "Plantera & the Jungle Temple",
      "chapter": "hard",
      "track": "route",
      "summary": "Push through vanilla's major mid-Hardmode unlocks.",
      "steps": [
        {
          "id": "a1",
          "label": "Explore the Hardmode Underground Jungle and find a Plantera's Bulb."
        },
        {
          "id": "a2",
          "label": "Build a Jungle arena and prepare healing and damage buffs."
        },
        {
          "id": "a3",
          "label": "Defeat Plantera."
        },
        {
          "id": "a4",
          "label": "Use the Temple Key to enter the Jungle Temple."
        },
        {
          "id": "a5",
          "label": "Find Lihzahrd Power Cells and the altar."
        },
        {
          "id": "a6",
          "label": "Defeat Golem and claim its drops."
        }
      ],
      "boss": "Golem",
      "source": "https://terraria.wiki.gg/wiki/Guide:Game_progression"
    },
    {
      "id": "atlas",
      "title": "Atlas: Spirit's final boss",
      "chapter": "end",
      "track": "route",
      "summary": "Face the last Spirit Classic boss before the lunar finale.",
      "steps": [
        {
          "id": "a1",
          "label": "Upgrade your gear with post-Golem and Spirit materials."
        },
        {
          "id": "a2",
          "label": "Prepare a large arena with mobility and recovery stations."
        },
        {
          "id": "a3",
          "label": "Obtain or craft a Stone Fist."
        },
        {
          "id": "a4",
          "label": "Summon Atlas in your chosen arena."
        },
        {
          "id": "a5",
          "label": "Defeat Atlas and collect its unique rewards."
        }
      ],
      "boss": "Atlas",
      "source": "https://spiritmod.wiki.gg/wiki/Bosses"
    },
    {
      "id": "celestial",
      "title": "Lunatic Cultist & Celestial Pillars",
      "chapter": "end",
      "track": "route",
      "summary": "Trigger the vanilla endgame sequence.",
      "steps": [
        {
          "id": "a1",
          "label": "Make final armor, weapon, mobility, and potion upgrades."
        },
        {
          "id": "a2",
          "label": "Return to the Dungeon entrance after defeating Golem."
        },
        {
          "id": "a3",
          "label": "Defeat the Lunatic Cultist."
        },
        {
          "id": "a4",
          "label": "Complete the Solar Pillar."
        },
        {
          "id": "a5",
          "label": "Complete the Vortex Pillar."
        },
        {
          "id": "a6",
          "label": "Complete the Nebula Pillar."
        },
        {
          "id": "a7",
          "label": "Complete the Stardust Pillar."
        },
        {
          "id": "a8",
          "label": "Prepare for Moon Lord after the fourth pillar."
        }
      ],
      "boss": "Lunatic Cultist",
      "source": "https://terraria.wiki.gg/wiki/Guide:Game_progression"
    },
    {
      "id": "moon-lord",
      "title": "Moon Lord: finish the playthrough",
      "chapter": "end",
      "track": "route",
      "summary": "Complete the main progression of Terraria + Spirit Classic.",
      "steps": [
        {
          "id": "a1",
          "label": "Set up an arena with mobility, healing, and shelter options."
        },
        {
          "id": "a2",
          "label": "Choose your best class armor, weapons, and accessories."
        },
        {
          "id": "a3",
          "label": "Prepare potions and summon options or wait for the post-pillar event."
        },
        {
          "id": "a4",
          "label": "Defeat Moon Lord."
        },
        {
          "id": "a5",
          "label": "Claim the victory loot and record your completed playthrough."
        },
        {
          "id": "a6",
          "label": "Review any optional Spirit quests, bosses, or rewards you still want."
        }
      ],
      "boss": "Moon Lord",
      "source": "https://terraria.wiki.gg/wiki/Guide:Game_progression"
    },
    {
      "id": "flowery-fiends",
      "title": "Flowery Fiends",
      "chapter": "pre",
      "track": "quest",
      "summary": "Available after The First Adventure; clear Briar enemies for rewards.",
      "steps": [
        {
          "id": "a1",
          "label": "After The First Adventure, speak with the Adventurer."
        },
        {
          "id": "a2",
          "label": "Accept Flowery Fiends when offered and activate it in Quest Book."
        },
        {
          "id": "a3",
          "label": "Defeat 12 qualifying Briar monsters (Feral Shambler, Wildwood Watcher, Blossom Hound, or Thorn Stalker)."
        },
        {
          "id": "a4",
          "label": "Open the Completed tab to claim rewards."
        }
      ],
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "unlockAll": [
        "first-adventure"
      ]
    },
    {
      "id": "cacophonous-cries",
      "title": "Cacophonous Cries",
      "chapter": "pre",
      "track": "quest",
      "summary": "An alternate early quest from the Guide, available after The First Adventure.",
      "steps": [
        {
          "id": "a1",
          "label": "Talk with the Guide after The First Adventure."
        },
        {
          "id": "a2",
          "label": "Accept and activate Cacophonous Cries in the Quest Book."
        },
        {
          "id": "a3",
          "label": "Travel to the snowy biome at night."
        },
        {
          "id": "a4",
          "label": "Defeat 2 Screech Owls while the quest is active."
        },
        {
          "id": "a5",
          "label": "Claim your rewards in the Completed tab."
        }
      ],
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "unlockAll": [
        "first-adventure"
      ]
    },
    {
      "id": "creepy-crawlies",
      "title": "Creepy Crawlies",
      "chapter": "pre",
      "track": "quest",
      "summary": "A follow-up slayer assignment unlocked after either early quest.",
      "steps": [
        {
          "id": "a1",
          "label": "Complete Flowery Fiends or Cacophonous Cries."
        },
        {
          "id": "a2",
          "label": "Speak with the Adventurer and activate Creepy Crawlies."
        },
        {
          "id": "a3",
          "label": "Explore the Cavern layer."
        },
        {
          "id": "a4",
          "label": "Defeat 8 eligible cavern monsters while the quest is active."
        },
        {
          "id": "a5",
          "label": "Claim the reward in Quest Book."
        }
      ],
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "unlockAny": [
        "flowery-fiends",
        "cacophonous-cries"
      ]
    },
    {
      "id": "bare-necessities",
      "title": "Bare Necessities",
      "chapter": "pre",
      "track": "quest",
      "summary": "Craft a workshop for the Adventurer's decorations and items.",
      "steps": [
        {
          "id": "a1",
          "label": "Complete The First Adventure."
        },
        {
          "id": "a2",
          "label": "Get Bare Necessities from the Adventurer and activate it."
        },
        {
          "id": "a3",
          "label": "Craft or acquire a Naturalist's Workshop."
        },
        {
          "id": "a4",
          "label": "Confirm it counts toward the quest and claim the reward."
        }
      ],
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "unlockAll": [
        "first-adventure"
      ]
    },
    {
      "id": "evil-explorer",
      "title": "Vile Wastes / Body Horrors",
      "chapter": "pre",
      "track": "quest",
      "summary": "Explore your world's evil biome; only one of the two quests applies to your world.",
      "steps": [
        {
          "id": "a1",
          "label": "Complete The First Adventure and talk with the Guide."
        },
        {
          "id": "a2",
          "label": "Accept Vile Wastes (Corruption) or Body Horrors (Crimson)."
        },
        {
          "id": "a3",
          "label": "Activate the correct quest from your book."
        },
        {
          "id": "a4",
          "label": "Travel roughly 250 blocks within the appropriate world-evil biome."
        },
        {
          "id": "a5",
          "label": "Claim the quest reward from the Completed tab."
        }
      ],
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "unlockAll": [
        "first-adventure"
      ]
    },
    {
      "id": "aurora-explorer",
      "title": "Lights in the Sky",
      "chapter": "pre",
      "track": "quest",
      "summary": "A short exploration quest unlocked after your world-evil expedition.",
      "steps": [
        {
          "id": "a1",
          "label": "Complete Vile Wastes or Body Horrors."
        },
        {
          "id": "a2",
          "label": "Receive and activate Lights in the Sky from the Adventurer."
        },
        {
          "id": "a3",
          "label": "Visit a Snow biome or Space during a Boreal Aurora."
        },
        {
          "id": "a4",
          "label": "Travel the distance indicated by the active quest counter."
        },
        {
          "id": "a5",
          "label": "Claim your quest reward."
        }
      ],
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "unlockAll": [
        "evil-explorer"
      ]
    },
    {
      "id": "space-rocks",
      "title": "Space Rocks",
      "chapter": "pre",
      "track": "quest",
      "summary": "Scout Spirit's Asteroid Field in the sky.",
      "steps": [
        {
          "id": "a1",
          "label": "Complete Vile Wastes or Body Horrors."
        },
        {
          "id": "a2",
          "label": "Speak with the Adventurer and activate Space Rocks."
        },
        {
          "id": "a3",
          "label": "Reach the Asteroid Field above an Ocean."
        },
        {
          "id": "a4",
          "label": "Move through the biome until the quest distance requirement is met."
        },
        {
          "id": "a5",
          "label": "Claim the Wayfinder rewards."
        }
      ],
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "unlockAll": [
        "evil-explorer"
      ]
    },
    {
      "id": "stylist-rescue",
      "title": "Wrapped Up",
      "chapter": "pre",
      "track": "quest",
      "summary": "A classic NPC rescue integrated into Spirit's quest rewards.",
      "steps": [
        {
          "id": "a1",
          "label": "Complete The First Adventure."
        },
        {
          "id": "a2",
          "label": "Talk to the Demolitionist and receive Wrapped Up."
        },
        {
          "id": "a3",
          "label": "Activate the quest in the Quest Book."
        },
        {
          "id": "a4",
          "label": "Locate the bound Stylist in an underground Spider Nest."
        },
        {
          "id": "a5",
          "label": "Talk to the Stylist and complete the rescue."
        },
        {
          "id": "a6",
          "label": "Claim rewards from the Quest Book."
        }
      ],
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "unlockAll": [
        "first-adventure"
      ]
    },
    {
      "id": "hardmode-quests",
      "title": "New Hardmode quest board",
      "chapter": "hard",
      "track": "quest",
      "summary": "Track later and branching quests without pretending every offer unlocks simultaneously.",
      "steps": [
        {
          "id": "a1",
          "label": "Return to the Adventurer after entering Hardmode."
        },
        {
          "id": "a2",
          "label": "Look for orange exclamation points above town NPCs."
        },
        {
          "id": "a3",
          "label": "Check Available quests and activate one that interests you."
        },
        {
          "id": "a4",
          "label": "Complete the exact objectives given in your in-game Quest Book."
        },
        {
          "id": "a5",
          "label": "Claim the reward in Completed and check for unlocked shop stock."
        }
      ],
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "unlockAll": [
        "hardmode-gate"
      ]
    },
    {
      "id": "bonus-bosses",
      "title": "Optional vanilla boss detours",
      "chapter": "pre",
      "track": "side",
      "summary": "These give worthwhile loot but aren't necessary to reach Hardmode.",
      "steps": [
        {
          "id": "a1",
          "label": "Defeat King Slime if you want its early accessories."
        },
        {
          "id": "a2",
          "label": "Defeat Queen Bee for Bee-themed loot or summoner gear."
        },
        {
          "id": "a3",
          "label": "Defeat Deerclops in the Snow biome for special equipment."
        },
        {
          "id": "a4",
          "label": "Catch up on any unfinished NPC rescue events."
        }
      ],
      "source": "https://terraria.wiki.gg/wiki/Guide:Game_progression"
    },
    {
      "id": "bonus-hardmode",
      "title": "Optional Hardmode challenges",
      "chapter": "hard",
      "track": "side",
      "summary": "Extra battles, Spirit events and rewards without delaying the main route.",
      "steps": [
        {
          "id": "a1",
          "label": "Defeat Queen Slime if you want her gear."
        },
        {
          "id": "a2",
          "label": "Try the Mystic Moon night event and loot upgrades."
        },
        {
          "id": "a3",
          "label": "Defeat Duke Fishron when you have strong mobility."
        },
        {
          "id": "a4",
          "label": "Defeat Empress of Light when ready for the bullet-hell fight."
        },
        {
          "id": "a5",
          "label": "Complete any new Spirit Quest Book branches you haven't tried."
        }
      ],
      "source": "https://spiritmod.wiki.gg/wiki/Events"
    },
    {
      "id": "postgame",
      "title": "Post-Moon-Lord completion",
      "chapter": "end",
      "track": "side",
      "summary": "Use as an optional finish line, not as a requirement to consider the playthrough complete.",
      "steps": [
        {
          "id": "a1",
          "label": "Replay any Spirit bosses for favorite loot or collectibles."
        },
        {
          "id": "a2",
          "label": "Finish optional NPC quests and claim pending rewards."
        },
        {
          "id": "a3",
          "label": "Explore structures or Spirit biome pockets you haven't visited."
        },
        {
          "id": "a4",
          "label": "Try another class build or finish special weapon sets."
        },
        {
          "id": "a5",
          "label": "Mark this playthrough fully complete when you're satisfied."
        }
      ],
      "source": "https://spiritmod.wiki.gg/wiki/Spirit_Classic"
    },
    {
      "id": "heart-cause",
      "title": "Heart to the Cause",
      "chapter": "pre",
      "track": "quest",
      "summary": "After The First Adventure: the Guide wants you to find a Life Crystal.",
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "steps": [
        {
          "id": "a1",
          "label": "Complete The First Adventure and ask the Guide for Heart to the Cause."
        },
        {
          "id": "a2",
          "label": "Activate Heart to the Cause in the Quest Book."
        },
        {
          "id": "a3",
          "label": "Explore underground until you obtain a Life Crystal."
        },
        {
          "id": "a4",
          "label": "Claim the quest reward from Completed."
        }
      ],
      "unlockAll": [
        "first-adventure"
      ]
    },
    {
      "id": "idle-idol",
      "title": "Idle Idol",
      "chapter": "pre",
      "track": "quest",
      "summary": "A short desert relic quest that eventually leads to Scarabeus.",
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "steps": [
        {
          "id": "a1",
          "label": "Complete The First Adventure, then ask the Adventurer about Idle Idol."
        },
        {
          "id": "a2",
          "label": "Activate Idle Idol and search the Desert for a Decrepit Idol."
        },
        {
          "id": "a3",
          "label": "Obtain the Decrepit Idol and talk to the Adventurer."
        },
        {
          "id": "a4",
          "label": "Claim the quest reward, including a Scarab Idol."
        }
      ],
      "unlockAll": [
        "first-adventure"
      ]
    },
    {
      "id": "sinister-sands",
      "title": "Sinister Sands",
      "chapter": "pre",
      "track": "quest",
      "summary": "Beat Scarabeus as a quest objective after retrieving the relic.",
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "steps": [
        {
          "id": "a1",
          "label": "Complete Idle Idol and receive Sinister Sands from the Adventurer."
        },
        {
          "id": "a2",
          "label": "Activate Sinister Sands in the Quest Book."
        },
        {
          "id": "a3",
          "label": "Summon Scarabeus in the Desert during the day."
        },
        {
          "id": "a4",
          "label": "Defeat Scarabeus while the quest is active."
        },
        {
          "id": "a5",
          "label": "Claim the reward from the Quest Book."
        }
      ],
      "unlockAll": [
        "idle-idol"
      ]
    },
    {
      "id": "return-roots",
      "title": "A Return to Your Roots",
      "chapter": "pre",
      "track": "quest",
      "summary": "A main Quest Book assignment to face Vinewrath Bane.",
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "steps": [
        {
          "id": "a1",
          "label": "Complete Flowery Fiends and talk with the Adventurer."
        },
        {
          "id": "a2",
          "label": "Activate A Return to Your Roots."
        },
        {
          "id": "a3",
          "label": "Travel to the bottom of the Underground Briar."
        },
        {
          "id": "a4",
          "label": "Summon and defeat Vinewrath Bane with the quest active."
        },
        {
          "id": "a5",
          "label": "Claim the thorn-themed reward."
        }
      ],
      "unlockAll": [
        "flowery-fiends"
      ]
    },
    {
      "id": "strange-seas",
      "title": "Strange Seas",
      "chapter": "pre",
      "track": "quest",
      "summary": "A Spirit quest that points you to The Tide and its miniboss.",
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "steps": [
        {
          "id": "a1",
          "label": "Defeat Skeletron to meet the unlocking condition."
        },
        {
          "id": "a2",
          "label": "Accept and activate Strange Seas from the Adventurer."
        },
        {
          "id": "a3",
          "label": "Obtain a Seabreak Pearl."
        },
        {
          "id": "a4",
          "label": "Travel to the Ocean and begin The Tide event."
        },
        {
          "id": "a5",
          "label": "Defeat R'lyehian while the quest is active."
        },
        {
          "id": "a6",
          "label": "Claim the Ancient Diver equipment reward."
        }
      ],
      "unlockAll": [
        "dungeon"
      ]
    },
    {
      "id": "raiding-stars",
      "title": "Raiding the Stars",
      "chapter": "pre",
      "track": "quest",
      "summary": "Post-Skeletron Asteroid Field combat assignment.",
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "steps": [
        {
          "id": "a1",
          "label": "Defeat Skeletron and ask the Adventurer for Raiding the Stars."
        },
        {
          "id": "a2",
          "label": "Activate Raiding the Stars in the Quest Book."
        },
        {
          "id": "a3",
          "label": "Travel to the Asteroid Field and defeat two Stardancers."
        },
        {
          "id": "a4",
          "label": "Obtain Energized Metal as required."
        },
        {
          "id": "a5",
          "label": "Claim the quest reward."
        }
      ],
      "unlockAll": [
        "dungeon"
      ]
    },
    {
      "id": "decrepit-depths",
      "title": "Decrepit Depths",
      "chapter": "pre",
      "track": "quest",
      "summary": "Search dangerous underground ruins for a Sepulchre Chest.",
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "steps": [
        {
          "id": "a1",
          "label": "Finish Heart to the Cause and ask the Adventurer for Decrepit Depths."
        },
        {
          "id": "a2",
          "label": "Activate the quest and prepare ropes, torches and mining equipment."
        },
        {
          "id": "a3",
          "label": "Find a Dark Sepulchre in the Cavern layer."
        },
        {
          "id": "a4",
          "label": "Obtain a Sepulchre Chest."
        },
        {
          "id": "a5",
          "label": "Claim the decorative and treasure-related rewards."
        }
      ],
      "unlockAll": [
        "heart-cause"
      ]
    },
    {
      "id": "sky-high",
      "title": "Sky High",
      "chapter": "pre",
      "track": "quest",
      "summary": "Search Spirit's floating pagodas for an ornate staff.",
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "steps": [
        {
          "id": "a1",
          "label": "Complete Heart to the Cause."
        },
        {
          "id": "a2",
          "label": "Accept and activate Sky High."
        },
        {
          "id": "a3",
          "label": "Look for Floating Pagodas in the skies near the oceans."
        },
        {
          "id": "a4",
          "label": "Obtain the Staff of the Jade Dragon."
        },
        {
          "id": "a5",
          "label": "Claim the Jade Dragon-related quest reward."
        }
      ],
      "unlockAll": [
        "heart-cause"
      ]
    },
    {
      "id": "ancestral-worship",
      "title": "Ancestral Worship",
      "chapter": "pre",
      "track": "quest",
      "summary": "Create a Briar monument after finishing Bare Necessities.",
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "steps": [
        {
          "id": "a1",
          "label": "Finish Bare Necessities and accept Ancestral Worship."
        },
        {
          "id": "a2",
          "label": "Activate the quest from your Quest Book."
        },
        {
          "id": "a3",
          "label": "Acquire or craft the Statue of the Old Gods."
        },
        {
          "id": "a4",
          "label": "Claim the Briar-themed crafting and decoration rewards."
        }
      ],
      "unlockAll": [
        "bare-necessities"
      ]
    },
    {
      "id": "unidentified-floaters",
      "title": "Unidentified Floaters",
      "chapter": "pre",
      "track": "quest",
      "summary": "Investigate a Jelly Deluge and capture Dreamlight Jelly.",
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "steps": [
        {
          "id": "a1",
          "label": "Defeat a qualifying early boss and ask the Adventurer about Unidentified Floaters."
        },
        {
          "id": "a2",
          "label": "Activate the quest."
        },
        {
          "id": "a3",
          "label": "Visit the surface or Space during a Jelly Deluge and meet the distance objective."
        },
        {
          "id": "a4",
          "label": "Obtain Dreamlight Jelly."
        },
        {
          "id": "a5",
          "label": "Claim the Distress Jelly quest reward."
        }
      ],
      "unlockAny": [
        "desert-scarabeus:a5",
        "eye-jelly:a3",
        "evil-and-briar:a3"
      ]
    },
    {
      "id": "rocky-road",
      "title": "Rocky Road",
      "chapter": "pre",
      "track": "quest",
      "summary": "An exploration quest through underground Granite Caves.",
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "steps": [
        {
          "id": "a1",
          "label": "Finish Vile Wastes or Body Horrors, then accept Rocky Road."
        },
        {
          "id": "a2",
          "label": "Activate the quest."
        },
        {
          "id": "a3",
          "label": "Find a Granite Cave while exploring underground."
        },
        {
          "id": "a4",
          "label": "Travel the required distance inside the Granite Cave."
        },
        {
          "id": "a5",
          "label": "Claim the Capacitor gear and other rewards."
        }
      ],
      "unlockAll": [
        "evil-explorer"
      ]
    },
    {
      "id": "rescue-bandit",
      "title": "Friend Safari",
      "chapter": "pre",
      "track": "quest",
      "summary": "A conditional NPC rescue quest; only available when the Bandit Hideout generated.",
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "steps": [
        {
          "id": "a1",
          "label": "Complete Heart to the Cause and confirm your world has a Bandit Hideout."
        },
        {
          "id": "a2",
          "label": "Ask the Adventurer for Friend Safari and activate it."
        },
        {
          "id": "a3",
          "label": "Search the Bandit Hideout for the bound Bandit."
        },
        {
          "id": "a4",
          "label": "Talk to the Bandit to rescue him."
        },
        {
          "id": "a5",
          "label": "Claim the quest reward and house the rescued Bandit."
        }
      ],
      "unlockAll": [
        "heart-cause"
      ]
    },
    {
      "id": "rescue-gambler",
      "title": "Breaking and Entering",
      "chapter": "pre",
      "track": "quest",
      "summary": "A conditional NPC rescue quest for worlds with the Goblin Tower / Arcane Tower.",
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "steps": [
        {
          "id": "a1",
          "label": "Complete Heart to the Cause and confirm the appropriate tower generated."
        },
        {
          "id": "a2",
          "label": "Receive and activate Breaking and Entering."
        },
        {
          "id": "a3",
          "label": "Explore the tower and talk to the bound Gambler."
        },
        {
          "id": "a4",
          "label": "Obtain a Shadowbreak Wand."
        },
        {
          "id": "a5",
          "label": "Claim the Quest Book reward and house the Gambler."
        }
      ],
      "unlockAll": [
        "heart-cause"
      ]
    },
    {
      "id": "taming-stars",
      "title": "Taming the Stars",
      "chapter": "hard",
      "track": "quest",
      "summary": "A Hardmode aurora-themed quest with a special mount reward.",
      "source": "https://spiritmod.wiki.gg/wiki/Quests",
      "steps": [
        {
          "id": "a1",
          "label": "Defeat Wall of Flesh."
        },
        {
          "id": "a2",
          "label": "Receive Taming the Stars from the Adventurer and activate it."
        },
        {
          "id": "a3",
          "label": "Obtain an Ice Berry."
        },
        {
          "id": "a4",
          "label": "Obtain an Aurora Saddle."
        },
        {
          "id": "a5",
          "label": "Claim the completed quest reward."
        }
      ],
      "unlockAll": [
        "hardmode-gate"
      ]
    }
  ],
  "bosses": [
    {
      "name": "Scarabeus",
      "stageId": "desert-scarabeus",
      "stepId": "a5",
      "chapter": "pre",
      "optional": false
    },
    {
      "name": "Eye of Cthulhu",
      "stageId": "eye-jelly",
      "stepId": "a3",
      "chapter": "pre",
      "optional": false
    },
    {
      "name": "Moon Jelly Wizard",
      "stageId": "eye-jelly",
      "stepId": "a6",
      "chapter": "pre",
      "optional": false
    },
    {
      "name": "Eater of Worlds / Brain of Cthulhu",
      "stageId": "evil-and-briar",
      "stepId": "a3",
      "chapter": "pre",
      "optional": false
    },
    {
      "name": "Vinewrath Bane",
      "stageId": "evil-and-briar",
      "stepId": "a7",
      "chapter": "pre",
      "optional": false
    },
    {
      "name": "Ancient Avian",
      "stageId": "sky-and-jungle",
      "stepId": "a3",
      "chapter": "pre",
      "optional": false
    },
    {
      "name": "Queen Bee",
      "stageId": "bonus-bosses",
      "stepId": "a2",
      "chapter": "pre",
      "optional": true
    },
    {
      "name": "Skeletron",
      "stageId": "dungeon",
      "stepId": "a3",
      "chapter": "pre",
      "optional": false
    },
    {
      "name": "Starplate Voyager",
      "stageId": "tide-and-stars",
      "stepId": "a7",
      "chapter": "pre",
      "optional": false
    },
    {
      "name": "Wall of Flesh",
      "stageId": "hardmode-gate",
      "stepId": "a5",
      "chapter": "pre",
      "optional": false
    },
    {
      "name": "Infernon",
      "stageId": "hardmode-first",
      "stepId": "a6",
      "chapter": "hard",
      "optional": false
    },
    {
      "name": "The Destroyer",
      "stageId": "mechs-and-dusking",
      "stepId": "a2",
      "chapter": "hard",
      "optional": false
    },
    {
      "name": "The Twins",
      "stageId": "mechs-and-dusking",
      "stepId": "a3",
      "chapter": "hard",
      "optional": false
    },
    {
      "name": "Skeletron Prime",
      "stageId": "mechs-and-dusking",
      "stepId": "a4",
      "chapter": "hard",
      "optional": false
    },
    {
      "name": "Dusking",
      "stageId": "mechs-and-dusking",
      "stepId": "a6",
      "chapter": "hard",
      "optional": false
    },
    {
      "name": "Plantera",
      "stageId": "jungle-temple",
      "stepId": "a3",
      "chapter": "hard",
      "optional": false
    },
    {
      "name": "Golem",
      "stageId": "jungle-temple",
      "stepId": "a6",
      "chapter": "hard",
      "optional": false
    },
    {
      "name": "Atlas",
      "stageId": "atlas",
      "stepId": "a5",
      "chapter": "end",
      "optional": false
    },
    {
      "name": "Lunatic Cultist",
      "stageId": "celestial",
      "stepId": "a3",
      "chapter": "end",
      "optional": false
    },
    {
      "name": "Moon Lord",
      "stageId": "moon-lord",
      "stepId": "a4",
      "chapter": "end",
      "optional": false
    },
    {
      "name": "King Slime",
      "stageId": "bonus-bosses",
      "stepId": "a1",
      "chapter": "pre",
      "optional": true
    },
    {
      "name": "Deerclops",
      "stageId": "bonus-bosses",
      "stepId": "a3",
      "chapter": "pre",
      "optional": true
    },
    {
      "name": "Queen Slime",
      "stageId": "bonus-hardmode",
      "stepId": "a1",
      "chapter": "hard",
      "optional": true
    },
    {
      "name": "Duke Fishron",
      "stageId": "bonus-hardmode",
      "stepId": "a3",
      "chapter": "hard",
      "optional": true
    },
    {
      "name": "Empress of Light",
      "stageId": "bonus-hardmode",
      "stepId": "a4",
      "chapter": "hard",
      "optional": true
    }
  ]
};
