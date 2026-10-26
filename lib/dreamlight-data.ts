/** Disney Dreamlight Valley base-game progression guide.
 * Paid DLC and expansion quests are intentionally excluded.
 * Stage/step IDs are stable and preserve progress already recorded under these keys.
 */
export type DreamlightArea = "valley";
export type DreamlightSection = "story" | "realms" | "friends" | "projects" | "collections";
export type DreamlightStep = { id: string; label: string; how?: string };
export type DreamlightStage = {
 id: string; title: string; area: DreamlightArea; section: DreamlightSection;
 summary: string; source: string; steps: DreamlightStep[];
};
export type DreamlightGame = {
 kind: "dreamlight"; id: string; tab: string; title: string; mods: string; stages: DreamlightStage[];
};
export const DREAMLIGHT_GAME: DreamlightGame = {
  "kind": "dreamlight",
  "id": "dreamlight-valley",
  "tab": "Dreamlight Valley",
  "title": "Disney Dreamlight Valley",
  "mods": "Base game • Main Story • Realms • Friends",
  "stages": [
    {
      "id": "welcome",
      "title": "Getting settled",
      "area": "valley",
      "section": "story",
      "summary": "The opening quest chain restores your tools and basic Valley facilities.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Complete Welcome to Dreamlight Valley",
          "how": "Follow Merlin's initial instructions and clear the Night Thorns."
        },
        {
          "id": "q2",
          "label": "Find the Royal Pickaxe, Watering Can, Shovel, and Fishing Rod in The Royal Tools."
        },
        {
          "id": "q3",
          "label": "Enter the Dream Castle with Merlin in The Dream Castle."
        },
        {
          "id": "q4",
          "label": "Help Scrooge in Making Cents of Things."
        },
        {
          "id": "q5",
          "label": "Finish Fishing Expedition with Goofy."
        },
        {
          "id": "q6",
          "label": "Complete Scrooge McDuck's Grand Re-opening."
        },
        {
          "id": "q7",
          "label": "Complete Mickey's Memories and Foodception."
        },
        {
          "id": "q8",
          "label": "Complete Friendship Is Everything to restore the first Pillar."
        }
      ]
    },
    {
      "id": "meadow-beach",
      "title": "Peaceful Meadow & Dazzle Beach",
      "area": "valley",
      "section": "story",
      "summary": "Open the coast and complete the Mystical Cave pillar story.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Finish Rebuild the Valley: Peaceful Meadow."
        },
        {
          "id": "q2",
          "label": "Unlock Dazzle Beach using Dreamlight."
        },
        {
          "id": "q3",
          "label": "Begin With Great Power... at the Mystical Cave."
        },
        {
          "id": "q4",
          "label": "Complete With Great Power...",
          "how": "Solve the Mystical Cave puzzles as the quest journal directs, then restore the Orb."
        },
        {
          "id": "q5",
          "label": "Finish Rebuild the Valley: Dazzle Beach."
        }
      ]
    },
    {
      "id": "forest-glade",
      "title": "Forest of Valor & Glade of Trust",
      "area": "valley",
      "section": "story",
      "summary": "Repair the next two biomes and progress the Valley's magical story.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Open the Forest of Valor."
        },
        {
          "id": "q2",
          "label": "Finish Lost in the Dark Grove."
        },
        {
          "id": "q3",
          "label": "Complete Rebuild the Valley: Forest of Valor."
        },
        {
          "id": "q4",
          "label": "Open the Glade of Trust."
        },
        {
          "id": "q5",
          "label": "Advance The Curse and help Mother Gothel."
        },
        {
          "id": "q6",
          "label": "Complete Rebuild the Valley: Glade of Trust."
        }
      ]
    },
    {
      "id": "sunlit-blizzard",
      "title": "Sunlit Plateau & Frosted Heights",
      "area": "valley",
      "section": "story",
      "summary": "Advance Scar and Olaf's stories through two major biome unlocks.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Open Sunlit Plateau and begin Nature & Nurture."
        },
        {
          "id": "q2",
          "label": "Help Scar restore the Pillar of Nurturing in Nature & Nurture."
        },
        {
          "id": "q3",
          "label": "Finish Rebuild the Valley: Sunlit Plateau."
        },
        {
          "id": "q4",
          "label": "Complete Working Miracles."
        },
        {
          "id": "q5",
          "label": "Open Frosted Heights and begin The Great Blizzard."
        },
        {
          "id": "q6",
          "label": "Help Olaf restore the Pillar of Love in The Great Blizzard."
        },
        {
          "id": "q7",
          "label": "Complete Rebuild the Valley: Frosted Heights."
        }
      ]
    },
    {
      "id": "forgotten-story",
      "title": "The Forgotten: core storyline",
      "area": "valley",
      "section": "story",
      "summary": "The original main story finale, with each Forgotten Relic separately checkable.",
      "source": "https://www.dreamlightvalleywiki.com/The_Forgotten_Relics",
      "steps": [
        {
          "id": "q1",
          "label": "Begin Miracles Take Time with the Fairy Godmother."
        },
        {
          "id": "q2",
          "label": "Complete Forgotten Memories: Friendship."
        },
        {
          "id": "q3",
          "label": "Complete Forgotten Memories: Trust."
        },
        {
          "id": "q4",
          "label": "Complete Forgotten Memories: Nurturing."
        },
        {
          "id": "q5",
          "label": "Finish What's Left Behind."
        },
        {
          "id": "q6",
          "label": "Begin The Forgotten Relics after Merlin's investigation",
          "how": "The quest typically becomes available about a day after What's Left Behind."
        },
        {
          "id": "q7",
          "label": "Find the Forgotten Storybook in Mickey's house."
        },
        {
          "id": "q8",
          "label": "Find the Forgotten Blanket in the secret Frosted Heights chamber."
        },
        {
          "id": "q9",
          "label": "Find the Forgotten Drawing in Scar's Lair."
        },
        {
          "id": "q10",
          "label": "Find Forgotten Beach Toys in Ursula's Dazzle Beach cave."
        },
        {
          "id": "q11",
          "label": "Finish the Forgotten Relics quests and listen to the characters' stories."
        },
        {
          "id": "q12",
          "label": "Complete The Dark Castle."
        },
        {
          "id": "q13",
          "label": "Complete The Remembered and Odds & Ends..."
        }
      ]
    },
    {
      "id": "valley-after",
      "title": "After the Forgotten",
      "area": "valley",
      "section": "story",
      "summary": "Continue free-story additions beyond the original finale; quest availability depends on completed character and Valley prerequisites.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Complete Between a Skull Rock and a Hard Place."
        },
        {
          "id": "q2",
          "label": "Rebuild the Valley: Forgotten Lands."
        },
        {
          "id": "q3",
          "label": "Progress Islands in the Sky."
        },
        {
          "id": "q4",
          "label": "Complete Slow and Steady."
        },
        {
          "id": "q5",
          "label": "Begin The Memento."
        },
        {
          "id": "q6",
          "label": "Follow Shadows on the Wall."
        },
        {
          "id": "q7",
          "label": "Complete A Ship of Gold."
        },
        {
          "id": "q8",
          "label": "Progress The Music's on the Walls."
        }
      ]
    },
    {
      "id": "valley-2026",
      "title": "Later free Valley adventures",
      "area": "valley",
      "section": "story",
      "summary": "Extra free storyline and seasonal quests; the Oogie Boogie questline is time-limited in 2026.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Finish The Moose Hunt when it becomes available."
        },
        {
          "id": "q2",
          "label": "Complete Developed Decorating."
        },
        {
          "id": "q3",
          "label": "Follow On the Path of Stars when unlocked."
        }
      ]
    },
    {
      "id": "realm-moana",
      "title": "Moana & Maui",
      "area": "valley",
      "section": "realms",
      "summary": "Unlock two residents through their ocean realm.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Unlock Moana's realm in the Dream Castle."
        },
        {
          "id": "q2",
          "label": "Complete After the Storm."
        },
        {
          "id": "q3",
          "label": "Complete The Great Maui."
        },
        {
          "id": "q4",
          "label": "Complete How Far You'll Go and welcome Moana."
        },
        {
          "id": "q5",
          "label": "Complete A Feast Worthy Of A Demigod and welcome Maui."
        }
      ]
    },
    {
      "id": "realm-remy-wall-e",
      "title": "Remy & WALL-E",
      "area": "valley",
      "section": "realms",
      "summary": "Unlock the restaurant and a robot gardening companion.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Enter the Ratatouille realm."
        },
        {
          "id": "q2",
          "label": "Finish An Important Night at the Restaurant and welcome Remy."
        },
        {
          "id": "q3",
          "label": "Restore Chez Remy to its active restaurant state."
        },
        {
          "id": "q4",
          "label": "Enter the WALL-E realm."
        },
        {
          "id": "q5",
          "label": "Complete The Shy Little Robot and welcome WALL-E."
        }
      ]
    },
    {
      "id": "realm-frozen-toys",
      "title": "Frozen & Toy Story",
      "area": "valley",
      "section": "realms",
      "summary": "Recruit Anna, Elsa, Buzz, and Woody through their realm quests.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Unlock the Frozen realm."
        },
        {
          "id": "q2",
          "label": "Complete The Spirits of Nature and Chasing The Wind."
        },
        {
          "id": "q3",
          "label": "Complete Welcoming Anna and Welcoming Elsa."
        },
        {
          "id": "q4",
          "label": "Open the Toy Story realm."
        },
        {
          "id": "q5",
          "label": "Complete A Secret Mission in Uncharted Space."
        },
        {
          "id": "q6",
          "label": "Complete You're My Favorite Deputy."
        }
      ]
    },
    {
      "id": "realm-lion-beast",
      "title": "Lion King & Beauty and the Beast",
      "area": "valley",
      "section": "realms",
      "summary": "Follow the Pride Lands and castle adventures.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Unlock the Lion King realm."
        },
        {
          "id": "q2",
          "label": "Finish Eyes in the Dark and Stars to Guide Us."
        },
        {
          "id": "q3",
          "label": "Complete Finding Old Friends, Relax!, and Where's Pumbaa? when available."
        },
        {
          "id": "q4",
          "label": "Enter the Beauty and the Beast realm."
        },
        {
          "id": "q5",
          "label": "Finish Into the West Wing! and A Prince in Disguise."
        },
        {
          "id": "q6",
          "label": "Continue The Haunting of Beast's Castle and A Growing Mystery."
        }
      ]
    },
    {
      "id": "realm-monsters-mulan",
      "title": "Monsters, Inc. & Mulan",
      "area": "valley",
      "section": "realms",
      "summary": "Train and recruit additional characters.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Unlock Monsters, Inc. and complete Escape Claws."
        },
        {
          "id": "q2",
          "label": "Complete Eye on the Prize."
        },
        {
          "id": "q3",
          "label": "Unlock Mulan's realm and complete A New Recruit."
        },
        {
          "id": "q4",
          "label": "Complete The Dragon Army."
        },
        {
          "id": "q5",
          "label": "Complete A Defender's Training, Orienteering, and Fishing for Precision."
        },
        {
          "id": "q6",
          "label": "Finish Clearing the Road."
        }
      ]
    },
    {
      "id": "realm-aladdin-alice",
      "title": "Aladdin & Alice in Wonderland",
      "area": "valley",
      "section": "realms",
      "summary": "Explore Agrabah and Wonderland through multi-quest realms.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Enter the Aladdin realm and complete The Ancient Revealed."
        },
        {
          "id": "q2",
          "label": "Complete Brave the Storm and Monkey Business."
        },
        {
          "id": "q3",
          "label": "Complete Breaking Through and Wish Magic."
        },
        {
          "id": "q4",
          "label": "Finish Carpet Diem."
        },
        {
          "id": "q5",
          "label": "Enter the Alice in Wonderland realm."
        },
        {
          "id": "q6",
          "label": "Complete Wonders of Wonderland and The Queen's Maze."
        },
        {
          "id": "q7",
          "label": "Finish Teeny, Tiny Problems and Leaving Wonderland."
        }
      ]
    },
    {
      "id": "realm-later",
      "title": "Newer Disney realms",
      "area": "valley",
      "section": "realms",
      "summary": "Track later realm releases available through the base game.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Enter the Inside Out realm and complete Emotional Rescue."
        },
        {
          "id": "q2",
          "label": "Complete Out of the Blue, Dream On!, and Get Up and Glow!"
        },
        {
          "id": "q3",
          "label": "Enter the Lady and the Tramp realm and complete Canine Courtship."
        },
        {
          "id": "q4",
          "label": "Finish The Jailbreak, Meatballs, and Critters and Compassion."
        },
        {
          "id": "q5",
          "label": "Enter the Hercules realm and begin Moonlighting as a Hero."
        },
        {
          "id": "q6",
          "label": "Complete Speedrun Crash Course, Thunderstruck, and A Real Godly Mess."
        }
      ]
    },
    {
      "id": "friends-unlock",
      "title": "Friendship storylines: residents",
      "area": "valley",
      "section": "friends",
      "summary": "Repeat this short loop for whichever character storyline you actually want to pursue.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Open the Characters menu and choose one unlocked villager."
        },
        {
          "id": "q2",
          "label": "Check that villager's available Friendship Quest and any prerequisite level."
        },
        {
          "id": "q3",
          "label": "Give gifts or hang out to reach the required friendship level."
        },
        {
          "id": "q4",
          "label": "Complete the next friendship quest in your journal."
        },
        {
          "id": "q5",
          "label": "Return to Characters and choose another villager or story."
        }
      ]
    },
    {
      "id": "friends-merlin",
      "title": "Early friendship questlines",
      "area": "valley",
      "section": "friends",
      "summary": "Optional character stories: no need to pursue every NPC simultaneously.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Progress Merlin's quests for magic tool upgrades."
        },
        {
          "id": "q2",
          "label": "Complete Mickey's available Friendship Quests."
        },
        {
          "id": "q3",
          "label": "Progress Goofy and Scrooge McDuck's Friendship Quests."
        },
        {
          "id": "q4",
          "label": "Progress Remy's food-related Friendship Quests."
        },
        {
          "id": "q5",
          "label": "Complete a friendship quest with Moana or Maui."
        }
      ]
    },
    {
      "id": "friends-magical",
      "title": "Magical character storylines",
      "area": "valley",
      "section": "friends",
      "summary": "Choose magical characters when you want more lore and story events.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Complete The Magic in Everything for the Forgotten when available."
        },
        {
          "id": "q2",
          "label": "Progress Olaf's available Friendship Quests."
        },
        {
          "id": "q3",
          "label": "Progress the Fairy Godmother's friendship story."
        },
        {
          "id": "q4",
          "label": "Follow Ursula's and Mother Gothel's character quests."
        },
        {
          "id": "q5",
          "label": "Complete a Friendship Quest for Belle or the Beast."
        }
      ]
    },
    {
      "id": "friends-new",
      "title": "Later friendship storylines",
      "area": "valley",
      "section": "friends",
      "summary": "A catch-up checklist for later base-game characters without tracking daily gifts.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Progress Tiana's friendship quests and restaurant-related storyline."
        },
        {
          "id": "q2",
          "label": "Follow Timon and Pumbaa's friendship storylines."
        },
        {
          "id": "q3",
          "label": "Progress Mulan and Mushu's follow-up quest chains."
        },
        {
          "id": "q4",
          "label": "Complete an Alice or Cheshire Cat Friendship Quest."
        },
        {
          "id": "q5",
          "label": "Continue Peter Pan, Joy, Sadness, or later villagers when unlocked."
        }
      ]
    },
    {
      "id": "village-projects",
      "title": "Village upgrades & improvements",
      "area": "valley",
      "section": "projects",
      "summary": "Optional permanent upgrades and decorating projects.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Upgrade Scrooge's Store when possible."
        },
        {
          "id": "q2",
          "label": "Repair or improve Goofy's Stalls in your unlocked biomes."
        },
        {
          "id": "q3",
          "label": "Improve the Valley well network for faster travel."
        },
        {
          "id": "q4",
          "label": "Upgrade your house storage and utilities."
        },
        {
          "id": "q5",
          "label": "Unlock a useful tool enchantment or upgrade."
        },
        {
          "id": "q6",
          "label": "Build and decorate one small themed neighborhood."
        },
        {
          "id": "q7",
          "label": "Save a Dreamlight reserve for the next realm or biome."
        }
      ]
    },
    {
      "id": "collections",
      "title": "Collections & long-term goals",
      "area": "valley",
      "section": "collections",
      "summary": "Repeatable checklist for completion motivation, not a forced 100% grind.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Complete a cooking recipe you have not made before."
        },
        {
          "id": "q2",
          "label": "Catch an uncaught fish from a new biome."
        },
        {
          "id": "q3",
          "label": "Grow or harvest a crop from an unlocked biome."
        },
        {
          "id": "q4",
          "label": "Feed and befriend a new critter."
        },
        {
          "id": "q5",
          "label": "Collect one new clothing or furniture item."
        },
        {
          "id": "q6",
          "label": "Craft a missing recipe or decoration."
        },
        {
          "id": "q7",
          "label": "Finish a Dreamlight Duty or Village Dreamlight achievement."
        }
      ]
    },
    {
      "id": "dlc-life",
      "title": "Cozy Valley projects",
      "area": "valley",
      "section": "projects",
      "summary": "Small optional building and decorating goals using only base-game resources. Expansion resources are tracked under their own packs.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Finish decorating a single corner or pathway in a favorite biome."
        },
        {
          "id": "q2",
          "label": "Repair or upgrade a stall or facility you've already unlocked."
        },
        {
          "id": "q3",
          "label": "Plan storage for the resources you collect most often."
        },
        {
          "id": "q4",
          "label": "Craft and place one new piece of furniture."
        },
        {
          "id": "q5",
          "label": "Pick a new room or outdoor area as your next decorating project."
        }
      ]
    }
  ]
};
