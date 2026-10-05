# Games checklists

The **Games** tab in the planner (`/games`) holds custom game progression checklists. The first one is the
Stardew Mega-Mod checklist (Stardew Valley Expanded, Ridgeside Village, East Scarp, Sword & Sorcery).

## How it behaves

- Only the first phase with unchecked boxes is open. When it is finished, the next phase opens and the finished one collapses.
- Each phase has a **Copy what's left** button that copies its unchecked boxes as text.
- Progress is saved in Netlify Blobs (store name `game-progress`), so every device shows the same boxes.
  Changes are merged on save, so two devices do not overwrite each other. Nothing is saved to Notion.
- The page and its save route sit behind the same portal login as every other page.

## Add another game

1. Open `lib/games-data.ts`.
2. Add one object to the `GAMES` list, copying the shape of the Stardew entry.
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
