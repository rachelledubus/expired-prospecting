# Prospecting Portal — Phase 1

Private property/owner lookup tool, meant to sit on a subdomain
(e.g. `portal.rachellesellsrealestate.com`) alongside the main Moxi website,
which stays untouched.

Phase 1 scope: password-gated login → property lookup form → Tracerfy →
results, with DNC/TCPA/litigator status shown per contact.

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

Start with the sandbox base URL until you're ready to spend real credits.

## Deploying to Netlify

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import an existing project → GitHub**, pick this repo.
3. Netlify auto-detects Next.js and installs the `@netlify/plugin-nextjs` build plugin (also pinned in `netlify.toml`).
4. Add the four environment variables above under **Site configuration → Environment variables**.
5. Deploy. Then add a custom domain (`portal.yourdomain.com`) under **Domain management** and point its DNS (a `CNAME` at your domain registrar/DNS provider) at the Netlify site — this does not touch the DNS records your root domain uses for Moxi.

## Compliance note

The DNC/TCPA/litigator flags shown here come straight from Tracerfy's data
and are surfaced as-is, with the lookup's `request_id` and `timestamp` for
an audit trail. This is **not** a substitute for a full compliance check —
confirm Tracerfy's DNC data freshness and whether you also need state-level
DNC or litigator-list scrubbing before using this for outbound calling at
volume. Treat a "not on DNC" result as "not on Tracerfy's national DNC
snapshot as of that timestamp," not a guarantee.

## What's not built yet (later phases)

- CSV import of MLS "Expired" exports → bulk Tracerfy lookups
- Notion sync (push qualified leads into your CRM)
- Saved/quick searches via Tracerfy's Property Search + Templates endpoints
- Daily call queue dashboard
