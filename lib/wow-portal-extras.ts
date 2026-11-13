/** WoW Forever personal tools. Locations/levels are Classic reference estimates, not live-server guarantees. */
export type WowFarm = {
  id: string; name: string; kind: "dungeon" | "outdoors"; zone: string;
  minMob: number; maxMob: number; rewards: string[]; note: string;
  waypoint?: string; sourceUrl: string; requiresSkinning?: boolean;
  hordeWarning?: string;
};
export const WOW_FARMS: WowFarm[] = [
  { id:"wc",name:"Wailing Caverns — skin and loot",kind:"dungeon",zone:"The Barrens",
    minMob:17,maxMob:24,rewards:["Light/Medium Leather","Deviate Scales","BoE greens"],
    note:"The skull cave is NOT the dungeon. Enter the outer cave at ~46.0 36.3; follow tunnels to the glowing portal near 47.7 35.0. Skin eligible beasts; elites can still be dangerous.",
    waypoint:"/way The Barrens 46.0 36.3",sourceUrl:"https://mmonster.co/wow-forever/guides/dungeons/wailing-caverns",requiresSkinning:true },
  { id:"rfc",name:"Ragefire Chasm — quick vendor loot",kind:"dungeon",zone:"Orgrimmar",
    minMob:13,maxMob:18,rewards:["Linen Cloth","BoE greens","Vendor trash"],
    note:"Go DOWN into the Cleft of Shadow, not to the street-level map marker. Instance portal is at its lower eastern end.",
    waypoint:"/way Orgrimmar 52.8 49.6",sourceUrl:"https://www.warcrafttavern.com/wow-classic/guides/ragefire-chasm" },
  { id:"deadmines",name:"The Deadmines — cloth and BoEs",kind:"dungeon",zone:"Westfall",
    minMob:17,maxMob:26,rewards:["Linen/Wool Cloth","BoE greens","Vendor loot"],
    note:"Enter the Defias Hideout in Moonbrook, then continue underground to the actual instance. Horde travel crosses Alliance territory; check every mob is gray.",
    waypoint:"/way Westfall 42 72",sourceUrl:"https://shokadezz.com/wow-classic-era/answers/dungeon-entrances-and-locations",
    hordeWarning:"Alliance-controlled area / risky Horde travel" },
  { id:"ruins",name:"Ruins of Lordaeron — cloth & greens",kind:"dungeon",zone:"Tirisfal Glades",
    minMob:15,maxMob:22,rewards:["Cloth where humanoids drop it","BoE gear","Vendor items"],
    note:"Forever-specific dungeon. Exact portal location and loot rates are not verified; check entrance in game.",
    sourceUrl:"https://www.wowhead.com/forever/guide/dungeons-overview-locations-details" },
  { id:"barrens",name:"The Barrens — gray-level beast skinning",kind:"outdoors",zone:"The Barrens",
    minMob:17,maxMob:22,rewards:["Light Leather","Medium Leather chance","Hides","Vendor items"],
    note:"Skin beasts around the Crossroads/Camp Taurajo route. Check their actual names and levels before pulling; gray mobs may stop giving Skinning skill.",
    sourceUrl:"https://www.wowhead.com/classic/guide/skinning-leveling-1-300-wow-classic" ,requiresSkinning:true },
  { id:"durnholde",name:"Durnholde Keep — cloth from Syndicate",kind:"outdoors",zone:"Hillsbrad Foothills",
    minMob:20,maxMob:26,rewards:["Wool Cloth","Greens","Vendor drops"],
    note:"Farm only Syndicate humanoids that display gray; mob levels vary within the keep. Nearby travel mobs may be higher level.",
    waypoint:"/way Hillsbrad Foothills 76 47",sourceUrl:"https://www.wowhead.com/classic/zone=267/durnholde-keep" },
  { id:"sfk",name:"Shadowfang Keep — BoE drop hunt",kind:"dungeon",zone:"Silverpine Forest",
    minMob:22,maxMob:30,rewards:["Wool Cloth","Rare BoE gear","Vendor items"],
    note:"Potentially valuable rare drops, but some higher-level mobs can grant XP. Do NOT full-clear when No XP is enabled unless each enemy is gray.",
    waypoint:"/way Silverpine Forest 44.5 68",sourceUrl:"https://www.warcrafttavern.com/wow-classic/guides/shadowfang-keep" },
  { id:"bfd",name:"Blackfathom Deeps — mixed loot",kind:"dungeon",zone:"Ashenvale",
    minMob:24,maxMob:32,rewards:["Cloth","BoE drops","Vendor items"],
    note:"Some mobs remain XP-eligible at level 34. Check mobs individually and skip any non-gray targets.",
    waypoint:"/way Ashenvale 14.5 14.6",sourceUrl:"https://shokadezz.com/wow-classic-era/answers/dungeon-entrances-and-locations" },
];
/** Conservative Classic-style gray cutoff. Verify against actual in-game mob color in Forever. */
export const grayMobThreshold = (level:number) => {
  const n=Math.max(1,Math.min(60,Math.floor(level)));
  if(n<=5)return 0;
  return Math.max(0,n-Math.floor(n/10)-(n>=45?6:5));
};
export const WOW_DUNGEON_ENTRANCES: Record<string,{zone:string;waypoint?:string;detail:string;sourceUrl:string}> = {
  ragefire:{zone:"Orgrimmar",waypoint:"/way Orgrimmar 52.8 49.6",detail:"Go DOWN into the Cleft of Shadow, toward Neeru Fireblade's tent and the portal.",sourceUrl:"https://www.warcrafttavern.com/wow-classic/guides/ragefire-chasm"},
  wailing:{zone:"The Barrens",waypoint:"/way The Barrens 46.0 36.3",detail:"This is the OUTER skull cave. Follow the cave tunnels to the actual portal at about /way The Barrens 47.7 35.0. The first cave is not instanced.",sourceUrl:"https://mmonster.co/wow-forever/guides/dungeons/wailing-caverns"},
  deadmines:{zone:"Westfall",waypoint:"/way Westfall 42 72",detail:"Enter the mine/hideout at Moonbrook, then continue underground until the instance portal.",sourceUrl:"https://shokadezz.com/wow-classic-era/answers/dungeon-entrances-and-locations"},
  shadowfang:{zone:"Silverpine Forest",waypoint:"/way Silverpine Forest 44.5 68",detail:"Above Pyrewood Village, enter the keep on the mountainside.",sourceUrl:"https://www.warcrafttavern.com/wow-classic/guides/shadowfang-keep"},
  blackfathom:{zone:"Ashenvale",waypoint:"/way Ashenvale 14.5 14.6",detail:"Explore the drowned ruins at Zoram Strand; continue inside the non-instanced approach until the portal.",sourceUrl:"https://shokadezz.com/wow-classic-era/answers/dungeon-entrances-and-locations"},
  gnomeregan:{zone:"Dun Morogh",waypoint:"/way Dun Morogh 24 40",detail:"Reach the Gnomeregan complex in western Dun Morogh. The outdoor marker is not the final portal.",sourceUrl:"https://shokadezz.com/wow-classic-era/answers/dungeon-entrances-and-locations"},
  "razorfen-kraul":{zone:"The Barrens",waypoint:"/way The Barrens 43 90",detail:"West of the southern Gold Road near the Great Lift. Follow Razorfen paths toward the instance.",sourceUrl:"https://shokadezz.com/wow-classic-era/answers/dungeon-entrances-and-locations"},
  uldaman:{zone:"Badlands",waypoint:"/way Badlands 44 12",detail:"Follow the northern excavation tunnels; the outdoor map point is not the inner instance portal.",sourceUrl:"https://shokadezz.com/wow-classic-era/answers/dungeon-entrances-and-locations"},
  zulfarrak:{zone:"Tanaris",waypoint:"/way Tanaris 39 20",detail:"Northwest Tanaris, west of Gadgetzan; look for the large troll city entrance.",sourceUrl:"https://shokadezz.com/wow-classic-era/answers/dungeon-entrances-and-locations"},
  maraudon:{zone:"Desolace",waypoint:"/way Desolace 30 62",detail:"Enter the Valley of Spears cave system and follow the correct wing; there are separate portals.",sourceUrl:"https://shokadezz.com/wow-classic-era/answers/dungeon-entrances-and-locations"}
};
export const WOW_PET_FAMILIES = [
 {name:"Cat",purpose:"Single-target damage",note:"High sustained damage. Generally less comfortable for multi-mob tanking."},
 {name:"Bear",purpose:"Durable solo pet",note:"More forgiving in long pulls; Growl/target control still matters."},
 {name:"Boar",purpose:"Solo control / utility",note:"Charge can help engage; verify available ranks in Forever."},
 {name:"Owl",purpose:"Multiple-mob threat candidate",note:"Screech can help manage several targets where the ability exists; verify rank and pet family on your server."},
 {name:"Carrion Bird",purpose:"Multiple-mob threat candidate",note:"Screech may improve group threat; confirm current Forever skill behavior."},
 {name:"Wolf",purpose:"Group utility",note:"Party-oriented buff/ability options may differ in Forever."}
] as const;
export const WOW_COMBAT_BINDS = [
  ["mb4","Mouse 4","Auto attack / Auto Shot"],
  ["wheelup","Wheel up","Pet attacks tank's target (test macro)"],
  ["wheeldown","Wheel down","Pet Passive + Follow / recall"],
  ["f","F","Crowd control (trap)"],
  ["r","R","Feign Death"],
  ["1","1","Scorpid Sting"],
  ["2","2","Arcane Shot"],
  ["3","3","Aimed Shot"],
  ["4","4","Serpent Sting"],
  ["5","5","Concussive Shot"],
  ["6","6","Multi-Shot"],
  ["7","7","Intimidation"]
] as const;
export const WOW_MACRO_PRESETS = [
 {id:"tanktarget",name:"Send pet to tank's target",script:"#showtooltip\n/assist [@focus,exists,nodead]\n/petdefensive\n/petattack",note:"Set your tank as focus first. Macro conditionals vary by client; test in a safe area. /petdefensive may change behavior vs Passive."},
 {id:"recall",name:"Emergency recall",script:"#showtooltip\n/petpassive\n/petfollow",note:"Stops chasing and recalls your pet."},
 {id:"distraction",name:"Pet distraction while escaping",script:"#showtooltip\n/petdefensive\n/petattack",note:"Send the pet into the pack, run away, and do NOT use Feign Death unless safe. This cannot guarantee sustained aggro or the pet remaining behind."},
 {id:"auto",name:"Auto Shot",script:"#showtooltip Auto Shot\n/cleartarget [dead]\n/targetenemy [noharm]\n/cast !Auto Shot",note:"May retarget unintended enemies; test Forever support for !Auto Shot."}
] as const;
export const WOW_GEAR_SLOTS = [
 ["ranged","Ranged weapon"],["melee","Melee/stat stick"],["head","Head"],["neck","Neck"],
 ["shoulders","Shoulders"],["back","Back"],["chest","Chest"],["wrist","Wrist"],
 ["hands","Hands"],["waist","Waist"],["legs","Legs"],["feet","Feet"],["ring","Rings"]
] as const;
export const wowExtraField = (id:string,key:string) => id+"|wow-extra|"+key;
export const wowMaterialKey = (name:string) => name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
