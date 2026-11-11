# WoW Forever Profession Planner — starter release

Scope: additive tab inside the existing WoW Forever Games view. No changes to the real-estate tools or other games.

## What works now
- Four editable skill values (Leatherworking, Skinning, Cooking, First Aid).
- Last-reported starting defaults: 152, 222, 104, 87. These are placeholders until edited; not a live game connection.
- Gold-on-hand and preferred continent/goal saved using existing game fields.
- Source-linked recipe starter catalog with Forever yellow/green/gray thresholds.
- Recipe colors recalculate when a saved skill changes.
- Saved "Pattern learned" checkboxes.
- Manual confirmation of a guaranteed orange craft advances the corresponding saved skill by one point.
- Copy TomTom command for verified Kalimdor vendor coordinates.
- The existing game-progress Netlify Blob record is reused, with keys explicitly registered in lib/games-data.ts.

## Deliberately NOT implemented
- Automated WoW client skill or bag scanning.
- Automatic game patch/recipe catalog updates.
- Real-time Auction House prices, vendor-sale profit, or optimized cost-per-point rankings.
- Exhaustive 1–300 recipe coverage.
- Inventory deductions or crafting cost tracking.
- A claim that a pattern is stocked at its cited vendor.

## Recipe data quality
The curated seed lives in lib/wow-forever-professions.ts. Every entry has a sourceUrl. When updating data:
1. Verify recipe minimum, yellow and gray thresholds using WoW Forever client data (not regular Classic data).
2. If green threshold cannot be established, use null rather than inventing a color.
3. Verify materials and the acquisition source independently. Region-specific vendor inventory is less certain than client recipe data.
4. Add a stable ID, then register the learned-recipe key using WOW_RECIPES in knownCheckKeys.
5. Do not change an existing ID, or the saved "learned" checkbox will appear reset.
6. Do not imply current Auction House profitability without a price, fee, and sale-likelihood model.

## Manual acceptance checks before merge
- /games → WoW Forever → Professions opens, existing Hunter tabs still function.
- Leatherworking 152: Barbaric Leggings / Guardian Belt orange, Raptor Hide Belt / Harness orange; +1 records one skill point when pattern learned.
- Leatherworking 160: Raptor items become yellow, Barbaric Leggings stays orange.
- Leatherworking 165: Barbaric Leggings becomes yellow and its guaranteed button is no longer offered.
- Cooking 104: Crispy Lizard Tail orange; Strider Stew hidden by default because gray at 130 only (at 104 it is green).
- First Aid 87: Wool Bandage orange. Skinning has no crafting recipes.
- Learned checkbox and skill fields persist after a refresh and a second-device read.
- Existing WoW quest checkmarks and the Stardew/Terraria/Dreamlight trackers remain intact.
- No recipe is shown as "guaranteed" once its yellow threshold is reached.
- An unavailable or unverified source is never presented as a guaranteed current vendor stock.
