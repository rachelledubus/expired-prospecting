/** Hunter gear source + pursuit-level regression, used by WoW CI.
 * Run: node scripts/verify-wow-hunter-bis.cjs */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),ts=require("typescript");
require.extensions[".ts"]=(m,filename)=>m._compile(
  ts.transpileModule(fs.readFileSync(filename,"utf8"),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}
  }).outputText,filename);
const root=path.resolve(__dirname,"..");
const {WOW_HUNTER_BIS_LEADS,WOW_HUNTER_BIS_SLOTS,hunterBisSourceWarnings,hunterBisLeadForDungeonItem}
 =require(path.join(root,"lib/wow-hunter-bis.ts"));
assert.equal(WOW_HUNTER_BIS_SLOTS.length,17,"Track all 17 stat-bearing equipment positions");
const planned=new Set(WOW_HUNTER_BIS_LEADS.filter(x=>
  !x.faction||x.faction==="horde").filter(x=>x.recommendedLevel<=40).map(x=>x.slot));
for(const [slot] of WOW_HUNTER_BIS_SLOTS)
  assert.ok(planned.has(slot),"Missing Horde level-40 BiS/gear recommendation for "+slot);
assert.ok(WOW_HUNTER_BIS_LEADS.length>=17,"Cover all Hunter gear slots");
assert.deepEqual(hunterBisSourceWarnings(),[],"Mapped boss and dungeon loot must still exist");
const ids=new Set();
for(const item of WOW_HUNTER_BIS_LEADS){
  assert.ok(!ids.has(item.id),"Duplicate BiS lead "+item.id);
  ids.add(item.id);
  assert.ok(item.recommendedLevel>=item.minEquipLevel,"Farm level must not predate equip level");
  assert.ok(item.source&&item.location,"Every target needs exact acquisition details");
  assert.ok(item.sourceUrl.startsWith("https://www.wowhead.com/forever/item=")||
    item.sourceUrl.startsWith("https://theforeverera.com/en/")||
    item.sourceUrl.startsWith("https://www.wowforever.info/bis?class=hunter"),
    "Use sourced Forever item/gear pages, not raw Classic/PTR");
  if(item.dungeonId&&item.targetId)
    assert.equal(hunterBisLeadForDungeonItem(item.dungeonId,item.targetId)?.id,item.id,
      "Dungeon BiS targets need a persistent tracked loot key");
}
const truth=WOW_HUNTER_BIS_LEADS.find(x=>x.id==="truthseekers-bow");
assert.ok(truth&&truth.minEquipLevel===40&&truth.recommendedLevel===40);
assert.ok(truth.location.includes("Undercity")&&truth.source.includes("25"));
const galgann=WOW_HUNTER_BIS_LEADS.find(x=>x.id==="galganns-fireblaster");
assert.ok(galgann&&galgann.minEquipLevel===42&&galgann.recommendedLevel>=42);
assert.ok(galgann.location.includes("Uldaman")&&galgann.source.includes("Galgann"));
const data=fs.readFileSync(path.join(root,"lib/games-data.ts"),"utf8");
assert.ok(data.includes('WOW_HUNTER_BIS_LEADS.filter(x=>!x.dungeonId||!x.targetId)'),
  "All non-dungeon BiS acquired checkboxes must be in saved-progress allowlist");
assert.ok(data.includes('extra("bis-owned-truthseekers-bow")'),
  "Preserve the quest bow checkmark in the whitelist");
const view=fs.readFileSync(path.join(root,"app/(planner)/games/WoWForeverView.tsx"),"utf8");
assert.ok(view.includes("<WoWHunterBiS"),"Show BiS guide in the existing Gear subtab");
const dungeon=fs.readFileSync(path.join(root,"app/(planner)/games/WoWHunterDungeons.tsx"),"utf8");
assert.ok(dungeon.includes("hunterBisLeadForDungeonItem"),"Mark BiS targets in dungeon loot lists");
console.log("WoW Hunter BiS 17-slot coverage, sources, levels and saved-progress checks passed");
