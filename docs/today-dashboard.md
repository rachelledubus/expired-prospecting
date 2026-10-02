# Today page (`/today`)

A simplified daily planner styled like a paper planner page (cream background, binder holes, side tabs, pastel color coding). It shows:

1. **Current focus**: a large card above the schedule for the block happening now, with time left, a progress bar, the next instruction and the link. Between blocks it says you are free and shows what is up next. Only one block is ever "right now": if blocks overlap, an Appointment wins, then a Deadline, then the one that started most recently, and the others are listed in a small note on the card. Done blocks are skipped.
2. **Schedule**: the time-blocked rows of the "TODAY, Full Schedule" view with hour labels down the side. Colors are by Calendar Role: Time Block (blue), Maintenance (green), Appointment (peach), Deadline (rose), anything else (lavender). The current block is outlined with a NOW tag; the page does not scroll by itself. Done blocks stay visible, crossed out and faded.
3. **Habits**: real habits from your Habits + Routines database in Notion. It shows habits that have a Routine Priority and a daily time of day (Early morning through Evening), grouped by time of day. A habit is left out when its task for today is already on the schedule or in the NOW list, so nothing appears twice. Weekly, monthly and yearly habits are not shown. Tapping a habit checks or unchecks the habit's **Checkbox** property in Notion, and the page reads that same Checkbox back, so Notion stays the source of truth. The Checkbox does not reset by itself; if you want it cleared each morning, that needs a Notion automation.
4. **Important Tasks**: the NOW view rows, any scheduled item with no set time, and the top open "Must Happen" tasks (Do Next or In progress, in Notion's priority order, up to four). Collapsed by default. They never appear on the schedule. To change which tasks show here, change them in Notion.

The side tabs jump to each section. 
Notion stays the only database and this page adds no storage of its own. It reads Notion, and has exactly one write: the Restart time button (below).

## Restart time

On the Current focus card, **Restart time** starts the current task at the current time and moves the rest of today by the same amount. It asks for confirmation first and says exactly what will move.

- The current task and every later timed task that is not Done move by the same number of minutes, so gaps stay the same.
- Appointments and Deadlines stay where they are. If a moved block now overlaps one, the confirmation and the result say so.
- Nothing is allowed to move into a different day, and a shift of more than 8 hours is refused.
- It writes only the **Due Date** of tasks that Notion's own Schedule view returned, one at a time. If any write fails, the ones already changed are put back.
- The server route is `app/api/today/restart/route.ts` (behind the portal login, same-origin only). The planning rules are in `lib/today-shift.ts`, shared by the page preview and the server so they always agree.
- It uses its own key, `NOTION_TODAY_EDIT_API_KEY` (also used to tick habits via `app/api/today/habit/route.ts`, which can only change the Checkbox of pages inside the Habits + Routines database). The read-only key can never write. Without this key the button explains it is not set up and changes nothing.

Setup for Restart time (once):

1. In Notion go to notion.so/my-integrations and create an internal integration named "Today (edit times)". Capabilities: **Read content** and **Update content**. Leave Insert content, comments and user information off.
2. Open the **Tasks** database, choose ••• → **Connections**, and add that integration. Only add it to the Tasks and Habits + Routines databases.
2b. Also open the **Habits + Routines** database, choose ••• → **Connections**, and add the same integration (so habits can be ticked).
3. In Netlify (project `rachellesportal`), Site configuration → Environment variables, add `NOTION_TODAY_EDIT_API_KEY` with that integration's secret, Production scope. Redeploy.

Note: if a Notion automation sets Due Dates on its own, it may move tasks back. Restart time changes only the dates, not the rules behind them.

## How it reads Notion

- Schedule and Important Tasks are read by asking Notion for the rows of two saved views. Those views already hold the rules for what counts as "today" (they filter on formulas such as Execution Day), so the rules are not copied into this code. If the views change in Notion, the page follows.
- One addition: the Schedule view filters on the Execution Day formula, and that formula treats anything after 8 PM Eastern (already tomorrow in UTC) as another day, so an evening item such as "Night Close" never reaches the view. The page therefore also asks the Tasks database for scheduled rows whose Due Date is inside today (Eastern) and adds any the view missed. It only adds rows; the view still decides everything it returns. If that extra query fails, the view's rows are shown as before.
- Notion returns only row ids for a view, so each row is then fetched once for its details. That is about ten small requests per page load.
- Open tasks come from one query on the Tasks data source.
- Code: `lib/today.ts` (Notion reads), `app/today/page.tsx` (server page), `app/today/TodayPlanner.tsx` (the screen), `app/today/today.css` (scoped styles, no effect on other pages).
- Uses Notion API version `2026-03-11` for this page only. Other routes keep their own version.

## Setup (once)

1. In Notion go to notion.so/my-integrations and create a new internal integration named "Today (read only)". Give it **Read content** only. Do not give it insert or update.
2. Open the **Tasks** database in Notion, choose ••• → **Connections**, and add that integration.
3. Open the **Today** page, choose ••• → **Connections**, and add the same integration. The Schedule and NOW views live on that page, so the integration needs it.
3b. Habits use the **Today (edit times)** connection (see Restart time setup below), because ticking a habit writes to Notion. Open the **Habits + Routines** database, choose ••• → **Connections**, and add "Today (edit times)" there too. If only the read-only connection is on that database, habits still show but cannot be ticked. If the page cannot find the database it lists the databases the connections can see.
4. In Netlify, Site settings → Environment variables, add `NOTION_TODAY_API_KEY` with the integration secret. Redeploy.

Optional environment variables (the defaults are Rachelle's current Notion ids):

| Variable | Purpose |
|---|---|
| `NOTION_TODAY_API_KEY` | Secret for the read-only integration above. Falls back to `NOTION_API_KEY` if unset, which is not recommended because that key can edit records. |
| `NOTION_TASKS_DATA_SOURCE_ID` | Tasks data source. Default `8a5f408a-fdce-83e0-a000-87da31fdc6cf`. |
| `NOTION_HABITS_DATA_SOURCE_ID` | Habits + Routines data source. Default `85ff408a-fdce-83fd-8dae-0715a2654ee8`. |
| `NOTION_TODAY_SCHEDULE_VIEW_ID` | Schedule view. Default `3d5f408a-fdce-815c-8533-000c40cb6885`. |
| `NOTION_TODAY_NOW_VIEW_ID` | NOW view. Default `3d5f408a-fdce-81a1-90b1-000c18b2ce11`. |
| `NOTION_TODAY_EDIT_API_KEY` | Secret for the "Today (edit times)" integration. Only used by Restart time. |
| `NOTION_API_BASE` | Testing only. Points the page at a fake Notion server. |

## What shows if something is wrong

The page shows a plain message instead of failing silently:

- No key set: names the missing variable.
- Notion rejects the key: says the key is wrong or expired.
- Notion cannot find the Schedule or NOW view: tells you to add the integration under Connections on the Tasks database and the Today page.
- Notion takes longer than 8 seconds: says it took too long.
- The open-tasks query fails but the views work: the page still loads and shows a one-line warning.

## Known limits

- The view ids above were taken from the Notion tools, not from the REST API. If Notion answers "not found" for a view after the setup steps, the first thing to check is that the Today page itself was added under Connections.
- Time is shown in Eastern time (`America/New_York`).

## Remove it

Delete `app/today/`, `app/api/today/`, `lib/today.ts` and `lib/today-shift.ts`, and remove the "Your day" card in `app/page.tsx`. Nothing else depends on them.
