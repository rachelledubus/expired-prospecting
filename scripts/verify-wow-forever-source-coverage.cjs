/**
 * Regression tests: Every curated entry must have a source and truthful status.
 * Run after tsc in CI: node scripts/verify-wow-forever-source-coverage.cjs
 */
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const Module=require("node:module");
const ts=require("typescript");

const file=path.resolve(__dirname,"../lib/wow-forever-source-expansion.ts");
const code=ts.transpileModule(fs.readFileSync(file,"utf8"),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}
}).outputText;
const moduleToLoad=new Module(file,module);
moduleToLoad.filename=file;
moduleToLoad.paths=Module._nodeModulePaths(path.dirname(file));
moduleToLoad._compile(code,file);
const {FOREVER_REVIEWED_MATERIAL_LEADS:leads,reviewedMaterialRoutes,FOREVER_MATERIAL_REVIEW_DATE}=moduleToLoad.exports;

const catalog=JSON.parse(fs.readFileSync(path.resolve(__dirname,"../lib/wow-forever-recipe-catalog.json"),"utf8"));
const reagents=new Set(catalog.recipes.flatMap(r=>r.reagents.map(m=>m.name)));
const names=new Set(),ids=new Set();
assert.equal(FOREVER_MATERIAL_REVIEW_DATE,"2026-11-14");
assert.ok(leads.length>=20,"Reviewed routes must retain at least the original 20 researched leads");
for(const lead of leads){
 assert.ok(reagents.has(lead.item),lead.item+" must be a real recipe ingredient in this portal");
 assert.ok(lead.id&&lead.target&&lead.zone&&lead.advice,"Routes must have actionable locations and guidance");
 assert.ok(!ids.has(lead.id),"Duplicate route ID: "+lead.id);
 ids.add(lead.id);
 names.add(lead.item);
 assert.match(lead.sourceUrl,/^https:\/\/www\.wowhead\.com\/forever\/(?:item|spell)=\d+|^https:\/\/www\.wowhead\.com\/forever\/guide\//);
 assert.ok(!lead.waypoint,"Unverified spawn coordinates must not be invented");
 if(lead.evidence==="classic-reference")assert.ok(["mob","dungeon","skinning"].includes(lead.method),
   "Historical drop comments must be marked as mob/dungeon, not Forever-confirmed");
 if(lead.method==="other-profession")assert.equal(lead.evidence,"wowhead-item-page");
 if(lead.method==="vendor")assert.equal(lead.evidence,"wowhead-item-page");
}
assert.ok(names.size>=20,"Review must retain at least 20 distinct recipe ingredient sources");
const horde=reviewedMaterialRoutes("Green Dye","horde")[0];
const alliance=reviewedMaterialRoutes("Green Dye","alliance")[0];
assert.match(horde.zone,/Orgrimmar/);
assert.match(alliance.zone,/Stormwind/);
assert.equal(horde.reviewedAt,"2026-11-14");
assert.equal(reviewedMaterialRoutes("Sulfuric Acid","horde")[0].method,"other-profession");
assert.equal(reviewedMaterialRoutes("Thick Murloc Scale","horde")[0].evidence,"classic-reference");
assert.equal(reviewedMaterialRoutes("Never Existed","horde").length,0);
assert.equal(reviewedMaterialRoutes("Kingsblood","horde").some(r=>r.method==="herbalism"&&r.requiredSkill===125),true);
assert.equal(reviewedMaterialRoutes("Medium Leather","horde").some(r=>r.id==="medium-leather-mulgore-supplier"),true);
assert.equal(reviewedMaterialRoutes("Medium Leather","alliance").some(r=>r.id==="medium-leather-mulgore-supplier"),false);
console.log("WoW Forever source coverage regression passed: "+leads.length+" leads, "+names.size+" recipe ingredients, faction and evidence checks.");
