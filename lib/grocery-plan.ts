export type GroceryUnit = "each" | "oz" | "fl oz" | "cup" | "lb";
export type GroceryCategory = "Produce" | "Meat & protein" | "Dairy & refrigerated" | "Bakery" | "Pantry" | "Frozen" | "Other";
export type RecipeIngredient = { name: string; quantity: number; unit: GroceryUnit; category: GroceryCategory };
export type GroceryFood = { id: string; name: string; servings: number; ingredients: RecipeIngredient[] };
export type GroceryStock = { onHand: number; packSize: number; packPrice: number | null; checked: boolean };
export type GroceryPlan = { version: 1; foods: GroceryFood[]; stock: Record<string, GroceryStock> };

export const UNITS: GroceryUnit[] = ["each", "oz", "fl oz", "cup", "lb"];
export const CATEGORIES: GroceryCategory[] = ["Produce", "Meat & protein", "Dairy & refrigerated", "Bakery", "Pantry", "Frozen", "Other"];

export const ingredientKey = (name: string, unit: GroceryUnit) =>
  name.trim().toLowerCase().replace(/\\s+/g, " ") + "::" + unit;

const ingredient = (name: string, quantity: number, unit: GroceryUnit, category: GroceryCategory): RecipeIngredient =>
  ({ name, quantity, unit, category });

export function starterPlan(): GroceryPlan {
  const foods: GroceryFood[] = [
    { id: "smoothie", name: "Strawberry-banana smoothie", servings: 0, ingredients: [
      ingredient("Kefir", 6, "fl oz", "Dairy & refrigerated"),
      ingredient("Greek yogurt", 4, "oz", "Dairy & refrigerated"),
      ingredient("Strawberries", 4, "oz", "Produce"),
      ingredient("Bananas", 1, "each", "Produce"),
    ] },
    { id: "turkey-crackers", name: "Turkey, cheese & crackers", servings: 0, ingredients: [
      ingredient("Deli turkey", 3, "oz", "Meat & protein"),
      ingredient("Gouda cheese", 1.5, "oz", "Dairy & refrigerated"),
      ingredient("Ritz crackers", 8, "each", "Pantry"),
    ] },
    { id: "steak", name: "Steak", servings: 0, ingredients: [ingredient("Steak", 6, "oz", "Meat & protein")] },
    { id: "mac", name: "Mac & cheese cup with cottage cheese", servings: 0, ingredients: [
      ingredient("Mac & cheese cup", 1, "each", "Pantry"),
      ingredient("Cottage cheese", 2, "oz", "Dairy & refrigerated"),
    ] },
    { id: "pulled-pork", name: "Pulled pork sliders", servings: 0, ingredients: [
      ingredient("Pulled pork", 3, "oz", "Meat & protein"),
      ingredient("Slider buns", 2, "each", "Bakery"),
    ] },
    { id: "pancakes", name: "Pancakes", servings: 0, ingredients: [
      ingredient("Pancake mix", 3, "oz", "Pantry"),
      ingredient("Butter", 0.5, "oz", "Dairy & refrigerated"),
      ingredient("Maple syrup", 1.5, "fl oz", "Pantry"),
    ] },
    { id: "broccoli", name: "Broccoli side", servings: 0, ingredients: [
      ingredient("Broccoli", 4, "oz", "Produce"),
      ingredient("Balsamic glaze", 0.5, "fl oz", "Pantry"),
    ] },
    { id: "fruit", name: "Mandarin snack", servings: 0, ingredients: [ingredient("Mandarins", 2, "each", "Produce")] },
  ];
  const stock: Record<string, GroceryStock> = {};
  const sizes: Record<string, number> = {
    "Kefir": 32, "Greek yogurt": 32, "Strawberries": 16, "Bananas": 1,
    "Deli turkey": 8, "Gouda cheese": 8, "Ritz crackers": 32, "Steak": 16,
    "Mac & cheese cup": 1, "Cottage cheese": 16, "Pulled pork": 16,
    "Slider buns": 8, "Pancake mix": 16, "Butter": 16, "Maple syrup": 12,
    "Broccoli": 12, "Balsamic glaze": 8, "Mandarins": 1,
  };
  for (const food of foods) for (const item of food.ingredients) {
    const key = ingredientKey(item.name, item.unit);
    stock[key] = { onHand: 0, packSize: sizes[item.name] ?? 1, packPrice: null, checked: false };
  }
  return { version: 1, foods, stock };
}

export type ShoppingItem = {
  key: string; name: string; unit: GroceryUnit; category: GroceryCategory;
  need: number; onHand: number; missing: number; packSize: number; packs: number;
  purchaseQuantity: number; remaining: number; packPrice: number | null; estimatedCost: number | null; checked: boolean;
};
const round = (n: number) => Math.round(n * 100) / 100;

export function shoppingItems(plan: GroceryPlan): ShoppingItem[] {
  const grouped = new Map<string, { name: string; unit: GroceryUnit; category: GroceryCategory; need: number }>();
  for (const food of plan.foods) {
    if (food.servings <= 0) continue;
    for (const item of food.ingredients) {
      if (!item.name.trim() || item.quantity <= 0) continue;
      const key = ingredientKey(item.name, item.unit);
      const found = grouped.get(key);
      if (found) found.need += item.quantity * food.servings;
      else grouped.set(key, { name: item.name.trim(), unit: item.unit, category: item.category, need: item.quantity * food.servings });
    }
  }
  return Array.from(grouped.entries()).map(([key, item]) => {
    const stock = plan.stock[key];
    const onHand = Math.max(0, stock?.onHand ?? 0);
    const packSize = stock?.packSize && stock.packSize > 0 ? stock.packSize : 1;
    const missing = Math.max(0, item.need - onHand);
    const packs = Math.ceil((missing - 0.0000001) / packSize);
    const purchaseQuantity = packs * packSize;
    const packPrice = stock?.packPrice ?? null;
    return { key, name: item.name, unit: item.unit, category: item.category,
      need: round(item.need), onHand, missing: round(missing), packSize, packs,
      purchaseQuantity: round(purchaseQuantity), remaining: round(onHand + purchaseQuantity - item.need),
      packPrice, estimatedCost: packPrice === null ? null : round(packs * packPrice),
      checked: Boolean(stock?.checked),
    };
  }).sort((a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) || a.name.localeCompare(b.name));
}

const numberOk = (n: unknown, max: number, allowZero = true) =>
  typeof n === "number" && Number.isFinite(n) && n >= (allowZero ? 0 : 0.01) && n <= max;

export function validateGroceryPlan(value: unknown): GroceryPlan | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const plan = value as Partial<GroceryPlan>;
  if (plan.version !== 1 || !Array.isArray(plan.foods) || plan.foods.length > 60 ||
      !plan.stock || typeof plan.stock !== "object" || Array.isArray(plan.stock)) return null;
  const ids = new Set<string>();
  const foods: GroceryFood[] = [];
  for (const food of plan.foods) {
    if (!food || typeof food.id !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(food.id) || ids.has(food.id) ||
      typeof food.name !== "string" || food.name.trim().length < 1 || food.name.length > 100 ||
      !Number.isInteger(food.servings) || food.servings < 0 || food.servings > 100 ||
      !Array.isArray(food.ingredients) || food.ingredients.length > 25) return null;
    ids.add(food.id);
    const ingredients: RecipeIngredient[] = [];
    for (const item of food.ingredients) {
      if (!item || typeof item.name !== "string" || item.name.trim().length < 1 || item.name.length > 100 ||
        !numberOk(item.quantity, 100000, false) || !UNITS.includes(item.unit) ||
        !CATEGORIES.includes(item.category)) return null;
      ingredients.push({ name: item.name.trim(), quantity: item.quantity, unit: item.unit, category: item.category });
    }
    foods.push({ id: food.id, name: food.name.trim(), servings: food.servings, ingredients });
  }
  const stock: Record<string, GroceryStock> = {};
  if (Object.keys(plan.stock).length > 1500) return null;
  for (const [key, entry] of Object.entries(plan.stock)) {
    if (key.length > 140 || !entry || !numberOk(entry.onHand, 100000) ||
      !numberOk(entry.packSize, 100000, false) ||
      (entry.packPrice !== null && !numberOk(entry.packPrice, 100000)) ||
      typeof entry.checked !== "boolean") return null;
    stock[key] = { onHand: entry.onHand, packSize: entry.packSize, packPrice: entry.packPrice, checked: entry.checked };
  }
  return { version: 1, foods, stock };
}
