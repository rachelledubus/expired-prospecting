"use client";

import { useState } from "react";
import Papa from "papaparse";
import {
  buildMatrixIntakeFile,
  statusSummary,
  validateMatrixExport,
  type MatrixIntakeFile,
} from "@/lib/mls-intake";

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

export default function StatusRefreshPage() {
  const [file, setFile] = useState<MatrixIntakeFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [result, setResult] = useState<PlanResponse | null>(null);
  const [applied, setApplied] = useState(0);

  async function loadFile(selected?: File) {
    setError(null);
    setResult(null);
    setApplied(0);
    setProgress(null);
    if (!selected) {
      setFile(null);
      return;
    }

    Papa.parse<Record<string, string>>(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        const intake = buildMatrixIntakeFile(
          selected.name,
          parsed.meta.fields ?? [],
          parsed.data,
          `${selected.name}-${selected.size}-${selected.lastModified}`
        );
        const validation = validateMatrixExport(intake.kind, intake.headers, intake.rows);
        if (intake.kind !== "current") {
          setFile(null);
          setError("This is not recognized as the PROSPECTING — CURRENT MARKET STATUS export. Use that saved Matrix search and export a fresh CSV.");
          return;
        }
        if (validation.errors.length) {
          setFile(null);
          setError(validation.errors.join(" "));
          return;
        }
        if (!intake.rows.length) {
          setFile(null);
          setError("The Current Market Status export is empty. Nothing was changed in Notion.");
          return;
        }
        setFile(intake);
      },
      error: (parseError) => {
        setFile(null);
        setError(`Could not read CSV: ${parseError.message}`);
      },
    });
  }

  async function runRefresh() {
    if (!file || working) return;
    setWorking(true);
    setError(null);
    setResult(null);
    setApplied(0);
    setProgress(null);

    try {
      const planResponse = await fetch("/api/status-refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "plan", rows: file.rows }),
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

  const statuses = file ? statusSummary(file.rows) : [];
  const reviews = result?.reviews ?? [];
  const updates = result?.updates ?? [];
  const relisted = result?.relisted ?? 0;
  const complete = Boolean(result && !working && applied === updates.length);

  return (
    <div className="page">
      <div className="top-bar">
        <div>
          <h1>Refresh Backlog Market Status</h1>
          <p className="muted">Daily $0 safety gate before expired-listing backlog work.</p>
        </div>
        <a href="/">Home</a>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>1. Export the saved Matrix search</h2>
        <p className="muted">
          Run <strong>PROSPECTING — CURRENT MARKET STATUS</strong> in Matrix and export a fresh CSV. Do not change the saved search scope; absence from this export is what lets the portal safely confirm a backlog property is still off market.
        </p>

        <div className="field">
          <label htmlFor="status-file">Current Market Status CSV</label>
          <input
            id="status-file"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => loadFile(event.target.files?.[0])}
          />
        </div>

        {file && <div className="person-card">
          <strong>{file.filename}</strong>
          <p className="muted">{file.rows.length} current-market row{file.rows.length === 1 ? "" : "s"} · {file.confidence} confidence</p>
          {statuses.length > 0 && <p className="meta">{statuses.map((status) => `${status.label}: ${status.count}`).join(" · ")}</p>}
        </div>}

        {error && <p className="error">{error}</p>}
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>2. Refresh Notion backlog</h2>
        <p className="muted">
          This checks the existing unresolved expired-property backlog only. It does not call Tracerfy, spend credits, create CRM leads, or import new expired records.
        </p>
        <button disabled={!file || working} onClick={runRefresh}>
          {working ? "Refreshing Notion…" : "Refresh existing backlog status"}
        </button>

        {progress && <p className="meta">{progress.current} of {progress.total} Notion record{progress.total === 1 ? "" : "s"} updated</p>}

        {result && <div className="person-card">
          <strong>{complete ? "✓ Status refresh complete" : "Status refresh planned"}</strong>
          <p className="muted">
            {result.backlogCount ?? 0} backlog properties checked · {result.clearExpired ?? 0} still Expired · {relisted} moved out of Expired · {reviews.length} need manual status review
          </p>
          {result.checkedAt && <p className="meta">Market Status Checked At: {result.checkedAt}</p>}
          {relisted > 0 && <p className="muted">Non-expired matches now flow into the Notion Status Exceptions queue and are blocked from ownership cleanup.</p>}
          {complete && reviews.length === 0 && <p className="muted">You can return to the Notion backlog workflow. Today’s still-expired records are now eligible for ownership cleanup.</p>}
        </div>}

        {reviews.length > 0 && <div className="person-card">
          <strong>Manual review required</strong>
          <p className="muted">These rows were intentionally not stamped current, so they remain blocked in Notion until resolved.</p>
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
