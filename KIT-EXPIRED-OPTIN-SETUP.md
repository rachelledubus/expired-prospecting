# Kit expired-report opt-in → Notion CRM

This is the public intake handoff for the **Expired Listing Private Property Analysis Report** offer.

## Architecture

`Kit landing page/form → Kit V4 webhook → /api/kit-expired-optin → Clients / Leads in Notion`

The rest of `portal.rachellesellsrealestate.com` remains password-gated. The middleware exposes only this webhook route in addition to the existing login routes.

The webhook does **not** trust a public URL token. It verifies Kit's `X-Kit-Signature` HMAC against the exact raw request body and rejects signatures older than 5 minutes. It also ignores any event that is not `subscriber.subscribed_to_form` for the configured form ID.

## Kit form

Use one dedicated Kit form / landing-page form for this offer.

Recommended fields:

- First name
- Email — required
- Property Address — recommended
- Phone — optional
- Phone/Text Follow-Up Permission — optional, but required if phone/text follow-up is desired

Do not infer phone/text permission from an email report request. If the phone/text permission field is not affirmative, the CRM record gets `Prospecting Channel = Email` only. If it is affirmative and a phone number exists, `Call` and `Text` are added too.

The form's visible consent language should match those fields exactly. Email is used to deliver and follow up on the requested report. Phone/text contact should be a distinct optional permission if offered.

## Kit email automation

Use Kit's Visual Automation for subscriber-facing delivery rather than the portal.

Recommended flow:

1. Trigger: subscriber joins the expired-report form.
2. Send immediate acknowledgment confirming the request was received.
3. Deliver the report / next-step message according to the finalized offer workflow.
4. Keep any later nurture sequence aligned with the permission language on the form.

The webhook is only the CRM handoff; it is not the email sender.

## Webhook endpoint

Create a Kit V4 webhook endpoint with:

- URL: `https://portal.rachellesellsrealestate.com/api/kit-expired-optin`
- Event: `subscriber.subscribed_to_form`

When Kit creates the endpoint, it returns the endpoint signing secret in plaintext. Save it immediately; Kit does not return the same secret later.

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

## CRM behavior

For a new email address, the webhook creates a `Clients / Leads` row with:

- Source = Website
- Lead Type = Expired Listing
- Service Need = Expired Seller
- Pipeline Stage = New
- Permission to Follow Up = Yes
- Prospecting Channel = Email
- Call + Text only when explicit phone/text permission is present
- Property address / phone when submitted
- Compliance Notes with Kit event ID, form ID/name, subscriber ID, event timestamp, and exact consent scope

For an existing CRM record with the same email address, the webhook updates permission/channel evidence and fills blank phone/address values without overwriting the record's live pipeline/source/workflow state.

The Kit event UUID is written to `Compliance Notes`. Retries with the same event UUID are treated as duplicates so they do not create repeated CRM mutations.

Do not auto-merge by property address. Multiple decision-makers can legitimately share one address.

## One-time production test

After deployment and Kit configuration:

1. Submit the landing page using a test email and a test property address.
2. Confirm Kit sends the acknowledgment/delivery email.
3. Confirm exactly one CRM row is created or updated.
4. Confirm `Source = Website`, `Lead Type = Expired Listing`, `Service Need = Expired Seller`, and `Permission to Follow Up = Yes`.
5. Confirm `Prospecting Channel = Email` when phone/text permission was not checked.
6. Repeat with explicit phone/text permission; confirm Call + Text are added only then.
7. In Kit, resend/retry the same webhook event if available; confirm the event UUID prevents duplicate CRM work.
8. Confirm normal portal pages still redirect unauthenticated visitors to `/login` while the webhook endpoint remains publicly reachable for signed Kit POSTs.

## Done when

The external funnel is considered live only when the landing-page URL is recorded in Notion, the Kit form ID + webhook secret are set in Netlify, the acknowledgment/delivery automation is active, and one end-to-end test submission has successfully reached the real CRM.
