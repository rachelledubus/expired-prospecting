# Kit expired-report opt-in → Notion CRM + fulfillment

This is the public intake handoff for the **Expired Listing Private Property Analysis Report**.

## Offer model

This is **not** an instant-download PDF or generic CMA. It is a property-specific, 10-page private relaunch analysis that Rachelle reviews, prints, packages, and mails as a physical report kit.

Launch flow:

`Kit landing page → double opt-in → signed Kit webhook → Clients / Leads + Property Research → ⚙️ Requested Report — Queue → native Notion automation → Mailing Kit workflow`

The private prospecting portal remains password-gated. Only the webhook route is public.

## Important confirmation rule

Kit exposes two separate V4 events that matter here:

- `subscriber.subscribed_to_form` — the subscriber joined the landing-page form.
- `subscriber.activated` — the subscriber transitioned to active after confirmation.

The webhook endpoint must subscribe to **both**.

A new double-opt-in signup normally arrives inactive. The form event is therefore **not fulfillment authorization**. The integration creates an archived pending CRM audit row with `Permission to Follow Up = Unknown` and an explicit **DO NOT CONTACT / DO NOT FULFILL** note. When the matching subscriber later activates, the pending record becomes a confirmed inbound request.

An already-active Kit subscriber can be treated as confirmed from the explicit report-form submission because their email is already active and the form submission itself is the request.

## Landing page copy

### SEO title

**Private Property Analysis for Expired Listings | Rachelle Dubus**

### Hero eyebrow

**FOR SW BROWARD HOMEOWNERS WHOSE LISTING EXPIRED**

### Headline

**Before you relist, find out what the last listing actually tells us.**

### Subheadline

Request a private, property-specific review of your expired listing. I’ll look at the listing history, pricing path, presentation, buyer search position, and selected comparable evidence, then prepare a 10-page relaunch analysis for your property and mail it to you.

**No generic CMA. No automatic “your home was overpriced” conclusion. No obligation to list with me.**

### Three value blocks

**What stood out**  
The strongest signals in the listing record—what appeared to work, where momentum changed, and which details deserve a closer look.

**Where the friction may have been**  
Pricing/search bands, presentation, listing history, buyer confidence, competition, or another issue the evidence actually supports.

**What I would investigate before relaunching**  
The unanswered questions I would want resolved before recommending a new price, positioning strategy, or launch plan.

### Expectation-setting block

**This is reviewed by a person, not generated instantly.**

I build each analysis around one property. Some of the most important answers—why a contract ended, what buyers repeatedly said, or what changed during the listing—may not exist in MLS or public records. The report separates what the evidence shows from what still needs seller context.

## Launch form

### Heading

**Request your private property analysis**

### Fields

1. **First name** — required
2. **Email** — required
3. **Property Address** — required
4. **Mailing Address (if different from the property)** — optional

That is the complete launch form. **Do not collect a phone number at launch.**

Why: phone/text consent is not needed to fulfill this offer and would add a separate consent branch. If a homeowner later explicitly asks for a call or text, document that permission separately in the CRM.

### Consent / expectation text

By submitting, you’re asking me to prepare and mail the requested property analysis and to email you about that request. You can ask me to stop contacting you at any time.

Add any brokerage-required privacy disclosure without changing the scope above.

### Button

**Request My Private Analysis**

Do not use urgency language, countdown timers, fake scarcity, “free home valuation,” or “instant report.”

## Pre-confirmation thank-you state

### Check your inbox to confirm your request

I have the property information. Before I queue the analysis, confirm your email using the message I just sent you.

Once confirmed, the request will enter my report-preparation workflow. Because this is a property-specific review rather than an instant automated valuation, I do not promise an immediate report download.

## Kit Confirmation Email

Keep double opt-in enabled and use Kit's built-in Confirmation Email. A separate Visual Automation is not required at launch.

### Subject

**Confirm your private property analysis request**

### Body

Hi {{ subscriber.first_name | strip | default: "there" }},

I received your request for a Private Property Analysis.

Before I start reviewing the listing history and queue the report for mailing, please confirm that this is the right email address for your request.

**[Confirm My Request]**

Once you confirm, I’ll review the property individually—not run it through a generic CMA—and work from the actual listing record, pricing history, presentation, and relevant comparable evidence.

If there’s something important that probably won’t show up in MLS or public records—like why a contract ended, repeated feedback you received, or improvements you made—just reply to one of my emails after confirming. That context can materially change the diagnosis.

There’s no obligation to relist with me. The point is to give you a clearer picture of what I’d want to understand before putting the property back on the market.

— Rachelle

### Confirmation button

**Confirm My Request**

## After-confirmation page

### You're confirmed — your request is in.

I’ll review the property information and work the request through my report-preparation process.

The packet is intentionally not an instant automated valuation. I want the analysis to distinguish between what the listing evidence actually supports and what still needs homeowner context.

If you remember something that may matter—especially a failed contract, repeated showing feedback, condition or renovation details, or a major change during the listing—you can reply to my email and tell me.

## Webhook endpoint

Create one current-generation Kit V4 **webhook endpoint** with:

- URL: `https://portal.rachellesellsrealestate.com/api/kit-expired-optin`
- Events:
  - `subscriber.subscribed_to_form`
  - `subscriber.activated`

Save the endpoint signing secret immediately; Kit only returns it in plaintext when the endpoint is created or its secret is rotated.

Set these Netlify environment variables:

```env
KIT_EXPIRED_FORM_ID=<numeric landing-page/form id>
KIT_EXPIRED_WEBHOOK_SECRET=<Kit endpoint signing secret>
```

The existing portal must also retain:

```env
NOTION_API_KEY=...
NOTION_LEADS_DATABASE_ID=9f7f408a-fdce-82f5-a49c-01dfb37a4c4c
NOTION_PROPERTY_RESEARCH_DATABASE_ID=5f4009da-260f-47ca-8120-0519d9134afe
```

## CRM + Property Research behavior

### New, unconfirmed signup

The form event creates an intentionally non-actionable CRM audit row:

- Source = Website
- Lead Type = Expired Listing
- Service Need = Expired Seller
- Pipeline Stage = Archived
- Permission to Follow Up = Unknown
- no Prospecting Channel is added
- no Mailing Kit queue is opened
- Compliance Notes contains the Kit form event + a clear `UNCONFIRMED — do not contact and do not fulfill` instruction

This keeps an unconfirmed/bot/typo signup out of daily work while giving the later activation event a durable correlation record in Notion.

### Confirmed request

When `subscriber.activated` matches that pending report request—or when an already-active subscriber submits the form—the integration prepares the deterministic intake inputs:

- Pipeline Stage = New when the pending record was Archived
- Permission to Follow Up = Yes
- Prospecting Channel adds Email + Direct Mail
- Property Address fills when the CRM field is blank
- Mailing Address uses the separately supplied address when present; otherwise it defaults to the Property Address because the form field is explicitly labeled “if different”
- a matching Property Research record is found or a minimal `Research Status = Not started` shell is created
- Property Research is linked to the CRM through the existing Owner / CRM Contact ↔ Related Property relation
- Mailing Kit Routing is left/set to **Not Evaluated** for the native requested-report queue
- Compliance Notes records the exact confirmed request, property, mailing-address behavior, Property Research URL, Kit event ID, and consent scope

The webhook does **not** create a task or stamp `Queued`. Those are owned by the native Notion automation below.

Existing live pipeline/source/workflow state is otherwise preserved. Existing hard suppression remains suppression and blocks automatic fulfillment.

Kit event UUIDs provide retry idempotency while allowing the same subscriber to make a legitimate future request.

## Native Notion handoff

The CRM view **`⚙️ Requested Report — Queue`** is already created. It includes only confirmed Website expired-seller requests with Email + Direct Mail permission, `Mailing Kit Routing = Not Evaluated`, a mailing address, and a linked Property Research record.

Create one native database automation in **Clients / Leads**:

- **Name:** `Mailer — Queue requested report`
- **Run on:** `⚙️ Requested Report — Queue`
- **Trigger when:** Page added; Permission to Follow Up edited; Prospecting Channel edited; Mailing Address edited; Related Property edited; Mailing Kit Routing edited; Pipeline Stage edited; Compliance Notes edited.

Actions:

1. Create a Tasks ✧ page named `Prepare requested Private Property Analysis — [Address]`.
2. Set the task to Do Next / Work Block / 45 min / Medium energy / Priority Tier 2 High Value / Must Happen / Supports Revenue / Platinum.
3. Task Next Instruction: open the linked Property Research record; CURRENT = use Latest Report Kit, BLOCKED = resolve the source-data blocker, READY FOR AI or REFRESH NEEDED = run **Generate Expired Listing Report Kit** using **Route D — Confirmed Kit / Website Request**; then use **Mailer Setup & Send Process** and validate the USPS address before postage.
4. Edit the CRM trigger row: `Mailing Kit Routing = Queued`.
5. Set `Mailing Kit Routed At = Now`.
6. Set `Call Disposition = Mailer Requested`.
7. Set `Next Action = Prepare requested private property analysis`.

Do **not** add Call/Text or alter Outreach Eligibility to force this through the cold mail-only automation. The requested-report lane is intentionally separate.

Setting `Mailing Kit Routing = Queued` removes the row from `⚙️ Requested Report — Queue`, which is the native idempotency guard for task creation.

## Production test

Run this after the Kit page, webhook endpoint, Netlify variables, branch deploy, and native Requested Report automation are ready:

1. Submit the landing page with a fresh test email and valid property address.
2. **Do not confirm yet.** Verify the CRM row is Archived, Permission = Unknown, has the UNCONFIRMED warning, and has no actionable mailing route.
3. Verify the landing page tells you to check your inbox.
4. Open the confirmation email and click **Confirm My Request**.
5. Verify the same CRM row moves to New, Permission = Yes, and adds Email + Direct Mail.
6. Verify Mailing Address equals the property address when the optional different-mailing-address field was left blank.
7. Verify a matching Property Research row exists and is linked to the CRM. A new shell should be `Research Status = Not started`; no MLS facts should be invented.
8. Verify the confirmed CRM record briefly qualifies for `⚙️ Requested Report — Queue` and the native automation creates exactly one task.
9. Verify the automation changes Mailing Kit Routing to Queued, stamps Mailing Kit Routed At, sets Mailer Requested, and sets the concrete Next Action.
10. Repeat once using a separate Mailing Address and confirm both CRM + Property Research preserve the separate mailing destination.
11. Confirm normal portal pages still redirect unauthenticated visitors to `/login` while the webhook accepts valid signed Kit POSTs.
12. If possible, replay the same Kit webhook event and confirm the event marker prevents duplicate webhook mutations and the Notion queue state prevents duplicate task creation.

## Done when

The external funnel is live only when:

- the landing page is published and its final URL is recorded in Notion;
- double opt-in + the confirmation email are active;
- the webhook endpoint subscribes to both form-subscribe + subscriber-activated events;
- `KIT_EXPIRED_FORM_ID` + `KIT_EXPIRED_WEBHOOK_SECRET` are set in Netlify;
- the native `Mailer — Queue requested report` automation is active;
- the PR is deployed/merged;
- an unconfirmed request remains non-actionable;
- a confirmed request creates/links Property Research and enters the requested-report queue;
- exactly one fulfillment task is created and the CRM becomes Queued; and
- both default-to-property-address and separate-mailing-address tests pass.
