/**
 * XP + Skinning objectives for the Hunter field guide.
 *
 * Recommendations are drawn from existing documented material leads, not
 * guessed spawn coordinates. Mob ranges are reference estimates; a skinnable
 * target is not necessarily within the character's Skinning skill.
 */
import { CURATED_MATERIAL_ROUTES, type MaterialRoute } from "./wow-material-farms";
import { FOREVER_REVIEWED_MATERIAL_LEADS } from "./wow-forever-source-expansion";
import { grayMobThreshold } from "./wow-portal-extras";

export type SkinningXpLead={
  route:MaterialRoute;
  grade:"level-appropriate"|"mixed-levels"|"lower-level";
  notes:string[];
  score:number;
};
const instanceZone=/dungeon|caverns|deeps|excavation site|shadowfang keep|razorfen|blackfathom|deadmines|maraudon|uldaman|gnomeregan|scarlet monastery/i;
const opposingZone=(zone:string,faction:"horde"|"alliance")=>
  faction==="horde"?/westfall|redridge mountains|dun morogh/i.test(zone):
  /the barrens|durotar|mulgore|tirisfal glades|orgrimmar/i.test(zone);
const sourceScore:Record<MaterialRoute["evidence"],number>={
  "forever-reported":0,"wowhead-item-page":8,"client-recipe":12,"classic-reference":24
};
export function rankLevelSkinning(level:number,faction:"horde"|"alliance"):SkinningXpLead[]{
  const current=Math.max(1,Math.min(60,Math.floor(level)||1));
  const gray=grayMobThreshold(current);
  const raw:MaterialRoute[]=[
    ...CURATED_MATERIAL_ROUTES,
    ...FOREVER_REVIEWED_MATERIAL_LEADS.map(lead=>({...lead} as MaterialRoute))
  ];
  const seen=new Set<string>();
  return raw.filter(r=>{
    if(seen.has(r.id))return false;
    seen.add(r.id);
    return r.method==="skinning"&&
      r.minMob!==undefined&&r.maxMob!==undefined&&
      !instanceZone.test(r.zone)&&
      // At least some enemies may give kill XP; no zero-XP skinnings.
      r.maxMob>gray&&
      // Exclude clearly over-leveled or too-far-below targets.
      r.minMob<=current+2&&r.maxMob>=Math.max(1,current-6);
  }).map(route=>{
    const min=route.minMob!,max=route.maxMob!;
    const allXp=min>gray;
    const near=current>=min&&current<=max;
    const higher=max>current+2;
    const lower=min<=gray;
    const grade:SkinningXpLead["grade"]=higher||lower?"mixed-levels":near?"level-appropriate":"lower-level";
    const notes=[
      "Kill, loot, then skin each eligible corpse",
      !allXp?"Some listed enemies may be gray and give no XP":"XP is possible from listed enemies; verify their name color",
      higher?"Some listed enemies may be too high level for comfortable solo kills":"",
      opposingZone(route.zone,faction)?"Opposing-faction travel may be risky":"",
      route.evidence==="classic-reference"?"Historical source; verify actual mobs and skinning loot in Forever":"Forever-reported source; availability may change",
      "Check your Skinning skill against the target before committing to a loop"
    ].filter(Boolean);
    const distance=current<min?min-current:current>max?current-max:0;
    const score=distance*25+(near?0:18)+(higher?34:0)+(lower?15:0)+
      (opposingZone(route.zone,faction)?70:0)+sourceScore[route.evidence];
    return {route,grade,notes,score};
  }).sort((a,b)=>a.score-b.score||a.route.target.localeCompare(b.route.target));
}
