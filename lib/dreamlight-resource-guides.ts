/** Verified Dreamlight Valley resource locations and quest-specific shopping/gathering lists.
 * Scope: base game + Honeyglow Woods only. Amounts are PER OBJECTIVE, not an inventory balance;
 * don't sum groups across stages to infer total needed (some stages share quest items).
 * Unverified quest steps intentionally show a reference instead of invented recipes.
 */
export type DreamlightResource = { name: string; method: string; where: string; url: string };
export type DreamlightRequirement = { item: string; qty?: number };
export type DreamlightMaterialGroup = { items: DreamlightRequirement[]; note?: string };
export const DREAMLIGHT_RESOURCES: Record<string,DreamlightResource> = {
  "Driftwood": {
    "name": "Driftwood",
    "method": "Fishing",
    "where": "Fish in open water anywhere in Honeyglow Woods, outside the colored fishing ripples. Once upgraded, clearing Twistroots with your Shovel can also yield Driftwood.",
    "url": "https://dreamlightvalleywiki.com/Driftwood"
  },
  "Tree Resin": {
    "name": "Tree Resin",
    "method": "Digging",
    "where": "Dig ordinary soil throughout Honeyglow Woods with your Shovel. With the relevant Pickaxe upgrade, breaking Amber Brushwood is another source.",
    "url": "https://dreamlightvalleywiki.com/Tree_Resin"
  },
  "Oak Leaves": {
    "name": "Oak Leaves",
    "method": "Foraging",
    "where": "Pick up fallen leaves on the ground near trees throughout Honeyglow Woods.",
    "url": "https://dreamlightvalleywiki.com/Oak_Leaves"
  },
  "Soft Limestone": {
    "name": "Soft Limestone",
    "method": "Mining",
    "where": "Mine rock spots throughout Honeyglow Woods using your Pickaxe.",
    "url": "https://dreamlightvalleywiki.com/Soft_Limestone"
  },
  "Golden Honey": {
    "name": "Golden Honey",
    "method": "Beekeeping",
    "where": "Harvest from an active Busy Bees' House. Put several flowers around the hive to speed production; Honey Swirls can also provide small amounts.",
    "url": "https://dreamlightvalleywiki.com/Beekeeping"
  },
  "Honey Agate": {
    "name": "Honey Agate",
    "method": "Mining",
    "where": "Mine black rock spots in Honeyglow Woods with the Pickaxe. It is a normal gem drop.",
    "url": "https://dreamlightvalleywiki.com/Honey_Agate"
  },
  "Shiny Honey Agate": {
    "name": "Shiny Honey Agate",
    "method": "Mining",
    "where": "Mine black rock spots in Honeyglow Woods for the rarer Shiny Honey Agate.",
    "url": "https://dreamlightvalleywiki.com/Shiny_Honey_Agate"
  },
  "Sweet Chestnut": {
    "name": "Sweet Chestnut",
    "method": "Fruit trees",
    "where": "Harvest Sweet Chestnut Trees found in Honeyglow Woods.",
    "url": "https://dreamlightvalleywiki.com/Sweet_Chestnut"
  },
  "Parsnip": {
    "name": "Parsnip",
    "method": "Gardening",
    "where": "Buy Parsnip Seeds from the Honeyglow Woods stall in Drowsybloom Acre after activating its Shopping List. Plant, water, and harvest.",
    "url": "https://dreamlightvalleywiki.com/Parsnip"
  },
  "Parsnip Seed": {
    "name": "Parsnip Seed",
    "method": "Shopping",
    "where": "Buy Parsnip Seeds from the Drowsybloom Acre stall; activate the Shopping List beside it first.",
    "url": "https://dreamlightvalleywiki.com/Parsnip_Seed"
  },
  "Fog Dust": {
    "name": "Fog Dust",
    "method": "Quest pickup",
    "where": "Search the foggy quest area for Fog Dust while the relevant chapter is active. This is a story item, not a general collectible.",
    "url": "https://dreamlightvalleywiki.com/Fog_Dust"
  },
  "Juniper Berry": {
    "name": "Juniper Berry",
    "method": "Foraging",
    "where": "Harvest Juniper Berry bushes around Honeyglow Woods.",
    "url": "https://dreamlightvalleywiki.com/Juniper_Berry"
  },
  "Acorn Snail": {
    "name": "Acorn Snail",
    "method": "Fishing",
    "where": "Fish in WHITE ripples in Honeyglow Woods to catch Acorn Snails.",
    "url": "https://dreamlightvalleywiki.com/Acorn_Snail"
  },
  "Hardwood": {
    "name": "Hardwood",
    "method": "Foraging",
    "where": "Collect fallen hardwood in the Forest of Valor, Glade of Trust, Sunlit Plateau, Frosted Heights, or Forgotten Lands; upgraded stumps also drop it.",
    "url": "https://dreamlightvalleywiki.com/Hardwood"
  },
  "Rose & Cream Foxglove": {
    "name": "Rose & Cream Foxglove",
    "method": "Flowers",
    "where": "Forage this flower in Honeyglow Woods. Check different cleared sub-biomes if none are visible.",
    "url": "https://dreamlightvalleywiki.com/Rose_%26_Cream_Foxglove"
  },
  "White & Pink Foxglove": {
    "name": "White & Pink Foxglove",
    "method": "Flowers",
    "where": "Forage this flower in Honeyglow Woods. Check different cleared sub-biomes if none are visible.",
    "url": "https://dreamlightvalleywiki.com/White_%26_Pink_Foxglove"
  },
  "Purple & White Foxglove": {
    "name": "Purple & White Foxglove",
    "method": "Flowers",
    "where": "Forage this flower in Honeyglow Woods.",
    "url": "https://dreamlightvalleywiki.com/Purple_%26_White_Foxglove"
  },
  "Yellow & Orange Foxglove": {
    "name": "Yellow & Orange Foxglove",
    "method": "Flowers",
    "where": "Forage this flower in Honeyglow Woods.",
    "url": "https://dreamlightvalleywiki.com/Yellow_%26_Orange_Foxglove"
  },
  "Purple Thistle": {
    "name": "Purple Thistle",
    "method": "Flowers",
    "where": "Find this flower spawning in Honeyglow Woods after the applicable biome is open.",
    "url": "https://dreamlightvalleywiki.com/Purple_Thistle"
  },
  "Red Thistle": {
    "name": "Red Thistle",
    "method": "Flowers",
    "where": "Find this flower spawning in Honeyglow Woods after the applicable biome is open.",
    "url": "https://dreamlightvalleywiki.com/Red_Thistle"
  },
  "White Thistle": {
    "name": "White Thistle",
    "method": "Flowers",
    "where": "Find this flower spawning in Honeyglow Woods after the applicable biome is open.",
    "url": "https://dreamlightvalleywiki.com/White_Thistle"
  },
  "Yellow Thistle": {
    "name": "Yellow Thistle",
    "method": "Flowers",
    "where": "Find this flower spawning in Honeyglow Woods after the applicable biome is open.",
    "url": "https://dreamlightvalleywiki.com/Yellow_Thistle"
  },
  "Truffle": {
    "name": "Truffle",
    "method": "Foraging",
    "where": "Forage Truffles on the ground in Honeyglow Woods.",
    "url": "https://dreamlightvalleywiki.com/Truffle"
  },
  "Golden Pattypan": {
    "name": "Golden Pattypan",
    "method": "Gardening",
    "where": "Grow Golden Pattypan from seeds sold at the Honeyglow Woods stall in Drowsybloom Acre.",
    "url": "https://dreamlightvalleywiki.com/Golden_Pattypan"
  },
  "Plush Fish": {
    "name": "Plush Fish",
    "method": "Fishing",
    "where": "Fish in GOLD ripples anywhere in Honeyglow Woods.",
    "url": "https://dreamlightvalleywiki.com/Plush_Fish"
  },
  "Rainbow Foxglove": {
    "name": "Rainbow Foxglove",
    "method": "Quest pickup",
    "where": "Find the quest-specific Rainbow Foxglove in Braveheart Grove during Chapter 10.",
    "url": "https://dreamlightvalleywiki.com/Rainbow_Foxglove"
  },
  "Soft Pillow": {
    "name": "Soft Pillow",
    "method": "Quest pickup",
    "where": "Pick up the Soft Pillow in Winnie the Pooh's house during Chapter 10.",
    "url": "https://dreamlightvalleywiki.com/Soft_Pillow"
  },
  "Special Honey": {
    "name": "Special Honey",
    "method": "Quest reward",
    "where": "Winnie the Pooh gives you Special Honey during the See You Next Summer epilogue.",
    "url": "https://dreamlightvalleywiki.com/Special_Honey"
  },
  "Honey Hero Cake": {
    "name": "Honey Hero Cake",
    "method": "Cooking",
    "where": "Cook at a stove using Special Honey, one sweet ingredient, one dairy or oil, one fruit, and one grain; the recipe unlocks during the epilogue.",
    "url": "https://dreamlightvalleywiki.com/Honey_Hero_Cake"
  },
  "Toasted Picnic Sandwich": {
    "name": "Toasted Picnic Sandwich",
    "method": "Cooking",
    "where": "Cook at a stove: Golden Honey + Parsnip + Tree Resin + any dairy/oil + any spice. Four servings are required in Chapter 11.",
    "url": "https://dreamlightvalleywiki.com/Toasted_Picnic_Sandwich"
  },
  "Any Dairy or Oil": {
    "name": "Any Dairy or Oil",
    "method": "Cooking ingredients",
    "where": "For the sandwich or cake, use a valid dairy/oil-category ingredient. Milk and Butter can be purchased from Chez Remy after his restaurant opens.",
    "url": "https://dreamlightvalleywiki.com/Ingredients"
  },
  "Any Spice": {
    "name": "Any Spice",
    "method": "Foraging",
    "where": "For example, gather Oregano in the Plaza or Basil in Peaceful Meadow.",
    "url": "https://dreamlightvalleywiki.com/Ingredients"
  },
  "Any Fruit": {
    "name": "Any Fruit",
    "method": "Foraging",
    "where": "For example, gather Apples from apple trees around Plaza or Peaceful Meadow.",
    "url": "https://dreamlightvalleywiki.com/Ingredients"
  },
  "Any Grain": {
    "name": "Any Grain",
    "method": "Gardening",
    "where": "Buy Wheat Seeds from Goofy's Stall in Peaceful Meadow, then grow and harvest Wheat.",
    "url": "https://dreamlightvalleywiki.com/Wheat"
  },
  "Any Sweet": {
    "name": "Any Sweet",
    "method": "Cooking ingredients",
    "where": "Use a sweet-category ingredient listed in your Cooking Collections; Sugarcane can be grown from Dazzle Beach seeds.",
    "url": "https://dreamlightvalleywiki.com/Ingredients"
  },
  "Peridot": {
    "name": "Peridot",
    "method": "Mining",
    "where": "Mine mineral veins in Peaceful Meadow or Dazzle Beach. The Mystical Cave requires a normal, NOT shiny, Peridot.",
    "url": "https://dreamlightvalleywiki.com/Peridot"
  },
  "Aquamarine": {
    "name": "Aquamarine",
    "method": "Mining",
    "where": "Mine mineral veins in Dazzle Beach or Forest of Valor. Use a normal, not shiny, Aquamarine for the cave.",
    "url": "https://dreamlightvalleywiki.com/Aquamarine"
  },
  "Garnet": {
    "name": "Garnet",
    "method": "Mining",
    "where": "Mine mineral veins in the Plaza or Peaceful Meadow. Use normal, not shiny, Garnet for the cave.",
    "url": "https://dreamlightvalleywiki.com/Garnet"
  },
  "Carrot Seed": {
    "name": "Carrot Seed",
    "method": "Shopping",
    "where": "Purchase Carrot Seeds from Goofy's Stall in Peaceful Meadow.",
    "url": "https://dreamlightvalleywiki.com/Carrot_Seed"
  },
  "Tomato Seed": {
    "name": "Tomato Seed",
    "method": "Shopping",
    "where": "Purchase Tomato Seeds from Goofy's Stall on Dazzle Beach after opening the stall.",
    "url": "https://dreamlightvalleywiki.com/Tomato_Seed"
  },
  "Wheat Seed": {
    "name": "Wheat Seed",
    "method": "Shopping",
    "where": "Purchase Wheat Seeds from Goofy's Stall in Peaceful Meadow.",
    "url": "https://dreamlightvalleywiki.com/Wheat_Seed"
  },
  "Dream Shard": {
    "name": "Dream Shard",
    "method": "Digging / critters",
    "where": "Dig sparkling soil spots, remove Night Thorns, or feed critters. Keep some for quests; don't convert all to Dreamlight.",
    "url": "https://dreamlightvalleywiki.com/Dream_Shard"
  },
  "Night Shard": {
    "name": "Night Shard",
    "method": "Digging",
    "where": "Dig sparkling soil spots in any Valley biome. One Onyx also crafts into three Night Shards.",
    "url": "https://dreamlightvalleywiki.com/Night_Shard"
  },
  "Vitalys Crystal": {
    "name": "Vitalys Crystal",
    "method": "Mining",
    "where": "Mine the special blue rock deposits inside the Vitalys Mines in Sunlit Plateau.",
    "url": "https://dreamlightvalleywiki.com/Vitalys_Crystal"
  },
  "Rich Soil": {
    "name": "Rich Soil",
    "method": "Harvesting crops",
    "where": "Harvest any planted crop for a chance at Rich Soil; quickly grown Wheat is useful for repeated attempts.",
    "url": "https://dreamlightvalleywiki.com/Rich_Soil"
  },
  "Dreamlight": {
    "name": "Dreamlight",
    "method": "Duties",
    "where": "Complete Dreamlight Duties and Dreamlight achievements under the Dreamlight menu to earn Dreamlight.",
    "url": "https://dreamlightvalleywiki.com/Dreamlight"
  },
  "Stone": {
    "name": "Stone",
    "method": "Mining",
    "where": "Mine rock spots in any Valley biome with the Pickaxe.",
    "url": "https://dreamlightvalleywiki.com/Stone"
  },
  "Iron Ore": {
    "name": "Iron Ore",
    "method": "Mining",
    "where": "Mine in Forest of Valor, Glade of Trust, Sunlit Plateau, Frosted Heights, Forgotten Lands, and Vitalys Mines.",
    "url": "https://dreamlightvalleywiki.com/Iron_Ore"
  },
  "Softwood": {
    "name": "Softwood",
    "method": "Foraging",
    "where": "Pick up sticks near trees in the Plaza, Peaceful Meadow, Forest of Valor, and Glade of Trust.",
    "url": "https://dreamlightvalleywiki.com/Softwood"
  },
  "Coal Ore": {
    "name": "Coal Ore",
    "method": "Mining",
    "where": "Mine rock spots in any Valley biome.",
    "url": "https://dreamlightvalleywiki.com/Coal_Ore"
  },
  "Welcoming Honey Treat": {
    "name": "Welcoming Honey Treat",
    "method": "Quest reward",
    "where": "Winnie the Pooh gives this special item during Chapter 11: The Anti-monster Camp. It is not a craftable ingredient.",
    "url": "https://dreamlightvalleywiki.com/Welcoming_Honey_Treat"
  }
};
export const DREAMLIGHT_MISSION_MATERIALS: Record<string,DreamlightMaterialGroup[]> = {
  "meadow-beach:q4": [
    {
      "items": [
        {
          "item": "Peridot",
          "qty": 1
        },
        {
          "item": "Aquamarine",
          "qty": 1
        },
        {
          "item": "Garnet",
          "qty": 1
        }
      ],
      "note": "The first Magic Gate needs one NON-SHINY gem of each color."
    },
    {
      "items": [
        {
          "item": "Carrot Seed",
          "qty": 1
        },
        {
          "item": "Tomato Seed",
          "qty": 1
        },
        {
          "item": "Wheat Seed",
          "qty": 1
        }
      ],
      "note": "Plant and water one of each crop at the second gate; then cook and eat the Veggie Pasta made from those crops at the third gate."
    }
  ],
  "forest-glade:q5": [
    {
      "items": [
        {
          "item": "Dream Shard",
          "qty": 5
        },
        {
          "item": "Night Shard",
          "qty": 5
        }
      ],
      "note": "Ursula asks for these during The Curse."
    }
  ],
  "sunlit-blizzard:q2": [
    {
      "items": [
        {
          "item": "Vitalys Crystal",
          "qty": 10
        },
        {
          "item": "Rich Soil",
          "qty": 10
        }
      ],
      "note": "Gather these for Miracle Growth Elixir; check the crafting station for the current Dreamlight requirement."
    }
  ],
  "honeyglow-1:q4": [
    {
      "items": [
        {
          "item": "Oak Leaves",
          "qty": 3
        },
        {
          "item": "Driftwood",
          "qty": 2
        },
        {
          "item": "Honey Agate",
          "qty": 1
        }
      ],
      "note": "Gather these for the Diggy-Wiggy Potion to clear Twistroots. Later dig up two Busy Bees' House parts near the river and fish two parts by the bridge."
    }
  ],
  "honeyglow-1:q5": [
    {
      "items": [
        {
          "item": "Golden Honey",
          "qty": 1
        },
        {
          "item": "Sweet Chestnut",
          "qty": 1
        }
      ],
      "note": "Cook the Honeycrunch Bar and give it to Pooh after completing the Busy Bees' House."
    }
  ],
  "honeyglow-2:q3": [
    {
      "items": [
        {
          "item": "Sweet Chestnut",
          "qty": 1
        },
        {
          "item": "Parsnip",
          "qty": 1
        },
        {
          "item": "Tree Resin",
          "qty": 1
        },
        {
          "item": "Fog Dust",
          "qty": 1
        },
        {
          "item": "Golden Honey",
          "qty": 1
        }
      ],
      "note": "Ingredients for one Honeyglow Elixir, used to clear the lantern fog."
    }
  ],
  "honeyglow-2:q5": [
    {
      "items": [
        {
          "item": "Golden Honey",
          "qty": 3
        },
        {
          "item": "Tree Resin",
          "qty": 15
        },
        {
          "item": "Driftwood",
          "qty": 12
        },
        {
          "item": "Oak Leaves",
          "qty": 10
        },
        {
          "item": "Soft Limestone",
          "qty": 15
        }
      ],
      "note": "Repair Pooh's Thoughtful Spot in Drowsybloom Acre."
    }
  ],
  "honeyglow-5:q3": [
    {
      "items": [
        {
          "item": "Hardwood",
          "qty": 4
        },
        {
          "item": "Tree Resin",
          "qty": 10
        },
        {
          "item": "Soft Limestone",
          "qty": 10
        },
        {
          "item": "Rose & Cream Foxglove",
          "qty": 3
        },
        {
          "item": "Driftwood",
          "qty": 5
        },
        {
          "item": "Honey Agate",
          "qty": 2
        },
        {
          "item": "Sweet Chestnut",
          "qty": 8
        }
      ],
      "note": "Total materials for the Storybook Sword and Heroic Helmet; craft both and wear them."
    }
  ],
  "honeyglow-5:q4": [
    {
      "items": [
        {
          "item": "Juniper Berry",
          "qty": 1
        },
        {
          "item": "Golden Pattypan",
          "qty": 1
        },
        {
          "item": "Plush Fish",
          "qty": 1
        },
        {
          "item": "Truffle",
          "qty": 1
        }
      ],
      "note": "Cook Fog-Busting Potion as instructed by Eeyore."
    }
  ],
  "honeyglow-6:q3": [
    {
      "items": [
        {
          "item": "Juniper Berry",
          "qty": 4
        },
        {
          "item": "Acorn Snail",
          "qty": 2
        },
        {
          "item": "Honey Agate",
          "qty": 1
        }
      ],
      "note": "Craft Amber Brushwoods Upgrade, use it, then clear eight large Amber Brushwoods near Eeyore's damaged house."
    }
  ],
  "honeyglow-6:q4": [
    {
      "items": [
        {
          "item": "Driftwood",
          "qty": 10
        },
        {
          "item": "Tree Resin",
          "qty": 5
        },
        {
          "item": "Oak Leaves",
          "qty": 3
        },
        {
          "item": "Soft Limestone",
          "qty": 12
        }
      ],
      "note": "Repair Eeyore's House."
    },
    {
      "items": [
        {
          "item": "Golden Honey",
          "qty": 6
        },
        {
          "item": "Honey Agate",
          "qty": 4
        },
        {
          "item": "Acorn Snail",
          "qty": 2
        },
        {
          "item": "Driftwood",
          "qty": 4
        }
      ],
      "note": "Additional decorations requested after the house repair: two Acorn Lanterns and 16 Driftwood Paths."
    }
  ],
  "honeyglow-7:q3": [
    {
      "items": [
        {
          "item": "Acorn Snail",
          "qty": 3
        },
        {
          "item": "Truffle",
          "qty": 3
        }
      ],
      "note": "Craft Door Grease to enter the blocked door."
    }
  ],
  "honeyglow-8:q3": [
    {
      "items": [
        {
          "item": "Sweet Chestnut",
          "qty": 5
        },
        {
          "item": "Oak Leaves",
          "qty": 6
        },
        {
          "item": "Soft Limestone",
          "qty": 5
        },
        {
          "item": "Yellow & Orange Foxglove",
          "qty": 5
        },
        {
          "item": "Yellow Thistle",
          "qty": 3
        },
        {
          "item": "Tree Resin",
          "qty": 5
        },
        {
          "item": "Golden Honey",
          "qty": 8
        },
        {
          "item": "Honey Agate",
          "qty": 4
        }
      ],
      "note": "First gather ingredients for the Chime Arch and Buzzing Hive Cluster to restore the Woods' sounds."
    },
    {
      "items": [
        {
          "item": "Rose & Cream Foxglove",
          "qty": 5
        },
        {
          "item": "Purple & White Foxglove",
          "qty": 5
        },
        {
          "item": "Driftwood",
          "qty": 5
        },
        {
          "item": "Shiny Honey Agate",
          "qty": 2
        },
        {
          "item": "Truffle",
          "qty": 5
        }
      ],
      "note": "After the sound decorations, craft Prickle-Popper Potion to upgrade your Shovel and clear Twistroots."
    }
  ],
  "honeyglow-8:q4": [
    {
      "items": [
        {
          "item": "Driftwood",
          "qty": 10
        },
        {
          "item": "Soft Limestone",
          "qty": 15
        },
        {
          "item": "Tree Resin",
          "qty": 10
        },
        {
          "item": "Honey Agate",
          "qty": 4
        },
        {
          "item": "Oak Leaves",
          "qty": 10
        }
      ],
      "note": "Craft/restore Babbling Pond; check your crafting table once the recipe unlocks."
    }
  ],
  "honeyglow-9:q3": [
    {
      "items": [
        {
          "item": "Tree Resin",
          "qty": 10
        },
        {
          "item": "Driftwood",
          "qty": 10
        },
        {
          "item": "Soft Limestone",
          "qty": 10
        },
        {
          "item": "Golden Honey",
          "qty": 5
        }
      ],
      "note": "Repair the Shortcut Bridge between Drowsybloom Acre and Braveheart Grove."
    }
  ],
  "honeyglow-10:q5": [
    {
      "items": [
        {
          "item": "Rainbow Foxglove",
          "qty": 1
        },
        {
          "item": "Soft Pillow",
          "qty": 1
        }
      ],
      "note": "Quest-specific ingredients for Bright Imagination Potion."
    }
  ],
  "honeyglow-10:q6": [
    {
      "items": [
        {
          "item": "Driftwood",
          "qty": 10
        },
        {
          "item": "Tree Resin",
          "qty": 8
        },
        {
          "item": "Soft Limestone",
          "qty": 10
        }
      ],
      "note": "Restore the Nectar Apiary campsite."
    }
  ],
  "honeyglow-11:q1": [
    {
      "items": [
        {
          "item": "Golden Honey",
          "qty": 4
        },
        {
          "item": "Parsnip",
          "qty": 4
        },
        {
          "item": "Tree Resin",
          "qty": 4
        },
        {
          "item": "Any Dairy or Oil",
          "qty": 4
        },
        {
          "item": "Any Spice",
          "qty": 4
        }
      ],
      "note": "Cook FOUR Toasted Picnic Sandwiches. Each sandwich uses one of every listed ingredient."
    }
  ],
  "honeyglow-11:q3": [
    {
      "items": [
        {
          "item": "Driftwood",
          "qty": 5
        },
        {
          "item": "White & Pink Foxglove",
          "qty": 5
        },
        {
          "item": "Tree Resin",
          "qty": 3
        }
      ],
      "note": "Craft Welcoming Signpost."
    }
  ],
  "honeyglow-11:q4": [
    {
      "items": [
        {
          "item": "Oak Leaves",
          "qty": 5
        },
        {
          "item": "Rose & Cream Foxglove",
          "qty": 5
        },
        {
          "item": "White Thistle",
          "qty": 5
        },
        {
          "item": "Golden Honey",
          "qty": 1
        },
        {
          "item": "Welcoming Honey Treat",
          "qty": 1
        }
      ],
      "note": "For the Welcoming Picnic Blanket: Pooh gives you the one Welcoming Honey Treat. Use the listed Golden Honey, flowers, and leaves at a crafting station."
    }
  ],
  "honeyglow-12:q2": [
    {
      "items": [
        {
          "item": "Golden Honey",
          "qty": 18
        }
      ],
      "note": "Craft three Honeyed Memories, then gift one each to Pooh, Eeyore and Piglet."
    }
  ],
  "honeyglow-12:q6": [
    {
      "items": [
        {
          "item": "Golden Honey",
          "qty": 5
        },
        {
          "item": "Driftwood",
          "qty": 10
        },
        {
          "item": "Tree Resin",
          "qty": 10
        },
        {
          "item": "Soft Limestone",
          "qty": 15
        },
        {
          "item": "Oak Leaves",
          "qty": 10
        }
      ],
      "note": "Repair the Old Windmill in Nectar Apiary."
    }
  ],
  "honeyglow-epilogue:q2": [
    {
      "items": [
        {
          "item": "Special Honey",
          "qty": 1
        },
        {
          "item": "Any Sweet",
          "qty": 1
        },
        {
          "item": "Any Dairy or Oil",
          "qty": 1
        },
        {
          "item": "Any Fruit",
          "qty": 1
        },
        {
          "item": "Any Grain",
          "qty": 1
        }
      ],
      "note": "Cooking recipe for Honey Hero Cake. Pooh gives you the quest-only Special Honey."
    }
  ],
  "honeyglow-epilogue:q3": [
    {
      "items": [
        {
          "item": "Oak Leaves",
          "qty": 5
        },
        {
          "item": "Tree Resin",
          "qty": 4
        },
        {
          "item": "Driftwood",
          "qty": 7
        },
        {
          "item": "White & Pink Foxglove",
          "qty": 5
        },
        {
          "item": "Honey Hero Cake",
          "qty": 1
        }
      ],
      "note": "Craft the Party Table; place it in Drowsybloom Acre."
    }
  ],
  "honeyglow-epilogue:q4": [
    {
      "items": [
        {
          "item": "Purple Thistle",
          "qty": 1
        },
        {
          "item": "Red Thistle",
          "qty": 1
        },
        {
          "item": "White & Pink Foxglove",
          "qty": 1
        },
        {
          "item": "Yellow & Orange Foxglove",
          "qty": 1
        },
        {
          "item": "Purple & White Foxglove",
          "qty": 1
        },
        {
          "item": "Rose & Cream Foxglove",
          "qty": 1
        },
        {
          "item": "White Thistle",
          "qty": 1
        },
        {
          "item": "Yellow Thistle",
          "qty": 1
        },
        {
          "item": "Golden Honey",
          "qty": 4
        }
      ],
      "note": "Materials needed across all FOUR Honeyglow Flower Pots."
    }
  ]
};
