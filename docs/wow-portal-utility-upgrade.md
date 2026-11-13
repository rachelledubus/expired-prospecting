# WoW Forever portal: complete utility upgrade (November 13, 2026)

This project adds tools to the existing Games → WoW Forever page without changing the other games, real estate pages or existing progress keys.

## Shipped features

- **Play Next modes**: Gold without XP (default), Professions, Hunter gear, and Leveling. The chosen goal persists.
- **Gold farming**: Curated gray-mob dungeon/outdoor routes, mob-level warnings, entrance approaches, optional TomTom copy, and actual manually recorded session gold/minutes for gold/hour comparisons. No fishing; no unsupported automatic XP-lock or AH feed claims.
- **Professions**: Learned recipes remain exclusively managed under Recommended Next. Separate guidance for learn-next, orange skill crafts and profitable learned crafts. A manually priced recipe cost/inventory/batch calculator compares crafting proceeds vs selling materials raw. AH fee is editable; deposit/failed listing costs and multi-yield recipes remain caveats.
- **Recipe acquisition**: Existing 669-client-snapshot recipe database is preserved. 24 additional Merchant’s Favor vendor recipes are mapped (now 50 with at least one acquisition location), including the Horde Pawani camp near Crossroads and Alliance Daniel Stitchsong at Three Corners, with per-source verification text. Selected Cooking/First Aid item acquisition hints are also supplied where published. Unmapped recipes link to community source directories and accept personal acquisition type, exact town/camp and NPC/requirement notes; these appear in the town filter without being misrepresented as independently verified.
- **Combat**: Editable, persistent bindings based on the most recently described Hunter keys, plus personal copyable macros and test cautions; outdated suggested controls removed from the displayed Combat guide.
- **Pets**: A three-slot active/stable roster with family, role, level, Growl, special-ability rank and source notes; utility comparisons and multi-target threat checklist.
- **Dungeon routes**: Grounded map coordinates for selected dungeons with the distinction between outdoor caves and actual instance portals; unmapped entrances are marked unverified.
- **Equipment**: Current per-slot names and manually entered ranged DPS, Agility, Attack Power; compare candidate dungeon targets against equipped values. Does not invent candidate stats or a calculated full DPS score.
- **Search**: Unlearned recipes, dungeon gear, gray-mob farms, pet families and guide objectives in one search panel.
- **Existing saves**: New allowed keys are isolated under `wow-extra` and old recipe/gear/check keys remain stable; higher field lengths are allowed for custom macros/source notes.

## Accuracy and limits

- The no-kill-XP cutoff follows conservative Classic reference rules. WoW Forever's live XP implementation and individual enemy levels must be verified in game. Quests/exploration/group XP can still level the character.
- Dungeon ranges, routes, loot and skinning yields are reference guidance, **not live availability or guaranteed income**.
- The 669 recipes are a dated client snapshot, **not** an authoritative list of currently obtainable recipes. Published recipe catalogs disagree on their counts as the game updates. Acquisition categories are only asserted when sourced, or explicitly labeled personal notes; unverified recipes stay unmapped rather than getting fabricated vendors.
- AH prices and the current equipped tooltip must be entered by the player. No in-game addon integration or real-time game connection is claimed.
- WoW macro scripting can vary by build; test personal macros and focus conditionals carefully before relying on them.

## Manual regression checklist

1. Open WoW Forever, confirm eleven tabs and no navigation overflow on a phone.
2. Change My level from 34 to 35; No XP cutoff and gold route filtering update while the leveling checklists stay checked.
3. Choose Gold, Professions, Gear, and Leveling in Play Next; selection survives refresh.
4. Add a farm's gold and minutes; its gold/hour displays and the inputs remain saved.
5. Save a pet, macro and binding; refresh and confirm they remain.
6. In Professions mark a recipe Learned; it disappears from Finder and remains editable in Recommended Next.
7. Enter material and sale prices; view profit, raw material comparison, batch needs and inventory.
8. Add a personal recipe acquisition town and verify it is filterable; check Alliance-only vendors never produce a Horde purchase waypoint.
9. In Gear enter current tooltip values and candidate values; compare stat differences without claiming a simulated DPS gain.
10. Search recipe name, pet family, farm and dungeon loot; check results link to relevant tabs.
11. In Razorfen/Wailing dungeon info open entrance route; inspect TomTom and the outer-cave distinction.
12. Confirm Stardew, Dreamlight, Terraria, grocery, real estate and original game progress are unchanged.

## Suggested future quality upgrades

- A verified, patch-tracked acquisition-source dataset for every recipe, with per-source confidence/evidence rather than only a client snapshot.
- Authenticated Blizzard game data or addon imports only if a supported API becomes available, with explicit user authorization.
- Periodic community source revalidation before changing a copied waypoint, drop source, or mob-level guidance.
