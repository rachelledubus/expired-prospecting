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
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function dedupeExpiredRows(files: MatrixIntakeFile[]) {
  const unique = new Map<string, Record<string, string>>();
  for (const file of files) {
    for (const row of file.rows) {
      const folio = matrixFolioValue(row) ?? "";
      const address = normalizeAddress(String(row.Address ?? ""));
      const city = normalizeCity(String(row["City Name"] ?? ""));
      const zip = normalizeZip(String(row["Zip Code"] ?? ""));
      const key = folio ? `folio:${folio}` : address && zip ? `address:${address}|${zip}` : `fallback:${address}|${city}|${zip}`;
      if (key && !unique.has(key)) unique.set(key, row);
    }
  }
  return [...unique.values()];
}

function dedupeCurrentRows(files: MatrixIntakeFile[]) {
  const unique = new Map<string, Record<string, string>>();
  for (const file of files) {
    for (const row of file.rows) {
      const folio = matrixFolioValue(row) ?? "";
      const address = normalizeAddress(String(row.Address ?? ""));
      const city = normalizeCity(String(row["City Name"] ?? ""));
      const zip = normalizeZip(String(row["Zip Code"] ?? ""));
      const status = String(row.St ?? "").trim().toUpperCase();
      const mls = String(row["MLS # Link"] ?? "").trim();
      const propertyKey = folio ? `folio:${folio}` : address && zip ? `address:${address}|${zip}` : `fallback:${address}|${city}|${zip}`;
      const key = `${propertyKey}|${status}|${mls}`;
      if (!unique.has(key)) unique.set(key, row);
    }
  }
  return [...unique.values()];
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
          complete: (result) => resolve(buildMatrixIntakeFile(
            selected.name,
            result.meta.fields ?? [],
            result.data,
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
    if (!expiredRows.length || !currentRows.length || working) return;
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
        <h2 style={{ marginTop: 0 }}>1. Upload the historical files you already have</h2>
        <p className="muted">
          Select <strong>all existing Expired CSVs</strong> that make up the backlog you want to refresh, plus <strong>one or more fresh Current Market Status CSVs</strong> covering those same properties. Multiple files are expected. Do not run a new expired intake just to use this page.
        </p>
        <p className="muted">
          For the Current Market Status export, include <strong>Expired (X)</strong> along with the other relevant statuses. The portal now requires a positive current-status match; a property missing from the current-status files is left unresolved instead of being assumed Expired.
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
            {expiredFiles.length} expired file{expiredFiles.length === 1 ? "" : "s"} → {expiredRows.length} unique expired properties · {currentFiles.length} current-status file{currentFiles.length === 1 ? "" : "s"} → {currentRows.length} current rows
          </p>
          {statuses.length > 0 && <p className="meta">{statuses.map((status) => `${status.label}: ${status.count}`).join(" · ")}</p>}
          {unsupportedFiles.length > 0 && <p className="error">{unsupportedFiles.length} file(s) were not recognized as Expired or Current Market Status and will be ignored.</p>}
          <button type="button" onClick={clearFiles} disabled={working}>Clear files</button>
        </div>}

        {error && <p className="error">{error}</p>}
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>2. Refresh only the existing Notion backlog</h2>
        <p className="muted">
          This intersects the uploaded historical Expired files with unresolved MLS-pull records already in Property Research. It does <strong>not</strong> call Tracerfy, spend credits, create CRM leads, or import new expired records.
        </p>
        <button disabled={!expiredRows.length || !currentRows.length || working} onClick={runRefresh}>
          {working ? "Refreshing Notion…" : "Refresh existing backlog — $0 Tracerfy"}
        </button>

        {progress && <p className="meta">{progress.current} of {progress.total} confirmed Notion record{progress.total === 1 ? "" : "s"} updated</p>}

        {result && <div className="person-card">
          <strong>{complete ? "✓ Safe refresh pass complete" : "Status refresh planned"}</strong>
          <p className="muted">
            {result.uploadedExpiredCount ?? expiredRows.length} uploaded unique expired properties · {result.backlogCount ?? 0} matched the unresolved Notion backlog · {result.clearExpired ?? 0} positively confirmed Expired · {relisted} moved out of Expired · {reviews.length} remain blocked for review
          </p>
          {result.checkedAt && <p className="meta">Market Status Checked At: {result.checkedAt}</p>}
          {complete && reviews.length === 0 && <p className="muted">You can return to the Notion backlog workflow. Every in-scope record had a positive current-status match.</p>}
          {complete && reviews.length > 0 && <p className="muted">Do not move the review rows into ownership cleanup yet. They were intentionally left unstamped because the uploaded current-status files did not positively account for them.</p>}
        </div>}

        {reviews.length > 0 && <div className="person-card">
          <strong>Still needs current-status confirmation</strong>
          <p className="muted">No-match is no longer treated as “still Expired.” These stay blocked until a Matrix current-status export positively identifies them.</p>
          {reviews.slice(0, 20).map((review) => (
            <div key={`${review.id}-${review.address}`} style={{ marginTop: 10 }}>
              <strong>{review.address}</strong>
              <div className="muted">{review.reason}{review.matchedStatus ? ` · ${review.matchedStatus}` : ""}</div>
            </div>
          ))}
          {reviews.length > 20 && <p className="meta">+ {reviews.length - 20} more review row(s)</p>}
        </div>}
      </div>
    </div>
  );
}
