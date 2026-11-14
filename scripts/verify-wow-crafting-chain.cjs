/**
 * Regression checks for inventory-aware WoW profession preparation.
 * Runs with the project's existing TypeScript dependency (no extra packages).
 */
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const Module=require("node:module");
const ts=require("typescript");

const filename=path.resolve(__dirname,"../lib/wow-crafting-chain.ts");
const js=ts.transpileModule(fs.readFileSync(filename,"utf8"),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}
}).outputText;
const mod=new Module(filename,module);
mod.filename=filename;
mod.paths=Module._nodeModulePaths(path.dirname(filename));
mod._compile(js,filename);
const {planCraftChain}=mod.exports;

const boots={id:"boots",name:"Leather Boots",reagents:[
  {name:"Cured Medium Hide",quantity:1},{name:"Medium Leather",quantity:6}
]};
const cure={id:"cure",name:"Cured Medium Hide",reagents:[
  {name:"Medium Hide",quantity:1},{name:"Salt",quantity:1}
]};
const medium={id:"medium",name:"Medium Leather",reagents:[{name:"Light Leather",quantity:4}]};
const recipes=[boots,cure,medium];
const initial={"Cured Medium Hide":0,"Medium Leather":2,"Medium Hide":0,"Salt":1,"Light Leather":10};
const prepare=(inventory=initial,opts={})=>planCraftChain({
  recipe:boots,batch:1,recipes,isLearned:r=>r.id!=="boots"&&opts.notLearned!==r.id,
  inventory:name=>Object.hasOwn(inventory,name)?inventory[name]:null,
  yieldPerCraft:r=>opts.mediumYield&&r.id==="medium"?opts.mediumYield:1,
  expandLearned:opts.expand!==false
});
const byName=(plan,name)=>plan.requirements.find(x=>x.name===name);
const byRecipe=(plan,id)=>plan.steps.find(x=>x.recipe.id===id);

let plan=prepare();
assert.equal(byRecipe(plan,"cure").casts,1,"Cure one medium hide");
assert.equal(byRecipe(plan,"medium").casts,4,"Craft four medium leather after using existing two");
assert.equal(byName(plan,"Medium Leather").stockUsed,2,"Use known intermediate stock once");
assert.equal(byName(plan,"Light Leather").rawShortage,6,"Need six additional light leather");
assert.equal(byName(plan,"Medium Hide").rawShortage,1,"Need one medium hide");
assert.equal(byName(plan,"Salt").rawShortage,0,"Already own enough salt");
assert.deepEqual(plan.steps.map(s=>s.recipe.id).sort(),["cure","medium"],"Both independent craft steps included");
assert.equal(plan.ready,false);

plan=prepare(initial,{mediumYield:2});
assert.equal(byRecipe(plan,"medium").casts,2,"Output yield reduces casts required");
assert.equal(byName(plan,"Light Leather").rawShortage,0,"Enough Light Leather with corrected output");
const sharedRoot={id:"shared-root",name:"Shared Materials",reagents:[
  {name:"Light Leather",quantity:8},{name:"Medium Leather",quantity:1}
]};
const shared=planCraftChain({recipe:sharedRoot,batch:1,recipes:[sharedRoot,medium],
  isLearned:r=>r.id==="medium",
  inventory:name=>name==="Light Leather"?10:0});
assert.equal(byName(shared,"Light Leather").stockUsed,10,"Shared material stock is consumed only once");
assert.equal(byName(shared,"Light Leather").rawShortage,2,"Repeated demands correctly account for leftover stock");


plan=prepare({...initial,"Medium Leather":undefined});
assert.equal(byName(plan,"Medium Leather").unknown,true,"Missing count must not be zero");
assert.equal(byRecipe(plan,"medium"),undefined,"Do not assume how many to convert");
assert.ok(plan.unknown.find(x=>x.name==="Medium Leather"));

plan=prepare(initial,{notLearned:"cure"});
assert.equal(byRecipe(plan,"cure"),undefined,"Unlearned conversion must not be offered");
assert.equal(byName(plan,"Cured Medium Hide").rawShortage,1);
assert.equal(byName(plan,"Medium Hide"),undefined,"Do not recurse into unknown recipe");

plan=prepare(initial,{expand:false});
assert.equal(plan.steps.length,0,"Conversion toggle is respected");
assert.equal(byName(plan,"Medium Leather").rawShortage,4);

const cyclicA={id:"a",name:"A",reagents:[{name:"B",quantity:1}]};
const cyclicB={id:"b",name:"B",reagents:[{name:"A",quantity:1}]};
const cyclicRoot={id:"root",name:"Root",reagents:[{name:"A",quantity:1}]};
const cyclic=planCraftChain({recipe:cyclicRoot,batch:1,recipes:[cyclicRoot,cyclicA,cyclicB],
  isLearned:()=>true,inventory:()=>0});
assert.ok(cyclic.toAcquire.length>=1,"Cyclic formulas must terminate with unmet source");

const top={id:"top",name:"Top",reagents:[{name:"Second",quantity:1}]};
const second={id:"second",name:"Second",reagents:[{name:"First",quantity:2}]};
const first={id:"first",name:"First",reagents:[{name:"Ore",quantity:1}]};
const nested=planCraftChain({recipe:top,batch:1,recipes:[top,second,first],
  isLearned:()=>true,inventory:()=>0});
assert.deepEqual(nested.steps.map(s=>s.recipe.id),["first","second"],
  "True crafting dependencies must appear in prerequisite order");
assert.equal(byName(nested,"Ore").rawShortage,2,"Nested required quantities propagate correctly");


const deepRecipes=Array.from({length:10},(_,i)=>({
  id:"deep-"+i,name:"Material "+i,
  reagents:[{name:i===9?"Raw Rock":"Material "+(i+1),quantity:1}]
}));
const deepRoot={id:"deep-root",name:"Deep Root",reagents:[{name:"Material 0",quantity:1}]};
const deep=planCraftChain({recipe:deepRoot,batch:1,
  recipes:[deepRoot,...deepRecipes],isLearned:()=>true,inventory:()=>0});
assert.equal(deep.ready,false,"Depth guard must not report ready when inputs remain unresolved");
assert.ok(deep.toAcquire.length>0,"Depth guard accounts for unmet raw inputs");
assert.ok(deep.warnings.length>0,"Depth guard explains the limit");

console.log("WoW crafting-chain regression tests passed (9 scenarios).");
