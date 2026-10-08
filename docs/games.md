# Games checklists

The **Games** tab in the planner (`/games`) holds custom game progression checklists and trackers. Each game gets a chip at
the top of the page.

- **Stardew Mega-Mod**: phase-by-phase checklist (Stardew Valley Expanded, Ridgeside Village, East Scarp, Sword & Sorcery).
- **Community Center**: the 30 standard bundles, sorted by season.

## How it behaves

- On the Stardew page the quest board is the main view. The roadmap stages are folded, and each has a **Copy what's left**
  button that copies its unchecked boxes as text.
- Progress is saved in Netlify Blobs (store name `game-progress`), so every device shows the same boxes.
  Nothing is saved to Notion.
- It is one site-wide store with strong consistency, shared by every deploy, so deploying never resets progress.
  Do **not** pick the store from `process.env.CONTEXT`: Netlify only sets that while building, not while the site runs.
  An earlier version did, which silently used a per-deploy store and lost progress on every deploy.
- Each save merges into what is stored and only goes through if nothing else saved first (a version-tag check).
  If something did, it re-reads and redoes the merge, so two devices or two quick taps never overwrite each other.
- A box that no longer exists (for example after you rename an item) is skipped on save instead of rejecting the save.
- The page checks that the server really confirmed each save, retries on its own after a failure, sends anything
  waiting when you leave the page, and says so if your login has lapsed.
- `LEGACY_DEPLOY_IDS` in `lib/games-store.ts` lists old per-deploy stores whose boxes are copied into the permanent
  store the first time a game is saved after the fix. Deploy stores cannot be listed, so only named deploys recover.
- The page and its save route sit behind the same portal login as every other page.

## Event triggers and finished-day guide (Stardew checklist)

- Under many items there is a short grey line saying how to trigger it: hearts, place, time, weather, and what has to
  happen first. It hides once you tick the box. Add one by putting `how: { "exact item text": "line" }` on the group.
- A collapsed **How events trigger, and what to do with a finished day** card sits under the quest board. It holds the
  event-trigger rules and the safe-to-do-early list (gifting, bed, what to leave alone). The text lives in `guide` on
  the game (`guide.events`, `guide.early`). There is no per-phase "Done early" block any more.
- The lines come from the Stardew Valley wiki, the Ridgeside Village wiki, and the East Scarp wiki (which also covers
  Sword & Sorcery). They avoid spoilers on purpose: no artifact locations, no placement order, no names of later
  Sword & Sorcery characters. Mod versions change, so spot-check a line in game if it does not work.
- Event Lookup is confirmed to cover Stardew Valley Expanded and Ridgeside. Whether it lists East Scarp or Sword &
  Sorcery events is not confirmed.

## Farm & Progression after Community Center completion

- Once every Community Center bundle is complete, the tab automatically changes from a seasonal bundle tracker into a **post–Community Center progression dashboard**.
- The main view becomes: **Next major unlock — Ginger Island**, **Power progression**, **SVE expansion — Lance & the Highlands**, **Post-CC world unlocks**, and **Later unlocks — keep on the radar**.
- The first unchecked milestone across those sections is surfaced as **DO NEXT** at the top, so the tab answers what to work on rather than showing old bundle chores.
- These post-CC milestones reuse the exact Story & Quests checkbox keys wherever possible. Checking Willy's Boat, Volcano Floor 10, Lance/Highlands, Galaxy Sword, Grandpa's Shed, Nexus, etc. in either tab updates the same saved progress.
- Completed milestones collapse under **Completed here** inside each section.
- The old farm/mining foundation tracker is kept under **Earlier farm & mining milestones** and the finished bundles are kept under **Completed Community Center archive**. Neither dominates the active page.
- Completing all bundles also marks the Community Center-complete prerequisite steps in the Ginger Island and SVE post-CC storylines so the guide does not continue telling the player to finish a milestone that is already done.

## Community Center tracker

- Tabs for Spring, Summer, Fall, Winter and **Any season**. Each tab lists the items you can collect in that season,
  with the room and bundle shown on every item. A badge on the tab shows how many items are left to gather there.
- An item that works in several seasons appears under each one, with an "Also in..." line. Ticking it in one place ticks
  it everywhere, because it is one box.
- A bundle shows how many you need ("Any 5 of 9"). Once you have enough, it moves into a folded **Completed bundles**
  section at the bottom of the tab, and its leftover items stop counting toward the tab numbers. Untick an item and
  the bundle comes back out.
- The **NOW** badge marks the season it is in game. Open another season and tap "It is ... in game now" to move it.
  That choice is saved with the rest of the progress.
- **Copy what's left** copies the unchecked items on the open tab, grouped by room and bundle.
- Standard bundles only. Remixed bundles use different items.
- Every item except the Vault payments has a grey line saying where to get it: forage locations and seasons, fish
  location, weather and time, crab pot water type, Mines floors for ores and monster drops, seed prices at Pierre's, and
  the machine, skill level or building that makes it. It is the `note` on the item in `lib/games-data.ts`. The facts come
  from the Stardew Valley wiki (base game, 1.6). A mod can change a spot, so check in game if one does not match.

## How the Stardew page is laid out

- **My Current Objectives** shows each storyline once, as one row: its name, a count (for example 2/4), and the next
  step to do. The rest of that storyline sits behind a "Rest of this storyline" fold. Rows are grouped by what the next
  step needs: do before a window closes, available now, work toward, and waiting on (folded). Finished storylines are
  folded at the bottom. Which group a row lands in comes from the "Current save" date, which you set with the season, day and year pickers.
  **Next day** moves it forward one day (rolling over seasons and years). The date is saved as text like "Spring 10, Year 1".
- The **Long-term roadmap** is one list of nine stages named for what you are doing (Getting started, Mines and farm
  basics, and so on), not for a season or year. A stage's `when` is a readiness cue, never a date. Season or date limits
  go on the one item that needs them, as a `how` line. Community Center items are not part of it: the Community
  Center tab is the guide for those. The roadmap is folded and labelled "not a gate". It repeats nothing that is tracked in the storylines:
  `hidden: [...]` on a roadmap group lists items that stay in the data and in saved progress (so no keys change) but are
  not shown there, and the phase notes how many are hidden. If you add a storyline step that duplicates a roadmap item,
  add that item to `hidden` instead of deleting it.
- Storylines are in `questBoard.storylines` in `lib/games-data.ts`. A step with `legacy` shares its box with the roadmap
  item of that text, so ticking it in either place stays in sync.

## Alternate item acquisition routes

- Material-gated quest and progression steps can declare `requiredItems`. The page then shows a folded **Ways to get required items** section directly under that step.
- Acquisition routes live once in `GAME_ITEM_SOURCES` in `lib/games-data.ts`, so the same item shows the same options everywhere it is required.
- Do not treat the normal crafting/farming route as the only route. When applicable, include useful alternatives such as monster drops, the Traveling Cart, permanent or rotating merchants, forage, fish ponds, treasure/reward sources, transmutation, recycling, and other valid acquisition methods.
- Put the most practical repeatable route first, but keep earlier/luck-based routes visible when they could let the player satisfy a requirement before the usual unlock.
- Keep this section collapsed by default so the progression page stays low-clutter; the player expands it only when they need help sourcing a requirement.
- Mod-specific items should list only sources verified for that mod/version. If a mod item is not sold by the Traveling Cart or a merchant, do not imply that it is.

## Item lookup (search box on the Games page)

- Type an item, fish or crop and it shows where to get it, the season, the time and the weather, with a link to the page.
  It is at the top of both trackers and works the same on each.
- It reads the **Stardew Valley wiki** (base game) live when you press Look up: `GET /api/games/lookup?q=...`, in
  `lib/wiki-lookup.ts`. The route sits behind the portal login. It uses the wiki's own search, then takes the infobox
  (Where, Season, Time, Weather, Seeds, Grows in) and the first lines of the page, with the wiki markup stripped. It does
  not summarize or guess, so every line is the wiki's own words.
- The server only ever fetches `stardewvalleywiki.com`. The mod wikis (Ridgeside, East Scarp, Stardew Valley Expanded) do
  not allow automated reading, so the page shows links that open each wiki's own search instead. Add a new mod wiki link
  in `lookupLinks`.
- Results are cached for a day. If the wiki is down or slow, the page says so and shows the links.
- Mods can change a spot, so treat it as the base game answer.

## Add another game

1. Open `lib/games-data.ts`.
2. Add one object to the `GAMES` list. Copy the Stardew entry for a phase checklist (`kind: "checklist"`), or the
   Community Center entry for a bundle tracker (`kind: "bundles"`).
3. Deploy. The game gets its own chip at the top of `/games` and its own saved progress.

Boxes are matched to saved progress by their text and the phase they sit in. If you rename a box later, that one box
shows as unchecked. Saved progress for a box that no longer exists is ignored, not deleted.

## Files

| File | What it does |
|---|---|
| `lib/games-data.ts` | The checklists, and the keys that identify each box. |
| `lib/games-store.ts` | Reads and saves progress in Netlify Blobs, and checks that a save only touches real boxes. |
| `app/api/games/progress/route.ts` | The save and read route. Same-origin only. |
| `app/(planner)/games/` | The page, the client component, and `games.css`. |
| `app/(planner)/PlannerTabs.tsx` | The `Games` tab entry. |
