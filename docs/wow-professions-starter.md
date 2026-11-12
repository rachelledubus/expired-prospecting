# WoW Forever Profession Planner — expanded recipe catalog

Additive Professions tab inside existing Games → WoW Forever guide. Real-estate tools and other games unchanged.

## Included
- 669 recipes from a single WoW Forever game-client snapshot: 512 Leatherworking, 125 Cooking, 32 First Aid. Skinning has its own skill tracker.
- Each recipe includes stable spell ID, skill thresholds (yellow, green, gray), ingredients and source type. Pattern learning skill is present when known; trainer unlock skill may be unknown.
- Existing nine starter learned-pattern checkbox IDs are preserved.
- Every recipe has its own saved Hide/Restore status, **independent of Learned**.
- Hidden recipes are removed from the normal recipe finder and the Next Craft recommendation immediately, even when skill levels change.
- The recipe finder has a Hidden recipes (N) view. It includes hidden recipes regardless of their color, with search and one-tap Restore. Switching professions shows only that profession's hidden recipes.
- Hidden recipe state is registered with knownCheckKeys and saved under stable recipe IDs through the existing Netlify game-progress API.
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
15. In Leatherworking, hide the currently recommended orange recipe: it immediately disappears and the next recommendation recalculates.
16. Hidden recipe remains hidden after skill changes, refresh, and switching devices; marking it Learned does not automatically unhide it.
17. Open Hidden recipes (N), search for the hidden item, Restore it; it returns to normal recipes without losing its Learned checkbox.
18. Hidden view can display gray recipes even while the normal Include gray setting is off, so nothing becomes permanently inaccessible.
19. Hiding Leatherworking recipes must not hide same-named Cooking or First Aid entries (the unique recipe IDs stay separate).

## Next improvements
- Build-diffed recipe catalog refreshes that preserve saved learned patterns.
- More confirmed vendor coordinates and reputation/stock/price metadata.
- User-entered Auctionator pricing, materials inventory, and cost-per-skill-point planning.

## Mobile layout refresh (November 11–12, 2026)
- On phone widths, the ten Hunter guide tabs use a single swipeable horizontal row; Professions is placed immediately after Play Next, with a visual swipe hint.
- Hunter character settings are collapsible; character level remains directly editable in the compact header.
- Profession skill inputs form a two-column grid with large 44px+ controls.
- Optional profession preferences and gold are under an expandable panel, reducing the scrolling needed to see recommendations.
- Search and continent filters stack at narrow widths, with 16px input text to avoid iOS Safari's automatic field zoom.
- Recipe list shows 12 compact entries per page rather than 35 expanded rows; each recipe keeps Learned and Hide/Restore controls accessible, and details expand only when requested.
- Recipe and location content wraps within the available viewport; vendor TomTom buttons are 44px+ touch targets.
- A media-specific CSS addition is scoped under WoW classes so Stardew, DDV, Terraria, and real-estate pages are not restyled.

### Acceptance checks
1. At 320, 375, and 430px viewport widths, all controls remain inside the horizontal viewport (no full-page sideways scrolling).
2. The WoW tab row scrolls horizontally and the Professions tab is visible near the front.
3. Changing character level, all four profession skills, goal, location preference, learned and hidden checkboxes still persists.
4. Recipe search and continent selector are both easy to tap and do not make iPhone Safari zoom in.
5. Recipe details open and close, and only expanded recipes show materials/vendor paragraphs.
6. Known vendor rows wrap without clipping; Copy TomTom works.
7. The Hidden recipes view shows hidden entries even if gray; Restore brings an entry back.
8. Desktop remains responsive and does not get forced into the small-screen arrangement.
9. Existing saved checkbox keys and backend validation are unchanged by this styling-only work.

## Faction-specific vendor correction
- Vendor lists default to the current character's saved faction plus neutral NPCs. Horde characters never receive copyable TomTom directions for Alliance-only vendors; the reverse holds for Alliance characters.
- Opposing-faction vendors remain optional **reference-only** information in a collapsed section, clearly marked not purchasable and without copyable waypoints.
- If the only documented vendor records are for the opposite faction, the recipe card says so instead of presenting the location as an accessible source.
- Unlearned recipes with only opposing-faction vendor records are excluded from the Next Craft recommendation. Learned recipes remain eligible because the player already knows how to craft them.
- Recipes with no verified faction-specific vendor source remain searchable and are explicitly labeled as unverified; they are not falsely declared impossible to obtain.
- A potentially tradeable recipe may be found on the Auction House, but this is never presented as guaranteed stock.

### Faction regression checks
1. Set Skyborne faction to Horde. Search the Green Leather Armor recipe (Hillsbrad): show George Candarte (Horde), not Wenna Silkbeard (Alliance) as a main route.
2. Search Raptor Hide Harness as Horde: Tunkk (Hammerfall/Horde) offers a vendor reference and copyable waypoint.
3. Search Raptor Hide Belt as Horde: Alliance vendor Androd Fadran is reference-only; no copyable waypoint and no recommendation to travel to Refuge Pointe.
4. Switch to Alliance and confirm faction-specific vendor display reverses.
5. With no saved vendor metadata, display an unverified-source message rather than a fabricated NPC or a claim of impossible acquisition.
6. Learned pattern remains craft-recommendable even if its only documented vendor is the opposing faction.
7. Existing hidden/learned flags, continent filters, and saved character settings remain unchanged.
