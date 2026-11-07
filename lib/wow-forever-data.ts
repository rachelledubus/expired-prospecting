// WoW: Forever Skyborne Beast Mastery Hunter guide (November 2026).
// Stable IDs intentionally preserve existing checkmarks when wording changes.
export type WowStep = { id: string; title: string; how: string; priority?: "essential" | "optional" };
export type WowStage = { id: string; title: string; from: number; to: number; place: string; summary: string; steps: WowStep[] };
export type WowGame = { kind: "wow"; id: string; tab: string; title: string; stages: WowStage[] };
export const WOW_GAME: WowGame = {
  kind: "wow", id: "wow-forever-skyborne-hunter", tab: "Skyborne BM Hunter",
  title: "WoW Forever · Skyborne Beast Mastery Hunter",
  stages: [
    { id: "thendal", title: "First steps in Zephras", from: 1, to: 5, place: "Thendal Grove · Zephras Isle",
      summary: "Follow the Skyborne introduction, practice ranged distance and unlock your racial. Hunter is slower before a pet, so don't rush difficult pulls.",
      steps: [
        {id:"coming-age",title:"Finish Coming of Age and Harmony in Balance",how:"Talk to Rorian the Dayseeker in Thendal Grove, then defeat the Vuldren Juveniles required by Harmony in Balance."},
        {id:"intro-combat",title:"Learn to open at range and keep Auto Shot firing",how:"Use your Target + Auto Shot macro on key 1 or Mouse 4 to select an enemy if none/dead and start shooting. Stop briefly to let Auto Shot fire. Move away if an enemy closes, and use Arcane Shot when trained."},
        {id:"flies",title:"Complete Infestation Investigation and The Cirrusfly Queen",how:"Defeat cirrusflies in Thendal Grove and then the Cirrusfly Queen; pick up nearby objectives before setting out."},
        {id:"walk-air",title:"Complete Falling With Style",how:"Go to the watchtower in Thendal Grove and use Walk on Air while falling. Keep this racial bound somewhere accessible."},
        {id:"pylons",title:"Do The Anchors of Zephras and Elemental Unrest",how:"Talk with Halaan Hawk-Eye and Yala Windwatcher for the island's failing-pylon storyline."},
        {id:"racial-intro",title:"Complete the faction-specific racial quest",how:"Horde: The Gift of Skysight — use Skysight near an Elemental Convergence. Alliance: Reading the Ley Lines — use Read Ley Line at a leyline."},
        {id:"hunters-path",title:"Complete The Way of the Hunter",how:"Take the Hunter class introduction in the starting area. Train new Hunter skills whenever you meet a trainer."},
        {id:"thendal-exit",title:"Finish Foul Matriarch, then The Next Step",how:"Clear the Ursera den objectives and report to Constable Aonda in Shen'dar Village."}
      ]},
    { id: "shendar", title: "Shen'dar and the highlands", from: 6, to: 9, place: "Shen'dar Village · Shen'dar Highlands",
      summary: "Clear neighboring quests in clusters to avoid repetitive travel. Aim to learn Arcane Shot and Concussive Shot as they become available.",
      steps: [
        {id:"welcome",title:"Finish Welcome to Shen'dar Village",how:"Accept the village introduction and talk to your faction contacts: the Windshapers on Horde or High Order on Alliance."},
        {id:"prideclaw",title:"Complete The Problem With Prideclaws and Restocking the Larders",how:"Kill Prideclaws and collect pelts; collect nearby eggs and strider meat before returning to the village."},
        {id:"bandits",title:"Finish Pilfered Windstones and The Criminal Element",how:"Kill Highlands Bandits and collect stolen windstones in the same loop."},
        {id:"cult",title:"Complete Infiltrating the Cult, Among the Faithful and Havoc in the Highlands",how:"Head to Falaath Village to investigate the cult and defeat its enemies. Pick up other Falaath quests while there."},
        {id:"western",title:"Visit West Pylon Watchtower for The Western Watch",how:"Find Peacekeeper Vaaniel. Follow up on A Last Request if it appears."},
        {id:"valanaar-route",title:"Take To Valanaar and Deliver the Signet",how:"Turn in the highlands quests before traveling to Valanaar. WANTED: Vulgara is optional and easier with a partner.",priority:"optional"}
      ]},
    { id: "pet-and-sky", title: "Pet unlock and leaving Zephras", from: 10, to: 13, place: "Valanaar · Gustberry Lowlands · Shrine of Akir",
      summary: "Your major power spike is the level-10 Tame Beast quest. Keep working the Skyborne story until the ship takes you to Azeroth.",
      steps: [
        {id:"taming",title:"Complete the level-10 Tame Beast class quest",how:"Speak with a Hunter trainer/class quest giver, complete the taming tasks and learn Tame Beast, Feed Pet and Revive Pet. This is higher priority than optional side quests."},
        {id:"first-pet",title:"Tame a pet and check Growl, food and happiness",how:"Pick an available pet you like, keep it fed, teach available pet skills and set Growl to autocast for solo questing. No need to wait for a rare cat."},
        {id:"mouse-macros",title:"Bind scroll up to Pet Attack and scroll down to Pet Recall",how:"Create the macros in /macro, drag them onto action bars, and bind the slots in Options > Keybindings > Action Bars. Set Mouse 4 or key 1 to your Target + Auto Shot macro; set Mouse 5 or key 2 to Arcane Shot + Auto Shot. Rebind camera zoom if necessary."},
        {id:"valanaar",title:"Clear Valanaar's main investigations and nearby quests",how:"Look for The High Elder's Request, Tower Defense, Unnerving Silence, The Cult's True Plans and the pylon/Al'Aketh story. Do quests together by area."},
        {id:"shrine",title:"Finish the Shrine of Akir story",how:"Follow Prepare for Battle, Making Our Move and any remaining faction-specific steps for The Fate of Zephras."},
        {id:"skyboat",title:"Complete What Comes Next and leave Zephras Isle",how:"Horde: The Earthen Ring, take the west dock skyboat toward Mulgore/Thunder Bluff. Alliance: The Magical City of Dalaran, take the east dock ship to Dalaran."}
      ]},
    { id:"early-azeroth", title:"Establish your Hunter routine", from: 14, to: 19, place:"Faction quest hubs · early Azeroth",
      summary:"Use quest hubs at your level; your faction and where your partner is questing determine the best route.",
      steps:[
        {id:"partner",title:"Choose a shared questing area with your Paladin partner",how:"Meet in a level-appropriate faction-friendly area. Let the Paladin tank difficult enemies if convenient, and use your pet to help rather than pulling extras."},
        {id:"ammo",title:"Stock ammunition, food, water and pet food",how:"Keep a quiver or ammo pouch stocked. Carry food your pet actually eats and supplies for mana recovery."},
        {id:"pet-skills",title:"Upgrade the pet's Claw / Bite / Growl ranks",how:"Train pet abilities and check higher-rank sources when your damage or threat falls behind. Pets scale with your stats, but active pet training still matters."},
        {id:"aspect",title:"Use Aspect of the Hawk during ranged combat",how:"Treat Hawk as your combat default. Keep a travel aspect separate so it isn't accidentally left active in fights."},
        {id:"professions",title:"Choose two professions",how:"Skinning + Leatherworking is a self-sufficient Hunter option; Skinning + a gathering profession is simpler for gold."}
      ]},
    { id:"twenties", title:"Ranged toolkit comes online", from: 20, to: 24, place:"Level-appropriate quests and dungeons",
      summary:"Aimed Shot and Cheetah make combat and travel smoother. Stay safe by avoiding melee range.",
      steps:[
        {id:"aimed",title:"Train Aimed Shot and put it on key 3",how:"Use it for stronger single-target openings. It shares a cooldown with Multi-Shot, so choose based on enemy count."},
        {id:"cheetah",title:"Train Aspect of the Cheetah and put it on your travel key",how:"Use Cheetah between fights; change back to Hawk before you take damage, because Cheetah can daze you."},
        {id:"talents",title:"Spend your talent points through level 24",how:"Follow the Talents tab for an exact level-by-level path. You should be working toward Summon Hawk at 25."},
        {id:"dungeons",title:"Practice one dungeon with pet Growl OFF",how:"When someone else tanks, disable Growl autocast. Keep your pet on your assigned target and recall it before skips.",priority:"optional"}
      ]},
    { id:"hawks", title:"Unlock Summon Hawk", from: 25, to: 29, place:"Azeroth · outdoor quests",
      summary:"The signature Forever BM talent arrives at level 25. Hawks and Arcane Shot share a cooldown.",
      steps:[
        {id:"summon",title:"Spend your level-25 point in Summon Hawk",how:"Put Summon Hawk on Q. It summons a temporary Hawk and shares a cooldown with Arcane Shot."},
        {id:"hawkrule",title:"Practice when to use Hawk versus Arcane Shot",how:"For enemies dying quickly, Arcane Shot gives immediate damage. On longer fights, summon Hawks for sustained damage (up to two at once)."},
        {id:"two-hawks",title:"Practice maintaining two Hawks on a tougher target",how:"Do not over-refresh; track their duration on a durable enemy while your permanent pet keeps attacking."},
        {id:"pet-growth",title:"Recheck pet ability ranks and ammunition quality",how:"Replace underleveled ammo and train your pet's useful damage skills."}
      ]},
    { id:"thirties", title:"Safer pulls and better pet damage", from: 30, to: 39, place:"Azeroth · quests, elites and dungeons",
      summary:"Feign Death and Intimidation are your escape/control milestones. Later BM talent points strengthen your pet.",
      steps:[
        {id:"intimidation",title:"Take Intimidation at level 30",how:"Place it on F. Your pet stuns your target on its next attack. Practice using it to interrupt a dangerous enemy."},
        {id:"feign",title:"Train Feign Death and bind it to C",how:"Use Feign Death to shed threat or escape bad pulls. It becomes available at level 30."},
        {id:"discipline",title:"Invest in Bestial Discipline",how:"Use points at levels 31–32 in the recommended leveling build; it helps pet Focus and mana sustain."},
        {id:"pet-protection",title:"Practice preventing pet deaths",how:"Recall before your pet chases into multiple packs; use Mend Pet early, not only when its health is nearly empty."},
        {id:"ferocity",title:"Finish Ferocity and start Frenzy",how:"Follow the level-by-level talent list for the level 33–39 stretch."}
      ]},
    { id:"forties", title:"Bestial Wrath and faster travel", from: 40, to: 49, place:"Azeroth · longer quests and harder encounters",
      summary:"Your level-40 keystone turns your pet into a powerful burst-damage tool; the suggested build starts Marksmanship investments afterward.",
      steps:[
        {id:"wrath",title:"Unlock Bestial Wrath at level 40",how:"Put it on Shift+1. Use for elites, bosses, tougher quest enemies and large pulls your pet can survive."},
        {id:"transport",title:"Review riding, routes and travel costs",how:"Check current Forever riding requirements and your gold before purchasing travel upgrades; do not assume modern retail timing."},
        {id:"mm-start",title:"Begin the Marksmanship points in your leveling build",how:"Levels 41–45: Lethal Attacks. Levels 46–49: Careful Aim. See the Talents tab."},
        {id:"weapon-check",title:"Replace outdated ranged weapon and ammunition",how:"Compare actual damage and ranged attack speed; keeping your ranged weapon updated is a very large DPS gain."}
      ]},
    { id:"fifties", title:"Polish your endgame kit", from: 50, to: 59, place:"Higher-level zones, dungeons and elite chains",
      summary:"Maintain Auto Shot and pet uptime while you finish the 31/20/0 leveling build.",
      steps:[
        {id:"mm-mid",title:"Complete Careful Aim, Rapid Killing and Hawk Eye",how:"Follow the exact level-by-level list; continue using the BM core rotation as your damage improves."},
        {id:"trueshot",title:"Take Trueshot Aura at level 56",how:"Bind/use the aura for group damage support."},
        {id:"hit-stats",title:"Start comparing hit, Agility and ranged weapon DPS",how:"Better uptime and a stronger weapon matter more than obsessing over a single low-level stat rule."},
        {id:"dungeon-readiness",title:"Run group content with disciplined pet control",how:"Growl off with a player tank; attack only the assigned enemy; recall before jumps or shortcuts; use traps thoughtfully."}
      ]},
    { id:"sixty", title:"Level 60 and ongoing goals", from: 60, to: 60, place:"Endgame · your preferred activities",
      summary:"Choose what is enjoyable: story completion, dungeons, professions, collecting pets or higher-pressure endgame.",
      steps:[
        {id:"complete-build",title:"Finish the level-60 31/20/0 leveling build",how:"At 57–60, put the final four points into Mortal Shots. Review the Talents tab before changing to a dedicated raid build."},
        {id:"prepare-groups",title:"Prepare an endgame dungeon kit",how:"Carry food, ammunition, pet food, healing and mana consumables. Check that your pet can survive group content and Growl is off."},
        {id:"pet-family",title:"Pick a preferred permanent pet and backup utility option",how:"A cat is a strong DPS default. Keep other pets only if you enjoy their utility; no rare camp is mandatory."},
        {id:"raid-build",title:"Decide whether to keep leveling BM or change the build",how:"Compare current patch build guides and your group's needs. Beta balancing and gear recommendations can change.",priority:"optional"},
        {id:"collection",title:"Choose optional Hunter goals",how:"Finish zone stories, collect pets, level professions, explore Skyborne lore or do dungeons with your partner.",priority:"optional"}
      ]}
  ]
};
const TALENT_NAMES = [
  "Deadly Aspects","Deadly Aspects","Deadly Aspects","Deadly Aspects","Deadly Aspects",
  "Focused Fire","Focused Fire","Improved Revive Pet","Improved Revive Pet","Endurance Training",
  "Pathfinding","Pathfinding","Bestial Swiftness","Unleashed Fury","Unleashed Fury",
  "Summon Hawk","Unleashed Fury","Unleashed Fury","Ferocity","Ferocity",
  "Intimidation","Bestial Discipline","Bestial Discipline","Ferocity","Ferocity",
  "Ferocity","Frenzy","Frenzy","Frenzy","Frenzy","Bestial Wrath",
  "Lethal Attacks","Lethal Attacks","Lethal Attacks","Lethal Attacks","Lethal Attacks",
  "Careful Aim","Careful Aim","Careful Aim","Careful Aim","Careful Aim",
  "Rapid Killing","Rapid Killing","Hawk Eye","Hawk Eye","Hawk Eye",
  "Trueshot Aura","Mortal Shots","Mortal Shots","Mortal Shots","Mortal Shots",
];
export const WOW_TALENT_PATH = TALENT_NAMES.map((name, index) => ({level:index+10, name, tree:index<=30?"Beast Mastery":"Marksmanship" as "Beast Mastery" | "Marksmanship"}));
export const WOW_SOURCES = [
  {label:"Blizzard: Meet the Skyborne",url:"https://worldofwarcraft.blizzard.com/en-us/news/24302071/"},
  {label:"Wowhead: Beast Mastery in Forever",url:"https://www.wowhead.com/forever/guide/classes/hunter/beast-mastery/overview-pve-dps"},
  {label:"Mobalytics: Hunter leveling 1–60 and talents",url:"https://mobalytics.gg/wow-forever/classes/hunter-leveling-guide"},
  {label:"Mobalytics: BM rotation and group play",url:"https://mobalytics.gg/wow-forever/classes/beast-mastery-hunter-guide"},
  {label:"Zephras Isle: quest hubs and exact quests",url:"https://www.hardcorehelper.com/forever/guides/zephras-isle-leveling-guide"},
  {label:"Wowhead: Zephras zone and ship locations",url:"https://www.wowhead.com/forever/guide/zephras-isle-zone-overview"},
  {label:"Hunter pet ability ranks",url:"https://beastmaster.io/"},
];
