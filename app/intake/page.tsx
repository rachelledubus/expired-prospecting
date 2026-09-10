"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import {
  MATRIX_COLUMNS,
  buildMatrixIntakeFile,
  calculateMarketMetrics,
  statusSummary,
  type MatrixExportKind,
  type MatrixIntakeFile,
} from "@/lib/mls-intake";
import {
  runMlsStatusCheck,
  type CurrentMarketColumnMap,
  type ExpiredColumnMap,
  type StatusDecision,
} from "@/lib/mls-status";

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

function money(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
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

  function effectiveKind(file: MatrixIntakeFile) {
    return overrides[file.id] ?? file.kind;
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
                resolve(buildMatrixIntakeFile(file.name, headers, parsed.data, `${file.name}-${file.size}-${file.lastModified}`));
              },
              error: reject,
            });
          })
      )
    ).catch((err) => {
      setError(`Could not read one of the CSV files: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    });
    if (!parsedFiles) return;
    setFiles((previous) => {
      const byId = new Map(previous.map((f) => [f.id, f]));
      for (const file of parsedFiles) byId.set(file.id, file);
      return Array.from(byId.values());
    });
    setReviewOverrides({});
  }

  const expiredFile = files.find((f) => effectiveKind(f) === "expired" && f.errors.length === 0);
  const currentFile = files.find((f) => effectiveKind(f) === "current" && f.errors.length === 0);

  const statusDecisions = useMemo<StatusDecision[] | null>(() => {
    if (!expiredFile || !currentFile) return null;
    return runMlsStatusCheck(expiredFile.rows, EXPIRED_MAP, currentFile.rows, CURRENT_MAP);
  }, [expiredFile, currentFile]);

  const effectiveDecisions = useMemo(() =>
    statusDecisions?.map((d) => ({ ...d, status: reviewOverrides[d.sourceIndex] ?? d.status })) ?? [],
    [statusDecisions, reviewOverrides]
  );

  const clearCount = effectiveDecisions.filter((d) => d.status === "clear").length;
  const relistedCount = effectiveDecisions.filter((d) => d.status === "relisted").length;
  const unresolvedReviews = statusDecisions?.filter((d) => d.status === "review" && !reviewOverrides[d.sourceIndex]) ?? [];

  const unknownFiles = files.filter((f) => effectiveKind(f) === "unknown");
  const brokenFiles = files.filter((f) => f.errors.length > 0);
  const marketFiles = files.filter((f) => ["active", "new", "closed"].includes(effectiveKind(f)) && f.errors.length === 0);
  const ready = files.length > 0 && unknownFiles.length === 0 && brokenFiles.length === 0 && unresolvedReviews.length === 0;

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setReviewOverrides({});
  }

  return (
    <div className="page">
      <div className="top-bar">
        <div>
          <h1>MLS Intake</h1>
          <p className="muted">Run your Matrix saved searches, export the CSVs, then drop them here. The portal handles the sorting and analysis.</p>
        </div>
        <a href="/">&larr; Dashboard</a>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Drop Matrix exports</h2>
        <p className="muted">Upload one or several CSVs at once. Known MIAMI Matrix columns are mapped automatically.</p>
        <input type="file" accept=".csv,text/csv" multiple onChange={(e) => handleFiles(e.target.files)} />
        {error && <p className="error">{error}</p>}
      </div>

      {files.length > 0 && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>Recognized exports</h2>
          {files.map((file) => {
            const kind = effectiveKind(file);
            const statuses = statusSummary(file.rows);
            return (
              <div className="person-card" key={file.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div>
                    <strong>{file.errors.length ? "⚠" : kind === "unknown" ? "🟡" : "✓"} {KIND_LABELS[kind]}</strong>
                    <p className="muted" style={{ marginTop: 4 }}>{file.filename} · {file.rows.length} rows · {file.confidence} confidence</p>
                  </div>
                  <button className="secondary" onClick={() => removeFile(file.id)}>Remove</button>
                </div>

                {file.reasons.map((reason) => <p className="meta" key={reason} style={{ marginTop: 5 }}>{reason}</p>)}
                {file.errors.map((message) => <p className="error" key={message}>{message}. Re-export using the expected Matrix export preset.</p>)}
                {file.warnings.map((message) => <p className="muted" key={message}>⚠ {message}</p>)}

                {statuses.length > 0 && (
                  <p className="meta" style={{ marginTop: 8 }}>
                    Statuses: {statuses.map((s) => `${s.label}: ${s.count}`).join(" · ")}
                  </p>
                )}

                {kind === "unknown" && (
                  <div style={{ marginTop: 10 }}>
                    <label htmlFor={`kind-${file.id}`}>What did you export?</label>
                    <select id={`kind-${file.id}`} value={kind} onChange={(e) => setOverrides((prev) => ({ ...prev, [file.id]: e.target.value as MatrixExportKind }))}>
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
          <h2 style={{ marginTop: 0 }}>Market data</h2>
          <p className="muted">Calculated automatically from the uploaded Matrix exports. No Tracerfy requests are made.</p>
          {marketFiles.map((file) => {
            const metrics = calculateMarketMetrics(file.rows);
            return (
              <div className="person-card" key={`market-${file.id}`}>
                <strong>{KIND_LABELS[effectiveKind(file)]} · {metrics.listings} listings</strong>
                <p className="muted" style={{ marginTop: 7 }}>
                  Median list: {money(metrics.medianListPrice)} · Median sale: {money(metrics.medianSalePrice)} · Median DOM: {number(metrics.medianDom)} · Median CDOM: {number(metrics.medianCdom)}
                  {metrics.medianSaleToList !== null ? ` · Sale-to-list: ${(metrics.medianSaleToList * 100).toFixed(1)}%` : ""}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {(expiredFile || currentFile) && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>Expired prospecting gate</h2>
          {!expiredFile && <p className="muted">Add your expired-listing CSV.</p>}
          {!currentFile && <p className="muted">Add your fresh Current Market Status CSV before any expired property can continue.</p>}

          {statusDecisions && (
            <>
              <p className="meta">{statusDecisions.length} checked · 🟢 {clearCount} clear · 🔴 {relistedCount} relisted · 🟡 {unresolvedReviews.length} review</p>
              {unresolvedReviews.map((decision) => {
                const row = expiredFile!.rows[decision.sourceIndex];
                return (
                  <div className="person-card" key={decision.sourceIndex}>
                    <strong>{row[MATRIX_COLUMNS.address]}, {row[MATRIX_COLUMNS.city]} {row[MATRIX_COLUMNS.zip]}</strong>
                    <p className="muted" style={{ marginTop: 5 }}>{decision.reason}</p>
                    {decision.matched && <p className="meta">Possible current match: {decision.matched.address}{decision.matched.status ? ` · ${decision.matched.status}` : ""}{decision.matched.mls ? ` · MLS ${decision.matched.mls}` : ""}</p>}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="secondary" onClick={() => setReviewOverrides((prev) => ({ ...prev, [decision.sourceIndex]: "clear" }))}>Mark CLEAR</button>
                      <button className="secondary" onClick={() => setReviewOverrides((prev) => ({ ...prev, [decision.sourceIndex]: "relisted" }))}>Mark RELISTED</button>
                    </div>
                  </div>
                );
              })}
              {unresolvedReviews.length === 0 && (
                <p className="muted">✓ Status gate complete. {clearCount} properties are eligible to continue to research; {relistedCount} are excluded before paid lookup.</p>
              )}
            </>
          )}
        </div>
      )}

      {files.length > 0 && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>Intake status</h2>
          {ready ? (
            <>
              <p><strong>✓ MLS intake complete.</strong></p>
              <p className="muted">All uploaded files are recognized and valid{statusDecisions ? `; the expired status gate has ${clearCount} CLEAR properties ready for the existing research workflow` : ""}.</p>
              {statusDecisions && clearCount > 0 && <a className="action-card" href="/import"><div className="action-title">Continue to Expired Research</div><div className="muted">Open the existing Tracerfy + compliance + Notion workflow.</div></a>}
            </>
          ) : (
            <>
              <p><strong>Action needed before this intake is complete.</strong></p>
              {unknownFiles.length > 0 && <p className="muted">Classify {unknownFiles.length} ambiguous export(s).</p>}
              {brokenFiles.length > 0 && <p className="muted">Fix {brokenFiles.length} export(s) with missing required Matrix columns.</p>}
              {unresolvedReviews.length > 0 && <p className="muted">Resolve {unresolvedReviews.length} possible relist match(es).</p>}
            </>
          )}
        </div>
      )}

      <details className="panel" style={{ marginTop: 16 }}>
        <summary className="muted">Advanced: known Matrix schema</summary>
        <p className="meta">The portal expects MIAMI Matrix fields such as Address, City Name, Zip Code, St, MLS # Link, List Price, Sale Price, Closing Date, Entry Date, DOM, and CDOM. Matrix `St` is treated only as listing status; Florida is handled separately by the paid-lookup backend.</p>
      </details>
    </div>
  );
}
