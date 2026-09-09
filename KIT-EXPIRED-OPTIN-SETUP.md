# Kit expired-report opt-in → Notion CRM + fulfillment

This is the public intake handoff for the **Expired Listing Private Property Analysis Report** offer.

## What the offer actually is

This is **not** an instant-download PDF or generic CMA. The live offer in Notion is a property-specific, 10-page private relaunch analysis that Rachelle personally reviews, prints, packages, and mails as a physical report kit.

The funnel therefore promises **request + personalized preparation + physical mail fulfillment**, not instant report delivery.

## Architecture

`Kit landing page → double opt-in confirmation → Kit V4 webhook → Clients / Leads → existing Mailing Kit workflow`

The rest of `portal.rachellesellsrealestate.com` remains password-gated. The middleware exposes only this webhook route in addition to the existing login routes.

The webhook verifies Kit's `X-Kit-Signature` HMAC against the exact raw request body, rejects signatures older than 5 minutes, and ignores any event that is not `subscriber.subscribed_to_form` for the configured form ID.

## Landing page: exact launch positioning

### Page title / SEO title

**Private Property Analysis for Expired Listings | Rachelle Dubus**

### Hero eyebrow

**FOR SW BROWARD HOMEOWNERS WHOSE LISTING EXPIRED**

### Headline

**Before you relist, find out what the last listing actually tells us.**

### Subheadline

Request a private, property-specific review of your expired listing. I’ll look at the listing history, pricing path, presentation, buyer search position, and selected comparable evidence, then prepare a 10-page relaunch analysis for your property and mail it to you.

**No generic CMA. No automatic “your home was overpriced” conclusion. No obligation to list with me.**

### What the report covers

**What stood out**  
The strongest signals in the listing record—what appeared to work, where momentum changed, and which details deserve a closer look.

**Where the friction may have been**  
Pricing/search bands, presentation, listing history, buyer confidence, competition, or another issue the evidence actually supports.

**What I would investigate before relaunching**  
The unanswered questions I would want resolved before recommending a new price, positioning strategy, or launch plan.

### Expectation-setting block

**This is reviewed by a person, not generated instantly.**

I build each analysis around one property. Some of the most important answers—why a contract ended, what buyers repeatedly said, or what changed during the listing—may not exist in MLS or public records. The report separates what the evidence shows from what still needs seller context.

### Form heading

**Request your private property analysis**

### Form fields

1. **First name** — required
2. **Email** — required
3. **Property Address** — required
4. **Mailing Address (if different from the property)** — optional
5. **Phone** — optional
6. **Phone/Text Follow-Up Permission** — optional checkbox

Recommended optional checkbox text:

> Yes — you may call or text me about this property and my analysis request.

Do **not** make the phone field or phone/text permission required.

### Consent / expectation text under the form

By submitting, you’re asking me to prepare and mail the requested property analysis and to email you about that request. Phone/text follow-up is optional and is only treated as permitted when you check the separate box above. You can ask me to stop contacting you at any time.

Use any additional brokerage-required privacy/TCPA disclosure without changing the core distinction above.

### Button

**Request My Private Analysis**

Do not use urgency language, countdown timers, fake scarcity, “free home valuation,” or “instant report.”

## Thank-you state before email confirmation

Keep Kit double opt-in enabled.

After the form is submitted, show:

### Check your inbox to confirm your request

I have the property information. Before I queue the analysis, confirm your email using the message I just sent you.

Once confirmed, the request will enter my report-preparation workflow. Because this is a property-specific review rather than an instant automated valuation, I do not promise an immediate report download.

## Kit confirmation email

Use Kit's built-in **Confirmation Email** rather than creating a separate Visual Automation just to acknowledge the request. Kit recommends double opt-in, and confirmed subscribers are the ones Kit can email normally.

### Subject

**Confirm your private property analysis request**

### Body

Hi {{ subscriber.first_name | default: "there" }},

I received your request for a Private Property Analysis.

Before I start reviewing the listing history and queue the report for mailing, please confirm that this is the right email address for your request.

**[Confirm my request]**

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

**Rachelle Dubus**  
SW Broward Realtor  
contact@rachellesellsrealestate.com

## Do we need a Visual Automation at launch?

**No.** Do not create one just because Kit offers it.

At launch, the built-in double-opt-in confirmation email handles the subscriber-facing acknowledgment, while the signed webhook handles CRM + fulfillment routing. The existing Notion workflow handles report preparation and follow-up.

Add a Kit Visual Automation later only if live usage proves that a separate post-confirmation email sequence has a real job to do. If one is eventually added, the dedicated landing page/form can be the entry point and an Email Sequence can be the action; Kit supports that pattern.

## Webhook endpoint

Create a Kit V4 webhook endpoint with:

- URL: `https://portal.rachellesellsrealestate.com/api/kit-expired-optin`
- Event: `subscriber.subscribed_to_form`

When Kit creates the endpoint, save the endpoint signing secret immediately.

Set these Netlify environment variables:

```env
KIT_EXPIRED_FORM_ID=<numeric form id>
KIT_EXPIRED_WEBHOOK_SECRET=<Kit endpoint signing secret>
```

The existing portal environment must also contain:

```env
NOTION_API_KEY=...
NOTION_LEADS_DATABASE_ID=9f7f408a-fdce-82f5-a49c-01dfb37a4c4c
```

## CRM + fulfillment behavior

For a new confirmed email address, the webhook creates a `Clients / Leads` row with:

- Source = Website
- Lead Type = Expired Listing
- Service Need = Expired Seller
- Pipeline Stage = New
- Permission to Follow Up = Yes
- Prospecting Channel = Email + Direct Mail
- Call + Text only when explicit phone/text permission is present
- Property address when submitted
- Separate Mailing Address when submitted
- Mailing Kit Routing = Queued when the property address is present
- Mailing Kit Routing = Exception when the property address is missing
- Mailing Kit Routed At = the Kit event time
- Compliance Notes with Kit event ID, form ID/name, subscriber ID, event timestamp, fulfillment request, submitted addresses, and exact consent scope

For an existing CRM record with the same email address, the webhook adds the new consent/fulfillment evidence and fills blank phone/address fields without overwriting the live pipeline/source/workflow state.

If an existing record's Mailing Kit Routing is already `Complete`, `Suppressed`, `Exception`, or otherwise in a meaningful state, the webhook does not downgrade that state merely because a new event arrived. The request remains visible in Compliance Notes for manual review.

The Kit event UUID is written to `Compliance Notes`. Retries with the same event UUID are treated as duplicates.

Do not auto-merge by property address. Multiple decision-makers can legitimately share one property, and one contact can also have more than one property.

## One-time production test

After deployment and Kit configuration:

1. Submit the landing page with a test email, property address, and **no** phone/text permission.
2. Confirm the pre-confirmation thank-you state tells the user to check email.
3. Click the Kit confirmation button.
4. Confirm exactly one CRM row is created or updated.
5. Confirm `Source = Website`, `Lead Type = Expired Listing`, `Service Need = Expired Seller`, and `Permission to Follow Up = Yes`.
6. Confirm `Prospecting Channel` contains Email + Direct Mail, but **not** Call/Text.
7. Confirm `Mailing Kit Routing = Queued` and the routed timestamp is present.
8. Repeat with a separate mailing address and explicit phone/text permission; confirm the mailing address is saved and Call + Text are added.
9. Test a malformed submission without property address if Kit allows it; it must route to `Exception`, not silently appear fulfillment-ready.
10. Retry the same webhook event if available; confirm the event UUID prevents duplicate CRM work.
11. Confirm normal portal pages still redirect unauthenticated visitors to `/login` while the webhook accepts valid signed Kit POSTs.

## Done when

The external funnel is live only when:

- the landing page is published and its final URL is recorded in Notion;
- double opt-in + the confirmation email are active;
- `KIT_EXPIRED_FORM_ID` and `KIT_EXPIRED_WEBHOOK_SECRET` are set in Netlify;
- the draft PR is deployed/merged;
- the email-only/direct-mail test passes;
- the explicit phone/text-permission test passes; and
- a confirmed request visibly lands in the existing Mailing Kit fulfillment queue.
