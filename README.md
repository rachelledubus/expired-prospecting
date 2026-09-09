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
database.

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

Pushing a matched contact ("Add to Notion") creates one page in your
**Clients / Leads** database using its existing fields only — no new
properties or select options are added:

- `Name`, `Address`, `Phone`, `Email` — from the Tracerfy match
- `Source` = "MLS Pull", `Lead Type` = "Expired Listing", `Service Need` = "Expired Seller", `Pipeline Stage` = "New" (matching your CRM's own conventions)
- `DNC Status` and `Outreach Eligibility` — derived from Tracerfy's per-phone `dnc`/`tcpa` flags and the person's `litigator` flag (a litigator or deceased record is always set to "None")
- `DNC Scrub Date` = today
- `Compliance Notes` — the Tracerfy request ID/timestamp and a plain-language summary of what was checked

`Next Action` and `Lead Temp` are intentionally left blank on import — your
CRM guide treats those as things you set after actually working the lead,
and none of the existing `Next Action` options represent "not yet
attempted," so guessing one would misrepresent the record.

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
