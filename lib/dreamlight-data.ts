/** Disney Dreamlight Valley progression data based on the Dreamlight Valley Wiki Quest Index (accessed October 2026).
 * DLC packs are optional and never assumed purchased. Stable stage and quest-step IDs preserve saved progress.
 */
export type DreamlightArea = "valley" | "rift" | "storybook" | "ranch" | "honeyglow";
export type DreamlightSection = "story" | "realms" | "friends" | "projects" | "collections" | "dlc";
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
  "mods": "Base Game • Realms • Friends • Optional Expansions",
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
        },
        {
          "id": "q4",
          "label": "Check the in-game quest journal for Oogie Boogie's seasonal 2026 storyline before its event ends."
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
      "id": "rift-opening",
      "title": "Eternity Isle: opening",
      "area": "rift",
      "section": "dlc",
      "summary": "Begin A Rift in Time and unlock the Hourglass.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Confirm A Rift in Time expansion is available in your game."
        },
        {
          "id": "q2",
          "label": "Complete The Port of Many Worlds."
        },
        {
          "id": "q3",
          "label": "Complete The Secrets of Eternity Isle."
        },
        {
          "id": "q4",
          "label": "Complete The Flying Metal Nuisance."
        },
        {
          "id": "q5",
          "label": "Obtain and use the Royal Hourglass in The Sands in the Hourglass."
        },
        {
          "id": "q6",
          "label": "Complete A Game of Coins and New Ventures (and Adventures)."
        }
      ]
    },
    {
      "id": "rift-tangle",
      "title": "Eternity Isle: wilds and desert",
      "area": "rift",
      "section": "dlc",
      "summary": "Explore the Wild Tangle and Glittering Dunes with new character quests.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Complete Give Me a Sign."
        },
        {
          "id": "q2",
          "label": "Complete Ancient's Landing Fine Dining."
        },
        {
          "id": "q3",
          "label": "Complete The Wanderer of the Dunes."
        },
        {
          "id": "q4",
          "label": "Complete The Wild Tangle's Swarm."
        },
        {
          "id": "q5",
          "label": "Complete Diamond in the Rough."
        },
        {
          "id": "q6",
          "label": "Complete The Ancient Door and The Sundial."
        }
      ]
    },
    {
      "id": "rift-finale",
      "title": "A Rift in Time: Jafar & final acts",
      "area": "rift",
      "section": "dlc",
      "summary": "Main expansion plot through the Spark and later Jafar quests.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Complete The Tower and Your Eternal Reward."
        },
        {
          "id": "q2",
          "label": "Complete The Sunken Ruins."
        },
        {
          "id": "q3",
          "label": "Complete Does Not Compute and Hero Pose."
        },
        {
          "id": "q4",
          "label": "Complete All the Right Notes."
        },
        {
          "id": "q5",
          "label": "Finish A Bit of Help from Your Friends."
        },
        {
          "id": "q6",
          "label": "Complete The Spark of Imagination."
        },
        {
          "id": "q7",
          "label": "Continue The Monochrome Mystery and Mysterious Mickey."
        },
        {
          "id": "q8",
          "label": "Complete The Palace of Time and Jafar's Laboratory."
        },
        {
          "id": "q9",
          "label": "Complete The Now and Then."
        }
      ]
    },
    {
      "id": "storybook-opening",
      "title": "Storybook Vale: The Bind",
      "area": "storybook",
      "section": "dlc",
      "summary": "Start the Lorekeeper's story and unlock the Royal Net.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Confirm The Storybook Vale expansion is available in your game."
        },
        {
          "id": "q2",
          "label": "Complete Welcome to the Storybook Vale."
        },
        {
          "id": "q3",
          "label": "Obtain and try the Royal Net for catching Snippets."
        },
        {
          "id": "q4",
          "label": "Complete A New Chapter."
        },
        {
          "id": "q5",
          "label": "Unlock The Bind and restore its essential facilities."
        },
        {
          "id": "q6",
          "label": "Begin A Land of Myths and Legends."
        }
      ]
    },
    {
      "id": "storybook-lands",
      "title": "Storybook Vale: myths and fairy tales",
      "area": "storybook",
      "section": "dlc",
      "summary": "Work through the different magical regions at your own pace.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Explore Everafter and follow The Wolf of the Wilds."
        },
        {
          "id": "q2",
          "label": "Complete A Sheep in Wolf's Clothing and Not by the Hair on My Chinny Chin Chin."
        },
        {
          "id": "q3",
          "label": "Explore Mythopia and complete Guts & Glory."
        },
        {
          "id": "q4",
          "label": "Complete A Moth to a Flame."
        },
        {
          "id": "q5",
          "label": "Complete The Promethean Flame."
        },
        {
          "id": "q6",
          "label": "Complete The Marble Colossus and Losing Your Marbles."
        },
        {
          "id": "q7",
          "label": "Continue Mount Olympus."
        }
      ]
    },
    {
      "id": "storybook-finale",
      "title": "Storybook Vale: later story",
      "area": "storybook",
      "section": "dlc",
      "summary": "Finish the later Unwritten Realms story chapters.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Complete Curiouser and Curiouser... and Teapot Falls."
        },
        {
          "id": "q2",
          "label": "Complete The Fallen Fortress."
        },
        {
          "id": "q3",
          "label": "Complete The Knights of the Round Table."
        },
        {
          "id": "q4",
          "label": "Complete The Mistress of All Evil."
        },
        {
          "id": "q5",
          "label": "Complete A Long-Awaited Invitation."
        },
        {
          "id": "q6",
          "label": "Complete A Storm of Stories."
        },
        {
          "id": "q7",
          "label": "Finish The Unwritten Realms story chapters."
        },
        {
          "id": "q8",
          "label": "Complete The Tales That Bind."
        }
      ]
    },
    {
      "id": "ranch-opening",
      "title": "Wishblossom Ranch: starting",
      "area": "ranch",
      "section": "dlc",
      "summary": "Open Wishblossom Ranch, meet Snow White, and gain your first mount.",
      "source": "https://www.dreamlightvalleywiki.com/A_Wishful_Invitation",
      "steps": [
        {
          "id": "q1",
          "label": "Confirm Wishblossom Ranch expansion is available in your game."
        },
        {
          "id": "q2",
          "label": "Open Snow White's Wishblossom Ranch invitation mail."
        },
        {
          "id": "q3",
          "label": "Complete The Port of Many Worlds if you haven't already."
        },
        {
          "id": "q4",
          "label": "Travel through Stardust Port to Wishblossom Ranch."
        },
        {
          "id": "q5",
          "label": "Meet Snow White in A Wishful Invitation."
        },
        {
          "id": "q6",
          "label": "Find the magical flower and restore the stable."
        },
        {
          "id": "q7",
          "label": "Unlock your first ridable Wishblossom Horse."
        }
      ]
    },
    {
      "id": "ranch-lands",
      "title": "Wishblossom Ranch: stories",
      "area": "ranch",
      "section": "dlc",
      "summary": "Explore the mountain regions and meet additional residents and mounts.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Complete Tales of a Broken Heart."
        },
        {
          "id": "q2",
          "label": "Complete Ghost Town."
        },
        {
          "id": "q3",
          "label": "Complete Wheel Big Trouble and Equine Delicacies."
        },
        {
          "id": "q4",
          "label": "Complete Water Tower of Terror."
        },
        {
          "id": "q5",
          "label": "Complete Crystal Cavern: Wishing Alps."
        },
        {
          "id": "q6",
          "label": "Complete Reindeer Are Better Than People."
        },
        {
          "id": "q7",
          "label": "Progress The Decay of Fashion and The De Vil Crash."
        },
        {
          "id": "q8",
          "label": "Complete The Skunk Rebellion."
        },
        {
          "id": "q9",
          "label": "Explore Crystal Caverns: Glamour Gulch."
        },
        {
          "id": "q10",
          "label": "Explore Crystal Cavern: Pixie Acres."
        },
        {
          "id": "q11",
          "label": "Finish The Decay."
        }
      ]
    },
    {
      "id": "honeyglow-story",
      "title": "Honeyglow Woods: story chapters",
      "area": "honeyglow",
      "section": "dlc",
      "summary": "Explore the released 2026 adventure pack's Winnie the Pooh storyline.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Confirm the Honeyglow Woods adventure pack is available."
        },
        {
          "id": "q2",
          "label": "Complete Prologue: Childhood Treasures."
        },
        {
          "id": "q3",
          "label": "Complete Chapter 1: All You Need Is Honey."
        },
        {
          "id": "q4",
          "label": "Complete Chapter 2: About Thought, Fog, and Light."
        },
        {
          "id": "q5",
          "label": "Complete Chapter 3: A Very Satisfied Bear."
        },
        {
          "id": "q6",
          "label": "Complete Interlude: The Misplaced Honey."
        },
        {
          "id": "q7",
          "label": "Complete Chapter 4: A Tail Tale and Chapter 5: The Big Red Monster."
        },
        {
          "id": "q8",
          "label": "Complete Chapter 6: A Place for Eeyore."
        },
        {
          "id": "q9",
          "label": "Continue Chapters 7–10 and their interludes."
        },
        {
          "id": "q10",
          "label": "Complete Chapter 11: The Anti-monster Camp."
        },
        {
          "id": "q11",
          "label": "Complete Chapter 12: Old Plans, New Wind."
        },
        {
          "id": "q12",
          "label": "Complete Epilogue: See You Next Summer."
        }
      ]
    },
    {
      "id": "dlc-life",
      "title": "Expansion collections & crafting",
      "area": "valley",
      "section": "projects",
      "summary": "Optional cross-expansion crafting and gathering; ignore tasks for packs you do not own.",
      "source": "https://www.dreamlightvalleywiki.com/quests",
      "steps": [
        {
          "id": "q1",
          "label": "Use the Hourglass to find a new item or Timebending material (if A Rift in Time is owned)."
        },
        {
          "id": "q2",
          "label": "Capture Snippets for a Storybook Vale tapestry (if owned)."
        },
        {
          "id": "q3",
          "label": "Build or repair an upgrade at Wishblossom Ranch (if owned)."
        },
        {
          "id": "q4",
          "label": "Collect an unfamiliar resource in Honeyglow Woods (if owned)."
        },
        {
          "id": "q5",
          "label": "Decorate one small area using expansion furniture you have unlocked."
        }
      ]
    }
  ]
};
