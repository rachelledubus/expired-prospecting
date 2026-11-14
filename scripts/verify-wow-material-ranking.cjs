/**
 * Standalone no-XP Hunter material routing regression.
 * Run: node scripts/verify-wow-material-ranking.cjs
 */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const Module=require("node:module");
const ts=require("typescript");
const file=path.resolve(__dirname,"../lib/wow-material-route-ranking.ts");
const js=ts.transpileModule(fs.readFileSync(file,"utf8"),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}
}).outputText;
const mod=new Module(file,module);mod.filename=file;
mod.paths=Module._nodeModulePaths(path.dirname(file));mod._compile(js,file);
const {expectedGrayCutoff,rankMaterialRoutes,materialRouteAdvice}=mod.exports;
const make=(id,method,minMob,maxMob,evidence="classic-reference",zone="The Barrens")=>({
 id,item:"Medium Leather",method,zone,target:id,advice:"Check current Forever",
 sourceUrl:"https://www.wowhead.com/forever/item=2319",
 evidence,...(minMob===undefined?{}:{minMob}),...(maxMob===undefined?{}:{maxMob})
});
const grayOutdoor=make("gray-skin","skinning",18,20,"classic-reference");
const historicalGray=make("historical-gray","mob",17,19,"classic-reference");
const xpOutdoor=make("xp-skin","skinning",30,32,"forever-reported");
const unknownDungeon=make("unknown-dungeon","skinning",undefined,undefined,"forever-reported","Excavation Site: Wetlands (custom dungeon)");
const confirmedGray=make("gray-new","skinning",18,20,"forever-reported");
const mining=make("mining","mining",undefined,undefined,"wowhead-item-page");
const merchant=make("merchant","vendor",undefined,undefined,"wowhead-item-page");
const other=make("other","other-profession",undefined,undefined,"wowhead-item-page");
const all=[unknownDungeon,xpOutdoor,grayOutdoor,mining,merchant,other,confirmedGray,historicalGray];
const defaults={level:34,noXp:true,includeGathering:false,includeHistorical:true};
assert.equal(expectedGrayCutoff(34),26);
assert.equal(expectedGrayCutoff(1),0);
assert.equal(materialRouteAdvice(grayOutdoor,34).xp,"gray-expected");
assert.equal(materialRouteAdvice(xpOutdoor,34).xp,"xp-possible");
assert.equal(materialRouteAdvice(unknownDungeon,34).xp,"unknown");
const ranked=rankMaterialRoutes(all,defaults);
const ids=ranked.map(x=>x.route.id);
assert.ok(ids.includes("gray-skin")&&ids.includes("merchant")&&ids.includes("gray-new"));
assert.ok(!ids.includes("xp-skin")&&!ids.includes("unknown-dungeon")&&!ids.includes("mining"));
assert.ok(ids.indexOf("gray-new")<ids.indexOf("historical-gray"),"Prefer Forever-reported over historical when both have gray mobs");
assert.ok(ids.indexOf("merchant")<ids.indexOf("other"),"A direct supplier beats other professions");
const relaxed=rankMaterialRoutes(all,{...defaults,noXp:false,includeGathering:true});
assert.ok(relaxed.some(x=>x.route.id==="mining"));
assert.ok(relaxed.some(x=>x.route.id==="xp-skin"));
assert.ok(relaxed.some(x=>x.route.id==="unknown-dungeon"));
assert.ok(!rankMaterialRoutes(all,{...defaults,includeHistorical:false}).some(x=>x.route.id==="historical-gray"));
assert.equal(materialRouteAdvice(make("mixed","mob",23,29),34).xp,"unknown","A mixed-level spawn must not be described as zero XP");
const now42=rankMaterialRoutes([xpOutdoor],{...defaults,level:42});
assert.equal(now42.length,1,"Gray suitability must update with character level");
console.log("WoW material farming ranking regression passed");
