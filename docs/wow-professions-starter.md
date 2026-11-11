# WoW Forever Profession Planner — expanded recipe catalog

Additive Professions tab inside existing Games → WoW Forever guide. Real-estate tools and other games unchanged.

## Included
- 669 recipes from a single WoW Forever game-client snapshot: 512 Leatherworking, 125 Cooking, 32 First Aid. Skinning has its own skill tracker.
- Each recipe includes stable spell ID, skill thresholds (yellow, green, gray), ingredients and source type. Pattern learning skill is present when known; trainer unlock skill may be unknown.
- Existing nine starter learned-pattern checkbox IDs are preserved.
- Search by recipe, material, vendor, or zone; show 35 recipes at once with Show More.
- Both continents are eligible by default. Optional Prefer Kalimdor is sorting-only; known-source filters can show Eastern Kingdoms or Kalimdor.
- Eastern Kingdoms source locations include Arathi Highlands, Hillsbrad, Undercity, Tirisfal, and Stranglethorn. These vendor coordinates come from Classic-baseline references, not confirmed current Forever stock.
- Known usable source locations have copyable TomTom waypoints.
- Saved profession levels, gold, learned recipe checkboxes and goal/location preference reuse the game-progress Netlify Blob flow.

## Provenance and limitations
- Client recipe data sourced from ChristianPresley/wow-forever: https://github.com/ChristianPresley/wow-forever/tree/main/tools/professions/recipes
- Snapshot build: 1.60.1.70862 (November 2026). Recipe colors and availability can change after patches.
- Vendor reference sources: https://forever.undrwrldcub.com/professions/leatherworking/ ; https://forever.undrwrldcub.com/professions/cooking/ ; https://forever.undrwrldcub.com/professions/first-aid/
- Most vendor coordinates are Classic reference positions; no guarantee of current stock or same spawn in Forever.
- The client can include recipes whose pattern is unobtainable. Trainer unlock skill may be absent: store null rather than assume minimum training requirement.
- Yellow and gray thresholds derive from the client dataset; green ranges may be interpolated by the community and must be treated as estimates. Do not claim the current in-game color is guaranteed after a patch.
- These 669 recipes are a comprehensive snapshot from the chosen source, NOT a verified complete live game database of every new patch, acquisition source, NPC, or farming route.
- This is an unofficial, personal fan project. Blizzard owns the game data.
- No real-time Auction House feeds, auto-imported game character skills, crafting profit guarantees, or material stock sync.

## Manual acceptance checks before merging
1. Next.js build passes and preview deploy reports ready.
2. WoW Forever Professions opens, old Hunter tabs still work.
3. Counts are 512 Leatherworking, 125 Cooking, and 32 First Aid (669).
4. Default location selector is Both continents on a new profile.
5. Leatherworking 152: Barbaric Leggings and Raptor Hide patterns orange; skill 160: Raptor patterns not orange; skill 165: Barbaric Leggings not orange.
6. Existing nine starter pattern checkboxes remain learned when previously checked.
7. Search for Roast Raptor or Keena; source card shows Eastern Kingdoms / Arathi and Classic-reference caveat.
8. Filter Eastern Kingdoms: known Horde/neutral locations appear; recipes with unknown source stay discoverable on All recipes.
9. Skinning has no crafting recipes; save and refresh retain its skill.
10. Mark one pattern learned; confirm an orange craft; skill increases by 1 and remains after refresh.
11. Unlearned pattern does not enable the +1 craft button.
12. Existing WoW quest checkmarks and Stardew/Terraria/Dreamlight trackers remain intact.
13. Unknown trainer learning skill is marked unknown, not invented.
14. No live AH prices or guaranteed vendor stock claims.

## Next improvements
- Build-diffed recipe catalog refreshes that preserve saved learned patterns.
- More confirmed vendor coordinates and reputation/stock/price metadata.
- User-entered Auctionator pricing, materials inventory, and cost-per-skill-point planning.
