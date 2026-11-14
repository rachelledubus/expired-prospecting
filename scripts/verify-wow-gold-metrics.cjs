/** Manual multi-session gold metric regression.
 * Run: node scripts/verify-wow-gold-metrics.cjs */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),Module=require("node:module");
const ts=require("typescript");
const file=path.resolve(__dirname,"../lib/wow-gold-session-metrics.ts");
const js=ts.transpileModule(fs.readFileSync(file,"utf8"),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}
}).outputText;
const mod=new Module(file,module);mod.filename=file;mod.paths=Module._nodeModulePaths(path.dirname(file));
mod._compile(js,file);
const {measureFarm}=mod.exports;
const metric=(fields,id="wc")=>measureFarm(k=>fields[k],id);
assert.equal(metric({}),null,"Missing measurements should not be treated as zero");
const legacy=metric({"farm-wc-gold":"10","farm-wc-minutes":"30"});
assert.equal(legacy.netPerHour,20);
assert.equal(legacy.runs,1);
const history=metric({
 "farm-wc-gold":"100","farm-wc-minutes":"10",
 "farm-wc-run-1-gold":"15","farm-wc-run-1-minutes":"30","farm-wc-run-1-expenses":"3",
 "farm-wc-run-2-gold":"20","farm-wc-run-2-minutes":"60","farm-wc-run-2-expenses":"2",
 "farm-wc-run-3-gold":"17","farm-wc-run-3-minutes":"0"
});
assert.equal(history.runs,2,"Incomplete/invalid sessions must be ignored");
assert.equal(history.minutes,90);
assert.equal(history.netGold,30);
assert.equal(history.netPerHour,20);
assert.equal(metric({"farm-wc-run-1-gold":"5","farm-wc-run-1-minutes":"20","farm-wc-run-1-expenses":"10"}).netPerHour,-15);
assert.equal(metric({"farm-wc-run-1-gold":"5","farm-wc-run-1-minutes":"not-a-number"}),null);
console.log("WoW gold metrics regression passed");
