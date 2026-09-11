"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import {
  buildMatrixIntakeFile,
  matrixFolioValue,
  statusSummary,
  validateMatrixExport,
  type MatrixIntakeFile,
} from "@/lib/mls-intake";
import { normalizeAddress, normalizeCity, normalizeZip } from "@/lib/mls-status";

const APPLY_BATCH_SIZE = 20;

type PlannedUpdate = {
  id: string;
  address: string;
  listingStatus: "Expired" | "Withdrawn" | "Cancelled" | "Sold" | "Active" | "Pending";
  checkedAt: string;
  reason: string;
  matchedStatus?: string;
};

type ReviewItem = {
  id: string;
  address: string;
  reason: string;
  matchedStatus?: string;
};

type PlanResponse = {
  ok?: boolean;
  error?: string;
  checkedAt?: string;
  backlogCount?: number;
  notionBacklogTotal?: number;
  uploadedExpiredCount?: number;
  clearExpired?: number;
  relisted?: number;
  reviews?: ReviewItem[];
  updates?: PlannedUpdate[];
};

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i++) {
    if (i % size === 0) chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function rowIdentityKeys(row: Record<string, string>) {
  const keys: string[] = [];
  const folio = matrixFolioValue(row) ?? "";
  const address = normalizeAddress(String(row.Address ?? ""));
  const city = normalizeCity(String(row["City Name"] ?? ""));
  const zip = normalizeZip(String(row["Zip Code"] ?? ""));
  if (folio) keys.push(`folio:${folio}`);
  if (address && zip) keys.push(`addressZip:${address}|${zip}`);
  if (address && city) keys.push(`addressCity:${address}|${city}`);
  return keys;
}

function dedupeExpiredRows(files: MatrixIntakeFile[]) {
  const unique = new Map<string, Record<string, string>>();
  for (const file of files) {
    for (const row of file.rows) {
      const keys = rowIdentityKeys(row);
      const fallback = `${normalizeAddress(String(row.Address ?? ""))}|${normalizeCity(String(row["City Name"] ?? ""))}|${normalizeZip(String(row["Zip Code"] ?? ""))}`;
      const key = keys[0] ?? `fallback:${fallback}`;
      if (key && !unique.has(key)) unique.set(key, row);
    }
  }
  return [...unique.values()];
}

function dedupeCurrentRows(files: MatrixIntakeFile[]) {
  const unique = new Map<string, Record<string, string>>();
  for (const file of files) {
    for (const row of file.rows) {
      const keys = rowIdentityKeys(row);
      const fallback = `${normalizeAddress(String(row.Address ?? ""))}|${normalizeCity(String(row["City Name"] ?? ""))}|${normalizeZip(String(row["Zip Code"] ?? ""))}`;
      const propertyKey = keys[0] ?? `fallback:${fallback}`;
      const status = String(row.St ?? "").trim().toUpperCase();
      const mls = String(row["MLS # Link"] ?? "").trim();
      const key = `${propertyKey}|${status}|${mls}`;
      if (!unique.has(key)) unique.set(key, row);
    }
  }
  return [...unique.values()];
}

function overlapCount(expiredRows: Record<string, string>[], currentRows: Record<string, string>[]) {
  const currentKeys = new Set(currentRows.flatMap(rowIdentityKeys));
  return expiredRows.reduce((count, row) => count + (rowIdentityKeys(row).some((key) => currentKeys.has(key)) ? 1 : 0), 0);
}

export default function StatusRefreshPage() {
  const [files, setFiles] = useState<MatrixIntakeFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [result, setResult] = useState<PlanResponse | null>(null);
  const [applied, setApplied] = useState(0);

  const expiredFiles = files.filter((file) => file.kind === "expired" && !validateMatrixExport(file.kind, file.headers, file.rows).errors.length);
  const currentFiles = files.filter((file) => file.kind === "current" && !validateMatrixExport(file.kind, file.headers, file.rows).errors.length);
  const unsupportedFiles = files.filter((file) => !["expired", "current"].includes(file.kind));

  const expiredRows = useMemo(() => dedupeExpiredRows(expiredFiles), [expiredFiles]);
  const currentRows = useMemo(() => dedupeCurrentRows(currentFiles), [currentFiles]);
  const uploadedOverlap = useMemo(() => overlapCount(expiredRows, currentRows), [expiredRows, currentRows]);
  const obviousScopeMismatch = expiredRows.length > 0 && currentRows.length > 0 && uploadedOverlap === 0;

  async function addFiles(list: FileList | null) {
    setError(null);
    setResult(null);
    setApplied(0);
    setProgress(null);
    if (!list?.length) return;

    try {
      const parsed = await Promise.all(Array.from(list).map((selected) => new Promise<MatrixIntakeFile>((resolve, reject) => {
        Papa.parse<Record<string, string>>(selected, {
          header: true,
          skipEmptyLines: true,
          complete: (parseResult) => resolve(buildMatrixIntakeFile(
            selected.name,
            parseResult.meta.fields ?? [],
            parseResult.data,
            `${selected.name}-${selected.size}-${selected.lastModified}`
          )),
          error: reject,
        });
      })));

      setFiles((existing) => {
        const next = new Map(existing.map((file) => [file.id, file]));
        for (const file of parsed) next.set(file.id, file);
        return [...next.values()];
      });
    } catch (parseError) {
      setError(`Could not read CSV: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
  }

  function clearFiles() {
    setFiles([]);
    setError(null);
    setResult(null);
    setApplied(0);
    setProgress(null);
  }

  async function runRefresh() {
    if (!expiredRows.length || !currentRows.length || obviousScopeMismatch || working) return;
    setWorking(true);
    setError(null);
    setResult(null);
    setApplied(0);
    setProgress(null);

    try {
      const planResponse = await fetch("/api/status-refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "plan", scopeRows: expiredRows, rows: currentRows }),
      });
      const plan = await planResponse.json() as PlanResponse;
      if (!planResponse.ok) throw new Error(plan.error ?? `Status plan failed (${planResponse.status}).`);

      const updates = plan.updates ?? [];
      const batches = chunk(updates, APPLY_BATCH_SIZE);
      setResult(plan);
      setProgress({ current: 0, total: updates.length });

      let completed = 0;
      const errors: string[] = [];
      for (const batch of batches) {
        const applyResponse = await fetch("/api/status-refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "apply", updates: batch }),
        });
        const data = await applyResponse.json() as {
          error?: string;
          applied?: number;
          errors?: { address: string; error: string }[];
        };
        completed += data.applied ?? 0;
        setApplied(completed);
        setProgress({ current: completed, total: updates.length });
        if (data.error) errors.push(data.error);
        for (const item of data.errors ?? []) errors.push(`${item.address}: ${item.error}`);
      }

      if (errors.length) {
        setError(`${errors.length} Notion update error(s): ${errors.slice(0, 3).join(" | ")}${errors.length > 3 ? " …" : ""}`);
      }
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Status refresh failed.");
    } finally {
      setWorking(false);
    }
  }

  const statuses = currentRows.length ? statusSummary(currentRows) : [];
  const reviews = result?.reviews ?? [];
  const updates = result?.updates ?? [];
  const relisted = result?.relisted ?? 0;
  const complete = Boolean(result && !working && applied === updates.length);
  const blocked = Boolean(complete && updates.length === 0 && reviews.length > 0);
  const partial = Boolean(complete && updates.length > 0 && reviews.length > 0);

  return (
    <div className="page">
      <div className="top-bar">
        <div>
          <h1>Refresh Existing Backlog Market Status</h1>
          <p className="muted">$0 Tracerfy maintenance only. This page never creates new expired leads.</p>
        </div>
        <a href="/">Home</a>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>1. Upload backlog files + fresh status files</h2>
        <p className="muted">
          Upload the historical <strong>Expired CSVs you already have</strong> plus fresh <strong>Current Market Status CSVs</strong> that actually cover those same properties. Include <strong>Expired (X)</strong> in the Matrix status search. Do not run a new expired intake for this step.
        </p>

        <div className="field">
          <label htmlFor="status-files">Expired + Current Status CSV files</label>
          <input
            id="status-files"
            type="file"
            multiple
            accept=".csv,text/csv"
            onChange={(event) => addFiles(event.target.files)}
          />
        </div>

        {files.length > 0 && <div className="person-card">
          <strong>{files.length} file{files.length === 1 ? "" : "s"} loaded</strong>
          <p className="muted">
            {expiredFiles.length} expired file{expiredFiles.length === 1 ? "" : "s"} → {expiredRows.length} unique historical properties · {currentFiles.length} current-status file{currentFiles.length === 1 ? "" : "s"} → {currentRows.length} current rows
          </p>
          {expiredRows.length > 0 && currentRows.length > 0 && <p className="meta">
            Quick overlap check: {uploadedOverlap} of {expiredRows.length} historical properties appear in the uploaded current-status files.
          </p>}
          {statuses.length > 0 && <p className="meta">{statuses.map((status) => `${status.label}: ${status.count}`).join(" · ")}</p>}
          {unsupportedFiles.length > 0 && <p className="error">{unsupportedFiles.length} file(s) were not recognized as Expired or Current Market Status and will be ignored.</p>}
          <button type="button" onClick={clearFiles} disabled={working}>Clear files</button>
        </div>}

        {obviousScopeMismatch && <div className="person-card" style={{ marginTop: 16 }}>
          <strong>⛔ STOP — the Current Market Status export does not cover this backlog</strong>
          <p className="error">
            0 of {expiredRows.length} historical expired properties appear in the current-status file(s). Nothing should be updated from this file set.
          </p>
          <p className="muted">
            Do not review addresses one by one and do not run new expireds. Fix the Matrix <strong>PROSPECTING — CURRENT MARKET STATUS</strong> search criteria, export it again, then replace the current-status file(s) here.
          </p>
        </div>}

        {error && <p className="error">{error}</p>}
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>2. Refresh only the existing Notion backlog</h2>
        <p className="muted">
          The portal intersects these files with unresolved MLS-pull records already in Property Research. It does <strong>not</strong> call Tracerfy, spend credits, create CRM leads, or import new expired records.
        </p>
        <button disabled={!expiredRows.length || !currentRows.length || obviousScopeMismatch || working} onClick={runRefresh}>
          {working ? "Refreshing Notion…" : "Refresh existing backlog — $0 Tracerfy"}
        </button>

        {progress && updates.length > 0 && <p className="meta">{progress.current} of {progress.total} confirmed Notion record{progress.total === 1 ? "" : "s"} updated</p>}

        {result && <div className="person-card">
          <strong>
            {blocked ? "⛔ BLOCKED — wrong/incomplete Current Market Status export" : partial ? "⚠ PARTIAL — some backlog records still need a better Matrix export" : complete ? "✓ READY — in-scope backlog status is current" : "Status refresh planned"}
          </strong>
          <p className="muted">
            {result.backlogCount ?? 0} existing Notion backlog records were in scope · {result.clearExpired ?? 0} confirmed Expired · {relisted} moved out of Expired · {reviews.length} still unconfirmed
          </p>
          {result.checkedAt && updates.length > 0 && <p className="meta">Confirmed records stamped: {result.checkedAt}</p>}

          {blocked && <>
            <p className="error"><strong>Nothing was changed.</strong> The uploaded current-status export did not positively identify any in-scope backlog property.</p>
            <p className="muted"><strong>Next action:</strong> stop here and fix the Matrix saved-search filters. Do not manually process the address list below.</p>
          </>}

          {partial && <p className="muted"><strong>Next action:</strong> do not work the unconfirmed rows manually. Export a corrected Current Market Status file for the remaining scope and re-run this page.</p>}

          {complete && !blocked && !partial && <p className="muted">Return to the Notion backlog workflow and continue to 0 — Status Exceptions, then 1 — Property Ownership Cleanup.</p>}
        </div>}

        {reviews.length > 0 && <details className="person-card" style={{ marginTop: 16 }}>
          <summary><strong>Technical details — {reviews.length} unconfirmed record{reviews.length === 1 ? "" : "s"}</strong></summary>
          <p className="muted">You do not need to work these individually. This list is only for diagnosing the Matrix export.</p>
          {reviews.slice(0, 20).map((review) => (
            <div key={`${review.id}-${review.address}`} style={{ marginTop: 10 }}>
              <strong>{review.address}</strong>
              <div className="muted">{review.reason}{review.matchedStatus ? ` · ${review.matchedStatus}` : ""}</div>
            </div>
          ))}
          {reviews.length > 20 && <p className="meta">+ {reviews.length - 20} more unconfirmed record(s)</p>}
        </details>}
      </div>
    </div>
  );
}
