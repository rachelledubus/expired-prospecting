# Tracerfy recovery workflow

The MLS Intake page treats paid Tracerfy lookups as recoverable work, not disposable request state.

## Normal research

- Research runs one CLEAR address per server request.
- Each definitive lookup result is written to browser-local checkpoints before the next paid address starts.
- A refresh or later retry can reuse those checkpoints at $0 additional Tracerfy spend.
- Existing CRM duplicate protection remains active by default.

## Failed / uncertain request

If a request fails without a valid JSON result, the address is marked spend-uncertain and is blocked from automatic paid retry. This prevents a network or hosting failure after a successful upstream charge from causing a second accidental charge.

## Tracerfy history recovery

Export the **Instant Trace API History** CSV from Tracerfy and use **Recover already-run Tracerfy results — $0** on `/intake` after the MLS expired/current-status files are loaded and review matches are resolved.

The importer:

1. Parses `response_data` from the Tracerfy backup.
2. Matches only addresses currently classified CLEAR in the MLS Intake session.
3. Uses the newest backup response when the same address appears more than once.
4. Restores the owner/contact result without calling Tracerfy.
5. Saves a completed local checkpoint so normal research will not pay for that address again.

Clearing saved checkpoints is intentionally placed in Advanced and requires typing `CLEAR-CHECKPOINTS`, because clearing them can make previously researched-but-unpushed addresses eligible for another paid lookup.
