/**
 * Material routing preferences for the personal WoW Forever Hunter guide.
 * Expected gray mobs are estimates, NOT a guarantee of zero XP in Forever.
 * Keep this helper independent of React and recipe/catalog imports for testing.
 */
import type {MaterialRoute} from "./wow-material-farms";

export type MaterialRoutePreferences = {
  level:number;
  noXp:boolean;
  includeGathering:boolean;
  includeHistorical:boolean;
};
export type MaterialRouteAdvice = {
  route:MaterialRoute;
  xp:"none"|"gray-expected"|"xp-possible"|"unknown";
  usable:"direct"|"other-profession";
  notes:string[];
  score:number;
};

const isDungeon=(r:MaterialRoute)=>r.method==="dungeon"||
  /dungeon|caverns|keep|kraul|deeps|excavation site|deadmines|gnomeregan|ragefire|scarlet monastery|uldaman|zul'farrak|maraudon/i.test(r.zone);
const needsGathering=(r:MaterialRoute)=>r.method==="mining"||r.method==="herbalism";
const nonCombat=(r:MaterialRoute)=>r.method==="vendor"||r.method==="crafting"||r.method==="other-profession";
const evidenceOrder:Record<MaterialRoute["evidence"],number>={
  "forever-reported":0,"client-recipe":1,"wowhead-item-page":2,"classic-reference":3
};
/** Mirrors the portal's conservative reference calculation; confirm mob color in-game. */
export function expectedGrayCutoff(level:number):number {
  const n=Math.max(1,Math.min(60,Math.floor(level)||1));
  if(n<=5)return 0;
  return Math.max(0,n-Math.floor(n/10)-(n>=45?6:5));
}
export function materialRouteAdvice(route:MaterialRoute,level:number):MaterialRouteAdvice {
  const cutoff=expectedGrayCutoff(level);
  const dungeon=isDungeon(route);
  const gathering=needsGathering(route);
  const trade=nonCombat(route);
  const allGray=route.minMob!==undefined&&route.maxMob!==undefined&&route.maxMob<=cutoff;
  const allExp=route.minMob!==undefined&&route.minMob>cutoff;
  const xp:MaterialRouteAdvice["xp"]=trade||gathering?"none":
    allGray?"gray-expected":allExp?"xp-possible":"unknown";
  const other=route.method==="other-profession"||gathering;
  const notes:string[]=[];
  if(gathering)notes.push("Needs "+(route.method==="mining"?"Mining":"Herbalism")+
    (route.requiredSkill!==undefined?" "+route.requiredSkill:"")+"; your Skinning cannot gather this");
  if(route.method==="other-profession")notes.push("Requires another crafter or Auction House");
  if(route.method==="crafting")notes.push("Confirm you have learned this recipe before relying on it");
  if(dungeon)notes.push("Dungeon: other enemies may give XP even when this target is gray");
  if(xp==="gray-expected")notes.push("Listed target should be gray; verify in Forever");
  if(xp==="xp-possible")notes.push("Expected to award kill XP");
  if(xp==="unknown")notes.push("Level or XP status unverified; not a confirmed zero-XP farm");
  if(route.evidence==="classic-reference")notes.push("Historical lead; not a current Forever drop confirmation");
  if(route.method==="vendor")notes.push("Vendor stock / exact NPC unverified");
  const score=
    (other?1000:0)+
    (xp==="xp-possible"?350:xp==="unknown"?180:0)+
    (dungeon?80:0)+
    (route.method==="crafting"?45:route.method==="vendor"?10:0)+
    evidenceOrder[route.evidence]*25;
  return {route,xp,usable:other?"other-profession":"direct",notes,score};
}
export function rankMaterialRoutes(routes:MaterialRoute[],prefs:MaterialRoutePreferences):MaterialRouteAdvice[] {
  const ranked=routes.filter(r=>
    (prefs.includeHistorical||r.evidence!=="classic-reference")&&
    (prefs.includeGathering||!needsGathering(r))
  ).map(r=>materialRouteAdvice(r,prefs.level));
  const filtered=prefs.noXp?ranked.filter(x=>x.xp==="none"||x.xp==="gray-expected"):ranked;
  return filtered.sort((a,b)=>a.score-b.score||
    a.route.zone.localeCompare(b.route.zone)||a.route.target.localeCompare(b.route.target));
}
