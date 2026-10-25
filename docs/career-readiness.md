# Career readiness tracker — Notion sync

The `/career` page belongs to the private planner and uses the existing two career Notion databases as its **only active source of truth**.

- **Skills:** Software Career Skills — Evidence Tracker (`53eb2478-1286-4418-8ffa-469ed9806af9`). The portal reads all 33 rows, and changes only `Status`, `Verified`, and `Evidence URL`. Notion's `Proof Complete` formula determines readiness.
- **Milestones:** Software Career Milestones — Readiness Gates (`89506274-1a9e-4606-801f-448f3120feb9`). The portal reads all four rows and changes only `Action Taken`.
- Every check/uncheck of `Verified` saves immediately in Notion, subject to the evidence-link rule. Edits to learning status/evidence use the Save button. Milestone `Action Taken` also saves immediately.
- The browser never sees an integration token. Server routes validate record IDs, database membership, field names, allowed status values, URLs, and last-edit timestamps before issuing a write. If Notion refuses a write, no local copy is treated as successfully checked.
- Reload/Refresh from Notion to see changes made directly in Notion. The page also re-reads all data after a successful save. A stale tab cannot overwrite a more recently edited Notion page without a conflict message.
- The original `lib/career-store.ts` (Netlify Blobs) remains unused as a legacy backup. Nothing automatically overwrites your Notion records with old portal data. Existing notes from the earlier version remain in that store but aren't synced because the Notion skills database has no `Notes` property.

## One-time permission setup

1. Open the **Software Career Skills — Evidence Tracker** database in Notion → `•••` → **Connections** → connect the already-existing internal integration **Today (edit times)**.
2. Repeat on **Software Career Milestones — Readiness Gates**.
3. That integration already has a Netlify server-side key, `NOTION_TODAY_EDIT_API_KEY`; no new token or database is required. A dedicated `NOTION_CAREER_API_KEY` may override it if desired and must have **Read** + **Update** content capabilities and be connected to both databases.
4. Open `/career` in the portal. If permissions are still missing it gives a setup message rather than presenting false zeros.

The server APIs use the existing Next.js route and portal login middleware. They never expose credentials in the client bundle. Refresh the Netlify production deploy after changing a server environment variable, if one was changed. Connecting an existing integration in Notion alone does not require changing Netlify environment values.

## Older version

The prior implementation stored proof in Netlify Blobs. That old data was **not migrated** because the new Notion records are authoritative and automatic import could overwrite manually verified data. Do not delete the old store until any important locally stored notes have been reviewed.
