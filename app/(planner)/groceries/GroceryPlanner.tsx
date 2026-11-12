"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CATEGORIES, UNITS, ingredientKey, shoppingItems, starterPlan, validateGroceryPlan,
  type GroceryCategory, type GroceryFood, type GroceryPlan, type GroceryStock, type GroceryUnit,
  type RecipeIngredient,
} from "@/lib/grocery-plan";

const displayNumber = (value: number) => Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
const money = (value: number) => "$" + value.toFixed(2);
const defaultStock: GroceryStock = { onHand: 0, packSize: 1, packPrice: null, checked: false };
const newId = () => "food-" + Math.random().toString(36).slice(2, 12) + "-" + Date.now().toString(36);

export default function GroceryPlanner() {
  const [plan, setPlan] = useState<GroceryPlan>(starterPlan);
  const [etag, setEtag] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [openFood, setOpenFood] = useState<string | null>(null);
  const revision = useRef(0);

  useEffect(() => {
    let active = true;
    fetch("/api/groceries", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.ok || !validateGroceryPlan(data.plan)) throw new Error(data.message || "Could not open your saved plan.");
        if (active) { setPlan(data.plan); setEtag(data.etag ?? null); setLoaded(true); }
      })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Could not open your saved plan."); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function change(updater: (current: GroceryPlan) => GroceryPlan) {
    revision.current += 1;
    setPlan(updater);
    setDirty(true);
    setMessage("");
    setError("");
  }
  function editFood(id: string, patch: Partial<GroceryFood>) {
    change((current) => ({ ...current, foods: current.foods.map((food) => food.id === id ? { ...food, ...patch } : food) }));
  }
  function editIngredient(foodId: string, index: number, patch: Partial<RecipeIngredient>) {
    change((current) => ({
      ...current, foods: current.foods.map((food) => food.id !== foodId ? food : ({
        ...food, ingredients: food.ingredients.map((item, i) => i === index ? { ...item, ...patch } : item),
      })),
    }));
  }
  function addIngredient(foodId: string) {
    change((current) => ({
      ...current, foods: current.foods.map((food) => food.id !== foodId ? food : ({
        ...food, ingredients: [...food.ingredients, { name: "New ingredient", quantity: 1, unit: "each" as GroceryUnit, category: "Other" as GroceryCategory }],
      })),
    }));
  }
  function removeIngredient(foodId: string, index: number) {
    change((current) => ({
      ...current, foods: current.foods.map((food) => food.id !== foodId ? food : ({
        ...food, ingredients: food.ingredients.filter((_, i) => i !== index),
      })),
    }));
  }
  function addFood() {
    const id = newId();
    change((current) => ({ ...current, foods: [...current.foods, { id, name: "New food", servings: 0, ingredients: [] }] }));
    setOpenFood(id);
  }
  function removeFood(food: GroceryFood) {
    if (!window.confirm("Remove " + food.name + " from your food library?")) return;
    change((current) => ({ ...current, foods: current.foods.filter((item) => item.id !== food.id) }));
    if (openFood === food.id) setOpenFood(null);
  }
  function editStock(key: string, patch: Partial<GroceryStock>) {
    change((current) => ({
      ...current,
      stock: { ...current.stock, [key]: { ...defaultStock, ...(current.stock[key] || {}), ...patch } },
    }));
  }
  function clearChecks() {
    change((current) => ({
      ...current, stock: Object.fromEntries(Object.entries(current.stock).map(([key, value]) => [key, { ...value, checked: false }])),
    }));
  }
  function resetStarterFoods() {
    if (!window.confirm("Replace your food library with the starter examples? Pantry amounts and package prices will also reset.")) return;
    change(() => starterPlan());
    setOpenFood(null);
  }
  async function save() {
    if (!dirty || saving) return;
    if (!validateGroceryPlan(plan)) {
      setError("Please give every food and ingredient a name, and use positive ingredient amounts and package sizes.");
      return;
    }
    setSaving(true); setError(""); setMessage("");
    const startedAt = revision.current;
    try {
      const response = await fetch("/api/groceries", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, etag }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "Could not save the grocery plan.");
      setEtag(data.etag ?? null);
      if (revision.current === startedAt) { setDirty(false); setMessage("Saved across your portal devices."); }
      else setMessage("Latest changes are still unsaved. Save again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your changes.");
    } finally { setSaving(false); }
  }
  const items = useMemo(() => shoppingItems(plan), [plan]);
  const needed = items.filter((item) => item.packs > 0);
  const covered = items.filter((item) => item.packs === 0);
  const pricedTotal = needed.reduce((sum, item) => sum + (item.estimatedCost ?? 0), 0);
  const unpriced = needed.filter((item) => item.packPrice === null).length;
  const checked = needed.filter((item) => item.checked).length;
  const servings = plan.foods.reduce((sum, food) => sum + food.servings, 0);
  const havePlans = servings > 0;

  async function copyList() {
    const groups = CATEGORIES.map((category) => {
      const lines = needed.filter((item) => item.category === category && !item.checked);
      return lines.length ? category + "\n" + lines.map((item) =>
        "- " + item.name + ": " + item.packs + " × " + displayNumber(item.packSize) + " " + item.unit +
        " (need " + displayNumber(item.missing) + " " + item.unit + ")").join("\n") : "";
    }).filter(Boolean);
    const text = groups.length ? "WEEKLY GROCERIES\n\n" + groups.join("\n\n") : "Nothing left to buy.";
    try { await navigator.clipboard.writeText(text); setMessage("Shopping list copied."); setError(""); }
    catch { setError("Clipboard was unavailable. Try copying the items directly."); }
  }

  return (
    <main className="shell gutter gp-shell">
      <div className="paper gp-paper">
        <div className="gp-inner">
          <div className="gp-heading">
            <div>
              <p className="gp-eyebrow">Home · food planning</p>
              <h1>Weekly groceries</h1>
              <p>Plan how many times you will eat each food, then see exactly what to buy for the next 7 days.</p>
            </div>
            <div className="gp-savebox">
              <button className="gp-primary" type="button" disabled={!loaded || !dirty || saving} onClick={() => void save()}>
                {saving ? "Saving…" : dirty ? "Save plan" : "Saved"}
              </button>
              <span role="status">{dirty ? "Unsaved changes" : loaded ? "Up to date" : "Loading…"}</span>
            </div>
          </div>

          {error && <p className="gp-alert" role="alert">{error} {!loaded && <button type="button" className="gp-linkbutton" onClick={() => window.location.reload()}>Retry</button>}</p>}
          {message && <p className="gp-success" role="status">{message}</p>}
          {!loaded ? <p className="gp-loading">Opening your saved grocery planner…</p> : (
            <>
              <div className="gp-stats" aria-label="Weekly overview">
                <div><strong>{servings}</strong><span>planned servings</span></div>
                <div><strong>{needed.length}</strong><span>items to buy</span></div>
                <div><strong>{checked}/{needed.length}</strong><span>items checked off</span></div>
              </div>

              <section aria-labelledby="gp-food-heading" className="gp-section">
                <div className="gp-sectionhead">
                  <div><span className="gp-step">1</span><h2 id="gp-food-heading">How much will you eat?</h2></div>
                  <button type="button" className="gp-outline" onClick={addFood}>+ Add food</button>
                </div>
                <p className="gp-help">Enter total servings for everyone over the next 7 days. A serving is one portion or snack, not necessarily a full meal. You can edit any ingredient amount.</p>
                <div className="gp-foods">
                  {plan.foods.map((food) => (
                    <article className="gp-food" key={food.id}>
                      <div className="gp-foodtop">
                        <div className="gp-foodname"><h3>{food.name}</h3><span>{food.ingredients.length} ingredient{food.ingredients.length === 1 ? "" : "s"} per serving</span></div>
                        <div className="gp-counter">
                          <button type="button" aria-label={"One fewer " + food.name} disabled={food.servings === 0} onClick={() => editFood(food.id, { servings: Math.max(0, food.servings - 1) })}>−</button>
                          <label><span className="gp-sr">Servings for {food.name}</span>
                            <input type="number" min="0" max="100" step="1" value={food.servings} onChange={(event) => editFood(food.id, { servings: Math.max(0, Math.min(100, Math.round(Number(event.target.value) || 0))) })} />
                          </label>
                          <button type="button" aria-label={"One more " + food.name} disabled={food.servings >= 100} onClick={() => editFood(food.id, { servings: Math.min(100, food.servings + 1) })}>+</button>
                        </div>
                      </div>
                      <button type="button" className="gp-edit-toggle" aria-expanded={openFood === food.id}
                        onClick={() => setOpenFood(openFood === food.id ? null : food.id)}>
                        {openFood === food.id ? "Close recipe" : "Edit serving ingredients"}
                      </button>
                      {openFood === food.id && (
                        <div className="gp-recipe">
                          <label className="gp-field">Food name
                            <input value={food.name} maxLength={100} onChange={(event) => editFood(food.id, { name: event.target.value })} />
                          </label>
                          <p className="gp-help">Amounts below are for <strong>one serving</strong>. Ingredients with the same name and unit are combined in the shopping list.</p>
                          {food.ingredients.map((item, index) => (
                            <div className="gp-recipe-row" key={index}>
                              <label className="gp-field gp-ingredient-name">Ingredient
                                <input value={item.name} maxLength={100} onChange={(event) => editIngredient(food.id, index, { name: event.target.value })} />
                              </label>
                              <label className="gp-field gp-smallfield">Per serving
                                <input type="number" min=".01" step=".25" value={item.quantity} onChange={(event) => editIngredient(food.id, index, { quantity: Math.max(0, Number(event.target.value) || 0) })} />
                              </label>
                              <label className="gp-field gp-smallfield">Unit
                                <select value={item.unit} onChange={(event) => editIngredient(food.id, index, { unit: event.target.value as GroceryUnit })}>
                                  {UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                                </select>
                              </label>
                              <label className="gp-field gp-categoryfield">Aisle
                                <select value={item.category} onChange={(event) => editIngredient(food.id, index, { category: event.target.value as GroceryCategory })}>
                                  {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                                </select>
                              </label>
                              <button type="button" className="gp-remove" aria-label={"Remove " + item.name} onClick={() => removeIngredient(food.id, index)}>Remove</button>
                            </div>
                          ))}
                          {food.ingredients.length === 0 && <p className="gp-help">Add ingredients to calculate this food's grocery needs.</p>}
                          <div className="gp-recipe-actions">
                            <button type="button" className="gp-outline" onClick={() => addIngredient(food.id)}>+ Ingredient</button>
                            <button type="button" className="gp-delete" onClick={() => removeFood(food)}>Delete this food</button>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
                <button type="button" className="gp-linkbutton gp-reset" onClick={resetStarterFoods}>Restore starter food examples</button>
              </section>

              <section aria-labelledby="gp-shop-heading" className="gp-section">
                <div className="gp-sectionhead">
                  <div><span className="gp-step">2</span><h2 id="gp-shop-heading">What do you need to buy?</h2></div>
                  <button type="button" className="gp-outline" onClick={() => void copyList()} disabled={!havePlans}>Copy list</button>
                </div>
                <p className="gp-help">The planner subtracts what you already have and rounds up to full packages. Package sizes are examples—adjust them to match the items at your store.</p>
                {!havePlans && <div className="gp-empty">Add some servings in Step 1 to generate your shopping quantities.</div>}
                {havePlans && needed.length === 0 && <div className="gp-empty">Everything in this week's plan is already covered by what you have at home.</div>}
                {CATEGORIES.map((category) => {
                  const group = needed.filter((item) => item.category === category);
                  if (group.length === 0) return null;
                  return <div className="gp-group" key={category}>
                    <h3>{category}</h3>
                    {group.map((item) => (
                      <article className={"gp-item" + (item.checked ? " gp-checked" : "")} key={item.key}>
                        <div className="gp-itemhead">
                          <label className="gp-check"><input type="checkbox" checked={item.checked} onChange={(event) => editStock(item.key, { checked: event.target.checked })} /><span>{item.name}</span></label>
                          <strong>{item.packs} {item.packs === 1 ? "package" : "packages"}</strong>
                        </div>
                        <p className="gp-math">Need {displayNumber(item.need)} {item.unit} − have {displayNumber(item.onHand)} = <strong>{displayNumber(item.missing)} {item.unit} short</strong></p>
                        <div className="gp-stockfields">
                          <label>Already have ({item.unit})
                            <input type="number" min="0" step=".25" value={item.onHand} onChange={(event) => editStock(item.key, { onHand: Math.max(0, Number(event.target.value) || 0) })} />
                          </label>
                          <label>Amount per package ({item.unit})
                            <input type="number" min=".01" step=".25" value={item.packSize} onChange={(event) => editStock(item.key, { packSize: Math.max(0.01, Number(event.target.value) || 0.01) })} />
                          </label>
                          <label>Price per package ($)
                            <input type="number" min="0" step=".01" placeholder="Optional" value={item.packPrice ?? ""} onChange={(event) => editStock(item.key, { packPrice: event.target.value === "" ? null : Math.max(0, Number(event.target.value) || 0) })} />
                          </label>
                        </div>
                        <p className="gp-footnote">Buy {displayNumber(item.purchaseQuantity)} {item.unit} total · {displayNumber(item.remaining)} {item.unit} left after this week's servings{item.estimatedCost === null ? "" : " · " + money(item.estimatedCost)}</p>
                      </article>
                    ))}
                  </div>;
                })}
                {covered.length > 0 && <details className="gp-covered">
                  <summary>Already have enough ({covered.length})</summary>
                  {covered.map((item) => <div key={item.key} className="gp-covered-row">
                    <span><strong>{item.name}</strong> · need {displayNumber(item.need)} {item.unit}</span>
                    <label>On hand
                      <input type="number" min="0" step=".25" value={item.onHand} onChange={(event) => editStock(item.key, { onHand: Math.max(0, Number(event.target.value) || 0) })} />
                    </label>
                  </div>)}
                </details>}
                {havePlans && (
                  <div className="gp-total">
                    <div><span>Estimated subtotal</span><strong>{money(pricedTotal)}</strong></div>
                    <p>{unpriced === 0 ? "All needed items have prices entered." : unpriced + " item" + (unpriced === 1 ? " has" : "s have") + " no package price yet."} This is not a total cost estimate until every item has a price.</p>
                    <div className="gp-buttons">
                      <button type="button" className="gp-outline" onClick={() => void copyList()}>Copy unchecked items</button>
                      <button type="button" className="gp-outline" disabled={checked === 0} onClick={clearChecks}>Clear shopping checkmarks</button>
                    </div>
                  </div>
                )}
              </section>
              <footer className="gp-footer">
                <p>Adjust servings as your week changes. Your shopping checkmarks and quantities are saved with the plan, not connected to any grocery store.</p>
                <button className="gp-primary" type="button" disabled={!dirty || saving} onClick={() => void save()}>{saving ? "Saving…" : dirty ? "Save my grocery plan" : "All changes saved"}</button>
              </footer>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
