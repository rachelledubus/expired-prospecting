import GroceryPlanner from "./GroceryPlanner";
import "./groceries.css";

export const metadata = {
  title: "Weekly Groceries",
  description: "Plan weekly servings, pantry quantities, and the packages to buy",
};

export default function GroceriesPage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;600;700&family=Source+Sans+3:wght@400;600&display=swap" />
      <GroceryPlanner />
    </>
  );
}
