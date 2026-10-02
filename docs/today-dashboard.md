# Today page (`/today`)

A simplified, read-only daily planner styled like a paper planner page (cream background, binder holes, side tabs, pastel color coding). It shows:

1. **Current focus**: a large card above the schedule for the block happening now, with time left, a progress bar, the next instruction and the link. Between blocks it says you are free and shows what is up next. Overlapping blocks each get a card. Done blocks are skipped.
2. **Schedule**: the time-blocked rows of the "TODAY, Full Schedule" view with hour labels down the side. Colors are by Calendar Role: Time Block (blue), Maintenance (green), Appointment (peach), Deadline (rose), anything else (lavender). The current block is outlined with a NOW tag; the page does not scroll by itself. Done blocks stay visible, crossed out and faded.
3. **Other important priorities**: open tasks (Do Next or In progress) not already on the schedule or in Important Tasks. Default is the top four "Must Happen" tasks in Notion's priority order. Add, remove and reorder through Edit (saved on this device only).
4. **Habits and self-care**: today's Maintenance items from the schedule (the daily occurrences of the habits in Notion), with a done count.
5. **Important Tasks**: the NOW view rows plus any scheduled item with no set time. Collapsed by default. They never appear on the schedule.

The side tabs jump to each section. On a wide screen the schedule is on the left and the lists are on the right.

Notion stays the only database. This page does not write to Notion and adds no storage of its own.

## How it reads Notion

- Schedule and Important Tasks are read by asking Notion for the rows of two saved views. Those views already hold the rules for what counts as "today" (they filter on formulas such as Execution Day), so the rules are not copied into this code. If the views change in Notion, the page follows.
- Notion returns only row ids for a view, so each row is then fetched once for its details. That is about ten small requests per page load.
- Open tasks come from one query on the Tasks data source.
- Code: `lib/today.ts` (Notion reads), `app/today/page.tsx` (server page), `app/today/TodayPlanner.tsx` (the screen), `app/today/today.css` (scoped styles, no effect on other pages).
- Uses Notion API version `2026-03-11` for this page only. Other routes keep their own version.

## Setup (once)

1. In Notion go to notion.so/my-integrations and create a new internal integration named "Today (read only)". Give it **Read content** only. Do not give it insert or update.
2. Open the **Tasks** database in Notion, choose ••• → **Connections**, and add that integration.
3. Open the **Today** page, choose ••• → **Connections**, and add the same integration. The Schedule and NOW views live on that page, so the integration needs it.
4. In Netlify, Site settings → Environment variables, add `NOTION_TODAY_API_KEY` with the integration secret. Redeploy.

Optional environment variables (the defaults are Rachelle's current Notion ids):

| Variable | Purpose |
|---|---|
| `NOTION_TODAY_API_KEY` | Secret for the read-only integration above. Falls back to `NOTION_API_KEY` if unset, which is not recommended because that key can edit records. |
| `NOTION_TASKS_DATA_SOURCE_ID` | Tasks data source. Default `8a5f408a-fdce-83e0-a000-87da31fdc6cf`. |
| `NOTION_TODAY_SCHEDULE_VIEW_ID` | Schedule view. Default `3d5f408a-fdce-815c-8533-000c40cb6885`. |
| `NOTION_TODAY_NOW_VIEW_ID` | NOW view. Default `3d5f408a-fdce-81a1-90b1-000c18b2ce11`. |
| `NOTION_API_BASE` | Testing only. Points the page at a fake Notion server. |

## What shows if something is wrong

The page shows a plain message instead of failing silently:

- No key set: names the missing variable.
- Notion rejects the key: says the key is wrong or expired.
- Notion cannot find the Schedule or NOW view: tells you to add the integration under Connections on the Tasks database and the Today page.
- Notion takes longer than 8 seconds: says it took too long.
- The open-tasks query fails but the views work: the page still loads and shows a one-line warning.

## Known limits

- **Priorities edits are saved in the browser on that device only.** They do not update Notion. A typed-in priority exists only on this page. Making Add and Remove change Notion needs a way to mark a task as a current focus in the Tasks database (for example a checkbox). That is a change to the Tasks structure and needs explicit approval first.
- The view ids above were taken from the Notion tools, not from the REST API. If Notion answers "not found" for a view after the setup steps, the first thing to check is that the Today page itself was added under Connections.
- Time is shown in Eastern time (`America/New_York`).

## Remove it

Delete `app/today/` and `lib/today.ts`, and remove the "Your day" card in `app/page.tsx`. Nothing else depends on them.
