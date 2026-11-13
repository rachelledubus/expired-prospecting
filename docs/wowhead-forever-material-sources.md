# WoW Forever material-source enrichment

Reviewed **November 13, 2026**. Data in this project is not a live API integration.

## Inputs and source confidence

1. **Wowhead Forever item page**: direct `/forever/item=ID/slug` links for 47 checked item names/IDs. The item page identifies the item in the Forever database. A name and ID match does **not** certify every displayed loot table as live Forever drop data.
2. **Forever-reported farming leads**: scarce Pristine Leather and Pristine Hide source listings and player reports from the appropriate Wowhead Forever item pages. Some pages show observations from players or a mixture of historical data. The UI explicitly warns about uncertain drop chance and XP.
3. **Older Wowhead community reports**: classic/historical comments on Forever item pages for such materials as Spider's Silk, Small Lustrous Pearl, Iridescent Pearl, Elemental Earth, Deeprock Salt, hides, and cloth. These are not labeled as current Forever-confirmed drops.
4. **Wowhead Forever vendor zones**: Horde-city vendor areas for common thread, spices, salt, dye and water are taken from Forever item pages. The exact NPC, current stock, opening state and route are **not verified**. These are shown as purchase options, not monster farms.
5. **Current portal client recipe snapshot**: where an ingredient is the named output of another recipe (e.g., Cured Medium Hide, Rugged Leather, Heavy Armor Kit), the guide supplies the ingredient formula and a link to the client-derived recipe source, clearly noting when the learn skill is unknown.
6. **Classic-reference material routes** from previous releases remain labeled separately when no Forever evidence exists.

## Example item pages (primary)

- [Pristine Leather, item 249427](https://www.wowhead.com/forever/item=249427/pristine-leather)
- [Pristine Hide, item 249428](https://www.wowhead.com/forever/item=249428/pristine-hide)
- [Moss Agate, item 1206](https://www.wowhead.com/forever/item=1206/moss-agate)
- [Spider's Silk, item 3182](https://www.wowhead.com/forever/item=3182/spiders-silk)
- [Small Lustrous Pearl, item 5498](https://www.wowhead.com/forever/item=5498/small-lustrous-pearl)
- [Iridescent Pearl, item 5500](https://www.wowhead.com/forever/item=5500/iridescent-pearl)
- [Medium Hide, item 4232](https://www.wowhead.com/forever/item=4232/medium-hide)
- [Deeprock Salt, item 8150](https://www.wowhead.com/forever/item=8150/deeprock-salt)
- [Fine Thread, item 2321](https://www.wowhead.com/forever/item=2321/fine-thread)
- [Hot Spices, item 2692](https://www.wowhead.com/forever/item=2692/hot-spices)
- [Coarse Thread, item 2320](https://www.wowhead.com/forever/item=2320/coarse-thread)
- [Raptor Egg, item 3685](https://www.wowhead.com/forever/item=3685/raptor-egg)
- [Wool Cloth, item 2592](https://www.wowhead.com/forever/item=2592/wool-cloth)

## What this release does and does not do

- Adds actionable source categories (buy, craft, farm, dungeon, Mining) instead of assuming every ingredient is a mob drop.
- Maintains all existing material links, player inventory data, saved goals, and learned/hidden recipe status.
- Shows a **direct Forever item record** for verified IDs, and a Forever search for all other names.
- Clearly warns when farm data are historical, observed but sparse, or not confirmed on the current server.
- Does not claim to have verified all 286 reagents or to have downloaded the entire Wowhead loot database.
- Does not scrape or fetch Wowhead from the production portal at runtime; this is a dated, source-linked snapshot that can be reviewed.

## Verification before expanding further

Before extending more routes, confirm precise loot sources from the latest Wowhead Forever item pages and in-game player observations, then note when these were last reviewed. Avoid inventing spawn points, drop percentages, materials that require different professions, or gray-XP guarantees.
