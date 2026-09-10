# Ownership Verification Architecture

Property Research is the ownership source of truth. CRM inherits verification; live call queues must only execute records whose related property has Owner Call Gate = READY.

BCPA is a human-confirmed source, not scraped by the portal. Future Matrix exports should include a folio/parcel identifier when available so the portal can write a direct BCPA record link. If no folio is present, use the BCPA record search manually.

Verification statuses:
- Not Checked
- Verified Current Owner
- Verified Co-Owner
- Verified Authorized Rep
- Needs Deed Review
- Mismatch / Not Owner

Only the three Verified statuses make Owner Call Gate = READY. Ambiguous records stay HOLD and escalate to Broward Official Records as needed.
