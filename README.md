# Prospecting Portal

Private property/owner lookup tool, meant to sit on a subdomain
(e.g. `portal.rachellesellsrealestate.com`) alongside the main Moxi website,
which stays untouched.

**Phase 1:** password-gated login → property lookup form → Tracerfy →
results, with DNC/TCPA/litigator status shown per contact.

**Phase 2:** CSV import of MLS "Expired" exports → column mapping → a
Tracerfy lookup per address (Tracerfy's docs describe batch/array support,
but its own live API schema doesn't implement it — confirmed directly
against the endpoint, so each row is looked up individually) → push
qualified leads straight into your real Notion "Clients / Leads" CRM
database, either one contact at a time or all at once with **Push all N to
Notion** (skips anyone already pushed, runs sequentially to stay well under
Notion's rate limit).

## Local development

Requires Node.js (LTS) installed.

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run dev
```

Visit http://localhost:3000 — you'll be redirected to `/login`.

## Environment variables

Set these in `.env.local` for local dev, and in Netlify's Site settings →
Environment variables for deployment. Never commit `.env.local`.

| Variable | Purpose |
|---|---|
| `PORTAL_PASSWORD` | The password used at `/login`. |
| `PORTAL_SESSION_SECRET` | Long random string used as the session cookie value. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `TRACERFY_API_BASE` | `https://mock.tracerfy.com/v1/api` for the free sandbox (fake data, no credits used), or `https://tracerfy.com/v1/api` for production. |
| `TRACERFY_API_KEY` | Your Tracerfy bearer token. Any non-empty string works against the sandbox. |
| `NOTION_API_KEY` | Secret for a Notion internal integration (see below). |
| `NOTION_LEADS_DATABASE_ID` | The "Clients / Leads" database ID — already filled in in `.env.example`. |

Start with the sandbox Tracerfy base URL until you're ready to spend real credits.

### Setting up the Notion connection

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations) → **New integration**. Name it something like "Prospecting Portal", pick your workspace, and give it **Insert content** capability (that's all this app needs).
2. Copy the **Internal Integration Secret** it gives you → that's `NOTION_API_KEY`.
3. Open your **Clients / Leads** database in Notion → **···** menu (top right) → **Connections** → add the integration you just created. This grants it access to that one database only, not your whole workspace.
4. `NOTION_LEADS_DATABASE_ID` is already set to the right value in `.env.example` — no need to look it up yourself.

## Deploying to Netlify

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import an existing project → GitHub**, pick this repo.
3. Netlify auto-detects Next.js and installs the `@netlify/plugin-nextjs` build plugin (also pinned in `netlify.toml`).
4. Add the environment variables above under **Site configuration → Environment variables**.
5. Deploy. Then add a custom domain (`portal.yourdomain.com`) under **Domain management** and point its DNS (a `CNAME` at your domain registrar/DNS provider) at the Netlify site — this does not touch the DNS records your root domain uses for Moxi.

## What gets written to Notion

Pushing a matched contact ("Add to Notion") first checks for an existing
page with the same `Name` and `Address` in your **Clients / Leads**
database. If one exists, it's **updated in place** (button shows "Updated
in CRM") — only the compliance/contact fields refresh (`Phone`, `Email`,
`All Phones`, `All Emails`, `DNC Status`, `Outreach Eligibility`, `DNC
Scrub Date`, `Compliance Notes`); `Pipeline Stage`, `Lead Type`, `Source`,
and anything else you've since set on the record are left alone. If no
match exists, it creates a new page (button shows "Added to CRM") with:

- `Name`, `Address` — from the lookup
- `Phone`, `Email` — the single best contact (first phone that's clean of DNC/TCPA, or the first phone if none are clean; the top-ranked email) so click-to-call/click-to-email still works on these fields
- `All Phones`, `All Emails` — every phone and email Tracerfy returned, one per line, so nothing is hidden when a record has many (real records can easily return 5-10+ of each). New fields added 2026-09-09 specifically for this — previously extra contacts were only mentioned in Compliance Notes text.
- `Source` = "MLS Pull", `Lead Type` = "Expired Listing", `Service Need` = "Expired Seller", `Pipeline Stage` = "New" (matching your CRM's own conventions)
- `DNC Status` — derived from Tracerfy's per-phone `dnc` flag
- `Outreach Eligibility` — derived from Tracerfy's `dnc`/`tcpa`/`litigator`/`deceased` flags: `Litigator` on its own if flagged (fully suppressed — no call, text, or mail); `Deceased` + `Mail` if the owner is deceased but has a mailing address (blocks calling, still allows working it as a probate/estate lead); otherwise `Call` and/or `Mail` based on what's actually usable. "Deceased" and "Litigator" were added as new options on this field (2026-09-09) specifically so the reason is visible at a glance in table/board view.
- `DNC Scrub Date` = today
- `Compliance Notes` — the Tracerfy request ID/timestamp and a litigator/deceased flag if applicable (the full phone/email list lives in `All Phones`/`All Emails` instead)

## Duplicate detection across different names

The dedupe check above only matches on exact `Name` + `Address`, which can't
catch a pre-existing combined household record (e.g. "Ricardo & Sandra
Castro") when Tracerfy identifies each owner separately (e.g. "Ricardo
Castro" and "Sandra Rivera" — note Tracerfy's public-records data doesn't
always agree with what you already have on file for a name). Rather than
guess whether those refer to the same people and silently merge them, every
push also checks for *any other* record at the same address and lists them
in a `Possible Other Names` field (added 2026-09-09) — the app's response
also surfaces a warning in the UI when this happens. Treat that as a prompt
to go check Notion and decide yourself whether to merge, not an automatic
action.

`Next Action` and `Lead Temp` are intentionally left blank on import — your
CRM guide treats those as things you set after actually working the lead,
and none of the existing `Next Action` options represent "not yet
attempted," so guessing one would misrepresent the record.

On a brand-new record only (never on an update, so it can't erase any
touch history you've since logged), the push also sets `Prospecting
Channel` to `Call` or `Direct Mail` based on the contact's outreach
eligibility — a lightweight "which method to try first" recommendation
using a field your CRM already had, no schema change needed for this one.

## Avoiding duplicate Tracerfy charges

Since credits cost real money, every lookup — single or CSV — checks
Notion for an existing record at that address **before** calling Tracerfy.
If found, you see what's already there (name, pipeline stage, last DNC
scrub date, a link to open it) instead of paying for the same property
twice. A "Refresh anyway" button (single lookup) or "Refresh this one
anyway" (per CSV row) explicitly re-runs Tracerfy if you actually want
fresh data. The CSV import page also has a "Refresh Tracerfy data even for
addresses already in your CRM" checkbox to skip this check for an entire
import at once.

The import page also has an optional "Saved search name" field (e.g. "New
Expireds") — if filled in, it's recorded in `Compliance Notes` on anything
pushed from that batch, so you have context later on why a lead entered
the system.

## Compliance note

The DNC/TCPA/litigator flags shown here come straight from Tracerfy's data
and are surfaced as-is, with the lookup's `request_id` and `timestamp` for
an audit trail. This is **not** a substitute for a full compliance check —
confirm Tracerfy's DNC data freshness and whether you also need state-level
DNC or litigator-list scrubbing before using this for outbound calling at
volume. Treat a "not on DNC" result as "not on Tracerfy's national DNC
snapshot as of that timestamp," not a guarantee.

## What's not built yet (later phases)

- Saved/quick searches via Tracerfy's Property Search + Templates endpoints
- Recurring property monitors
- Daily call queue dashboard
