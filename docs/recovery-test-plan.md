# Recovery smoke test

1. Load valid expired and Current Market Status CSVs in `/intake` and resolve review rows.
2. Import a Tracerfy Instant Trace API History CSV before unlocking the paid gate.
3. Confirm matching CLEAR addresses appear in Research Results with the recovery badge and no new API call.
4. Unlock the paid gate and run research. Confirm the button shows `Researching X of Y...` and only unmatched/uncheckpointed addresses are sent to Tracerfy.
5. Confirm each completed row remains visible immediately while later rows continue.
6. Simulate/observe a failed server response: earlier rows remain, the uncertain address is blocked against automatic paid retry, and remaining rows are not lost.
7. Push recovered/completed owner records to Notion and confirm the existing `Pushing X of Y...` counter and Property Research linking still work.
