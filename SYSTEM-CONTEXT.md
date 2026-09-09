# System Context: Prospecting Portal

Handoff document describing an existing system and its hard constraints,
for use when designing a new/adjacent system. Treat everything under
"Constraints" as fixed — a new system should integrate with this, not
duplicate or conflict with it.

## Purpose

A private, single-user (Rachelle, a solo real estate agent) tool for
expired-listing prospecting: skip-trace property owners, apply
compliance logic (DNC/TCPA/litigator/deceased), and route qualified leads
into her real Notion CRM. Not a product — no other users, no billing, no
multi-tenancy.

## Stack & hosting

- **Framework:** Next.js 14 (App Router, TypeScript), React 18
- **Hosting:** Netlify, auto-deployed from GitHub (`rachelledubus/expired-prospecting`, `main` branch)
- **Domain:** `portal.rachellesellsrealestate.com` (CNAME at GoDaddy → Netlify), separate from her main site (Moxi-hosted, untouched)
- **Persistence:** **none of its own.** No database, no ORM. `package.json` has only `next`, `react`, `react-dom`, `papaparse`. Notion is the durable store — see Constraints.
- **Auth:** single shared password → cookie set to a static `PORTAL_SESSION_SECRET`, checked in `middleware.ts`. Deliberately minimal; fine for one user, would need replacing (e.g. real auth provider) before any second user exists.

## External APIs

### Tracerfy (skip-tracing / owner lookup)
- Docs: `tracerfy.com/skip-tracing-api-documentation`. Sandbox: `mock.tracerfy.com` (any bearer token works, free, fake but realistic data, has its own `/openapi.json`).
- Auth: `Authorization: Bearer <token>`.
- Endpoint used: `POST /v1/api/trace/lookup/` — body `{address, city, state, zip, find_owner: true}`.
- **The docs claim array/batch support (up to 15 objects) for this endpoint. That is false.** Verified directly against the live OpenAPI schema (`TraceLookupRequest`) — it only accepts a single flat object. A batch call gets `400 {"non_field_errors":["Input should be a valid dictionary..."]}`. The app calls it once per address, sequentially. Don't reintroduce batching without re-verifying.
- Response includes per-phone `dnc`/`tcpa` flags and per-person `litigator`/`deceased` flags, plus `meta.request_id`/`meta.timestamp` (single-lookup only, no `meta` on error paths).
- Cost: 5 credits per hit, 0 on a miss. Pay-as-you-go, $0.02/credit (~$0.10/hit).

### Notion (system of record — see Constraints below)

## File structure

```
app/
  login/page.tsx           password entry
  page.tsx                 dashboard (links to the 3 tools below)
  lookup/page.tsx           single address → Tracerfy → results → push
  import/page.tsx          CSV (Expired) → per-row Tracerfy → results → push (single or bulk)
  watchlist/page.tsx       CSV (Price Reduction/Stale) → Property Research only, no Tracerfy
  api/
    login/route.ts, logout/route.ts
    property-lookup/route.ts   single Tracerfy lookup, checks Notion first
    bulk-lookup/route.ts       sequential per-row Tracerfy lookups, checks Notion first per row
    notion-push/route.ts       upsert into Clients / Leads (the core compliance+routing logic)
    watchlist-import/route.ts  upsert into Property Research
lib/
  tracerfy.ts     types + compliance derivation (outreachEligibility, dncStatus, bestPhone/bestEmail)
  notion.ts       queryLeadsByAddress() — checks Clients/Leads before spending Tracerfy credits
  propertyResearch.ts   Property Research upsert logic
middleware.ts     password gate
```

## Constraints

These are not stylistic preferences — violating them either breaks a
working system, corrupts real production data, or crosses a compliance/ToS
line.

1. **Notion is the database. Do not add Postgres/Supabase/any other
   persistence layer** unless a real, validated bottleneck shows up from
   actual usage (not a hypothetical from a roadmap document — this has
   already been proposed and declined twice in this project).
2. **Two existing Notion databases are load-bearing. Do not create parallel
   ones without explicit confirmation, and always read the actual current
   schema before writing to either:**
   - **Clients / Leads** (id `9f7f408a-fdce-82f5-a49c-01dfb37a4c4c`, data
     source `301f408a-fdce-83ea-bef1-07aa97c91433`) — the CRM. Fields this
     app writes: `Name`, `Address`, `Phone`/`Email` (single best contact),
     `All Phones`/`All Emails` (full list, one per line), `Source`,
     `Lead Type`, `Service Need`, `Pipeline Stage` (create-only, always
     `"New"`), `DNC Status`, `Outreach Eligibility` (options include
     `Deceased`/`Litigator`, added specifically for this app),
     `DNC Scrub Date`, `Compliance Notes`, `Possible Other Names`
     (same-address/different-name flag), `Prospecting Channel`
     (create-only). **Never overwrite** `Next Action`, `Lead Temp`, `Call
     Notes`, `Call Disposition`, `Last Contact`, or page content — those
     are Rachelle's live working state (see the real "Attempting Contact"
     record with an active call script this app had to work around).
     Dedupe key: exact `Name` + `Address` match → update in place;
     different name at the same address → flag via `Possible Other
     Names`, never auto-merge.
   - **Property Research** (id `5f4009da-260f-47ca-8120-0519d9134afe`,
     data source `2fcb946a-4eff-4263-a88b-2d89cb503fbf`) — a
     deliberate-analysis tool (has its own manual workflow: "Property
     Research Console", comp-picking, `Realistic High/Low`, `Observation /
     Call Reason`), NOT a bulk-log dump. This app only writes listing-data
     fields (`Listing Status`, `Original/Final List Price`, `Number of
     Price Changes`, `DOM`, `Beds/Baths/Sq Ft/Year Built`) and sets
     `Research Status = "Not started"` on create only. Never touches
     `Research Status` on update, nor `Owner / CRM Contact`, `Campaign`,
     `Comparable Sales`, or the manual-analysis fields.
   - A related **Comparable Sales** database (id
     `1dd0ff3a-0c0a-4ad9-8fc0-13bda421516f`) exists but is per-property
     (tied to one Subject Property via relation) — not a general market
     database. Don't bulk-import into it.
3. **Changing either database's schema (new property, new select option)
   requires the user's explicit confirmation each time** — an automated
   classifier blocks schema-write calls by default specifically to force
   this. Two schema additions have been made so far (both confirmed):
   `Deceased`/`Litigator` options on `Outreach Eligibility`, and the
   `All Phones`/`All Emails`/`Possible Other Names` fields.
4. **No MLS automation.** Don't scrape, auto-login to, or otherwise
   automate against MLS Matrix — that risks her MLS board access over a
   Terms of Service violation. The only sanctioned MLS data path is a
   manual CSV export she uploads herself. If true live MLS data becomes
   necessary, the only acceptable route is an official RETS/data-feed
   agreement through her MLS board — a business/legal step, not an
   engineering one.
5. **Compliance logic is load-bearing, not a UI nicety.** A `litigator`
   flag suppresses all outreach. A `deceased` flag blocks calling but
   still allows mail (probate/estate outreach is normal practice). Any
   new system that touches contact data needs to preserve — not
   reinterpret — this logic (`lib/tracerfy.ts`: `outreachEligibility`,
   `dncStatus`).
6. **Don't duplicate what already exists elsewhere in her workspace.**
   Market-stats aggregation overlaps her `local-market-report-analyst`
   skill. Property research/call-prep overlaps existing Notion
   pages/workflows (Property Research Console, call scripts, SOP
   library). Check before building a second version of something.
7. **Single user, no billing, no multi-tenancy, no white-label** — none
   of that has been requested or validated. Don't design for it
   speculatively.

## What's deliberately NOT built (and why)

- Any persistence layer beyond Notion (see Constraint 1)
- Saved/quick searches, recurring monitors via Tracerfy's other endpoints — no validated need yet
- Daily call-queue dashboard — no validated need yet
- Market-stats aggregation, buyer-inventory matching — overlaps existing tooling / no home in Notion, no validated need

## Where to look for more detail

- `README.md` in this repo — user-facing setup/behavior docs, kept in sync with the code
- The actual route files under `app/api/` — the compliance and dedupe logic is dense but fully commented inline
