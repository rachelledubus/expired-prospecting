/** Test XP + Skinning priorities without importing the entire Next.js app.
 * Run: node scripts/verify-wow-level-skinning.cjs */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const Module=require("node:module");
const ts=require("typescript");
const file=path.resolve(__dirname,"../lib/wow-level-skinning.ts");
const fixture=(id,zone,min,max,method="skinning",evidence="classic-reference")=>({
  id,item:"Heavy Leather",method,zone,target:id,advice:"Check the actual mob in game",
  sourceUrl:"https://www.wowhead.com/forever/item=4234/heavy-leather",
  minMob:min,maxMob:max,evidence
});
const curated=[
 fixture("arathi-raptors","Arathi Highlands",30,37),
 fixture("stv-cats","Stranglethorn Vale",30,38),
 fixture("gray-wc","The Barrens",17,24),
 fixture("instance","Excavation Site: Wetlands (custom dungeon)",31,35),
 fixture("horde-hostile","Westfall",32,34),
 fixture("low-forest","Ashenvale",26,29),
 fixture("future","Feralas",48,50),
 fixture("humanoids","Arathi Highlands",32,34,"mob"),
 fixture("unknown-level","The Hinterlands",undefined,undefined)
];
const reviewed=[fixture("reported","Arathi Highlands",32,34,"skinning","forever-reported")];
const originalLoad=Module._load;
Module._load=function(request,parent,isMain){
 if(parent&&parent.filename===file){
   if(request==="./wow-material-farms")return {CURATED_MATERIAL_ROUTES:curated};
   if(request==="./wow-forever-source-expansion")return {FOREVER_REVIEWED_MATERIAL_LEADS:reviewed};
   if(request==="./wow-portal-extras")return {grayMobThreshold:l=>Math.max(0,l-Math.floor(l/10)-(l>=45?6:5))};
 }
 return originalLoad.apply(this,arguments);
};
try{
 const src=fs.readFileSync(file,"utf8");
 const js=ts.transpileModule(src,{
   compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}
 }).outputText;
 const mod=new Module(file,module);mod.filename=file;
 mod.paths=Module._nodeModulePaths(path.dirname(file));mod._compile(js,file);
 const {rankLevelSkinning}=mod.exports;
 const horde=rankLevelSkinning(34,"horde"),ids=horde.map(x=>x.route.id);
 assert.ok(ids.includes("arathi-raptors")&&ids.includes("stv-cats"),
   "Level-34 Hunter should see level-appropriate outdoor beasts");
 for(const excluded of ["gray-wc","instance","future","humanoids","unknown-level"])
   assert.ok(!ids.includes(excluded),"Bad level or ineligible method displayed: "+excluded);
 assert.equal(ids[0],"reported","Prefer relevant Forever reports over old sources");
 assert.ok(ids.indexOf("horde-hostile")>ids.indexOf("reported"),"Opposing faction should be deprioritized");
 assert.ok(horde[0].notes.some(x=>x.toLowerCase().includes("skin")), "Must remind user to skin after looting");
 const ally=rankLevelSkinning(34,"alliance");
 assert.ok(ally.find(x=>x.route.id==="horde-hostile").score<
   horde.find(x=>x.route.id==="horde-hostile").score);
 assert.ok(rankLevelSkinning(50,"horde").some(x=>x.route.id==="future"),
   "Routes need to respond to updated Hunter level");
 console.log("WoW XP + Skinning recommendations regression passed");
}finally{Module._load=originalLoad}
