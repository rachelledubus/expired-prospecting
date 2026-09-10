"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import {
  MATRIX_COLUMNS,
  buildMatrixIntakeFile,
  calculateMarketMetrics,
  statusSummary,
  validateMatrixExport,
  type MatrixExportKind,
  type MatrixIntakeFile,
} from "@/lib/mls-intake";
import {
  runMlsStatusCheck,
  type CurrentMarketColumnMap,
  type ExpiredColumnMap,
  type StatusDecision,
} from "@/lib/mls-status";
import {
  formatPhone,
  outreachEligibility,
  dncStatus,
  type LookupResult,
  type Person,
} from "@/lib/tracerfy";
import type { ExistingLeadRecord } from "@/lib/notion";

const KIND_LABELS: Record<MatrixExportKind, string> = {
  expired: "Expired Listings",
  current: "Current Market Status",
  active: "Active Inventory",
  new: "New Listings",
  closed: "Closed Sales",
  unknown: "Needs Classification",
};

const EXPIRED_MAP: ExpiredColumnMap = {
  address: MATRIX_COLUMNS.address,
  city: MATRIX_COLUMNS.city,
  state: "",
  zip: MATRIX_COLUMNS.zip,
  folio: "",
};

const CURRENT_MAP: CurrentMarketColumnMap = {
  address: MATRIX_COLUMNS.address,
  city: MATRIX_COLUMNS.city,
  state: "",
  zip: MATRIX_COLUMNS.zip,
  folio: "",
  status: MATRIX_COLUMNS.status,
  mls: MATRIX_COLUMNS.mls,
};

type RowResult = LookupResult & { rowError?: string; alreadyInCrm?: ExistingLeadRecord[] };
type PushState = {
  status: "loading" | "done" | "error";
  message?: string;
  action?: "created" | "updated";
  otherRecordsAtAddress?: number;
};

function money(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function number(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

export default function MlsIntakePage() {
  const [files, setFiles] = useState<MatrixIntakeFile[]>([]);
  const [overrides, setOverrides] = useState<Record<string, MatrixExportKind>>({});
  const [reviewOverrides, setReviewOverrides] = useState<Record<number, "clear" | "relisted">>({});
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<RowResult[] | null>(null);
  const [forceAll, setForceAll] = useState(false);
  const [pushStatus, setPushStatus] = useState<Record<string, PushState>>({});
  const [bulkPushProgress, setBulkPushProgress] = useState<{ current: number; total: number } | null>(null);
  const [refreshingRow, setRefreshingRow] = useState<number | null>(null);

  function effectiveKind(file: MatrixIntakeFile) {
    return overrides[file.id] ?? file.kind;
  }

  function validationFor(file: MatrixIntakeFile) {
    return validateMatrixExport(effectiveKind(file), file.headers, file.rows);
  }

  function resetResearch() {
    setResults(null);
    setPushStatus({});
    setBulkPushProgress(null);
    setError(null);
  }

  async function handleFiles(selected: FileList | null) {
    if (!selected?.length) return;
    setError(null);

    const parsedFiles = await Promise.all(
      Array.from(selected).map(
        (file) =>
          new Promise<MatrixIntakeFile>((resolve, reject) => {
            Papa.parse<Record<string, string>>(file, {
              header: true,
              skipEmptyLines: true,
              complete: (parsed) => {
                const headers = parsed.meta.fields ?? [];
                resolve(
                  buildMatrixIntakeFile(
                    file.name,
                    headers,
                    parsed.data,
                    `${file.name}-${file.size}-${file.lastModified}`
                  )
                );
              },
              error: reject,
            });
          })
      )
    ).catch((err) => {
      setError(
        `Could not read one of the CSV files: ${err instanceof Error ? err.message : String(err)}`
      );
      return null;
    });

    if (!parsedFiles) return;

    setFiles((previous) => {
      const byId = new Map(previous.map((f) => [f.id, f]));
      for (const file of parsedFiles) byId.set(file.id, file);
      return Array.from(byId.values());
    });
    setReviewOverrides({});
    resetResearch();
  }

  function setFileKind(file: MatrixIntakeFile, kind: MatrixExportKind) {
    setOverrides((prev) => ({ ...prev, [file.id]: kind }));
    setReviewOverrides({});
    resetResearch();
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setReviewOverrides({});
    resetResearch();
  }

  const expiredFile = files.find(
    (file) => effectiveKind(file) === "expired" && validationFor(file).errors.length === 0
  );
  const currentFile = files.find(
    (file) => effectiveKind(file) === "current" && validationFor(file).errors.length === 0
  );

  const statusDecisions = useMemo<StatusDecision[] | null>(() => {
    if (!expiredFile || !currentFile) return null;
    return runMlsStatusCheck(expiredFile.rows, EXPIRED_MAP, currentFile.rows, CURRENT_MAP);
  }, [expiredFile, currentFile]);

  const effectiveDecisions = useMemo(
    () =>
      statusDecisions?.map((decision) => ({
        ...decision,
        status: reviewOverrides[decision.sourceIndex] ?? decision.status,
      })) ?? [],
    [statusDecisions, reviewOverrides]
  );

  const clearCount = effectiveDecisions.filter((d) => d.status === "clear").length;
  const relistedCount = effectiveDecisions.filter((d) => d.status === "relisted").length;
  const unresolvedReviews =
    statusDecisions?.filter(
      (d) => d.status === "review" && !reviewOverrides[d.sourceIndex]
    ) ?? [];

  const unknownFiles = files.filter((file) => effectiveKind(file) === "unknown");
  const brokenFiles = files.filter((file) => validationFor(file).errors.length > 0);
  const marketFiles = files.filter(
    (file) =>
      ["active", "new", "closed"].includes(effectiveKind(file)) &&
      validationFor(file).errors.length === 0
  );
  const missingCurrentForExpired = Boolean(expiredFile && !currentFile);
  const intakeReady =
    files.length > 0 &&
    unknownFiles.length === 0 &&
    brokenFiles.length === 0 &&
    !missingCurrentForExpired &&
    unresolvedReviews.length === 0;

  const clearSourceIndexes = useMemo(
    () =>
      new Set(
        effectiveDecisions
          .filter((d) => d.status === "clear")
          .map((d) => d.sourceIndex)
      ),
    [effectiveDecisions]
  );

  async function handleResearchClear() {
    if (!expiredFile || !statusDecisions || unresolvedReviews.length > 0 || clearCount === 0) return;

    const rows = expiredFile.rows
      .map((row, sourceIndex) => ({
        sourceIndex,
        address: String(row[MATRIX_COLUMNS.address] ?? "").trim(),
        city: String(row[MATRIX_COLUMNS.city] ?? "").trim(),
        state: "FL",
        zip: String(row[MATRIX_COLUMNS.zip] ?? "").trim(),
      }))
      .filter(
        (row) =>
          clearSourceIndexes.has(row.sourceIndex) &&
          row.address &&
          row.city &&
          row.zip
      )
      .map(({ sourceIndex: _sourceIndex, ...row }) => row);

    if (!rows.length) {
      setError("No CLEAR properties are available to research.");
      return;
    }

    setProcessing(true);
    setError(null);
    setResults(null);
    setPushStatus({});

    try {
      const response = await fetch("/api/bulk-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, forceAll }),
      });
      const data = await response.json();
      if (!response.ok) {
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

  async function handleForceRefreshRow(index: number) {
    if (!results) return;
    const row = results[index];
    setRefreshingRow(index);
    setError(null);

    try {
      const response = await fetch("/api/property-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: row.address,
          city: row.city,
          state: "FL",
          zip: row.zip,
          force: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Refresh failed.");
        return;
      }
      setResults((previous) => {
        if (!previous) return previous;
        const next = [...previous];
        next[index] = data;
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
      const response = await fetch("/api/notion-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person,
          address: rowResult.address,
          city: rowResult.city,
          state: "FL",
          zip: rowResult.zip,
          requestId: rowResult.meta?.request_id,
          timestamp: rowResult.meta?.timestamp,
          sourceSearch: expiredFile?.filename,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setPushStatus((prev) => ({
          ...prev,
          [key]: {
            status: "error",
            message: data?.error ?? `Failed (${response.status})`,
          },
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
      setPushStatus((prev) => ({
        ...prev,
        [key]: { status: "error", message: "Network error" },
      }));
    }
  }

  async function handlePushAllToNotion() {
    if (!results) return;

    const toPush: { rowResult: RowResult; person: Person; key: string }[] = [];
    results.forEach((row, rowIndex) => {
      if (row.rowError || !row.hit || row.persons_count === 0) return;
      row.persons.forEach((person, personIndex) => {
        const key = `${rowIndex}-${personIndex}`;
        if (pushStatus[key]?.status === "done") return;
        toPush.push({ rowResult: row, person, key });
      });
    });

    if (!toPush.length) return;

    setBulkPushProgress({ current: 0, total: toPush.length });
    for (let index = 0; index < toPush.length; index += 1) {
      const item = toPush[index];
      await handlePushToNotion(item.rowResult, item.person, item.key);
      setBulkPushProgress({ current: index + 1, total: toPush.length });
    }
    setBulkPushProgress(null);
  }

  const hitCount = results?.filter((row) => row.hit).length ?? 0;
  const creditsSpent = results?.reduce((sum, row) => sum + (row.credits_deducted ?? 0), 0) ?? 0;
  const pushablePersonCount =
    results?.reduce((sum, row) => {
      if (row.rowError || !row.hit) return sum;
      return sum + row.persons.length;
    }, 0) ?? 0;
  const remainingToPush =
    results?.reduce((sum, row, rowIndex) => {
      if (row.rowError || !row.hit) return sum;
      return (
        sum +
        row.persons.filter(
          (_, personIndex) => pushStatus[`${rowIndex}-${personIndex}`]?.status !== "done"
        ).length
      );
    }, 0) ?? 0;

  return (
    <div className="page">
      <div className="top-bar">
        <div>
          <h1>MLS Intake</h1>
          <p className="muted">
            Run your Matrix saved searches, export the CSVs, then drop them here. The portal handles the rest.
          </p>
        </div>
        <a href="/">&larr; Dashboard</a>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>1. Drop Matrix exports</h2>
        <p className="muted">
          Upload one or several CSVs at once. Known MIAMI Matrix columns are mapped automatically.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          multiple
          onChange={(event) => handleFiles(event.target.files)}
        />
        {error && <p className="error">{error}</p>}
      </div>

      {files.length > 0 && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>2. Recognized exports</h2>
          {files.map((file) => {
            const kind = effectiveKind(file);
            const validation = validationFor(file);
            const statuses = statusSummary(file.rows);

            return (
              <div className="person-card" key={file.id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>
                      {validation.errors.length ? "⚠" : kind === "unknown" ? "🟡" : "✓"}{" "}
                      {KIND_LABELS[kind]}
                    </strong>
                    <p className="muted" style={{ marginTop: 4 }}>
                      {file.filename} · {file.rows.length} rows · {file.confidence} confidence
                    </p>
                  </div>
                  <button className="secondary" onClick={() => removeFile(file.id)}>
                    Remove
                  </button>
                </div>

                {file.reasons.map((reason) => (
                  <p className="meta" key={reason} style={{ marginTop: 5 }}>
                    {reason}
                  </p>
                ))}
                {validation.errors.map((message) => (
                  <p className="error" key={message}>
                    {message}. Re-export using the expected Matrix export preset.
                  </p>
                ))}
                {validation.warnings.map((message) => (
                  <p className="muted" key={message}>
                    ⚠ {message}
                  </p>
                ))}

                {statuses.length > 0 && (
                  <p className="meta" style={{ marginTop: 8 }}>
                    Statuses: {statuses.map((status) => `${status.label}: ${status.count}`).join(" · ")}
                  </p>
                )}

                {kind === "unknown" && (
                  <div style={{ marginTop: 10 }}>
                    <label htmlFor={`kind-${file.id}`}>What did you export?</label>
                    <select
                      id={`kind-${file.id}`}
                      value={kind}
                      onChange={(event) =>
                        setFileKind(file, event.target.value as MatrixExportKind)
                      }
                    >
                      <option value="unknown">Choose...</option>
                      <option value="current">Current Market Status</option>
                      <option value="expired">Expired Listings</option>
                      <option value="active">Active Inventory</option>
                      <option value="new">New Listings</option>
                      <option value="closed">Closed Sales</option>
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {marketFiles.length > 0 && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>3. Market data</h2>
          <p className="muted">
            Calculated automatically from the uploaded Matrix exports. No Tracerfy requests are made here.
          </p>
          {marketFiles.map((file) => {
            const metrics = calculateMarketMetrics(file.rows);
            return (
              <div className="person-card" key={`market-${file.id}`}>
                <strong>
                  {KIND_LABELS[effectiveKind(file)]} · {metrics.listings} listings
                </strong>
                <p className="muted" style={{ marginTop: 7 }}>
                  Median list: {money(metrics.medianListPrice)} · Median sale: {money(metrics.medianSalePrice)} · Median DOM: {number(metrics.medianDom)} · Median CDOM: {number(metrics.medianCdom)}
                  {metrics.medianSaleToList !== null
                    ? ` · Sale-to-list: ${(metrics.medianSaleToList * 100).toFixed(1)}%`
                    : ""}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {(expiredFile || currentFile) && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>4. Expired prospecting gate</h2>
          {!expiredFile && <p className="muted">Add your expired-listing CSV.</p>}
          {!currentFile && (
            <p className="muted">
              Add your fresh Current Market Status CSV before any expired property can continue.
            </p>
          )}

          {statusDecisions && (
            <>
              <p className="meta">
                {statusDecisions.length} checked · 🟢 {clearCount} clear · 🔴 {relistedCount} relisted · 🟡 {unresolvedReviews.length} review
              </p>

              {unresolvedReviews.map((decision) => {
                const row = expiredFile!.rows[decision.sourceIndex];
                return (
                  <div className="person-card" key={decision.sourceIndex}>
                    <strong>
                      {row[MATRIX_COLUMNS.address]}, {row[MATRIX_COLUMNS.city]} {row[MATRIX_COLUMNS.zip]}
                    </strong>
                    <p className="muted" style={{ marginTop: 5 }}>
                      {decision.reason}
                    </p>
                    {decision.matched && (
                      <p className="meta">
                        Possible current match: {decision.matched.address}
                        {decision.matched.status ? ` · ${decision.matched.status}` : ""}
                        {decision.matched.mls ? ` · MLS ${decision.matched.mls}` : ""}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        className="secondary"
                        onClick={() => {
                          setReviewOverrides((prev) => ({
                            ...prev,
                            [decision.sourceIndex]: "clear",
                          }));
                          resetResearch();
                        }}
                      >
                        Mark CLEAR
                      </button>
                      <button
                        className="secondary"
                        onClick={() => {
                          setReviewOverrides((prev) => ({
                            ...prev,
                            [decision.sourceIndex]: "relisted",
                          }));
                          resetResearch();
                        }}
                      >
                        Mark RELISTED
                      </button>
                    </div>
                  </div>
                );
              })}

              {unresolvedReviews.length === 0 && (
                <>
                  <p className="muted">
                    ✓ Status gate complete. {clearCount} properties can continue; {relistedCount} are excluded before paid lookup.
                  </p>
                  <div className="field" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      id="forceAll"
                      type="checkbox"
                      style={{ width: "auto" }}
                      checked={forceAll}
                      onChange={(event) => setForceAll(event.target.checked)}
                    />
                    <label htmlFor="forceAll" style={{ margin: 0 }}>
                      Refresh Tracerfy data even for addresses already in your CRM
                    </label>
                  </div>
                  <button
                    onClick={handleResearchClear}
                    disabled={processing || clearCount === 0}
                  >
                    {processing
                      ? "Researching CLEAR properties..."
                      : `5. Research ${clearCount} CLEAR properties`}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {results && (
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="top-bar" style={{ marginBottom: 8 }}>
            <div>
              <h2 style={{ marginTop: 0 }}>5. Research results</h2>
              <p className="meta" style={{ marginTop: 0 }}>
                {results.length} addresses processed · {hitCount} with owner/contact info · {creditsSpent} Tracerfy credits charged
              </p>
            </div>
            {pushablePersonCount > 0 && (
              <button
                onClick={handlePushAllToNotion}
                disabled={Boolean(bulkPushProgress) || remainingToPush === 0}
              >
                {bulkPushProgress
                  ? `Pushing ${bulkPushProgress.current} of ${bulkPushProgress.total}...`
                  : remainingToPush === 0
                    ? "All pushed to CRM"
                    : `Push all ${remainingToPush} to Notion`}
              </button>
            )}
          </div>

          {results.map((row, rowIndex) => (
            <div className="person-card" key={`${row.address}-${rowIndex}`}>
              <strong>
                {row.address}, {row.city} FL {row.zip}
              </strong>

              {row.rowError ? (
                <p className="error" style={{ marginTop: 8 }}>
                  {row.rowError}
                </p>
              ) : row.alreadyInCrm ? (
                <div style={{ marginTop: 8 }}>
                  <p className="muted">Already researched — no Tracerfy credits spent:</p>
                  {row.alreadyInCrm.map((record) => (
                    <p className="muted" key={record.url} style={{ marginTop: 4 }}>
                      <strong>{record.name}</strong> — {record.pipelineStage ?? "unknown stage"} · scrubbed {record.dncScrubDate ?? "unknown date"} ·{" "}
                      <a href={record.url} target="_blank" rel="noreferrer">
                        Open in Notion
                      </a>
                    </p>
                  ))}
                  <button
                    className="secondary"
                    style={{ marginTop: 8 }}
                    onClick={() => handleForceRefreshRow(rowIndex)}
                    disabled={refreshingRow === rowIndex}
                  >
                    {refreshingRow === rowIndex
                      ? "Refreshing..."
                      : "Refresh this one anyway (~5 credits)"}
                  </button>
                </div>
              ) : !row.hit || row.persons_count === 0 ? (
                <p className="muted" style={{ marginTop: 8 }}>
                  No owner/contact records found.
                </p>
              ) : (
                row.persons.map((person, personIndex) => {
                  const key = `${rowIndex}-${personIndex}`;
                  const push = pushStatus[key];
                  return (
                    <div className="person-card" key={key}>
                      <strong>{person.full_name}</strong>
                      {person.litigator && (
                        <span className="badge bad">LITIGATOR — DO NOT CONTACT</span>
                      )}
                      {person.deceased && <span className="badge bad">DECEASED</span>}

                      <p className="muted" style={{ marginTop: 6 }}>
                        DNC: {dncStatus(person)} · Eligible for: {outreachEligibility(person).join(", ")}
                      </p>

                      {person.phones?.map((phone, phoneIndex) => (
                        <div className="phone-row" key={`${key}-${phoneIndex}`}>
                          <span>{formatPhone(phone.number)}</span>
                          <span className="muted">{phone.type}</span>
                          {phone.dnc ? (
                            <span className="badge bad">DNC</span>
                          ) : (
                            <span className="badge ok">CLEAR</span>
                          )}
                          {phone.tcpa && <span className="badge warn">TCPA</span>}
                        </div>
                      ))}

                      <div style={{ marginTop: 10 }}>
                        <button
                          className="secondary"
                          onClick={() => handlePushToNotion(row, person, key)}
                          disabled={push?.status === "loading" || push?.status === "done"}
                        >
                          {push?.status === "loading"
                            ? "Pushing..."
                            : push?.status === "done"
                              ? "In Notion ✓"
                              : "Push to Notion"}
                        </button>
                        {push?.status === "error" && (
                          <span className="error" style={{ marginLeft: 8 }}>
                            {push.message}
                          </span>
                        )}
                        {push?.status === "done" && push.otherRecordsAtAddress ? (
                          <span className="muted" style={{ marginLeft: 8 }}>
                            {push.action}; {push.otherRecordsAtAddress} other record(s) already use this address
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>Completion</h2>
          {intakeReady ? (
            <>
              <p>
                <strong>✓ MLS intake is valid.</strong>
              </p>
              {statusDecisions && !results && clearCount > 0 && (
                <p className="muted">
                  Your next action is already above: research the {clearCount} CLEAR expired properties. No re-upload is required.
                </p>
              )}
              {results && remainingToPush > 0 && (
                <p className="muted">
                  Research is complete. Push the remaining {remainingToPush} owner record(s) to Notion.
                </p>
              )}
              {results && remainingToPush === 0 && pushablePersonCount > 0 && (
                <p className="muted">✓ Research and CRM push are complete for this batch.</p>
              )}
              {!statusDecisions && (
                <p className="muted">All uploaded market-data exports are recognized and ready for use.</p>
              )}
            </>
          ) : (
            <>
              <p>
                <strong>Action needed before this intake is complete.</strong>
              </p>
              {unknownFiles.length > 0 && (
                <p className="muted">Classify {unknownFiles.length} ambiguous export(s).</p>
              )}
              {brokenFiles.length > 0 && (
                <p className="muted">Fix {brokenFiles.length} export(s) with missing required Matrix columns.</p>
              )}
              {missingCurrentForExpired && (
                <p className="muted">Upload the fresh Current Market Status export for this expired batch.</p>
              )}
              {unresolvedReviews.length > 0 && (
                <p className="muted">Resolve {unresolvedReviews.length} possible relist match(es).</p>
              )}
            </>
          )}
        </div>
      )}

      <details className="panel" style={{ marginTop: 16 }}>
        <summary className="muted">Advanced: known Matrix schema</summary>
        <p className="meta">
          The portal expects MIAMI Matrix fields such as Address, City Name, Zip Code, St, MLS # Link, List Price, Sale Price, Closing Date, Entry Date, DOM, and CDOM. Matrix `St` is listing status, never property state. Paid property lookup is explicitly normalized to Florida.
        </p>
        <p className="meta">
          The legacy direct CSV processor remains available at <a href="/import">/import</a> as a fallback, but normal daily processing no longer requires it.
        </p>
      </details>
    </div>
  );
}
