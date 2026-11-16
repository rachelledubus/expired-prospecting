/**
 * Curated Hunter *leveling* BiS contenders, NOT proven endgame BiS.
 * Sources checked 2026-11-16 against Forever-specific item pages / dungeon journals.
 * recommendedLevel = when it is sensible to pursue, not the equip requirement.
 * Never assume that a level threshold alone guarantees a dungeon clear.
 */
import { WOW_HUNTER_DUNGEONS, type HunterLootTarget } from "./wow-forever-dungeon-gear";

export type HunterBisLead={
  id:string;name:string;slot:HunterLootTarget["slot"];
  minEquipLevel:number;recommendedLevel:number;
  source:string;location:string;sourceUrl:string;
  tier:"leveling-bis-candidate"|"strong-leveling-option";
  dungeonId?:string;targetId?:string;
  method:"quest"|"dungeon boss";
  note:string;
};
export const WOW_HUNTER_BIS_REVIEW_DATE="2026-11-16";
export const WOW_HUNTER_BIS_LEADS:readonly HunterBisLead[]=[
  {
    id:"truthseekers-bow",name:"Truthseeker's Bow",slot:"ranged",
    minEquipLevel:40,recommendedLevel:40,
    source:"Greater Friend of the Library (25 library books)",
    location:"Horde: Owen Thadd, Magic Quarter, Undercity / Alliance: Garion Wendell, Mage Tower, Stormwind",
    sourceUrl:"https://www.wowhead.com/forever/item=277254/truthseekers-bow",
    tier:"leveling-bis-candidate",method:"quest",
    note:"Choose the bow as the 25-book quest reward. The quest and item levels differ; bow requires level 40 to equip. Do not replace a better equipped weapon without checking tooltip DPS."
  },
  {
    id:"galganns-fireblaster",name:"Galgann's Fireblaster",slot:"ranged",
    minEquipLevel:42,recommendedLevel:44,
    source:"Galgann Firehammer",location:"Uldaman, Badlands",
    sourceUrl:"https://www.wowhead.com/forever/item=9412/galganns-fireblaster",
    tier:"leveling-bis-candidate",method:"dungeon boss",dungeonId:"uldaman",targetId:"galganns-fireblaster",
    note:"Level 42 to equip; around level 44 is a group-run planning recommendation, not a dungeon requirement. Compare against Truthseeker's Bow before farming."
  },
  {
    id:"fleshhide-shoulders",name:"Fleshhide Shoulders",slot:"shoulders",
    minEquipLevel:37,recommendedLevel:40,
    source:"Glutton",location:"Razorfen Downs, Southern Barrens",
    sourceUrl:"https://www.wowhead.com/forever/item=10774/fleshhide-shoulders",
    tier:"strong-leveling-option",method:"dungeon boss",dungeonId:"razorfen-downs",targetId:"fleshhide-shoulders",
    note:"Confirmed Forever dungeon-journal boss source; leather shoulder option while leveling. Actual BiS depends on your equipped stats."
  },
  {
    id:"oilskin-leggings",name:"Oilskin Leggings",slot:"legs",
    minEquipLevel:42,recommendedLevel:44,
    source:"Grimlok",location:"Uldaman, Badlands",
    sourceUrl:"https://www.wowhead.com/forever/item=9414/oilskin-leggings",
    tier:"strong-leveling-option",method:"dungeon boss",dungeonId:"uldaman",targetId:"oilskin-leggings",
    note:"Forever tooltip reports +18 Agility. Level 42 to equip; recommended group run about level 44."
  },
  {
    id:"megashot-rifle",name:"Megashot Rifle",slot:"ranged",
    minEquipLevel:48,recommendedLevel:49,
    source:"Tinkerer Gizlock",location:"Maraudon, Desolace",
    sourceUrl:"https://www.wowhead.com/forever/item=17717/megashot-rifle",
    tier:"leveling-bis-candidate",method:"dungeon boss",dungeonId:"maraudon",targetId:"megashot-rifle",
    note:"Level 48 to equip. A later ranged weapon option, not an upgrade guaranteed over a quest bow in your bags."
  }
] as const;

export const hunterBisLeadForDungeonItem=(dungeonId:string,targetId:string)=>
  WOW_HUNTER_BIS_LEADS.find(x=>x.dungeonId===dungeonId&&x.targetId===targetId);

/** Manual source review catches stale aliases and misassigned loot without inventing records. */
export function hunterBisSourceWarnings():string[]{
  return WOW_HUNTER_BIS_LEADS.flatMap(lead=>{
    if(!lead.dungeonId||!lead.targetId)return [];
    const dungeon=WOW_HUNTER_DUNGEONS.find(d=>d.id===lead.dungeonId);
    const item=dungeon?.loot.find(t=>t.id===lead.targetId);
    return item&&item.name===lead.name?[]:[`BiS source missing or mismatched: ${lead.id}`];
  });
}
