/** Hunter pet families documented by the WoW Forever client reference,
 * checked 2026-11-10 (build 1.60.1.70862).
 * https://classicwowforever.com/hunter-pets/
 * Family skills and taming availability may change after patches.
 * This is not a live spawn map. Fox taming remains unconfirmed.
 */
export type PetFamilyRole="Solo / tank"|"Damage"|"Group"|"Control"|"Utility";
export type PetFamilyRecord={
  name:string;skill:string;use:string;role:PetFamilyRole;diet:string;note?:string;
};
export const WOW_FOREVER_PET_FAMILY_SOURCE="https://classicwowforever.com/hunter-pets/";
export const WOW_FOREVER_PET_FAMILIES:ReadonlyArray<PetFamilyRecord>=[
 {name:"Wolf",skill:"Furious Howl",use:"Melee party attack-power support",role:"Group",diet:"Meat"},
 {name:"Cat",skill:"Prowl",use:"Stealthed opener and damage",role:"Damage",diet:"Meat, fish"},
 {name:"Spider",skill:"Web",use:"Root and damage-over-time control",role:"Control",diet:"Meat"},
 {name:"Bear",skill:"Swipe",use:"Hits several nearby enemies",role:"Solo / tank",diet:"Meat, fish, cheese, bread, fungus, fruit"},
 {name:"Boar",skill:"Charge",use:"Engages and briefly roots enemies",role:"Solo / tank",diet:"Meat, fish, cheese, bread, fungus, fruit"},
 {name:"Crocolisk",skill:"Dismember",use:"Reduces enemy healing",role:"Control",diet:"Meat, fish"},
 {name:"Carrion Bird",skill:"Demoralizing Screech",use:"Damages enemies nearby and lowers their melee power",role:"Solo / tank",diet:"Meat, fish"},
 {name:"Crab",skill:"Pinch",use:"Movement slow",role:"Control",diet:"Fish, bread, fungus, fruit"},
 {name:"Gorilla",skill:"Thunderstomp",use:"Area damage",role:"Solo / tank",diet:"Fungus, fruit"},
 {name:"Raptor",skill:"Savage Rend",use:"Bleed damage",role:"Damage",diet:"Meat"},
 {name:"Tallstrider",skill:"Dust Cloud",use:"Armor reduction for target",role:"Group",diet:"Cheese, fungus, fruit"},
 {name:"Scorpid",skill:"Scorpid Poison",use:"Stacking damage over time",role:"Damage",diet:"Meat"},
 {name:"Turtle",skill:"Shell Shield",use:"Damage mitigation",role:"Solo / tank",diet:"Fish, fungus, fruit"},
 {name:"Bat",skill:"Sonic Blast",use:"Slows enemy spellcasting",role:"Control",diet:"Fungus, fruit"},
 {name:"Hyena",skill:"Tendon Rip",use:"Movement slow and bleed",role:"Control",diet:"Meat, fruit"},
 {name:"Bird of Prey",skill:"Mine!",use:"Disarms an enemy",role:"Control",diet:"Meat",note:"Formerly called Owl; old Screech information may be outdated."},
 {name:"Wind Serpent",skill:"Lightning Breath",use:"Ranged damage",role:"Damage",diet:"Fish, cheese, bread"},
 {name:"Fox",skill:"Trickster's Dance",use:"Short dodge and attack-speed boost",role:"Utility",diet:"Meat",note:"Tameable Forever spawns not yet verified; do not travel without confirming."}
] as const;
