"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import {
  formatPhone,
  outreachEligibility,
  dncStatus,
  type LookupResult,
  type Person,
} from "@/lib/tracerfy";
import type { ExistingLeadRecord } from "@/lib/notion";
import {
  runMlsStatusCheck,
  type CurrentMarketColumnMap,
  type ExpiredColumnMap,
  type StatusDecision,
} from "@/lib/mls-status";

type FieldGuessMap<T extends Record<string, string>> = Record<keyof T, string[]>;

const EXPIRED_FIELD_GUESSES: FieldGuessMap<ExpiredColumnMap> = {
  address: ["address", "street address", "street", "property address", "property street address"],
  city: ["city", "property city"],
  state: ["state", "st", "property state"],
  zip: ["zip", "zip code", "postal code", "postal", "property zip"],
  folio: ["folio", "folio number", "parcel", "parcel id", "parcel number", "apn", "tax id"],
};

const CURRENT_FIELD_GUESSES: FieldGuessMap<CurrentMarketColumnMap> = {
  address: ["address", "street address", "street", "property address", "property street address"],
  city: ["city", "property city"],
  state: ["state", "st", "property state"],
  zip: ["zip", "zip code", "postal code", "postal", "property zip"],
  folio: ["folio", "folio number", "parcel", "parcel id", "parcel number", "apn", "tax id"],
  status: ["status", "listing status", "mls status", "status mls"],
  mls: ["mls #", "mls number", "mls", "listing id", "listing number"],
};

function guessColumn<T extends Record<string, string>>(
  headers: string[],
  field: keyof T,
  guessesByField: FieldGuessMap<T>
): string {
  const guesses = guessesByField[field];
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const guess of guesses) {
    const idx = lower.indexOf(guess);
    if (idx !== -1) return headers[idx];
  }
  for (const guess of guesses) {
    const idx = lower.findIndex((h) => h.includes(guess));
    if (idx !== -1) return headers[idx];
  }
  return "";
}

function buildMap<T extends Record<string, string>>(
  headers: string[],
  guesses: FieldGuessMap<T>
): T {
  return Object.fromEntries(
    (Object.keys(guesses) as (keyof T)[]).map((field) => [
      field,
      guessColumn<T>(headers, field, guesses),
    ])
  ) as T;
}

type PushKey = string;
type RowResult = LookupResult & { rowError?: string; alreadyInCrm?: ExistingLeadRecord[] };
type PushState = {
  status: "loading" | "done" | "error";
  message?: string;
  action?: "created" | "updated";
  otherRecordsAtAddress?: number;
};
type ReviewOverride = "clear" | "relisted";

function sourceValue(
  row: Record<string, string>,
  map: ExpiredColumnMap,
  field: keyof ExpiredColumnMap
) {
  return map[field] ? String(row[map[field]] ?? "").trim() : "";
}

export default function ImportPage() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [expiredFilename, setExpiredFilename] = useState("");
  const [columnMap, setColumnMap] = useState<ExpiredColumnMap>({
    address: "",
    city: "",
    state: "",
    zip: "",
    folio: "",
  });

  const [currentHeaders, setCurrentHeaders] = useState<string[]>([]);
  const [currentRows, setCurrentRows] = useState<Record<string, string>[]>([]);
  const [currentFilename, setCurrentFilename] = useState("");
  const [currentMap, setCurrentMap] = useState<CurrentMarketColumnMap>({
    address: "",
    city: "",
    state: "",
    zip: "",
    folio: "",
    status: "",
    mls: "",
  });

  const [statusDecisions, setStatusDecisions] = useState<StatusDecision[] | null>(null);
  const [reviewOverrides, setReviewOverrides] = useState<Record<number, ReviewOverride>>({});
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RowResult[] | null>(null);
  const [pushStatus, setPushStatus] = useState<Record<PushKey, PushState>>({});
  const [bulkPushProgress, setBulkPushProgress] = useState<{ current: number; total: number } | null>(null);
  const [forceAll, setForceAll] = useState(false);
  const [refreshingRow, setRefreshingRow] = useState<number | null>(null);
  const [sourceSearch, setSourceSearch] = useState("");

  function resetDownstream() {
    setStatusDecisions(null);
    setReviewOverrides({});
    setResults(null);
    setPushStatus({});
    setError(null);
  }

  function handleExpiredFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        const fields = parsed.meta.fields ?? [];
        setExpiredFilename(file.name);
        setHeaders(fields);
        setCsvRows(parsed.data);
        setColumnMap(buildMap<ExpiredColumnMap>(fields, EXPIRED_FIELD_GUESSES));
        resetDownstream();
      },
      error: (err) => setError(`Could not read expired CSV: ${err.message}`),
    });
  }

  function handleCurrentFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        const fields = parsed.meta.fields ?? [];
        setCurrentFilename(file.name);
        setCurrentHeaders(fields);
        setCurrentRows(parsed.data);
        setCurrentMap(buildMap<CurrentMarketColumnMap>(fields, CURRENT_FIELD_GUESSES));
        resetDownstream();
      },
      error: (err) => setError(`Could not read current-market CSV: ${err.message}`),
    });
  }

  const mappingComplete = Boolean(columnMap.address && columnMap.city && columnMap.state && columnMap.zip);
  const currentMappingComplete = Boolean(currentMap.folio || currentMap.address);

  function handleStatusCheck() {
    if (!mappingComplete || !currentMappingComplete) return;
    setError(null);
    setResults(null);
    setPushStatus({});
    setReviewOverrides({});
    setStatusDecisions(runMlsStatusCheck(csvRows, columnMap, currentRows, currentMap));
  }

  const effectiveDecisions = useMemo(() => {
    if (!statusDecisions) return [];
    return statusDecisions.map((decision) => ({
      ...decision,
      status: reviewOverrides[decision.sourceIndex] ?? decision.status,
    }));
  }, [statusDecisions, reviewOverrides]);

  const clearCount = effectiveDecisions.filter((d) => d.status === "clear").length;
  const relistedCount = effectiveDecisions.filter((d) => d.status === "relisted").length;
  const unresolvedReviews = statusDecisions?.filter(
    (d) => d.status === "review" && !reviewOverrides[d.sourceIndex]
  ) ?? [];
  const statusReady = Boolean(statusDecisions && unresolvedReviews.length === 0);

  const clearSourceIndexes = useMemo(
    () => new Set(effectiveDecisions.filter((d) => d.status === "clear").map((d) => d.sourceIndex)),
    [effectiveDecisions]
  );

  async function handleProcess() {
    if (!mappingComplete || !statusReady) return;
    setProcessing(true);
    setError(null);

    const rows = csvRows
      .map((row, sourceIndex) => ({
        sourceIndex,
        address: row[columnMap.address]?.trim() ?? "",
        city: row[columnMap.city]?.trim() ?? "",
        state: row[columnMap.state]?.trim() ?? "",
        zip: row[columnMap.zip]?.trim() ?? "",
      }))
      .filter((r) => clearSourceIndexes.has(r.sourceIndex) && r.address && r.city && r.state && r.zip)
      .map(({ sourceIndex: _sourceIndex, ...row }) => row);

    if (rows.length === 0) {
      setError("No CLEAR properties are available to skip trace.");
      setProcessing(false);
      return;
    }

    try {
      const res = await fetch("/api/bulk-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, forceAll }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Bulk lookup failed.");
        return;
      }

      setResults(data.results);
    } catch {
      setError("Something went wrong reaching the lookup service.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleForceRefreshRow(i: number) {
    if (!results) return;
    const row = results[i];
    setRefreshingRow(i);
    try {
      const res = await fetch("/api/property-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: row.address,
          city: row.city,
          state: row.state,
          zip: row.zip,
          force: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Refresh failed.");
        return;
      }
      setResults((prev) => {
        if (!prev) return prev;
        const next = [...prev];
        next[i] = data;
        return next;
      });
    } catch {
      setError("Something went wrong reaching the lookup service.");
    } finally {
      setRefreshingRow(null);
    }
  }

  async function handlePushToNotion(rowResult: LookupResult, person: Person, key: string) {
    setPushStatus((prev) => ({ ...prev, [key]: { status: "loading" } }));
    try {
      const res = await fetch("/api/notion-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person,
          address: rowResult.address,
          city: rowResult.city,
          state: rowResult.state,
          zip: rowResult.zip,
          requestId: rowResult.meta?.request_id,
          timestamp: rowResult.meta?.timestamp,
          sourceSearch: sourceSearch.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setPushStatus((prev) => ({
          ...prev,
          [key]: { status: "error", message: data?.error ?? `Failed (${res.status})` },
        }));
        return;
      }
      setPushStatus((prev) => ({
        ...prev,
        [key]: {
          status: "done",
          action: data?.action,
          otherRecordsAtAddress: data?.otherRecordsAtAddress,
        },
      }));
    } catch {
      setPushStatus((prev) => ({ ...prev, [key]: { status: "error", message: "Network error" } }));
    }
  }

  async function handlePushAllToNotion() {
    if (!results) return;

    const toPush: { rowResult: RowResult; person: Person; key: string }[] = [];
    results.forEach((row, i) => {
      if (row.rowError || !row.hit || row.persons_count === 0) return;
      row.persons.forEach((person, j) => {
        const key = `${i}-${j}`;
        if (pushStatus[key]?.status === "done") return;
        toPush.push({ rowResult: row, person, key });
      });
    });

    if (toPush.length === 0) return;

    setBulkPushProgress({ current: 0, total: toPush.length });
    for (let i = 0; i < toPush.length; i++) {
      const { rowResult, person, key } = toPush[i];
      await handlePushToNotion(rowResult, person, key);
      setBulkPushProgress({ current: i + 1, total: toPush.length });
    }
    setBulkPushProgress(null);
  }

  const hitCount = results?.filter((r) => r.hit).length ?? 0;
  const pushablePersonCount =
    results?.reduce((sum, row) => {
      if (row.rowError || !row.hit) return sum;
      return sum + row.persons.length;
    }, 0) ?? 0;
  const remainingToPush =
    results?.reduce((sum, row, i) => {
      if (row.rowError || !row.hit) return sum;
      return sum + row.persons.filter((_, j) => pushStatus[`${i}-${j}`]?.status !== "done").length;
    }, 0) ?? 0;

  return (
    <div className="page">
      <div className="top-bar">
        <div>
          <h1>Process Expired Listings</h1>
          <p className="muted">Verify current MLS status first. Only CLEAR properties can reach Tracerfy.</p>
        </div>
        <a href="/">&larr; Dashboard</a>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>1. Upload expired batch</h2>
        <div className="field">
          <label htmlFor="expiredCsv">Expired MLS CSV</label>
          <input id="expiredCsv" type="file" accept=".csv" onChange={handleExpiredFile} />
        </div>
        <div className="field">
          <label htmlFor="sourceSearch">Saved search name (optional)</label>
          <input
            id="sourceSearch"
            placeholder="e.g. New Expireds"
            value={sourceSearch}
            onChange={(e) => setSourceSearch(e.target.value)}
          />
        </div>

        {headers.length > 0 && (
          <details>
            <summary className="muted">
              {expiredFilename || "Expired CSV"}: {csvRows.length} rows · check column mapping
            </summary>
            <div style={{ marginTop: 12 }}>
              {(["address", "city", "state", "zip", "folio"] as const).map((field) => (
                <div className="field" key={field}>
                  <label htmlFor={`expired-${field}`}>
                    {field === "folio" ? "Folio / Parcel (recommended)" : `${field[0].toUpperCase()}${field.slice(1)} column`}
                  </label>
                  <select
                    id={`expired-${field}`}
                    value={columnMap[field]}
                    onChange={(e) => {
                      setColumnMap((prev) => ({ ...prev, [field]: e.target.value }));
                      resetDownstream();
                    }}
                  >
                    <option value="">-- {field === "folio" ? "not available" : "select column"} --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>2. Upload current market export</h2>
        <p className="muted">
          Use one Matrix export covering your prospecting area for Coming Soon, Active, Active Under Contract / Backup, and Pending. Every row in this file is treated as market-live.
        </p>
        <div className="field">
          <label htmlFor="currentCsv">Current market-live MLS CSV</label>
          <input id="currentCsv" type="file" accept=".csv" onChange={handleCurrentFile} />
        </div>

        {currentHeaders.length > 0 && (
          <details>
            <summary className="muted">
              {currentFilename || "Current market CSV"}: {currentRows.length} rows · check column mapping
            </summary>
            <div style={{ marginTop: 12 }}>
              {(["address", "city", "state", "zip", "folio", "status", "mls"] as const).map((field) => (
                <div className="field" key={field}>
                  <label htmlFor={`current-${field}`}>
                    {field === "folio" ? "Folio / Parcel" : field === "mls" ? "MLS number (display only)" : field === "status" ? "Status (display only)" : `${field[0].toUpperCase()}${field.slice(1)} column`}
                  </label>
                  <select
                    id={`current-${field}`}
                    value={currentMap[field]}
                    onChange={(e) => {
                      setCurrentMap((prev) => ({ ...prev, [field]: e.target.value }));
                      resetDownstream();
                    }}
                  >
                    <option value="">-- not available --</option>
                    {currentHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </details>
        )}

        {headers.length > 0 && currentHeaders.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <button onClick={handleStatusCheck} disabled={!mappingComplete || !currentMappingComplete}>
              Check {csvRows.length} expired properties against current MLS
            </button>
            {!mappingComplete && <p className="error">Map address, city, state, and ZIP in the expired CSV.</p>}
            {!currentMappingComplete && <p className="error">Map either Folio / Parcel or Address in the current-market CSV.</p>}
          </div>
        )}
        <p className="meta">Status comparison happens in your browser. No Tracerfy request is made until Step 4.</p>
        {error && <p className="error">{error}</p>}
      </div>

      {statusDecisions && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>3. Status check</h2>
          <p className="meta" style={{ marginTop: 0 }}>
            {statusDecisions.length} checked · 🟢 {clearCount} clear · 🔴 {relistedCount} relisted · 🟡 {unresolvedReviews.length} review
          </p>

          {unresolvedReviews.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <strong>Resolve these before skip tracing:</strong>
              {unresolvedReviews.map((decision) => {
                const source = csvRows[decision.sourceIndex];
                const sourceAddress = sourceValue(source, columnMap, "address");
                const sourceCity = sourceValue(source, columnMap, "city");
                const sourceState = sourceValue(source, columnMap, "state");
                const sourceZip = sourceValue(source, columnMap, "zip");
                return (
                  <div className="person-card" key={decision.sourceIndex}>
                    <strong>{sourceAddress}, {sourceCity} {sourceState} {sourceZip}</strong>
                    <p className="muted" style={{ marginTop: 6 }}>{decision.reason}</p>
                    {decision.matched && (
                      <p className="muted" style={{ marginTop: 4 }}>
                        Possible current match: <strong>{decision.matched.address || "address unavailable"}</strong>
                        {decision.matched.city ? `, ${decision.matched.city}` : ""}
                        {decision.matched.zip ? ` ${decision.matched.zip}` : ""}
                        {decision.matched.status ? ` · ${decision.matched.status}` : ""}
                        {decision.matched.mls ? ` · MLS ${decision.matched.mls}` : ""}
                      </p>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                      <button
                        className="secondary"
                        onClick={() => setReviewOverrides((prev) => ({ ...prev, [decision.sourceIndex]: "clear" }))}
                      >
                        Mark CLEAR
                      </button>
                      <button
                        className="secondary"
                        onClick={() => setReviewOverrides((prev) => ({ ...prev, [decision.sourceIndex]: "relisted" }))}
                      >
                        Mark RELISTED
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {relistedCount > 0 && (
            <details style={{ marginTop: 16 }}>
              <summary className="muted">Show {relistedCount} excluded relisted properties</summary>
              <div style={{ marginTop: 10 }}>
                {effectiveDecisions.filter((d) => d.status === "relisted").map((decision) => {
                  const source = csvRows[decision.sourceIndex];
                  return (
                    <p className="muted" key={decision.sourceIndex} style={{ marginTop: 6 }}>
                      🔴 <strong>{sourceValue(source, columnMap, "address")}</strong>
                      {decision.matched?.status ? ` · ${decision.matched.status}` : ""}
                      {decision.matched?.mls ? ` · MLS ${decision.matched.mls}` : ""}
                      {decision.matchMethod ? ` · matched by ${decision.matchMethod}` : " · manually marked"}
                    </p>
                  );
                })}
              </div>
            </details>
          )}

          {statusReady && (
            <div style={{ marginTop: 18 }}>
              <div className="field" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  id="forceAll"
                  type="checkbox"
                  style={{ width: "auto" }}
                  checked={forceAll}
                  onChange={(e) => setForceAll(e.target.checked)}
                />
                <label htmlFor="forceAll" style={{ margin: 0 }}>
                  Refresh Tracerfy data even for addresses already in your CRM
                </label>
              </div>
              <button onClick={handleProcess} disabled={processing || clearCount === 0}>
                {processing ? "Processing CLEAR properties..." : `4. Continue: Skip trace ${clearCount} CLEAR properties`}
              </button>
              {clearCount === 0 && <p className="muted">Nothing to skip trace — every property was excluded.</p>}
            </div>
          )}
        </div>
      )}

      {results && (
        <div style={{ marginTop: 20 }}>
          <div className="top-bar" style={{ marginBottom: 0 }}>
            <p className="meta" style={{ marginTop: 0 }}>
              {results.length} CLEAR address(es) sent to lookup · {hitCount} with owner/contact info found
            </p>
            {pushablePersonCount > 0 && (
              <button onClick={handlePushAllToNotion} disabled={!!bulkPushProgress || remainingToPush === 0}>
                {bulkPushProgress
                  ? `Pushing ${bulkPushProgress.current} of ${bulkPushProgress.total}...`
                  : remainingToPush === 0
                    ? "All pushed to CRM"
                    : `Push all ${remainingToPush} to Notion`}
              </button>
            )}
          </div>

          {results.map((row, i) => (
            <div className="panel" key={i} style={{ marginTop: 12 }}>
              <strong>{row.address}, {row.city} {row.state} {row.zip}</strong>

              {row.rowError ? (
                <p className="error" style={{ marginTop: 8 }}>{row.rowError}</p>
              ) : row.alreadyInCrm ? (
                <div style={{ marginTop: 8 }}>
                  <p className="muted">Already researched — no Tracerfy credits spent:</p>
                  {row.alreadyInCrm.map((r) => (
                    <p key={r.url} className="muted" style={{ marginTop: 4 }}>
                      <strong>{r.name}</strong> — {r.pipelineStage ?? "unknown stage"} · scrubbed {r.dncScrubDate ?? "unknown date"} ·{" "}
                      <a href={r.url} target="_blank" rel="noreferrer">Open in Notion</a>
                    </p>
                  ))}
                  <button
                    className="secondary"
                    style={{ marginTop: 8 }}
                    onClick={() => handleForceRefreshRow(i)}
                    disabled={refreshingRow === i}
                  >
                    {refreshingRow === i ? "Refreshing..." : "Refresh this one anyway (~5 credits)"}
                  </button>
                </div>
              ) : !row.hit || row.persons_count === 0 ? (
                <p className="muted" style={{ marginTop: 8 }}>No owner/contact records found.</p>
              ) : (
                row.persons.map((person, j) => {
                  const key = `${i}-${j}`;
                  const push = pushStatus[key];
                  return (
                    <div className="person-card" key={j}>
                      <strong>{person.full_name}</strong>
                      {person.litigator && <span className="badge bad">LITIGATOR — DO NOT CONTACT</span>}
                      {person.deceased && <span className="badge bad">DECEASED</span>}

                      <p className="muted" style={{ marginTop: 6 }}>
                        DNC: {dncStatus(person)} · Eligible for: {outreachEligibility(person).join(", ")}
                      </p>

                      {person.phones?.map((phone, k) => (
                        <div className="phone-row" key={k}>
                          <span>{formatPhone(phone.number)}</span>
                          <span className="muted">{phone.type}</span>
                          {phone.dnc ? <span className="badge bad">DNC</span> : <span className="badge ok">CLEAR</span>}
                          {phone.tcpa && <span className="badge warn">TCPA</span>}
                        </div>
                      ))}

                      <div style={{ marginTop: 10 }}>
                        <button
                          className="secondary"
                          disabled={push?.status === "loading" || push?.status === "done"}
                          onClick={() => handlePushToNotion(row, person, key)}
                        >
                          {push?.status === "done"
                            ? push.action === "updated"
                              ? "Updated in CRM"
                              : "Added to CRM"
                            : push?.status === "loading"
                              ? "Adding..."
                              : "Add to Notion"}
                        </button>
                        {push?.status === "error" && <span className="error"> {push.message}</span>}
                        {push?.status === "done" && !!push.otherRecordsAtAddress && (
                          <p className="error" style={{ marginTop: 6 }}>
                            ⚠️ {push.otherRecordsAtAddress} other record{push.otherRecordsAtAddress > 1 ? "s" : ""} found at this address under a different name — check "Possible Other Names" on this record before assuming it&apos;s a new lead.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
