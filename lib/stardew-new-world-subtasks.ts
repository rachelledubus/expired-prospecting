/** Small, checkable actions for the four new expansion mods and current campaign bottlenecks.
 * IDs are persistent save keys. Do not rename or reorder an existing part ID after publishing. */
export const STARDEW_NEW_WORLD_SUBTASKS: Record<string, { id: string; label: string; how?: string }[]> = {
  "new-age:intro": [
    {
      "id": "part-1",
      "label": "Go to the Adventurer's Guild"
    },
    {
      "id": "part-2",
      "label": "Talk to Marlon and watch the guild expansion scene"
    },
    {
      "id": "part-3",
      "label": "Check that Expanding the Guild is in the quest journal"
    }
  ],
  "new-age:wood": [
    {
      "id": "part-1",
      "label": "Collect 600 Wood and hold it in one stack"
    },
    {
      "id": "part-2",
      "label": "Go to Robin's Carpenter Shop"
    },
    {
      "id": "part-3",
      "label": "Hand all 600 Wood to Robin for Expanding the Guild (not as a gift)"
    }
  ],
  "new-age:wing": [
    {
      "id": "part-1",
      "label": "Watch the farmhouse follow-up after giving Robin the wood"
    },
    {
      "id": "part-2",
      "label": "Sleep until Marlon's invitation arrives"
    },
    {
      "id": "part-3",
      "label": "Return to the Adventurer's Guild"
    },
    {
      "id": "part-4",
      "label": "Enter the Monster Research Wing and meet Gabriel and Zinnia"
    }
  ],
  "new-age:slimes": [
    {
      "id": "part-1",
      "label": "Read the current slime research request"
    },
    {
      "id": "part-2",
      "label": "Find Green Slimes in the normal Mines"
    },
    {
      "id": "part-3",
      "label": "Defeat 30 Green Slimes while the quest is active"
    },
    {
      "id": "part-4",
      "label": "Return to the Monster Research Wing"
    }
  ],
  "new-age:gem": [
    {
      "id": "part-1",
      "label": "Read the Slime Gem objective"
    },
    {
      "id": "part-2",
      "label": "Defeat Green Slimes until a Slime Gem drops"
    },
    {
      "id": "part-3",
      "label": "Bring the Slime Gem to the Monster Research Wing"
    }
  ],
  "new-age:branch": [
    {
      "id": "part-1",
      "label": "Read your current Monster Research objective"
    },
    {
      "id": "part-2",
      "label": "Complete the next requested experiment or hand-in"
    },
    {
      "id": "part-3",
      "label": "Watch the resulting research story scene"
    },
    {
      "id": "part-4",
      "label": "Follow your preferred Gabriel or Zinnia/Silly story branch"
    },
    {
      "id": "part-5",
      "label": "Check the next quest for your chosen branch"
    }
  ],
  "new-sunberry:arrive": [
    {
      "id": "part-1",
      "label": "Go south of the Pelican Town Museum"
    },
    {
      "id": "part-2",
      "label": "Cross the route toward Sunberry Road"
    },
    {
      "id": "part-3",
      "label": "Follow the road into Sunberry Village"
    }
  ],
  "new-sunberry:explore": [
    {
      "id": "part-1",
      "label": "Find the village center and shops"
    },
    {
      "id": "part-2",
      "label": "Visit the cat café"
    },
    {
      "id": "part-3",
      "label": "Locate Sunberry Forest to the south"
    },
    {
      "id": "part-4",
      "label": "Locate Sunberry Mountain to the north"
    }
  ],
  "new-sunberry:museum": [
    {
      "id": "part-1",
      "label": "Find and enter the Sunberry Museum"
    },
    {
      "id": "part-2",
      "label": "Check which new finds are accepted"
    },
    {
      "id": "part-3",
      "label": "Keep a qualifying item instead of selling it"
    },
    {
      "id": "part-4",
      "label": "Make a museum donation"
    }
  ],
  "new-sunberry:mines": [
    {
      "id": "part-1",
      "label": "Find the Sunberry mines entrance"
    },
    {
      "id": "part-2",
      "label": "Enter the first accessible mine area"
    },
    {
      "id": "part-3",
      "label": "Collect a resource found inside"
    },
    {
      "id": "part-4",
      "label": "Reach the next mine checkpoint"
    }
  ],
  "new-sunberry:orders": [
    {
      "id": "part-1",
      "label": "Locate the Sunberry Special Orders board"
    },
    {
      "id": "part-2",
      "label": "Check whether the board is unlocked in your configuration"
    },
    {
      "id": "part-3",
      "label": "Choose one order with a reward you want"
    },
    {
      "id": "part-4",
      "label": "Collect the items for that order"
    },
    {
      "id": "part-5",
      "label": "Hand in the quest and claim its reward"
    }
  ],
  "new-sunberry:farm": [
    {
      "id": "part-1",
      "label": "Look for the storyline that unlocks new Sunberry farm space"
    },
    {
      "id": "part-2",
      "label": "Complete the next required story event"
    },
    {
      "id": "part-3",
      "label": "Deliver any requested items"
    },
    {
      "id": "part-4",
      "label": "Enter the newly unlocked farm space"
    }
  ],
  "new-vapius:train": [
    {
      "id": "part-1",
      "label": "Go to the Railroad"
    },
    {
      "id": "part-2",
      "label": "Find the Mount Vapius ticket machine"
    },
    {
      "id": "part-3",
      "label": "Pay the 250g fare"
    },
    {
      "id": "part-4",
      "label": "Take the train to Mount Vapius"
    }
  ],
  "new-vapius:hamlet": [
    {
      "id": "part-1",
      "label": "Walk north from the train station"
    },
    {
      "id": "part-2",
      "label": "Explore the Hamlet's main paths"
    },
    {
      "id": "part-3",
      "label": "Find the Red Owl Inn"
    },
    {
      "id": "part-4",
      "label": "Find the progression plaque in the Clearing"
    },
    {
      "id": "part-5",
      "label": "Read the current Hamlet Progression level"
    }
  ],
  "new-vapius:bundles": [
    {
      "id": "part-1",
      "label": "Find the local bundle collection area"
    },
    {
      "id": "part-2",
      "label": "Choose a manageable bundle"
    },
    {
      "id": "part-3",
      "label": "Collect the remaining bundle items"
    },
    {
      "id": "part-4",
      "label": "Donate the items to complete the bundle"
    },
    {
      "id": "part-5",
      "label": "Check the progression plaque for changes"
    }
  ],
  "new-vapius:board": [
    {
      "id": "part-1",
      "label": "Reach Hamlet Progression 1"
    },
    {
      "id": "part-2",
      "label": "Watch the Special Orders board introduction"
    },
    {
      "id": "part-3",
      "label": "Find the board outside the Red Owl Inn"
    },
    {
      "id": "part-4",
      "label": "Accept an interesting order"
    },
    {
      "id": "part-5",
      "label": "Finish the order and claim the reward"
    }
  ],
  "new-vapius:reserve": [
    {
      "id": "part-1",
      "label": "Find the Botanical Reserve"
    },
    {
      "id": "part-2",
      "label": "Inspect its plant donation requirements"
    },
    {
      "id": "part-3",
      "label": "Find or grow a qualifying local plant"
    },
    {
      "id": "part-4",
      "label": "Donate the plant"
    },
    {
      "id": "part-5",
      "label": "Check the collection's progress"
    }
  ],
  "new-vapius:forest": [
    {
      "id": "part-1",
      "label": "Take the western path from the Hamlet"
    },
    {
      "id": "part-2",
      "label": "Explore the forest"
    },
    {
      "id": "part-3",
      "label": "Find Lake Shimmersong"
    },
    {
      "id": "part-4",
      "label": "Locate the Forest Caves"
    },
    {
      "id": "part-5",
      "label": "Explore one accessible cave area"
    }
  ],
  "new-distant:swamp": [
    {
      "id": "part-1",
      "label": "Travel to the Witch's Swamp"
    },
    {
      "id": "part-2",
      "label": "Explore the changed swamp map"
    },
    {
      "id": "part-3",
      "label": "Find the new paths and landmarks"
    },
    {
      "id": "part-4",
      "label": "Locate Zic"
    }
  ],
  "new-distant:zic": [
    {
      "id": "part-1",
      "label": "Find Zic in the swamp"
    },
    {
      "id": "part-2",
      "label": "Talk to Zic"
    },
    {
      "id": "part-3",
      "label": "Check his friendship or next-event hints"
    },
    {
      "id": "part-4",
      "label": "Return for the next available interaction"
    }
  ],
  "new-distant:quests": [
    {
      "id": "part-1",
      "label": "Talk to Zic for his next event clue"
    },
    {
      "id": "part-2",
      "label": "Check the in-game journal for a new swamp objective"
    },
    {
      "id": "part-3",
      "label": "Complete that quest's current requirement"
    },
    {
      "id": "part-4",
      "label": "Watch the follow-up story scene"
    },
    {
      "id": "part-5",
      "label": "Check for the next objective"
    }
  ],
  "new-distant:secrets": [
    {
      "id": "part-1",
      "label": "Explore another corner of the swamp"
    },
    {
      "id": "part-2",
      "label": "Collect a new forage item or crop"
    },
    {
      "id": "part-3",
      "label": "Try a new swamp fishing spot"
    },
    {
      "id": "part-4",
      "label": "Look for newly available recipes"
    },
    {
      "id": "part-5",
      "label": "Use or craft one new swamp discovery"
    }
  ],
  "sword-sorcery-campaign:bardics-unlock": [
    {
      "id": "part-1",
      "label": "Open the Sword & Sorcery Player's Handbook"
    },
    {
      "id": "part-2",
      "label": "Find Cirrus's next required campaign objective"
    },
    {
      "id": "part-3",
      "label": "Complete the specified event or quest"
    },
    {
      "id": "part-4",
      "label": "Verify Bardics appears as an unlocked skill"
    }
  ],
  "sword-sorcery-campaign:roslin-intro": [
    {
      "id": "part-1",
      "label": "Finish Cirrus's required chapter"
    },
    {
      "id": "part-2",
      "label": "Check the Player's Handbook for the next main story hint"
    },
    {
      "id": "part-3",
      "label": "Meet Roslin through the next event"
    },
    {
      "id": "part-4",
      "label": "Read the Sorcerer chapter objective"
    }
  ],
  "sword-sorcery-campaign:sorcery-unlock": [
    {
      "id": "part-1",
      "label": "Follow Roslin's required Sorcerer storyline"
    },
    {
      "id": "part-2",
      "label": "Complete its next objective"
    },
    {
      "id": "part-3",
      "label": "Confirm Sorcery is unlocked in the skill or spell interface"
    }
  ],
  "sve-nexus:galdoran-warp": [
    {
      "id": "part-1",
      "label": "Return to the Enchanted Grove"
    },
    {
      "id": "part-2",
      "label": "Inspect the inactive Nexus destinations"
    },
    {
      "id": "part-3",
      "label": "Advance the missing warp requirement"
    },
    {
      "id": "part-4",
      "label": "Watch the Galdoran unlock event"
    },
    {
      "id": "part-5",
      "label": "Confirm the new warp route works"
    }
  ],
  "sve-aurora:starfruit": [
    {
      "id": "part-1",
      "label": "Plan where to obtain or grow Starfruit"
    },
    {
      "id": "part-2",
      "label": "Gather 200 Starfruit"
    },
    {
      "id": "part-3",
      "label": "Keep the full stack for the Aurora Vineyard quest"
    }
  ],
  "eastscarp-josephine-oliver:josephine-four": [
    {
      "id": "part-1",
      "label": "Confirm Oliver's required six-heart event"
    },
    {
      "id": "part-2",
      "label": "Reach four hearts with Josephine"
    },
    {
      "id": "part-3",
      "label": "Visit Scarp Inn when Josephine and Oliver are present"
    },
    {
      "id": "part-4",
      "label": "Watch Josephine's Inn event"
    }
  ]
};
