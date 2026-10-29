/** Readable Terraria + Spirit Classic item locations and recipes. No out-of-page links required.
 * Verified recipe examples: Spirit Mod Wiki (Wayfarer, Durasilk, Seabreak Pearl, Feather Crown,
 * Naturalist Workshop, Dusk Crown, Stone Fist, Scarabeus) and Terraria Wiki (base-game crafting).
 * Explicitly label unverified recipe details rather than inventing them.
 */
export type TerrariaItemGuide = { name: string; method: string; where: string; recipe: string; tip: string };
export const TERRARIA_ITEM_INDEX: TerrariaItemGuide[] = [
  {
    "name": "Wood",
    "method": "Chop Trees",
    "where": "Chop trees in the Forest or other surface biomes with an Axe.",
    "recipe": "Stand by a Work Bench to craft wood platforms, walls, doors, and chairs.",
    "tip": "Replant Acorns for renewable Wood."
  },
  {
    "name": "Stone Block",
    "method": "Mine Stone",
    "where": "Dig surface caves or underground stone with a Pickaxe.",
    "recipe": "Use 20 Stone Blocks and 4 Wood to craft a Furnace at a Work Bench.",
    "tip": "Stone is abundant underground."
  },
  {
    "name": "Work Bench",
    "method": "Craft with Wood",
    "where": "Gather Wood from any trees.",
    "recipe": "Craft from 10 Wood by hand.",
    "tip": "Place on level ground for early furniture and crafting."
  },
  {
    "name": "Wooden Platform",
    "method": "Craft with Wood",
    "where": "Chop any trees for Wood.",
    "recipe": "1 Wood crafts 2 Wooden Platforms by hand.",
    "tip": "Platforms let you jump through from below and build arenas."
  },
  {
    "name": "Wooden Door",
    "method": "Craft at Work Bench",
    "where": "Chop trees to get Wood.",
    "recipe": "6 Wood at a Work Bench.",
    "tip": "Leave a three-tile-tall opening in NPC housing."
  },
  {
    "name": "Torch",
    "method": "Craft by hand",
    "where": "Gel from Slimes and Wood from trees.",
    "recipe": "1 Gel + 1 Wood crafts 3 Torches by hand.",
    "tip": "Put torches on walls or platforms to light caves."
  },
  {
    "name": "Gel",
    "method": "Defeat Slimes",
    "where": "Slimes appear on the surface, in caves and during Slime Rain.",
    "recipe": "Combine Gel with Wood to make Torches.",
    "tip": "Some Slimes drop extra Gel."
  },
  {
    "name": "Furnace",
    "method": "Craft at Work Bench",
    "where": "Mine Stone, chop Wood, collect Gel for Torches.",
    "recipe": "20 Stone Blocks + 4 Wood + 3 Torches at a Work Bench.",
    "tip": "Smelts ore into metal bars."
  },
  {
    "name": "Anvil",
    "method": "Craft from metal bars",
    "where": "Mine Iron or Lead Ore underground and smelt at Furnace.",
    "recipe": "Craft an Iron Anvil from 5 Iron Bars at a Work Bench, or a Lead Anvil from 5 Lead Bars.",
    "tip": "Both anvils work for Wayfarer gear."
  },
  {
    "name": "Iron Ore",
    "method": "Mine caves",
    "where": "Iron spawns in Underground and Cavern layers in worlds with Iron rather than Lead.",
    "recipe": "Smelt 3 Iron Ore into an Iron Bar at a Furnace.",
    "tip": "Worlds may spawn Lead instead."
  },
  {
    "name": "Lead Ore",
    "method": "Mine caves",
    "where": "Lead spawns in Underground and Cavern layers in worlds with Lead rather than Iron.",
    "recipe": "Smelt 3 Lead Ore into a Lead Bar at a Furnace.",
    "tip": "Either metal works for Wayfarer equipment."
  },
  {
    "name": "Iron Bar",
    "method": "Smelt ore",
    "where": "Mine Iron Ore in the Underground/Cavern and smelt at a Furnace.",
    "recipe": "3 Iron Ore per Iron Bar.",
    "tip": "Lead Bars substitute in most recipes labeled Any Iron Bar."
  },
  {
    "name": "Lead Bar",
    "method": "Smelt ore",
    "where": "Mine Lead Ore in underground caves and smelt at a Furnace.",
    "recipe": "3 Lead Ore per Lead Bar.",
    "tip": "Alternate world version of Iron Bar."
  },
  {
    "name": "Rope",
    "method": "Pots and shops",
    "where": "Break cave Pots and loot chests; buy Rope from the Merchant.",
    "recipe": "Carry at least several stacks for the long Briar shaft.",
    "tip": "Place a vertical line while descending so you can climb back."
  },
  {
    "name": "Grappling Hook",
    "method": "Craft or loot",
    "where": "Common early hook: collect Hook from Skeletons or Piranhas and 3 Chains, then craft at Anvil.",
    "recipe": "Find hooks in Chests or from special drops as you explore.",
    "tip": "Use to avoid fall damage in Briar tunnels."
  },
  {
    "name": "Hook",
    "method": "Enemy drop",
    "where": "Skeletons and Piranhas occasionally drop a Hook.",
    "recipe": "Combine Hook + 3 Chains at an Anvil for a Grappling Hook.",
    "tip": "Some biome-specific hooks have different recipes."
  },
  {
    "name": "Chain",
    "method": "Craft at Anvil",
    "where": "Smelt Iron or Lead Ore into bars.",
    "recipe": "1 Iron/Lead Bar makes 10 Chains at an Anvil.",
    "tip": "Used for Grappling Hook and Heart Lanterns."
  },
  {
    "name": "Life Crystal",
    "method": "Mine / pick up",
    "where": "Look for glowing red heart crystals in Underground and Cavern caves.",
    "recipe": "Break with Pickaxe and use for +20 max life until 400.",
    "tip": "Can be seen with Spelunker Potions."
  },
  {
    "name": "Mana Crystal",
    "method": "Craft from Fallen Stars",
    "where": "Pick up Fallen Stars on the surface at night.",
    "recipe": "Craft from 5 Fallen Stars by hand.",
    "tip": "Permanently adds 20 maximum mana up to the early cap."
  },
  {
    "name": "Fallen Star",
    "method": "Night surface pickup",
    "where": "Pick up bright stars that land on surface blocks at night.",
    "recipe": "5 Fallen Stars make a Mana Crystal.",
    "tip": "Vanish when day begins."
  },
  {
    "name": "Hermes Boots",
    "method": "Chest loot",
    "where": "Search Gold Chests in Underground/Cavern cabins.",
    "recipe": "Equip to run faster.",
    "tip": "Sailfish Boots from fishing and other running boots are alternatives."
  },
  {
    "name": "Cloud in a Bottle",
    "method": "Chest loot",
    "where": "Found in underground Gold Chests; Tsunami in a Bottle is a fishing alternative.",
    "recipe": "Equip for an extra jump.",
    "tip": "May also use Blizzard or Sandstorm in a Bottle."
  },
  {
    "name": "Magic Mirror",
    "method": "Chest loot",
    "where": "Found in underground and Cavern Gold Chests.",
    "recipe": "Use to teleport home without spending a potion.",
    "tip": "Ice Mirror works the same."
  },
  {
    "name": "Recall Potion",
    "method": "Loot or craft",
    "where": "Find in chests and Pots underground.",
    "recipe": "Use to instantly teleport to your spawn bed or world spawn.",
    "tip": "Carry while exploring the Briar."
  },
  {
    "name": "Healing Potion",
    "method": "Craft or loot",
    "where": "Found in Pots and chests; made with Lesser Healing Potions and Glowing Mushrooms at a placed Bottle.",
    "recipe": "Use for boss fights.",
    "tip": "Potion Sickness temporarily prevents repeated healing."
  },
  {
    "name": "Campfire",
    "method": "Craft from Wood/Torches",
    "where": "Chop trees and fight Slimes for Gel.",
    "recipe": "10 Wood + 5 Torches at a Work Bench.",
    "tip": "Place near arenas for passive regeneration."
  },
  {
    "name": "Heart Lantern",
    "method": "Craft with Life Crystal and Chains",
    "where": "Find Life Crystal underground; craft Chains from Iron/Lead Bars.",
    "recipe": "1 Life Crystal + 4 Chains at Work Bench.",
    "tip": "Hanging it near an arena boosts life regeneration."
  },
  {
    "name": "Sunflower",
    "method": "Harvest surface plants",
    "where": "Look for yellow flowers on the grassy surface in Forest biomes.",
    "recipe": "Plant near homes or arenas for movement benefits and reduced hostile spawns nearby.",
    "tip": "Useful for Scarabeus preparation."
  },
  {
    "name": "Durasilk Sheaf",
    "method": "Spirit Quest drop",
    "where": "Activate The First Adventure, then kill Hookbats on the Forest surface at night. Each Hookbat drops one sheaf during the quest.",
    "recipe": "Collect 3 total for Wayfarer's Hat, Rucksack, and Pants.",
    "tip": "After completing the quest, the Adventurer sells sheaves."
  },
  {
    "name": "Wayfarer's Hat",
    "method": "Craft at Iron/Lead Anvil",
    "where": "Farm Durasilk Sheaf from Hookbats during active First Adventure.",
    "recipe": "1 Durasilk Sheaf + 1 Iron/Lead Bar at an Iron/Lead Anvil.",
    "tip": "Quest-required armor; hat grants Darkness immunity."
  },
  {
    "name": "Wayfarer's Rucksack",
    "method": "Craft at Iron/Lead Anvil",
    "where": "Farm Durasilk Sheaf from Hookbats during active First Adventure.",
    "recipe": "1 Durasilk Sheaf + 2 Iron/Lead Bars at an Iron/Lead Anvil.",
    "tip": "Quest-required armor chest piece."
  },
  {
    "name": "Wayfarer's Pants",
    "method": "Craft at Iron/Lead Anvil",
    "where": "Farm Durasilk Sheaf from Hookbats during active First Adventure.",
    "recipe": "1 Durasilk Sheaf + 1 Iron/Lead Bar at an Iron/Lead Anvil.",
    "tip": "Quest-required armor leg piece."
  },
  {
    "name": "Decrepit Idol",
    "method": "Spirit Desert structure",
    "where": "Find the Ancient Ziggurat structure generated in the Desert and break the Scarab Idol found inside.",
    "recipe": "Deliver to the Adventurer during Idle Idol.",
    "tip": "The Adventurer rewards a Scarab Idol that can summon the boss."
  },
  {
    "name": "Scarab Idol",
    "method": "Spirit boss summon",
    "where": "Complete Idle Idol by bringing the Adventurer the Decrepit Idol from the Ancient Ziggurat, or craft the item if you have its ingredients.",
    "recipe": "Use in the Desert in daytime to summon Scarabeus.",
    "tip": "In-page guaranteed route is the Idle Idol quest reward; precise alternate crafting recipe is not recorded here."
  },
  {
    "name": "Chitin",
    "method": "Scarabeus boss drop",
    "where": "Defeat Scarabeus in the Desert during daytime.",
    "recipe": "Use the dropped Chitin for its armor and weapons.",
    "tip": "Scarabeus is early Pre-Hardmode."
  },
  {
    "name": "Enchanted Leaf",
    "method": "Spirit Briar material",
    "where": "Explore the Briar and defeat Briar enemies / gather foliage as applicable.",
    "recipe": "Used with Floran Ore to craft Floran Bars, and in Naturalist's Workshop.",
    "tip": "Gather during early Briar exploration."
  },
  {
    "name": "Floran Ore",
    "method": "Spirit Briar mining",
    "where": "Mine the glowing green ore deeper in the Underground Briar with an appropriate Pickaxe.",
    "recipe": "Combine with Enchanted Leaves to craft Floran Bars at an Iron/Lead Anvil.",
    "tip": "More common toward the deep Briar."
  },
  {
    "name": "Floran Bar",
    "method": "Craft from Spirit materials",
    "where": "Mine Floran Ore deep in Briar and collect Enchanted Leaves there.",
    "recipe": "Combine Floran Ore and Enchanted Leaves at an Iron/Lead Anvil; exact quantity may vary by version.",
    "tip": "Used for Floran armor and weapons."
  },
  {
    "name": "Naturalist's Workshop",
    "method": "Spirit crafting station",
    "where": "Gather 20 Wood from trees, 2 Iron/Lead Bars from underground ore, and 6 Enchanted Leaves in Briar.",
    "recipe": "Craft 20 Wood + 2 Any Iron Bars + 6 Enchanted Leaves by hand.",
    "tip": "Required for Bare Necessities."
  },
  {
    "name": "Suspicious Looking Eye",
    "method": "Eye of Cthulhu summon",
    "where": "Find from surface/underground chests or craft at Demon/Crimson Altar.",
    "recipe": "Craft 6 Lenses at Demon/Crimson Altar.",
    "tip": "Use at night to summon the Eye."
  },
  {
    "name": "Lens",
    "method": "Demon Eye drop",
    "where": "Kill Demon Eyes on the surface at night.",
    "recipe": "6 Lenses craft a Suspicious Looking Eye at a Demon/Crimson Altar.",
    "tip": "Can be gathered while farming early enemy loot."
  },
  {
    "name": "Dreamlight Jelly",
    "method": "Spirit Jelly Deluge pickup",
    "where": "After Eye of Cthulhu, visit the Space layer at night for the Jelly Deluge event and collect its special jelly.",
    "recipe": "Use during the event to summon the Moon Jelly Wizard.",
    "tip": "The event can also be triggered at night with Distress Jelly."
  },
  {
    "name": "Distress Jelly",
    "method": "Spirit event summon",
    "where": "Claim as a quest reward from Unidentified Floaters.",
    "recipe": "Use at nighttime to start the Jelly Deluge.",
    "tip": "The natural Jelly Deluge can also occur on a Space night after the Eye has been defeated."
  },
  {
    "name": "Feather Crown",
    "method": "Spirit Ancient Avian summon",
    "where": "Gather Fallen Stars from the surface at night and Feathers from Harpies at high altitude.",
    "recipe": "2 Fallen Stars + 6 Feathers at Iron/Lead Anvil.",
    "tip": "Use in the Space layer for Ancient Avian; or break Avian Egg on an Avian Island."
  },
  {
    "name": "Feather",
    "method": "Harpy drop",
    "where": "Kill Harpies in Sky/Space high above the surface.",
    "recipe": "Collect 6 for a Feather Crown.",
    "tip": "Harpies are dangerous early; prepare mobility."
  },
  {
    "name": "Seabreak Pearl",
    "method": "Spirit event summon",
    "where": "Collect Coral in the Ocean and Bones from enemies in the Dungeon after Skeletron.",
    "recipe": "5 Coral + 10 Bone at Iron/Lead Anvil.",
    "tip": "Use at the Ocean to start The Tide."
  },
  {
    "name": "Coral",
    "method": "Ocean foraging",
    "where": "Pick up coral growing on Ocean floor sand, near either map edge.",
    "recipe": "Collect 5 for a Seabreak Pearl.",
    "tip": "Breathe carefully underwater."
  },
  {
    "name": "Bone",
    "method": "Dungeon enemy drop",
    "where": "Defeat Angry Bones and other skeleton enemies in the Dungeon after defeating Skeletron.",
    "recipe": "Collect 10 for Seabreak Pearl; also used in Stone Fist.",
    "tip": "Bone drops increase with Dungeon farming."
  },
  {
    "name": "Astralite Beacon",
    "method": "Spirit Asteroid Field structure",
    "where": "Explore floating Asteroids in the Asteroid Field high above an Ocean; look for a naturally placed Astralite Beacon.",
    "recipe": "Use Starplate Beacon at this furniture to summon the Starplate Voyager.",
    "tip": "Beacon is not a quest reward that appears at spawn."
  },
  {
    "name": "Starplate Beacon",
    "method": "Spirit boss summon",
    "where": "Needed to summon Starplate Voyager at a naturally generated Astralite Beacon in the Asteroid Field.",
    "recipe": "Obtain via its Spirit crafting recipe before the fight.",
    "tip": "Specific current recipe is not verified in this guide; summon location and item are confirmed."
  },
  {
    "name": "Astralite Shard",
    "method": "Spirit boss drop",
    "where": "Defeat Starplate Voyager in the Asteroid Field.",
    "recipe": "Used for Astralite armor and later weapon recipes.",
    "tip": "Ranger-focused Astralite armor takes 42 shards."
  },
  {
    "name": "Stream Scale",
    "method": "Spirit Tide drop",
    "where": "Defeat enemies during The Tide at an Ocean.",
    "recipe": "Used in Stream Surfer armor and weapons.",
    "tip": "The event gains more enemies as bosses are defeated."
  },
  {
    "name": "Cryolite Ore",
    "method": "Spirit Underground Snow ore",
    "where": "Explore Underground/Cavern Snow and mine Cryolite Ore.",
    "recipe": "Smelt into Cryolite Bars at a Hellforge, for Cryolite armor and weapons.",
    "tip": "Strong melee option before Wall of Flesh."
  },
  {
    "name": "Slagstone",
    "method": "Spirit Underworld material",
    "where": "Mine Slagstone deposits in the Underworld.",
    "recipe": "Craft Slag Tyrant armor at Iron/Lead Anvil (45 total).",
    "tip": "Sentry-oriented Summoner armor."
  },
  {
    "name": "Shadow Key",
    "method": "Dungeon locked chest loot",
    "where": "Find a Golden Key in the Dungeon and unlock Dungeon chests to find the Shadow Key.",
    "recipe": "Opens Shadow Chests in the Underworld; key is reusable.",
    "tip": "Defeat Skeletron before searching the Dungeon."
  },
  {
    "name": "Golden Key",
    "method": "Dungeon loot",
    "where": "Drop from Dungeon enemies or obtain from Dungeon Pots and chests.",
    "recipe": "Unlocks locked Gold Chests inside the Dungeon.",
    "tip": "Bring several into the Dungeon."
  },
  {
    "name": "Cobalt Shield",
    "method": "Dungeon locked chest loot",
    "where": "Find in Dungeon Gold Chests after defeating Skeletron.",
    "recipe": "Equip for knockback immunity; later combined with Obsidian Skull.",
    "tip": "Search Dungeon before the Underworld."
  },
  {
    "name": "Guide Voodoo Doll",
    "method": "Underworld enemy drop",
    "where": "Defeat Voodoo Demons in the Underworld (they carry a doll).",
    "recipe": "Toss into lava while Guide NPC is alive to summon Wall of Flesh.",
    "tip": "Beware: a doll accidentally falling in lava can also summon."
  },
  {
    "name": "Pwnhammer",
    "method": "Wall of Flesh boss drop",
    "where": "Defeat Wall of Flesh to enter Hardmode.",
    "recipe": "Use on Demon/Crimson Altars to generate Hardmode ore in most worlds.",
    "tip": "Hardmode begins as soon as Wall of Flesh dies."
  },
  {
    "name": "Mechanical Eye",
    "method": "Craft at Mythril/Orichalcum Anvil",
    "where": "Obtain Lenses, Iron/Lead Bars and Souls of Light after Hardmode begins.",
    "recipe": "3 Lenses + 5 Iron/Lead Bars + 6 Souls of Light at Mythril/Orichalcum Anvil.",
    "tip": "Use at night to summon Twins."
  },
  {
    "name": "Mechanical Worm",
    "method": "Craft at Mythril/Orichalcum Anvil",
    "where": "Obtain Rotten Chunks/Vertebrae, Iron/Lead Bars and Souls of Night in Hardmode.",
    "recipe": "6 Rotten Chunks/Vertebrae + 5 Iron/Lead Bars + 6 Souls of Night at Mythril/Orichalcum Anvil.",
    "tip": "Use at night to summon Destroyer."
  },
  {
    "name": "Mechanical Skull",
    "method": "Craft at Mythril/Orichalcum Anvil",
    "where": "Obtain Bones, Iron/Lead Bars, Souls of Light and Souls of Night.",
    "recipe": "30 Bones + 5 Iron/Lead Bars + 3 Souls of Light + 3 Souls of Night at Mythril/Orichalcum Anvil.",
    "tip": "Use at night to summon Skeletron Prime."
  },
  {
    "name": "Soul of Light",
    "method": "Underground Hallow enemy drop",
    "where": "Defeat enemies in Underground Hallow during Hardmode.",
    "recipe": "Used in Mechanical Eye and Mechanical Skull.",
    "tip": "Can drop from enemies killed in eligible biome."
  },
  {
    "name": "Soul of Night",
    "method": "Underground Evil enemy drop",
    "where": "Defeat enemies in Underground Corruption or Crimson during Hardmode.",
    "recipe": "Used in Mechanical Worm, Dusk Crown and Mechanical Skull.",
    "tip": "Requires Underground/Cavern evil environment."
  },
  {
    "name": "Spirit Bar",
    "method": "Spirit Hardmode material",
    "where": "Collect Spirit biome materials in Hardmode, using available smelting/crafting stations.",
    "recipe": "Used in Dusk Crown and Spirit gear; exact bar recipe may depend on mod version.",
    "tip": "Spirit biome appears in Hardmode."
  },
  {
    "name": "Dusk Crown",
    "method": "Spirit boss summon",
    "where": "Mine / craft 3 Spirit Bars and farm 4 Souls of Night in the underground Corruption/Crimson.",
    "recipe": "3 Spirit Bars + 4 Souls of Night at Mythril/Orichalcum Anvil.",
    "tip": "Use at night to summon Dusking."
  },
  {
    "name": "Pain Caller",
    "method": "Spirit Infernon summon",
    "where": "Obtain the Pain Caller as an early-Hardmode Spirit summoning item.",
    "recipe": "Use in the Underworld to summon Infernon.",
    "tip": "Specific recipe not yet verified here."
  },
  {
    "name": "Torment Shard",
    "method": "Spirit boss drop",
    "where": "Defeat Infernon in Hardmode Underworld.",
    "recipe": "Used for Pain Monger armor and infernal equipment.",
    "tip": "Fight occurs after entering Hardmode."
  },
  {
    "name": "Spirit Ore",
    "method": "Spirit Hardmode mining",
    "where": "Explore Underground Spirit biome after Hardmode.",
    "recipe": "Spirit materials are used for gear and crafting.",
    "tip": "Requires biome to have appeared in world."
  },
  {
    "name": "Plantera's Bulb",
    "method": "Hardmode Jungle object",
    "where": "After defeating all three mechanical bosses, search the Underground Jungle for pink glowing bulbs.",
    "recipe": "Break one to summon Plantera; fight near its location.",
    "tip": "More bulbs appear over time."
  },
  {
    "name": "Temple Key",
    "method": "Plantera boss drop",
    "where": "Defeat Plantera in the Underground Jungle.",
    "recipe": "Unlock the Lihzahrd Temple entrance door in the Jungle.",
    "tip": "Unlock once, then explore temple."
  },
  {
    "name": "Lihzahrd Power Cell",
    "method": "Jungle Temple loot",
    "where": "Search Temple Chests and defeat some Lihzahrds inside the Jungle Temple.",
    "recipe": "Use at the Lihzahrd Altar to summon Golem.",
    "tip": "Also part of Stone Fist recipe."
  },
  {
    "name": "Martian Conduit Plating",
    "method": "Martian Madness enemy drop",
    "where": "After Golem, trigger Martian Madness by letting a Martian Probe escape, then defeat invasion enemies.",
    "recipe": "Collect 20 to craft Stone Fist.",
    "tip": "Also use for Martian furniture and items."
  },
  {
    "name": "Stone Fist",
    "method": "Spirit Atlas summon",
    "where": "Acquire a Lihzahrd Power Cell, 20 Martian Conduit Plating, 100 Stone Blocks and 10 Bones.",
    "recipe": "Craft by hand: 1 Lihzahrd Power Cell + 20 Martian Conduit Plating + 100 Stone Blocks + 10 Bone.",
    "tip": "Non-consumable item that summons Atlas anywhere."
  },
  {
    "name": "Shadowbreak Wand",
    "method": "Spirit Quest objective",
    "where": "Search the Arcane Tower / quest structure while Breaking and Entering is active; rescue Gambler first.",
    "recipe": "Obtain as specified by active Quest Book objective.",
    "tip": "Precise drop/container not verified in this guide."
  }
];
export function terrariaItem(name: string) { return TERRARIA_ITEM_INDEX.find(item => item.name.toLowerCase() === name.toLowerCase()); }
