/**
 * Pure, inventory-aware bill of materials for a WoW profession crafting run.
 * Never reads game memory. Inputs are explicit manual stock and known recipes.
 * Recipes may have unknown output yields, so default to one per cast and allow
 * an explicit user override. Unknown stock must not be treated as zero.
 */
import type { WowRecipe } from "./wow-forever-professions";

export type PlanRequirement = {
  name:string;
  required:number;
  stock:number|null;
  stockUsed:number;
  unknown:boolean;
  rawShortage:number;
  crafted:number;
};
export type PlanCraftStep = {
  recipe:WowRecipe;
  casts:number;
  outputPerCast:number;
  outputUsed:number;
  inputNames:string[];
};
export type CraftChainPlan = {
  requirements:PlanRequirement[];
  steps:PlanCraftStep[];
  unknown:PlanRequirement[];
  toAcquire:PlanRequirement[];
  ready:boolean;
  warnings:string[];
};
type Inputs={
  recipe:WowRecipe;
  batch:number;
  recipes:readonly WowRecipe[];
  isLearned:(recipe:WowRecipe)=>boolean;
  inventory:(name:string)=>number|null;
  yieldPerCraft?:(recipe:WowRecipe)=>number;
  expandLearned?:boolean;
};
const norm=(name:string)=>name.trim().toLowerCase();
const positiveWhole=(number:number,fallback=1)=>Number.isFinite(number)&&number>=1?Math.min(999,Math.floor(number)):fallback;

export function planCraftChain({recipe,batch,recipes,isLearned,inventory,yieldPerCraft,expandLearned=true}:Inputs):CraftChainPlan{
  const requirements=new Map<string,PlanRequirement>();
  const steps=new Map<string,PlanCraftStep>();
  const remainingStock=new Map<string,number>();
  const leftFromConversions=new Map<string,number>();
  const warnings=new Set<string>();
  const candidates=new Map<string,WowRecipe[]>();
  for(const item of recipes){
    if(!item.reagents.length||!isLearned(item)||item.id===recipe.id)continue;
    const key=norm(item.name);
    if(!candidates.has(key))candidates.set(key,[]);
    candidates.get(key)!.push(item);
  }
  // Prefer a simpler documented formula instead of making one item from
  // an exotic multi-reagent recipe when several learned formulas exist.
  for(const items of candidates.values())
    items.sort((a,b)=>a.reagents.length-b.reagents.length||
      a.reagents.reduce((n,r)=>n+r.quantity,0)-b.reagents.reduce((n,r)=>n+r.quantity,0));

  function demand(name:string,quantity:number,stack:readonly string[],depth:number):void{
    const id=norm(name);
    if(depth>7){
      warnings.add("Nested crafting for "+name+" is deeper than 7 steps. Check the recipe manually.");
      return;
    }
    const amount=Math.max(0,Math.floor(quantity));
    if(!amount)return;
    let row=requirements.get(id);
    if(!row){
      const rawStock=inventory(name);
      const stock=typeof rawStock==="number"&&Number.isFinite(rawStock)&&rawStock>=0?Math.floor(rawStock):null;
      row={name,required:0,stock,stockUsed:0,unknown:stock===null,rawShortage:0,crafted:0};
      requirements.set(id,row);
      if(stock!==null)remainingStock.set(id,Math.max(0,Math.floor(stock)));
    }
    row.required+=amount;
    if(row.unknown) return;

    const available=remainingStock.get(id)??0;
    const used=Math.min(amount,available);
    remainingStock.set(id,available-used);
    row.stockUsed+=used;
    let toFill=amount-used;
    if(!toFill)return;

    const producedAvailable=leftFromConversions.get(id)??0;
    if(producedAvailable){
      const usedProduced=Math.min(toFill,producedAvailable);
      toFill-=usedProduced;
      leftFromConversions.set(id,producedAvailable-usedProduced);
      row.crafted+=usedProduced;
    }
    if(!toFill)return;

    const producer=expandLearned
      ?(candidates.get(id)??[]).find(item=>!stack.includes(item.id)&&!item.reagents.some(m=>norm(m.name)===id))
      :undefined;
    if(!producer){
      row.rawShortage+=toFill;
      return;
    }
    const yieldCount=positiveWhole(yieldPerCraft?.(producer)??1);
    const casts=Math.ceil(toFill/yieldCount);
    const extra=casts*yieldCount-toFill;
    if(extra)leftFromConversions.set(id,(leftFromConversions.get(id)??0)+extra);
    row.crafted+=toFill;
    const current=steps.get(producer.id);
    if(current)current.casts+=casts;
    else steps.set(producer.id,{recipe:producer,casts,outputPerCast:yieldCount,
      outputUsed:toFill,inputNames:producer.reagents.map(x=>x.name)});
    if(current)current.outputUsed+=toFill;
    for(const reagent of producer.reagents)
      demand(reagent.name,reagent.quantity*casts,[...stack,producer.id],depth+1);
  }

  const casts=positiveWhole(batch);
  for(const reagent of recipe.reagents)
    demand(reagent.name,reagent.quantity*casts,[recipe.id],0);

  const rows=[...requirements.values()];
  return {
    requirements:rows,
    steps:[...steps.values()].reverse(),
    unknown:rows.filter(row=>row.unknown),
    toAcquire:rows.filter(row=>row.rawShortage>0),
    ready:!rows.some(row=>row.unknown||row.rawShortage>0),
    warnings:[...warnings]
  };
}
