# Tracerfy Instant Trace API History backup fields used by recovery

The recovery importer relies on the raw `response_data` JSON field from the Tracerfy Instant Trace API History CSV. It also reads `created_at` when present so that, if an address appears more than once, the newest response wins.

Required for recovery matching inside `response_data`:

- `address`
- `city`
- `zip`
- `persons` array

The remaining response fields, including `hit`, `persons_count`, `credits_deducted`, `meta.request_id`, `meta.timestamp`, phones, emails, DNC/TCPA flags, litigator status, deceased status, property-owner status, and mailing address, are preserved as returned by Tracerfy and flow through the normal Research Results → Notion push path.
