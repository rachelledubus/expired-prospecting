# Games checklists

The **Games** tab in the planner (`/games`) holds custom game progression checklists and trackers. Each game gets a chip at
the top of the page.

- **Stardew Mega-Mod**: phase-by-phase checklist (Stardew Valley Expanded, Ridgeside Village, East Scarp, Sword & Sorcery).
- **Community Center**: the 30 standard bundles, sorted by season.

## How it behaves

- Only the first phase with unchecked boxes is open. When it is finished, the next phase opens and the finished one collapses.
- Each phase has a **Copy what's left** button that copies its unchecked boxes as text.
- Progress is saved in Netlify Blobs (store name `game-progress`), so every device shows the same boxes.
  Changes are merged on save, so two devices do not overwrite each other. Nothing is saved to Notion.
- The page and its save route sit behind the same portal login as every other page.

## Community Center tracker

- Tabs for Spring, Summer, Fall, Winter and **Any season**. Each tab lists the items you can collect in that season,
  with the room and bundle shown on every item. A badge on the tab shows how many items are left to gather there.
- An item that works in several seasons appears under each one, with an "Also in..." line. Ticking it in one place ticks
  it everywhere, because it is one box.
- A bundle shows how many you need ("Any 5 of 9"). Once you have enough, it shows Complete and collapses, and its
  leftover items stop counting toward the tab numbers.
- The **NOW** badge marks the season it is in game. Open another season and tap "It is ... in game now" to move it.
  That choice is saved with the rest of the progress.
- **Copy what's left** copies the unchecked items on the open tab, grouped by room and bundle.
- Standard bundles only. Remixed bundles use different items.

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
