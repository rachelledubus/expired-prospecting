# Ownership Verification Architecture

Property Research is the ownership source of truth. CRM inherits verification; live call queues must only execute records whose related property has Owner Call Gate = READY.

BCPA is a human-confirmed source, not scraped by the portal. BCPA does not provide a stable unique per-property record URL. Use the shared BCPA Record Search page at https://web.bcpa.net/BcpaClient/#/Record-Search. When Matrix provides a folio/parcel identifier, the portal should normalize it into Property Research `Folio Number` so the human lookup can use that value; otherwise search BCPA by property address.

Verification statuses:
- Not Checked
- Verified Current Owner
- Verified Co-Owner
- Verified Authorized Rep
- Needs Deed Review
- Mismatch / Not Owner

Only the three Verified statuses make Owner Call Gate = READY. Ambiguous records stay HOLD and escalate to Broward Official Records as needed.
