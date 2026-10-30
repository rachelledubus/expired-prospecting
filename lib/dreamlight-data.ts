/** Disney Dreamlight Valley guide: base game plus the user's owned Honeyglow Woods Adventure Pack.
 * Other paid expansions are intentionally excluded. Stable stage and step IDs preserve saved progress.
 */
export type DreamlightArea = "valley" | "honeyglow";
export type DreamlightSection = "story" | "realms" | "friends" | "projects" | "collections" | "honeyglow" | "honeyglow-friends";
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
  "mods": "Base Game • Honeyglow Woods",
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
    },
    {
      "id": "honeyglow-prologue",
      "title": "Prologue: Childhood Treasures",
      "area": "honeyglow",
      "section": "honeyglow",
      "summary": "Enter the new world through your magical tree. Ownership already confirmed.",
      "source": "https://dreamlightvalleywiki.com/Prologue%3A_Childhood_Treasures",
      "steps": [
        {
          "id": "q1",
          "label": "Confirm these Valley quests are complete: The Dream Castle, Friendship Is Everything, Making Cents of Things, Scrooge McDuck's Grand Re-opening, and Fishing Expedition."
        },
        {
          "id": "q2",
          "label": "Read A VERY IMPORTANT PARCEL!!! in your mailbox and claim the Tree Sprout."
        },
        {
          "id": "q3",
          "label": "Place the Tree Sprout from furniture mode.",
          "how": "It is a furniture placement, not a crop that you plant in soil."
        },
        {
          "id": "q4",
          "label": "Enter the glowing tree gateway into Honeyglow Woods."
        },
        {
          "id": "q5",
          "label": "Explore Drowsybloom Acre and meet Winnie the Pooh."
        },
        {
          "id": "q6",
          "label": "Finish the Childhood Treasures prologue."
        }
      ]
    },
    {
      "id": "honeyglow-1",
      "title": "Chapter 1: All You Need Is Honey",
      "area": "honeyglow",
      "section": "honeyglow",
      "summary": "Meet Pooh and begin restoring the Woods.",
      "source": "https://dreamlightvalleywiki.com/Chapter_1%3A_All_You_Need_Is_Honey",
      "steps": [
        {
          "id": "q1",
          "label": "Talk with Pooh about the condition of Drowsybloom Acre."
        },
        {
          "id": "q2",
          "label": "Follow the story markers and inspect his honey-related concerns."
        },
        {
          "id": "q3",
          "label": "Try the introduction to gathering honey and beekeeping."
        },
        {
          "id": "q4",
          "label": "Complete the quest's requested gathering or crafting tasks."
        },
        {
          "id": "q5",
          "label": "Finish Chapter 1: All You Need Is Honey."
        }
      ]
    },
    {
      "id": "honeyglow-2",
      "title": "Chapter 2: About Thought, Fog, and Light",
      "area": "honeyglow",
      "section": "honeyglow",
      "summary": "Learn how the magic and fog-clearing mechanics work.",
      "source": "https://dreamlightvalleywiki.com/Chapter_2:_About_Thought,_Fog,_and_Light",
      "steps": [
        {
          "id": "q1",
          "label": "Follow Pooh and investigate the lantern affected by the fog."
        },
        {
          "id": "q2",
          "label": "Inspect the Memory Shard near the lantern."
        },
        {
          "id": "q3",
          "label": "Gather the ingredients shown for Honeyglow Elixir."
        },
        {
          "id": "q4",
          "label": "Make and use the Honeyglow Elixir as directed."
        },
        {
          "id": "q5",
          "label": "Complete the fog and Thoughtful Spot objectives."
        },
        {
          "id": "q6",
          "label": "Finish Chapter 2: About Thought, Fog, and Light."
        }
      ]
    },
    {
      "id": "honeyglow-3",
      "title": "Chapter 3: A Very Satisfied Bear",
      "area": "honeyglow",
      "section": "honeyglow",
      "summary": "Finish Pooh's first storyline and unlock him as a villager.",
      "source": "https://dreamlightvalleywiki.com/Chapter_3%3A_A_Very_Satisfied_Bear",
      "steps": [
        {
          "id": "q1",
          "label": "Talk to Pooh and start Chapter 3."
        },
        {
          "id": "q2",
          "label": "Follow the instructions to restore Pooh's house."
        },
        {
          "id": "q3",
          "label": "Finish the remaining honey and home-restoration objectives."
        },
        {
          "id": "q4",
          "label": "Complete A Very Satisfied Bear and welcome Pooh to your Valley."
        }
      ]
    },
    {
      "id": "honeyglow-interlude-1",
      "title": "Interlude: The Misplaced Honey",
      "area": "honeyglow",
      "section": "honeyglow",
      "summary": "Open Gloommeadow and continue toward Eeyore.",
      "source": "https://dreamlightvalleywiki.com/Interlude%3A_The_Misplaced_Honey",
      "steps": [
        {
          "id": "q1",
          "label": "Speak to Winnie the Pooh to begin the next story beat."
        },
        {
          "id": "q2",
          "label": "Follow the clue about missing honey."
        },
        {
          "id": "q3",
          "label": "Make or obtain the item needed to clear the blocked passage as instructed."
        },
        {
          "id": "q4",
          "label": "Clear the corrupted honey barrier into Gloommeadow."
        },
        {
          "id": "q5",
          "label": "Complete The Misplaced Honey and enter the new biome."
        }
      ]
    },
    {
      "id": "honeyglow-4",
      "title": "Chapter 4: A Tail Tale",
      "area": "honeyglow",
      "section": "honeyglow",
      "summary": "Start Eeyore's Gloommeadow storyline.",
      "source": "https://dreamlightvalleywiki.com/Chapter_4%3A_A_Tail_Tale",
      "steps": [
        {
          "id": "q1",
          "label": "Explore Gloommeadow and find Eeyore."
        },
        {
          "id": "q2",
          "label": "Start A Tail Tale and speak with Eeyore."
        },
        {
          "id": "q3",
          "label": "Follow Eeyore's directions for the damaged landscape and nearby tasks."
        },
        {
          "id": "q4",
          "label": "Complete A Tail Tale."
        }
      ]
    },
    {
      "id": "honeyglow-5",
      "title": "Chapter 5: The Big Red Monster",
      "area": "honeyglow",
      "section": "honeyglow",
      "summary": "Help Eeyore feel safer and reveal more of the Woods.",
      "source": "https://dreamlightvalleywiki.com/Chapter_5%3A_The_Big_Red_Monster",
      "steps": [
        {
          "id": "q1",
          "label": "Start The Big Red Monster."
        },
        {
          "id": "q2",
          "label": "Investigate the strange 'monster' in Gloommeadow."
        },
        {
          "id": "q3",
          "label": "Gather and craft the quest items shown in your journal."
        },
        {
          "id": "q4",
          "label": "Complete the investigation and the Chapter 5 finale."
        }
      ]
    },
    {
      "id": "honeyglow-6",
      "title": "Chapter 6: A Place for Eeyore",
      "area": "honeyglow",
      "section": "honeyglow",
      "summary": "Repair Eeyore's home and complete his first arc.",
      "source": "https://dreamlightvalleywiki.com/Chapter_6%3A_A_Place_for_Eeyore",
      "steps": [
        {
          "id": "q1",
          "label": "Start A Place for Eeyore."
        },
        {
          "id": "q2",
          "label": "Find the site of Eeyore's home."
        },
        {
          "id": "q3",
          "label": "Gather the building materials required by the active quest."
        },
        {
          "id": "q4",
          "label": "Repair Eeyore's house and finish any decoration tasks."
        },
        {
          "id": "q5",
          "label": "Complete Chapter 6 and welcome Eeyore as a villager."
        }
      ]
    },
    {
      "id": "honeyglow-interlude-2",
      "title": "Interlude 2: The Gloomy Hollow",
      "area": "honeyglow",
      "section": "honeyglow",
      "summary": "Connect Eeyore's story to the Piglet chapters.",
      "source": "https://dreamlightvalleywiki.com/Interlude_2%3A_The_Gloomy_Hollow",
      "steps": [
        {
          "id": "q1",
          "label": "Return to the Honeyglow Woods with Eeyore's storyline completed."
        },
        {
          "id": "q2",
          "label": "Begin The Gloomy Hollow."
        },
        {
          "id": "q3",
          "label": "Investigate the new clue toward the next hidden character."
        },
        {
          "id": "q4",
          "label": "Complete the interlude and unlock the way into Braveheart Grove."
        }
      ]
    },
    {
      "id": "honeyglow-7",
      "title": "Chapter 7: A Voice Behind the Door",
      "area": "honeyglow",
      "section": "honeyglow",
      "summary": "Meet the next character in Braveheart Grove.",
      "source": "https://dreamlightvalleywiki.com/Chapter_7%3A_A_Voice_Behind_the_Door",
      "steps": [
        {
          "id": "q1",
          "label": "Explore Braveheart Grove."
        },
        {
          "id": "q2",
          "label": "Find the source of the voice and speak to the relevant character."
        },
        {
          "id": "q3",
          "label": "Follow the main quest's investigation and dialogue steps."
        },
        {
          "id": "q4",
          "label": "Complete A Voice Behind the Door."
        }
      ]
    },
    {
      "id": "honeyglow-8",
      "title": "Chapter 8: The Little Big Forest",
      "area": "honeyglow",
      "section": "honeyglow",
      "summary": "Restore more of the area while helping Piglet.",
      "source": "https://dreamlightvalleywiki.com/Chapter_8%3A_The_Little_Big_Forest",
      "steps": [
        {
          "id": "q1",
          "label": "Begin The Little Big Forest."
        },
        {
          "id": "q2",
          "label": "Collect the materials shown in the quest journal."
        },
        {
          "id": "q3",
          "label": "Craft and use any required forest or fog-clearing item."
        },
        {
          "id": "q4",
          "label": "Repair the story location or path requested by the chapter."
        },
        {
          "id": "q5",
          "label": "Finish The Little Big Forest."
        }
      ]
    },
    {
      "id": "honeyglow-9",
      "title": "Chapter 9: How to Meet a Best Friend (Again)",
      "area": "honeyglow",
      "section": "honeyglow",
      "summary": "Reunite the trio and unlock Piglet.",
      "source": "https://dreamlightvalleywiki.com/Chapter_9%3A_How_to_Meet_a_Best_Friend_(Again)",
      "steps": [
        {
          "id": "q1",
          "label": "Talk with Piglet about his next task."
        },
        {
          "id": "q2",
          "label": "Follow the friendship and reconnection objectives."
        },
        {
          "id": "q3",
          "label": "Repair the shortcut or location indicated in the story."
        },
        {
          "id": "q4",
          "label": "Complete Chapter 9 and welcome Piglet to the Valley."
        }
      ]
    },
    {
      "id": "honeyglow-interlude-3",
      "title": "Interlude 3: The Shadowy Surprise",
      "area": "honeyglow",
      "section": "honeyglow",
      "summary": "Reveal Honeyglow Woods' last major region.",
      "source": "https://dreamlightvalleywiki.com/Interlude_3%3A_The_Shadowy_Surprise",
      "steps": [
        {
          "id": "q1",
          "label": "Return to the Everoak story after Piglet joins."
        },
        {
          "id": "q2",
          "label": "Begin The Shadowy Surprise."
        },
        {
          "id": "q3",
          "label": "Investigate the new mystery and follow the fog-related instructions."
        },
        {
          "id": "q4",
          "label": "Unlock and enter Nectar Apiary."
        },
        {
          "id": "q5",
          "label": "Complete the interlude."
        }
      ]
    },
    {
      "id": "honeyglow-10",
      "title": "Chapter 10: Most Grand Adventure",
      "area": "honeyglow",
      "section": "honeyglow",
      "summary": "Restore the Nectar Apiary campsite and pursue the remaining fog.",
      "source": "https://dreamlightvalleywiki.com/Chapter_10:_Most_Grand_Adventure",
      "steps": [
        {
          "id": "q1",
          "label": "Begin Chapter 10 in Nectar Apiary."
        },
        {
          "id": "q2",
          "label": "Collect and place the four flags on their poles."
        },
        {
          "id": "q3",
          "label": "Catch the fifth red flag and place it near the Wishing Well."
        },
        {
          "id": "q4",
          "label": "Go to the campsite southeast of the Everoak Tree."
        },
        {
          "id": "q5",
          "label": "Make Bright Imagination Potion and clear the resin blocking the campsite."
        },
        {
          "id": "q6",
          "label": "Collect 10 Driftwood, 8 Tree Resin, and 10 Soft Limestone."
        },
        {
          "id": "q7",
          "label": "Repair the campsite and finish Chapter 10."
        }
      ]
    },
    {
      "id": "honeyglow-11",
      "title": "Chapter 11: The Anti-monster Camp",
      "area": "honeyglow",
      "section": "honeyglow",
      "summary": "Set up a welcoming camp and investigate the mystery.",
      "source": "https://dreamlightvalleywiki.com/Chapter_11:_The_Anti-monster_Camp",
      "steps": [
        {
          "id": "q1",
          "label": "Cook four Toasted Picnic Sandwiches."
        },
        {
          "id": "q2",
          "label": "Give the sandwiches to Winnie the Pooh."
        },
        {
          "id": "q3",
          "label": "Craft a Welcoming Signpost."
        },
        {
          "id": "q4",
          "label": "Craft a Welcoming Picnic Blanket."
        },
        {
          "id": "q5",
          "label": "Place the picnic items at the edge of the fog."
        },
        {
          "id": "q6",
          "label": "Investigate the missing honey and ask Piglet, Eeyore, and Pooh."
        },
        {
          "id": "q7",
          "label": "Finish the chapter after Pooh's windmill clue."
        }
      ]
    },
    {
      "id": "honeyglow-12",
      "title": "Chapter 12: Old Plans, New Wind",
      "area": "honeyglow",
      "section": "honeyglow",
      "summary": "Repair the windmill and reconnect memories from the Woods.",
      "source": "https://dreamlightvalleywiki.com/Chapter_12:_Old_Plans,_New_Wind",
      "steps": [
        {
          "id": "q1",
          "label": "Investigate the corrupted lantern in Nectar Apiary."
        },
        {
          "id": "q2",
          "label": "Collect 18 Golden Honey for three Honeyed Memories."
        },
        {
          "id": "q3",
          "label": "Craft and gift Honeyed Memories to Pooh, Eeyore, and Piglet."
        },
        {
          "id": "q4",
          "label": "Revisit the lantern and inspect the new memory."
        },
        {
          "id": "q5",
          "label": "Find and read the Worn Scout's Journal."
        },
        {
          "id": "q6",
          "label": "Gather 5 Golden Honey, 10 Driftwood, 10 Tree Resin, 15 Soft Limestone, and 10 Oak Leaves."
        },
        {
          "id": "q7",
          "label": "Repair the Old Windmill."
        },
        {
          "id": "q8",
          "label": "Find the old photo, take a new photo, and finish the quest."
        }
      ]
    },
    {
      "id": "honeyglow-interlude-4",
      "title": "Interlude 4: Curiosity Satisfied",
      "area": "honeyglow",
      "section": "honeyglow",
      "summary": "Restore the final Pillar and lift the remaining fog.",
      "source": "https://dreamlightvalleywiki.com/Interlude_4:_Curiosity_Satisfied",
      "steps": [
        {
          "id": "q1",
          "label": "Bring the Bright New Photo into the Everoak Tree at Nectar Apiary."
        },
        {
          "id": "q2",
          "label": "Explore the Everoak Tree interior with Pooh."
        },
        {
          "id": "q3",
          "label": "Follow the orb-piece puzzles with Pooh, Eeyore, and Piglet."
        },
        {
          "id": "q4",
          "label": "Prepare the requested hedgehog treat for Piglet."
        },
        {
          "id": "q5",
          "label": "Collect the three broken orb pieces and place them in the Pillar."
        },
        {
          "id": "q6",
          "label": "Rotate the honey-flow floor pieces to connect the pond to the Pillar."
        },
        {
          "id": "q7",
          "label": "Watch the restored Woods scene and complete the interlude."
        }
      ]
    },
    {
      "id": "honeyglow-epilogue",
      "title": "Epilogue: See You Next Summer",
      "area": "honeyglow",
      "section": "honeyglow",
      "summary": "Celebrate restoring Honeyglow Woods and finish the main adventure.",
      "source": "https://dreamlightvalleywiki.com/Epilogue:_See_You_Next_Summer",
      "steps": [
        {
          "id": "q1",
          "label": "Speak with the three friends to arrange a celebration."
        },
        {
          "id": "q2",
          "label": "Cook a Honey Hero Cake."
        },
        {
          "id": "q3",
          "label": "Craft and place a Party Table in Drowsybloom Acre."
        },
        {
          "id": "q4",
          "label": "Craft the four Honeyglow Flower Pot variants."
        },
        {
          "id": "q5",
          "label": "Place the flower pots and take the group picture."
        },
        {
          "id": "q6",
          "label": "Use the Great Summer List to craft a Paper Boat."
        },
        {
          "id": "q7",
          "label": "Set the Paper Boat sailing from the river bridge and watch the final scene."
        }
      ]
    },
    {
      "id": "honeyglow-friendship",
      "title": "Honeyglow friendships: Pooh, Eeyore & Piglet",
      "area": "honeyglow",
      "section": "honeyglow-friends",
      "summary": "Optional friendship quests after each character joins.",
      "source": "https://dreamlightvalleywiki.com/Honeyglow_friendships%3A_Pooh%2C_Eeyore_%26_Piglet",
      "steps": [
        {
          "id": "q1",
          "label": "Choose one of the three friends to focus on."
        },
        {
          "id": "q2",
          "label": "Check that friend's next friendship-level prerequisite."
        },
        {
          "id": "q3",
          "label": "Talk, gift, or hang out until the next friendship quest unlocks."
        },
        {
          "id": "q4",
          "label": "Complete the active friendship quest in your journal."
        },
        {
          "id": "q5",
          "label": "Repeat for the other two friends when you want another story."
        }
      ]
    },
    {
      "id": "honeyglow-exploration",
      "title": "Honeyglow collection & cozy projects",
      "area": "honeyglow",
      "section": "honeyglow-friends",
      "summary": "Low-pressure exploration beyond the main story.",
      "source": "https://dreamlightvalleywiki.com/Honeyglow_collection_%26_cozy_projects",
      "steps": [
        {
          "id": "q1",
          "label": "Find an unexplored corner of one Honeyglow biome."
        },
        {
          "id": "q2",
          "label": "Try the beekeeping mechanic and gather honey."
        },
        {
          "id": "q3",
          "label": "Cook one new Honeyglow recipe."
        },
        {
          "id": "q4",
          "label": "Collect one new flower, crafting ingredient, or critter."
        },
        {
          "id": "q5",
          "label": "Craft and place one Honeyglow furniture item."
        }
      ]
    }
  ]
};
