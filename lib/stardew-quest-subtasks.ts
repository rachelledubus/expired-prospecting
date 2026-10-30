import { STARDEW_NEW_WORLD_SUBTASKS } from "./stardew-new-world-subtasks";
import type { GameQuestStep, GameStoryline } from "./games-data";

/** Track the real actions inside broad Stardew/expanded-mod objectives without changing saved parent milestone keys. */
export type StardewQuestSubtask = { id: string; label: string; how?: string };

/** Keys are `storylineId:stepId`. Subtask IDs are stable once published to preserve checkmarks. */
export const STARDEW_QUEST_SUBTASKS: Record<string, StardewQuestSubtask[]> = {
  "ginger-island-field-office:large-animal": [
    {
      "id": "part-1",
      "label": "Collect Fossilized Skull",
      "how": "Crack Golden Coconuts at Clint's Blacksmith."
    },
    {
      "id": "part-2",
      "label": "Collect Fossilized Spine",
      "how": "Fish in the Dig Site river or hoe Artifact Spots on the Island South beach."
    },
    {
      "id": "part-3",
      "label": "Collect Fossilized Ribs",
      "how": "Hoe Artifact Spots on Island South or break Dig Site bone nodes."
    },
    {
      "id": "part-4",
      "label": "Collect Fossilized Tail",
      "how": "Use a Copper Pan in the Dig Site river."
    },
    {
      "id": "part-5",
      "label": "Collect 2 Fossilized Legs",
      "how": "Break fossil/bone nodes in the Dig Site until you have two."
    },
    {
      "id": "part-6",
      "label": "Donate all six pieces to Professor Snail",
      "how": "Open the Large Animal exhibit in the Island Field Office."
    }
  ],
  "ginger-island-field-office:snake": [
    {
      "id": "part-1",
      "label": "Collect the Snake Skull",
      "how": "Hoe Artifact Spots at the Dig Site or Island West; fishing in Island West is another route."
    },
    {
      "id": "part-2",
      "label": "Collect the first Snake Vertebra",
      "how": "Hoe Artifact Spots in Island West, especially near the Island Farm."
    },
    {
      "id": "part-3",
      "label": "Collect the second Snake Vertebra",
      "how": "Keep checking Island West Artifact Spots."
    },
    {
      "id": "part-4",
      "label": "Donate the Skull and both Vertebrae",
      "how": "Complete the Snake display at the Island Field Office."
    }
  ],
  "ginger-island-field-office:complete": [
    {
      "id": "part-1",
      "label": "Finish the Large Animal display"
    },
    {
      "id": "part-2",
      "label": "Finish the Snake display"
    },
    {
      "id": "part-3",
      "label": "Donate the Mummified Frog"
    },
    {
      "id": "part-4",
      "label": "Donate the Mummified Bat"
    },
    {
      "id": "part-5",
      "label": "Answer the Purple Flowers survey (22)"
    },
    {
      "id": "part-6",
      "label": "Answer the Purple Starfish survey (18)"
    },
    {
      "id": "part-7",
      "label": "Talk to Professor Snail and collect the final reward"
    }
  ],
  "ginger-island-qi:first-order": [
    {
      "id": "part-1",
      "label": "Enter Qi's Walnut Room"
    },
    {
      "id": "part-2",
      "label": "Choose one available Qi Special Order"
    },
    {
      "id": "part-3",
      "label": "Review its requirements and deadline in the journal"
    },
    {
      "id": "part-4",
      "label": "Finish the order and collect Qi Gems"
    }
  ],
  "vanilla-infinity-weapon:souls": [
    {
      "id": "part-1",
      "label": "Acquire Galaxy Soul 1"
    },
    {
      "id": "part-2",
      "label": "Acquire Galaxy Soul 2"
    },
    {
      "id": "part-3",
      "label": "Acquire Galaxy Soul 3"
    },
    {
      "id": "part-4",
      "label": "Collect 60 Cinder Shards"
    }
  ],
  "vanilla-infinity-weapon:forge": [
    {
      "id": "part-1",
      "label": "Bring the Galaxy Sword, 3 Galaxy Souls, and 60 Cinder Shards to the Volcano Forge"
    },
    {
      "id": "part-2",
      "label": "Forge the first Galaxy Soul with 20 Cinder Shards"
    },
    {
      "id": "part-3",
      "label": "Forge the second Galaxy Soul with 20 Cinder Shards"
    },
    {
      "id": "part-4",
      "label": "Forge the third Galaxy Soul with 20 Cinder Shards to obtain the Infinity Blade"
    }
  ],
  "vanilla-movie-theater:missing-bundle": [
    {
      "id": "part-1",
      "label": "Donate Silver-or-better Wine (one possible slot)"
    },
    {
      "id": "part-2",
      "label": "Donate Dinosaur Mayonnaise (one possible slot)"
    },
    {
      "id": "part-3",
      "label": "Donate a Prismatic Shard (one possible slot)"
    },
    {
      "id": "part-4",
      "label": "Donate 5 Gold-quality Ancient Fruit (one possible slot)"
    },
    {
      "id": "part-5",
      "label": "Donate Gold/Iridium-quality Void Salmon (one possible slot)"
    },
    {
      "id": "part-6",
      "label": "Donate Caviar (one possible slot)"
    }
  ],
  "vanilla-mastery:five-skills": [
    {
      "id": "part-1",
      "label": "Reach Farming level 10"
    },
    {
      "id": "part-2",
      "label": "Reach Mining level 10"
    },
    {
      "id": "part-3",
      "label": "Reach Foraging level 10"
    },
    {
      "id": "part-4",
      "label": "Reach Fishing level 10"
    },
    {
      "id": "part-5",
      "label": "Reach Combat level 10"
    }
  ],
  "vanilla-mastery:all-five": [
    {
      "id": "part-1",
      "label": "Claim Farming Mastery"
    },
    {
      "id": "part-2",
      "label": "Claim Fishing Mastery"
    },
    {
      "id": "part-3",
      "label": "Claim Foraging Mastery"
    },
    {
      "id": "part-4",
      "label": "Claim Mining Mastery"
    },
    {
      "id": "part-5",
      "label": "Claim Combat Mastery"
    }
  ],
  "vanilla-raccoon:request-2": [
    {
      "id": "part-1",
      "label": "Complete the first Raccoon request using the items shown in-game"
    },
    {
      "id": "part-2",
      "label": "Wait for the next request to appear"
    },
    {
      "id": "part-3",
      "label": "Complete the second Raccoon request"
    }
  ],
  "vanilla-raccoon:request-9": [
    {
      "id": "part-1",
      "label": "Complete Raccoon request 3"
    },
    {
      "id": "part-2",
      "label": "Complete Raccoon request 4"
    },
    {
      "id": "part-3",
      "label": "Complete Raccoon request 5"
    },
    {
      "id": "part-4",
      "label": "Complete Raccoon request 6"
    },
    {
      "id": "part-5",
      "label": "Complete Raccoon request 7"
    },
    {
      "id": "part-6",
      "label": "Complete Raccoon request 8"
    },
    {
      "id": "part-7",
      "label": "Complete Raccoon request 9"
    }
  ],
  "sns-underforge:pure-ore-forge": [
    {
      "id": "part-1",
      "label": "Reach Artificer level 2"
    },
    {
      "id": "part-2",
      "label": "Collect a compatible Pure Ore from ore nodes"
    },
    {
      "id": "part-3",
      "label": "Bring the Pure Ore and weapon to the Underforge"
    },
    {
      "id": "part-4",
      "label": "Use the forge interface to apply the upgrade"
    }
  ],
  "sns-underforge:exquisite-forge": [
    {
      "id": "part-1",
      "label": "Reach Artificer level 4"
    },
    {
      "id": "part-2",
      "label": "Collect a compatible Exquisite Gem from gem nodes"
    },
    {
      "id": "part-3",
      "label": "Bring the Exquisite Gem and weapon to the Underforge"
    },
    {
      "id": "part-4",
      "label": "Apply the upgrade after checking the effect in the tooltip"
    }
  ],
  "sword-sorcery-campaign:cirrus-intro": [
    {
      "id": "part-1",
      "label": "Check the Player's Handbook for the next available Cirrus trigger in your installed S&S version"
    },
    {
      "id": "part-2",
      "label": "Trigger and watch Cirrus's introduction cutscene"
    }
  ],
  "sword-sorcery-campaign:lions-mane": [
    {
      "id": "part-1",
      "label": "Start Cirrus's required chapter after her introduction"
    },
    {
      "id": "part-2",
      "label": "Complete the current Cirrus quest shown in your journal/Player's Handbook"
    },
    {
      "id": "part-3",
      "label": "Return to the Lion's Mane after the required restoration event"
    },
    {
      "id": "part-4",
      "label": "Confirm that the Lion's Mane has been restored"
    }
  ],
  "sword-sorcery-campaign:cirrus-chapter": [
    {
      "id": "part-1",
      "label": "Unlock Bardics through Cirrus's story"
    },
    {
      "id": "part-2",
      "label": "Finish the remaining required Cirrus journal/event sequence"
    },
    {
      "id": "part-3",
      "label": "Confirm the next main campaign chapter becomes available"
    }
  ],
  "sve-highlands:enter-highlands": [
    {
      "id": "part-1",
      "label": "Use the repaired boat at the Adventurer's Guild"
    },
    {
      "id": "part-2",
      "label": "Arrive in the Highlands"
    },
    {
      "id": "part-3",
      "label": "Trigger Lance's available 2-heart story event"
    }
  ],
  "sve-nexus:railroad-boulder": [
    {
      "id": "part-1",
      "label": "Collect 20 Iridium Ore"
    },
    {
      "id": "part-2",
      "label": "Collect 20 Coal"
    },
    {
      "id": "part-3",
      "label": "Deliver both materials for Clint's Railroad Boulder quest"
    },
    {
      "id": "part-4",
      "label": "Visit the reopened Summit"
    }
  ],
  "sve-nexus:galaxy-sword": [
    {
      "id": "part-1",
      "label": "Acquire one Prismatic Shard"
    },
    {
      "id": "part-2",
      "label": "Repair the Bus and travel to Calico Desert"
    },
    {
      "id": "part-3",
      "label": "Stand holding the shard between the three desert pillars"
    },
    {
      "id": "part-4",
      "label": "Collect your Galaxy Sword"
    }
  ],
  "sve-nexus:nexus-part1": [
    {
      "id": "part-1",
      "label": "Confirm the four Nexus prerequisites in your quest guide"
    },
    {
      "id": "part-2",
      "label": "Enter your Farm in the morning when the Enchanted Grove event becomes available"
    },
    {
      "id": "part-3",
      "label": "Watch Magnus's Enchanted Grove Part I"
    }
  ],
  "sve-grandpa-shed:inspection": [
    {
      "id": "part-1",
      "label": "Enter Grandpa's ruined Shed"
    },
    {
      "id": "part-2",
      "label": "Trigger Robin's inspection"
    },
    {
      "id": "part-3",
      "label": "Follow Robin's request for the restoration materials"
    }
  ],
  "sve-grandpa-shed:restore": [
    {
      "id": "part-1",
      "label": "Place the requested materials in the Shed restoration chest"
    },
    {
      "id": "part-2",
      "label": "Finish the day and allow the restoration sequence"
    },
    {
      "id": "part-3",
      "label": "Re-enter the restored Grandpa's Shed"
    }
  ],
  "sve-andy-strawberry-mastery:order": [
    {
      "id": "part-1",
      "label": "Accept Andy's Cellar Special Order"
    },
    {
      "id": "part-2",
      "label": "Collect 500 Wood"
    },
    {
      "id": "part-3",
      "label": "Collect 500 Stone"
    },
    {
      "id": "part-4",
      "label": "Collect 75 Hardwood"
    },
    {
      "id": "part-5",
      "label": "Collect 15 Iron Bars"
    },
    {
      "id": "part-6",
      "label": "Deposit the materials into Andy's quest chest before the 14-day deadline"
    }
  ],
  "sve-susan-brewing-mastery:order": [
    {
      "id": "part-1",
      "label": "Accept Homemade Fertilizer outside Winter"
    },
    {
      "id": "part-2",
      "label": "Craft or collect 50 Quality Fertilizer"
    },
    {
      "id": "part-3",
      "label": "Deposit all 50 in Susan's quest chest before the order expires"
    }
  ],
  "sve-marlon-venture:order": [
    {
      "id": "part-1",
      "label": "Accept A Mysterious Venture from the Special Orders board"
    },
    {
      "id": "part-2",
      "label": "Collect 30 Cherry Bombs"
    },
    {
      "id": "part-3",
      "label": "Collect 20 Bombs"
    },
    {
      "id": "part-4",
      "label": "Collect 10 Mega Bombs"
    },
    {
      "id": "part-5",
      "label": "Deliver all three bomb stacks to the quest drop-off"
    }
  ],
  "sve-aurora:turn-in": [
    {
      "id": "part-1",
      "label": "Make sure Aurora Vineyard's 200-Starfruit quest is active"
    },
    {
      "id": "part-2",
      "label": "Bring all 200 Starfruit to the required quest delivery point"
    },
    {
      "id": "part-3",
      "label": "Complete the quest and wait for the Apples follow-up"
    }
  ],
  "sve-morgan-animal-mastery:ten-hearts": [
    {
      "id": "part-1",
      "label": "Reach 10 hearts with Morgan"
    },
    {
      "id": "part-2",
      "label": "Trigger Part I on the Farm, 6–8 AM on a sunny non-Winter day"
    },
    {
      "id": "part-3",
      "label": "Trigger Part II in Forest West, 6 AM–6 PM on a sunny day"
    },
    {
      "id": "part-4",
      "label": "Confirm Animal Mastery was unlocked"
    }
  ],
  "sve-late-combat:legendary-ready": [
    {
      "id": "part-1",
      "label": "Unlock the Highlands Dwarf Shop"
    },
    {
      "id": "part-2",
      "label": "Unlock Henchman as an NPC"
    },
    {
      "id": "part-3",
      "label": "Reach the Crimson Badlands Treasure Cave"
    },
    {
      "id": "part-4",
      "label": "Reach at least 4 hearts with Marlon"
    },
    {
      "id": "part-5",
      "label": "Confirm Legendary Trio is available"
    }
  ],
  "sve-late-combat:legendary-trio": [
    {
      "id": "part-1",
      "label": "Defeat the target that drops the Mega Purple Mushroom"
    },
    {
      "id": "part-2",
      "label": "Defeat the target that drops the Magic Lamp"
    },
    {
      "id": "part-3",
      "label": "Defeat the target that drops the Gold Slime Egg"
    },
    {
      "id": "part-4",
      "label": "Turn in all three quest spoils to Marlon"
    }
  ],
  "ridgeside-main:preparations": [
    {
      "id": "part-1",
      "label": "Meet Daia and receive The Preparations"
    },
    {
      "id": "part-2",
      "label": "Read the Ancient Book in the Ninja House"
    },
    {
      "id": "part-3",
      "label": "Review the requested Mountain Mistbloom and Cursed Artifacts"
    }
  ],
  "ridgeside-main:mistbloom": [
    {
      "id": "part-1",
      "label": "Read the Ancient Book for the Cursed Artifact clues"
    },
    {
      "id": "part-2",
      "label": "Collect the Mountain Mistbloom quantity shown in your journal"
    },
    {
      "id": "part-3",
      "label": "Collect the required Cursed Artifacts"
    },
    {
      "id": "part-4",
      "label": "Check the quest journal for any remaining requirements"
    }
  ],
  "ridgeside-main:crystal-quests": [
    {
      "id": "part-1",
      "label": "Donate 30 RED-color items",
      "how": "Bait or Salmonberries are inexpensive examples."
    },
    {
      "id": "part-2",
      "label": "Donate 30 ORANGE-color items",
      "how": "Copper Ore is a commonly used option."
    },
    {
      "id": "part-3",
      "label": "Donate 30 YELLOW-color items",
      "how": "Sap is an inexpensive option."
    },
    {
      "id": "part-4",
      "label": "Donate 30 GREEN-color items",
      "how": "Fiber is an inexpensive option."
    },
    {
      "id": "part-5",
      "label": "Donate 30 BLUE-color items",
      "how": "Joja Cola is an option if you do not want to wait for blueberries."
    },
    {
      "id": "part-6",
      "label": "Donate 30 PURPLE-color items",
      "how": "Mountain Mistbloom or Eggplant can work; check the crystal's dye-category acceptance."
    },
    {
      "id": "part-7",
      "label": "Donate 30 GREY/white/black-color items",
      "how": "Stone or Iron Ore can count."
    }
  ],
  "ridgeside-main:blessed-artifacts": [
    {
      "id": "part-1",
      "label": "Collect Ancient Music Box",
      "how": "Axe the ballerina painting on the Log Cabin Hotel's third floor."
    },
    {
      "id": "part-2",
      "label": "Collect Elven Comb",
      "how": "Hoe the tile at the top-right of the Abandoned House on the Hike Trail."
    },
    {
      "id": "part-3",
      "label": "Collect Everfrost Stone",
      "how": "Axe the wall between the colored boxes at Nightingale Orchard Tree Shop."
    },
    {
      "id": "part-4",
      "label": "Collect Great River Spirit Statue",
      "how": "Hoe beside the tree and bench at The Cliff."
    },
    {
      "id": "part-5",
      "label": "Collect Opal Halo",
      "how": "Hoe the indicated tile behind the Pelican Town cable-car stop."
    },
    {
      "id": "part-6",
      "label": "Collect Pale Candelabrum",
      "how": "First unlock the Phantom Greenhouse through the parallel Ridgeside greenhouse storyline; then water the statue inside."
    },
    {
      "id": "part-7",
      "label": "Collect Relic Fox Mask",
      "how": "Stand still for two in-game hours directly in front of the fox statue on The Ridge."
    },
    {
      "id": "part-8",
      "label": "Collect Sapphire Pearl",
      "how": "Fish in Tort's pond at its northernmost tile, west of Akina Residence."
    },
    {
      "id": "part-9",
      "label": "Collect Village Hero Sculpture",
      "how": "Fish in the well beside Amethyne Mansion."
    }
  ],
  "ridgeside-main:open-portal": [
    {
      "id": "part-1",
      "label": "Place Opal Halo on the lower-right pedestal"
    },
    {
      "id": "part-2",
      "label": "Place Elven Comb on the next pedestal counterclockwise"
    },
    {
      "id": "part-3",
      "label": "Place Pale Candelabrum on the next pedestal"
    },
    {
      "id": "part-4",
      "label": "Place Village Hero Sculpture on the next pedestal"
    },
    {
      "id": "part-5",
      "label": "Place Everfrost Stone on the next pedestal"
    },
    {
      "id": "part-6",
      "label": "Place Ancient Music Box on the next pedestal"
    },
    {
      "id": "part-7",
      "label": "Place Sapphire Pearl on the next pedestal"
    },
    {
      "id": "part-8",
      "label": "Place Relic Fox Mask on the next pedestal"
    },
    {
      "id": "part-9",
      "label": "Place Great River Spirit Statue on the last pedestal"
    },
    {
      "id": "part-10",
      "label": "Confirm each fox's eyes glow and enter the open portal"
    }
  ],
  "ridgeside-main:cleanse-spirit-realm": [
    {
      "id": "part-1",
      "label": "Extinguish Corrupted Flame 1"
    },
    {
      "id": "part-2",
      "label": "Extinguish Corrupted Flame 2"
    },
    {
      "id": "part-3",
      "label": "Extinguish Corrupted Flame 3"
    },
    {
      "id": "part-4",
      "label": "Extinguish Corrupted Flame 4"
    },
    {
      "id": "part-5",
      "label": "Extinguish Corrupted Flame 5"
    },
    {
      "id": "part-6",
      "label": "Confirm the Spirit Realm cleansing event completes"
    }
  ],
  "ridgeside-ridge-pond:linked-fishes": [
    {
      "id": "part-1",
      "label": "Collect Bladetail Sturgeon"
    },
    {
      "id": "part-2",
      "label": "Collect Caped Tree Frog"
    },
    {
      "id": "part-3",
      "label": "Collect Cardia Septal Jellyfish"
    },
    {
      "id": "part-4",
      "label": "Collect Crimson Spiked Clam"
    },
    {
      "id": "part-5",
      "label": "Collect Fairytale Lionfish"
    },
    {
      "id": "part-6",
      "label": "Collect Fixer Eel"
    },
    {
      "id": "part-7",
      "label": "Collect Golden Rose Fin"
    },
    {
      "id": "part-8",
      "label": "Collect Harvester Trout"
    },
    {
      "id": "part-9",
      "label": "Collect Lullaby Carp"
    },
    {
      "id": "part-10",
      "label": "Collect Pebble Back Crab"
    },
    {
      "id": "part-11",
      "label": "Donate the 10 linked fish to the Ninja House"
    }
  ],
  "ridgeside-ridge-pond:pond-event": [
    {
      "id": "part-1",
      "label": "Sleep after completing Linked Fishes"
    },
    {
      "id": "part-2",
      "label": "Read Belinda's letter"
    },
    {
      "id": "part-3",
      "label": "Visit Ridge Falls and watch Belinda's event"
    }
  ],
  "ridgeside-greenhouse-story:second-chance": [
    {
      "id": "part-1",
      "label": "Collect 25 Mountain Mistbloom"
    },
    {
      "id": "part-2",
      "label": "Collect 10 Sweet Gem Berries"
    },
    {
      "id": "part-3",
      "label": "Collect 5 Rubies"
    },
    {
      "id": "part-4",
      "label": "Turn in the items to finish A Second Chance"
    }
  ],
  "ridgeside-community-greenhouse:restore": [
    {
      "id": "part-1",
      "label": "Deposit 60 Hardwood in Lenny's office"
    },
    {
      "id": "part-2",
      "label": "Deposit 100 Stone in Lenny's office"
    },
    {
      "id": "part-3",
      "label": "Deposit 50 Iron Bars in Lenny's office"
    },
    {
      "id": "part-4",
      "label": "Sleep and return to confirm the Greenhouse is restored"
    }
  ],
  "rosa:orchard-bridge": [
    {
      "id": "part-1",
      "label": "Accept Repair the Orchard Bridge"
    },
    {
      "id": "part-2",
      "label": "Gather 200 Wood"
    },
    {
      "id": "part-3",
      "label": "Gather 20 Hardwood"
    },
    {
      "id": "part-4",
      "label": "Submit the materials to complete Rosa's bridge order"
    }
  ],
  "rosa:ruby-ring": [
    {
      "id": "part-1",
      "label": "Read the active archaeology clue or journal entry"
    },
    {
      "id": "part-2",
      "label": "Investigate the location identified by the quest"
    },
    {
      "id": "part-3",
      "label": "Recover the Vintage Ruby Ring"
    }
  ],
  "eastscarp-victoria-luma:slime-eggs": [
    {
      "id": "part-1",
      "label": "Accept Luma's Slime Eggs request and confirm the agreed quantity (50, 25, or 10)"
    },
    {
      "id": "part-2",
      "label": "Collect the agreed number of Slime Eggs"
    },
    {
      "id": "part-3",
      "label": "Deliver them to finish the challenge"
    }
  ],
  "eastscarp-aideen-bouquet:flowers": [
    {
      "id": "part-1",
      "label": "Collect 1 Tulip"
    },
    {
      "id": "part-2",
      "label": "Collect 1 Blue Jazz"
    },
    {
      "id": "part-3",
      "label": "Collect 1 Sweet Pea"
    },
    {
      "id": "part-4",
      "label": "Enter Aideen's house carrying all three flowers"
    }
  ],
  "eastscarp-jade-fairy:fairy-ring": [
    {
      "id": "part-1",
      "label": "Collect 10 Fairy Rose Seeds"
    },
    {
      "id": "part-2",
      "label": "Collect 20 Moss"
    },
    {
      "id": "part-3",
      "label": "Collect 10 Clay"
    },
    {
      "id": "part-4",
      "label": "Collect 10 mushrooms of any kind"
    },
    {
      "id": "part-5",
      "label": "Deposit everything outside Jessie's House"
    }
  ],
  "eastscarp-josephine-oliver:oliver-six": [
    {
      "id": "part-1",
      "label": "Reach 2 hearts with Oliver and see his 2-heart event"
    },
    {
      "id": "part-2",
      "label": "Reach 4 hearts with Lexi and see the required 4-heart event"
    },
    {
      "id": "part-3",
      "label": "Reach 4 hearts with Oliver and see his 4-heart event"
    },
    {
      "id": "part-4",
      "label": "Reach 6 hearts with Oliver and see his 6-heart event"
    }
  ],
  "eastscarp-tristan:part3": [
    {
      "id": "part-1",
      "label": "Trigger Tristan Part III-A at the Wizard's Tower"
    },
    {
      "id": "part-2",
      "label": "Visit Evelyn's House while Evelyn is present for Part III-B"
    }
  ],
  "eastscarp-tristan:part4": [
    {
      "id": "part-1",
      "label": "Collect a Fairy Rose"
    },
    {
      "id": "part-2",
      "label": "Collect a Fairy Stone"
    },
    {
      "id": "part-3",
      "label": "Catch or obtain a Void Salmon"
    },
    {
      "id": "part-4",
      "label": "Bring all three to the Fairy Pool around 11:50 PM"
    }
  ],
  "eastscarp-sen:six-part2": [
    {
      "id": "part-1",
      "label": "Finish the quest issued after Sen's 6-heart Part I in the Deep Dark"
    },
    {
      "id": "part-2",
      "label": "Return to the farmhouse for Sen's 6-heart Part II"
    }
  ],
  "eyvind:void-goats": [
    {
      "id": "part-1",
      "label": "Finish Eyvind's 8-heart event"
    },
    {
      "id": "part-2",
      "label": "Finish George's 6-heart event"
    },
    {
      "id": "part-3",
      "label": "Receive Marnie's letter"
    },
    {
      "id": "part-4",
      "label": "Check that Void Goats appear at Marnie's livestock shop"
    }
  ],
  "jio-romance:fourteen-hearts": [
    {
      "id": "part-1",
      "label": "Reach 14 hearts with Jio"
    },
    {
      "id": "part-2",
      "label": "Trigger Jio's first post-marriage event"
    },
    {
      "id": "part-3",
      "label": "Trigger the post-marriage follow-up event"
    }
  ],
  ...STARDEW_NEW_WORLD_SUBTASKS
};


// One source of truth for BOTH the UI and server-side persisted check key registry.
// Existing curated and material/social IDs remain unchanged across releases.
export function getStardewQuestSubtasks(story: GameStoryline, step: GameQuestStep): StardewQuestSubtask[] {
  const curated = STARDEW_QUEST_SUBTASKS[`${story.id}:${step.id}`];
  if (curated?.length) return curated;

  // Keep older "material-N" keys stable so existing individual checkmarks persist.
  const materials: StardewQuestSubtask[] = (step.requiredItems ?? []).map((item, i) => ({
    id: `material-${i + 1}`,
    label: `Collect ${item.qty ?? 1} × ${item.name}`,
    how: item.note,
  }));

  if (materials.length <= 1 && step.social && /hearts?/i.test(step.label) && /(event|Part |trigger|see |unlock)/i.test(step.label)) {
    return [
      { id: "friendship", label: `Reach ${step.social.hearts} hearts with ${step.social.npc}` },
      { id: "event", label: "Trigger and watch the required story event", how: step.how },
    ];
  }

  // For quests without a handcrafted breakdown, reuse actual objective instructions
  // instead of inventing mod-specific requirements. Each short instruction gets a checkbox.
  const route: StardewQuestSubtask[] = step.location
    ? [{ id: "travel", label: `Go to ${step.location}` }]
    : [];
  const instructions = (step.how ?? "")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])|;\s+/)
    .map((text) => text.trim())
    .filter((text) => text.length > 8)
    .slice(0, 4)
    .map((label, i) => ({ id: `instruction-${i + 1}`, label }));

  return [...materials, ...route, ...instructions].slice(0, Math.max(12, materials.length));
}
