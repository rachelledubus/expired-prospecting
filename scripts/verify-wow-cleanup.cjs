/** Guard against reintroducing WoW companion scope creep.
 * Run: node scripts/verify-wow-cleanup.cjs
 * Static coverage complements TypeScript and the material/source regressions.
 */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const read=p=>fs.readFileSync(path.resolve(__dirname,"..",p),"utf8");
const view=read("app/(planner)/games/WoWForeverView.tsx");
const pets=read("app/(planner)/games/WoWPetTracker.tsx");
const search=read("app/(planner)/games/WoWUnifiedSearch.tsx");
const data=read("lib/games-data.ts");
const farm=read("app/(planner)/games/WoWGoldFarming.tsx");
const groups=[...view.matchAll(/\{id:"(next|professions|farming|hunter|world|search)",label:"[^"]+",views:\[([^\]]+)\]\}/g)];
assert.equal(groups.length,6,"Keep six primary groups");
const views=groups.flatMap(m=>[...m[2].matchAll(/"([^"]+)"/g)].map(x=>x[1]));
assert.equal(views.length,12,"Keep every existing guide subsection");
assert.equal(new Set(views).size,views.length,"Do not duplicate a subsection in multiple main groups");
for(const required of ["next","professions","materials","gold","roadmap","zones","talents","combat","pets","skyborne","gear","lookup"])
  assert.ok(views.includes(required),"Missing subsection: "+required);
assert.ok(!view.includes("quickMode"),"Do not reintroduce a second Play Next / compact mode");
assert.ok(view.includes('views:["gold","materials"]'),"Gold & Farming should open Gold first");
assert.ok(pets.includes("WOW_FOREVER_PET_FAMILIES")&&search.includes("WOW_FOREVER_PET_FAMILIES"),"Pet roster and search must share the Forever catalog");
assert.ok(!pets.includes("WOW_PET_FAMILIES"),"Do not render the redundant legacy pet directory");
for(const name of ["last-view","pet-","stock-","price-","source-area-","source-note-","farm-","macro-"])
  assert.ok(data.includes(name),"Keep saved data keys compatible: "+name);
assert.ok(farm.includes("Earlier saved session")&&farm.includes("Log farming sessions"),"One consolidated log must preserve older gold sessions");
assert.equal((view.match(/<WoWHunterDungeons /g)||[]).length,1,"Render the full dungeon planner only once");
assert.ok(!view.includes('F(game.id,"pet-name")'),"Keep pet identity in the roster only");
assert.ok(view.includes("Advanced · Compare equipment stats"),"Keep manual gear comparison optional");
assert.ok(view.includes("Other level ranges · early game and upcoming"),"Archive noncurrent leveling brackets");
assert.ok(search.includes('!prog.checks[recipeHiddenKey(game.id,r.id)]'),"Global search must exclude hidden recipes");
const play=read("app/(planner)/games/WoWPlaySession.tsx");
assert.ok(play.includes('{mode==="gold"&&<details'),"Detailed material lookup should be optional in gold mode");
assert.ok(!play.includes('mode!=="skin-xp"'),"Do not repeat material search for unrelated play goals");
console.log("WoW cleanup regression passed: six groups, one dungeon planner, consolidated saves and search filtering");
