/** Extra actionable walkthrough instructions for Spirit Classic playthrough objectives.
 * Keys are the original stage/step IDs. Existing checkboxes are NOT modified.
 * References: https://spiritmod.wiki.gg/wiki/Quests and /Guide:Mod_progression,
 * targeted item and boss wiki pages, plus base Terraria crafting.
 */
export type TerrariaStepGuide = { place: string; action: string; items: string[]; tip: string };
export const TERRARIA_STEP_GUIDES: Record<string, TerrariaStepGuide> = {
  "first-day:a2": {
    "place": "Forest / spawn",
    "action": "Chop several trees with your starting Axe, speak to the Guide to see a recipe if needed, and save Wood for housing.",
    "items": [
      "Wood"
    ],
    "tip": "Keep your first base near spawn for easy returns."
  },
  "first-day:a3": {
    "place": "Near spawn",
    "action": "Make a room with solid side/back walls, player-placed background walls, a light, a flat table/work bench, a chair and an entry; use the Housing menu to validate.",
    "items": [
      "Wood",
      "Work Bench",
      "Torch",
      "Wooden Door"
    ],
    "tip": "Build at least two rooms for Guide and Merchant or Adventurer."
  },
  "first-day:a4": {
    "place": "At your base",
    "action": "Craft a Work Bench first, then mine Stone and farm Slimes for Torches. Use those ingredients to build a Furnace.",
    "items": [
      "Work Bench",
      "Furnace",
      "Torch"
    ],
    "tip": "An Anvil is your next crafting upgrade."
  },
  "first-day:a5": {
    "place": "Forest caves",
    "action": "Follow natural cave mouths, place Torches at branches and use Rope to avoid fall damage.",
    "items": [
      "Torch",
      "Rope",
      "Recall Potion"
    ],
    "tip": "Place lights as breadcrumbs so you can retrace the route."
  },
  "first-day:a6": {
    "place": "Underground/Cavern cabins",
    "action": "Search chests for running boots or a double jump, and mine Iron/Lead Ore for an Anvil.",
    "items": [
      "Hermes Boots",
      "Cloud in a Bottle",
      "Iron Ore",
      "Lead Ore",
      "Grappling Hook"
    ],
    "tip": "Mobility is more important than rushing your first major boss."
  },
  "briar-adventurer:a1": {
    "place": "Forest surface / below",
    "action": "Find the Briar's large root-themed entrance. If unclear, look underground for the hanging, glowing Briar vines that point into its tunnel system.",
    "items": [
      "Rope",
      "Torch"
    ],
    "tip": "The Underground Briar's central shaft is extremely deep."
  },
  "briar-adventurer:a2": {
    "place": "Briar shaft",
    "action": "Bring a long vertical Rope line, Wooden Platforms and Torches. Start the descent from the top and illuminate side exits.",
    "items": [
      "Rope",
      "Wooden Platform",
      "Torch",
      "Grappling Hook"
    ],
    "tip": "Don't drop into the shaft without a way out."
  },
  "briar-adventurer:a3": {
    "place": "Upper Underground Briar",
    "action": "Search horizontally through the hut-like structures along connected tunnels.",
    "items": [
      "Rope",
      "Torch"
    ],
    "tip": "The Ensnared Adventurer is found in a Briar Hut in the upper half of the Underground Briar in newer Spirit Classic versions."
  },
  "briar-adventurer:a4": {
    "place": "Upper Underground Briar huts",
    "action": "Look for the tied-up Adventurer NPC in one of the built Briar huts.",
    "items": [],
    "tip": "Walk up and interact; this NPC provides your whole Quest Book system."
  },
  "briar-adventurer:a5": {
    "place": "Briar hut",
    "action": "Talk to the bound NPC to free him.",
    "items": [],
    "tip": "He can then move into a valid town house."
  },
  "briar-adventurer:a6": {
    "place": "Adventurer dialogue",
    "action": "Choose the Quest option in the Adventurer's dialogue. Open your inventory and look for the Quest Book icon just below/near the life-heart area.",
    "items": [],
    "tip": "The Quest Book has Available, Active and Completed tabs."
  },
  "briar-adventurer:a7": {
    "place": "Your base",
    "action": "Build a valid empty NPC room and let the Adventurer move in; check the Housing interface.",
    "items": [
      "Wooden Door",
      "Work Bench",
      "Torch"
    ],
    "tip": "Return to him for new quest dialogue and shop unlocks."
  },
  "first-adventure:a1": {
    "place": "Quest Book menu",
    "action": "After unlocking the Quest Book from Adventurer, open its Available tab and locate The First Adventure.",
    "items": [],
    "tip": "If you don't see it, return to the Adventurer's Quest dialogue."
  },
  "first-adventure:a2": {
    "place": "Quest Book · Available tab",
    "action": "Click the quest and press Activate. You can keep at most 5 quests active.",
    "items": [],
    "tip": "Only Active quests count; deactivating loses the quest's in-game counter."
  },
  "first-adventure:a3": {
    "place": "Forest surface at night",
    "action": "Hunt flying Hookbats after sunset in the ordinary Forest area.",
    "items": [
      "Durasilk Sheaf"
    ],
    "tip": "The sheaf only drops while The First Adventure is active."
  },
  "first-adventure:a4": {
    "place": "Forest at night",
    "action": "Defeat Hookbats until you have all 3 Durasilk Sheaves.",
    "items": [
      "Durasilk Sheaf"
    ],
    "tip": "Keep all 3 for one of each Wayfarer armor piece."
  },
  "first-adventure:a5": {
    "place": "Iron/Lead Anvil",
    "action": "Use 1 Durasilk Sheaf and 1 Iron/Lead Bar to craft the Hat.",
    "items": [
      "Wayfarer's Hat",
      "Durasilk Sheaf",
      "Iron Bar",
      "Lead Bar"
    ],
    "tip": "Equip once crafted; it also gives Darkness immunity."
  },
  "first-adventure:a6": {
    "place": "Iron/Lead Anvil",
    "action": "Use 1 Durasilk Sheaf and 2 Iron/Lead Bars to craft the Rucksack.",
    "items": [
      "Wayfarer's Rucksack",
      "Durasilk Sheaf",
      "Iron Bar",
      "Lead Bar"
    ],
    "tip": "If you lack bars, mine Iron or Lead in caves."
  },
  "first-adventure:a7": {
    "place": "Iron/Lead Anvil",
    "action": "Use 1 Durasilk Sheaf and 1 Iron/Lead Bar to craft the Pants.",
    "items": [
      "Wayfarer's Pants",
      "Durasilk Sheaf",
      "Iron Bar",
      "Lead Bar"
    ],
    "tip": "In total, the full set costs 3 sheaves and 4 metal bars."
  },
  "first-adventure:a8": {
    "place": "Quest Book · Completed tab",
    "action": "Once requirements register, select The First Adventure in Completed and press Claim rewards.",
    "items": [],
    "tip": "New townspeople start offering quests after this one."
  },
  "desert-scarabeus:a2": {
    "place": "Desert surface",
    "action": "Build a long flat arena with an extra Wooden Platform tier; add a Campfire and room to dodge charges.",
    "items": [
      "Wooden Platform",
      "Campfire"
    ],
    "tip": "Scarabeus is summoned in daytime."
  },
  "desert-scarabeus:a3": {
    "place": "Desert / Ancient Ziggurat",
    "action": "Complete the Idle Idol quest to exchange a Decrepit Idol for a Scarab Idol. The item can also be crafted, but this is the direct quest path.",
    "items": [
      "Decrepit Idol",
      "Scarab Idol"
    ],
    "tip": "The Ancient Ziggurat is a naturally generated Desert structure."
  },
  "desert-scarabeus:a4": {
    "place": "Desert daytime",
    "action": "Use the Scarab Idol in the Desert during daylight; make sure your arena is prepared.",
    "items": [
      "Scarab Idol",
      "Campfire"
    ],
    "tip": "The item will not summon Scarabeus at night."
  },
  "eye-jelly:a1": {
    "place": "Night surface",
    "action": "Farm Demon Eyes for 6 Lenses and craft Suspicious Looking Eye at Demon/Crimson Altar; or find one in chests.",
    "items": [
      "Suspicious Looking Eye",
      "Lens"
    ],
    "tip": "Summon only at night."
  },
  "eye-jelly:a3": {
    "place": "Forest arena at night",
    "action": "Fight Eye of Cthulhu on layered platforms with boots or an extra jump, a Campfire and healing.",
    "items": [
      "Hermes Boots",
      "Cloud in a Bottle",
      "Campfire"
    ],
    "tip": "Victory makes Jelly Deluge possible on later Space nights."
  },
  "eye-jelly:a4": {
    "place": "Space layer at night",
    "action": "Build a safe sky platform high above the surface; after Eye is beaten, Jelly Deluge can start randomly there at night.",
    "items": [
      "Dreamlight Jelly",
      "Distress Jelly"
    ],
    "tip": "Use Distress Jelly at night if you obtained it from Unidentified Floaters."
  },
  "eye-jelly:a5": {
    "place": "Jelly Deluge (Space)",
    "action": "Collect Dreamlight Jelly from the event.",
    "items": [
      "Dreamlight Jelly"
    ],
    "tip": "Keep one to summon Moon Jelly Wizard during the event."
  },
  "evil-and-briar:a2": {
    "place": "Corruption / Crimson",
    "action": "Break three Shadow Orbs or Crimson Hearts using a Hammer or explosives to trigger the biome boss, or summon using the proper item.",
    "items": [],
    "tip": "Don't trigger the boss until you have an arena and escape path."
  },
  "evil-and-briar:a5": {
    "place": "Deep Briar",
    "action": "Mine Floran Ore and gather Enchanted Leaves; combine them into Floran Bars at an Anvil for gear.",
    "items": [
      "Floran Ore",
      "Enchanted Leaf",
      "Floran Bar"
    ],
    "tip": "The deeper Briar becomes more dangerous."
  },
  "evil-and-briar:a6": {
    "place": "Bottom of Underground Briar",
    "action": "Follow the main passages down until you find a flower in a small enclosed chamber.",
    "items": [
      "Rope",
      "Torch"
    ],
    "tip": "Interacting with this flower is the Vinewrath Bane trigger."
  },
  "sky-and-jungle:a2": {
    "place": "Space / Avian Islands",
    "action": "Craft a Feather Crown from 2 Fallen Stars and 6 Feathers at an Iron/Lead Anvil, then use in Space; alternatively find and break an Avian Egg on an Avian Island.",
    "items": [
      "Feather Crown",
      "Fallen Star",
      "Feather"
    ],
    "tip": "Prepare long horizontal platforms for mobility."
  },
  "dungeon:a2": {
    "place": "Dungeon entrance at night",
    "action": "Return when the Old Man offers the Curse interaction at night.",
    "items": [
      "Campfire",
      "Wooden Platform"
    ],
    "tip": "Beating Skeletron is required before routine Dungeon exploration."
  },
  "dungeon:a5": {
    "place": "Dungeon locked chests",
    "action": "Farm Golden Keys, unlock Dungeon Gold Chests and look for the Shadow Key and Cobalt Shield.",
    "items": [
      "Golden Key",
      "Shadow Key",
      "Cobalt Shield"
    ],
    "tip": "Rescue Mechanic in the Dungeon while exploring."
  },
  "tide-and-stars:a2": {
    "place": "Ocean / Iron/Lead Anvil",
    "action": "Collect 5 Coral from Ocean floor and 10 Bone from Dungeon enemies, then craft the Seabreak Pearl.",
    "items": [
      "Seabreak Pearl",
      "Coral",
      "Bone"
    ],
    "tip": "Skeletron unlocks safe access to Dungeon bones."
  },
  "tide-and-stars:a3": {
    "place": "Ocean biome",
    "action": "Travel to either Ocean edge and use Seabreak Pearl to start The Tide.",
    "items": [
      "Seabreak Pearl"
    ],
    "tip": "The Tide is a five-wave event ending with R'lyehian."
  },
  "tide-and-stars:a5": {
    "place": "Sky / above Ocean",
    "action": "Use skybridges or flying accessories to locate Spirit's Asteroid Field above an Ocean.",
    "items": [
      "Rope",
      "Wooden Platform"
    ],
    "tip": "Look for naturally generated Astralite Beacons in asteroids."
  },
  "tide-and-stars:a6": {
    "place": "Asteroid Field",
    "action": "Search within the asteroids for the placed Astralite Beacon structure.",
    "items": [
      "Astralite Beacon"
    ],
    "tip": "The boss must be summoned at one of these, not by using the item at your home base."
  },
  "tide-and-stars:a7": {
    "place": "Astralite Beacon",
    "action": "Bring and use a Starplate Beacon at the naturally placed Astralite Beacon to summon Starplate Voyager.",
    "items": [
      "Starplate Beacon",
      "Astralite Beacon"
    ],
    "tip": "The boss is a worm fight, so allow room for movement."
  },
  "hardmode-gate:a3": {
    "place": "Underworld",
    "action": "Build a long platform bridge above lava, extend it far across the Underworld and remove obstacles.",
    "items": [
      "Wooden Platform",
      "Healing Potion"
    ],
    "tip": "Wall of Flesh moves horizontally, so keep the escape direction clear."
  },
  "hardmode-gate:a5": {
    "place": "Underworld lava",
    "action": "Defeat a Voodoo Demon to get a Guide Voodoo Doll, then throw the doll into lava while Guide is alive.",
    "items": [
      "Guide Voodoo Doll"
    ],
    "tip": "The world switches to Hardmode immediately after victory."
  },
  "hardmode-first:a4": {
    "place": "Hardmode / Underworld",
    "action": "Obtain a Pain Caller (Spirit summoning item) before fighting Infernon in the Underworld.",
    "items": [
      "Pain Caller"
    ],
    "tip": "This guide tracks summon conditions; the exact current crafting recipe is not verified here."
  },
  "mechs-and-dusking:a2": {
    "place": "Underground evil (Hardmode)",
    "action": "Farm Souls of Night and Rotten Chunks or Vertebrae for Mechanical Worm at a Mythril/Orichalcum Anvil; then fight Destroyer at night.",
    "items": [
      "Mechanical Worm",
      "Soul of Night"
    ],
    "tip": "A broad arena helps avoid the laser and worm rush."
  },
  "mechs-and-dusking:a3": {
    "place": "Underground Hallow (Hardmode)",
    "action": "Farm Souls of Light and Lenses, craft Mechanical Eye at Mythril/Orichalcum Anvil; summon Twins at night.",
    "items": [
      "Mechanical Eye",
      "Soul of Light",
      "Lens"
    ],
    "tip": "Focus on one twin first."
  },
  "mechs-and-dusking:a4": {
    "place": "Dungeon + underground Hallow / Evil",
    "action": "Farm Bones and both soul types for Mechanical Skull; summon Skeletron Prime at night.",
    "items": [
      "Mechanical Skull",
      "Bone",
      "Soul of Light",
      "Soul of Night"
    ],
    "tip": "Bring good horizontal mobility."
  },
  "mechs-and-dusking:a5": {
    "place": "Mythril/Orichalcum Anvil",
    "action": "Craft Dusk Crown using 3 Spirit Bars and 4 Souls of Night.",
    "items": [
      "Dusk Crown",
      "Spirit Bar",
      "Soul of Night"
    ],
    "tip": "Dusking spawns at night."
  },
  "jungle-temple:a1": {
    "place": "Underground Jungle",
    "action": "After all three mechanical bosses, look for glowing pink Plantera's Bulbs.",
    "items": [
      "Plantera's Bulb"
    ],
    "tip": "Clearing a large nearby arena before breaking the bulb improves your odds."
  },
  "jungle-temple:a4": {
    "place": "Jungle Temple entrance",
    "action": "After Plantera dies, use her Temple Key to open the locked Temple door.",
    "items": [
      "Temple Key"
    ],
    "tip": "Watch for traps inside."
  },
  "jungle-temple:a5": {
    "place": "Inside Jungle Temple",
    "action": "Find Lihzahrd Power Cells in Temple Chests or enemies and locate the Lihzahrd Altar.",
    "items": [
      "Lihzahrd Power Cell"
    ],
    "tip": "Use a Cell at the altar to summon Golem."
  },
  "atlas:a3": {
    "place": "Craft by hand",
    "action": "Combine 1 Lihzahrd Power Cell, 20 Martian Conduit Plating, 100 Stone Blocks and 10 Bones.",
    "items": [
      "Stone Fist",
      "Lihzahrd Power Cell",
      "Martian Conduit Plating",
      "Stone Block",
      "Bone"
    ],
    "tip": "Stone Fist is reusable and summons Atlas anywhere."
  },
  "heart-cause:a3": {
    "place": "Underground / Cavern",
    "action": "Find a glowing Life Crystal, break it with Pickaxe, and have it in inventory while the quest is active.",
    "items": [
      "Life Crystal"
    ],
    "tip": "Use afterward for +20 maximum life."
  },
  "idle-idol:a2": {
    "place": "Ancient Ziggurat, Desert",
    "action": "Search the Desert for a temple-like Ancient Ziggurat. Find and break its idol.",
    "items": [
      "Decrepit Idol"
    ],
    "tip": "The item is unique to the Desert structure."
  },
  "idle-idol:a3": {
    "place": "Adventurer NPC",
    "action": "Deliver the Decrepit Idol to the Adventurer after activating Idle Idol.",
    "items": [
      "Decrepit Idol",
      "Scarab Idol"
    ],
    "tip": "The claimed reward includes a Scarab Idol for Scarabeus."
  },
  "bare-necessities:a3": {
    "place": "By-hand crafting",
    "action": "Gather 20 Wood, 2 Any Iron Bars, 6 Enchanted Leaves from Briar. Craft Naturalist's Workshop by hand and place it.",
    "items": [
      "Naturalist's Workshop",
      "Wood",
      "Iron Bar",
      "Lead Bar",
      "Enchanted Leaf"
    ],
    "tip": "Activating Bare Necessities first ensures the crafting registers."
  },
  "strange-seas:a3": {
    "place": "Ocean and Dungeon",
    "action": "Gather Coral and Dungeon Bones, craft Seabreak Pearl at Iron/Lead Anvil.",
    "items": [
      "Seabreak Pearl",
      "Coral",
      "Bone"
    ],
    "tip": "Bring the pearl to the Ocean to activate The Tide."
  },
  "raiding-stars:a3": {
    "place": "Asteroid Field above Ocean",
    "action": "Explore the Space layer Asteroid Field and defeat two Stardancers while quest is active.",
    "items": [
      "Astralite Beacon"
    ],
    "tip": "Prepare mobility and breathing room."
  },
  "stylist-rescue:a4": {
    "place": "Underground Spider Nest",
    "action": "Search Cavern-level Spider Nests for a bound Stylist NPC.",
    "items": [
      "Torch",
      "Rope"
    ],
    "tip": "Talking frees the Stylist and allows her to move into housing."
  },
  "rescue-bandit:a3": {
    "place": "Bandit Hideout near Oceans",
    "action": "Explore a naturally generated Bandit Hideout structure near a world edge; talk to its bound Bandit.",
    "items": [
      "Torch",
      "Rope"
    ],
    "tip": "Availability depends on world generation."
  },
  "rescue-gambler:a3": {
    "place": "Arcane Tower",
    "action": "Find the Arcane Tower structure near a world edge, fight through its dangers and speak to the bound Gambler.",
    "items": [
      "Rope",
      "Torch"
    ],
    "tip": "The Arcane Tower must have generated in your world."
  },
  "rescue-gambler:a4": {
    "place": "Arcane Tower",
    "action": "Find the Shadowbreak Wand in the Arcane Tower as part of Breaking and Entering.",
    "items": [
      "Shadowbreak Wand"
    ],
    "tip": "Versions prior to the 1.5.0.8 fix could have missing quest loot."
  },
  "taming-stars:a3": {
    "place": "Quest Book / Hardmode",
    "action": "Keep Taming the Stars active and follow the specific Ice Berry objective in the Quest Book.",
    "items": [],
    "tip": "Exact source is not confirmed in this built-in guide."
  },
  "taming-stars:a4": {
    "place": "Quest Book / Hardmode",
    "action": "Keep Taming the Stars active and complete the Aurora Saddle objective shown in the Quest Book.",
    "items": [],
    "tip": "Exact source is not confirmed in this built-in guide."
  }
};
