"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import {
  MATRIX_COLUMNS,
  buildMatrixIntakeFile,
  calculateMarketMetrics,
  expiredPropertyPayload,
  matrixFolioValue,
  statusSummary,
  validateMatrixExport,
  type ExpiredPropertyPayload,
  type MatrixExportKind,
  type MatrixIntakeFile,
} from "@/lib/mls-intake";
import {
  normalizeAddress,
  normalizeCity,
  normalizeZip,
  runMlsStatusCheck,
  type CurrentMarketColumnMap,
  type ExpiredColumnMap,
  type StatusDecision,
} from "@/lib/mls-status";
import {
  dncStatus,
  formatPhone,
  outreachEligibility,
  type LookupResult,
  type Person,
} from "@/lib/tracerfy";
import type { ExistingLeadRecord } from "@/lib/notion";

const LABEL: Record<MatrixExportKind, string> = {
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
  folio: MATRIX_COLUMNS.folio,
};
const CURRENT_MAP: CurrentMarketColumnMap = {
  address: MATRIX_COLUMNS.address,
  city: MATRIX_COLUMNS.city,
  state: "",
  zip: MATRIX_COLUMNS.zip,
  folio: MATRIX_COLUMNS.folio,
  status: MATRIX_COLUMNS.status,
  mls: MATRIX_COLUMNS.mls,
};

const LOOKUP_CHECKPOINT_KEY = "rachellesportal:tracerfy-checkpoints:v1";

type LookupRow = { address: string; city: string; state: string; zip: string };
type RowResult = LookupResult & {
  rowError?: string;
  alreadyInCrm?: ExistingLeadRecord[];
  propertySynced?: boolean;
  propertySyncError?: string;
  spendUncertain?: boolean;
  recoveredFromBackup?: boolean;
  recoveredFromCheckpoint?: boolean;
};
type PushState = { status: "loading" | "done" | "error"; message?: string };
type PushProgress = { current: number; total: number };
type ResearchProgress = { current: number; total: number };
type LookupCheckpoint =
  | { status: "complete"; savedAt: string; result: RowResult }
  | { status: "uncertain"; savedAt: string; row: LookupRow; message: string };

type TracerfyHistoryRow = {
  created_at?: string;
  response_data?: string;
};

function money(v: number | null) {
  return v === null
    ? "—"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

function lookupKey(row: { address: string; city?: string; zip: string }) {
  return `${normalizeAddress(row.address)}|${normalizeCity(row.city ?? "")}|${normalizeZip(row.zip)}`;
}

function readLookupCheckpoints(): Record<string, LookupCheckpoint> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LOOKUP_CHECKPOINT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed as Record<string, LookupCheckpoint> : {};
  } catch {
    return {};
  }
}

function writeLookupCheckpoints(checkpoints: Record<string, LookupCheckpoint>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOOKUP_CHECKPOINT_KEY, JSON.stringify(checkpoints));
}

function checkpointComplete(result: RowResult) {
  const checkpoints = readLookupCheckpoints();
  checkpoints[lookupKey(result)] = {
    status: "complete",
    savedAt: new Date().toISOString(),
    result: { ...result, recoveredFromBackup: false, recoveredFromCheckpoint: false },
  };
  writeLookupCheckpoints(checkpoints);
}

function checkpointUncertain(row: LookupRow, message: string) {
  const checkpoints = readLookupCheckpoints();
  checkpoints[lookupKey(row)] = {
    status: "uncertain",
    savedAt: new Date().toISOString(),
    row,
    message,
  };
  writeLookupCheckpoints(checkpoints);
}

function orderedResults(rows: LookupRow[], results: Iterable<RowResult>) {
  const byKey = new Map<string, RowResult>();
  for (const result of results) byKey.set(lookupKey(result), result);
  return rows.map((row) => byKey.get(lookupKey(row))).filter((row): row is RowResult => Boolean(row));
}

export default function MlsIntakePage() {
  const [files, setFiles] = useState<MatrixIntakeFile[]>([]);
  const [kinds, setKinds] = useState<Record<string, MatrixExportKind>>({});
  const [reviews, setReviews] = useState<Record<number, "clear" | "relisted">>({});
  const [results, setResults] = useState<RowResult[] | null>(null);
  const [push, setPush] = useState<Record<string, PushState>>({});
  const [processing, setProcessing] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushProgress, setPushProgress] = useState<PushProgress>({ current: 0, total: 0 });
  const [researchProgress, setResearchProgress] = useState<ResearchProgress>({ current: 0, total: 0 });
  const [spendConfirmed, setSpendConfirmed] = useState(false);
  const [forceAll, setForceAll] = useState(false);
  const [existingRefreshConfirmed, setExistingRefreshConfirmed] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const kindOf = (f: MatrixIntakeFile) => kinds[f.id] ?? f.kind;
  const validation = (f: MatrixIntakeFile) => validateMatrixExport(kindOf(f), f.headers, f.rows);
  const resetResearch = () => {
    setResults(null);
    setPush({});
    setPushProgress({ current: 0, total: 0 });
    setResearchProgress({ current: 0, total: 0 });
    setRecoveryMessage(null);
    setError(null);
  };
  const resetPaidGate = () => {
    setSpendConfirmed(false);
    setForceAll(false);
    setExistingRefreshConfirmed(false);
  };

  function changeExistingCrmPaidOverride(checked: boolean) {
    if (!checked) {
      setForceAll(false);
      setExistingRefreshConfirmed(false);
      return;
    }

    const phrase = window.prompt(
      "PAID OVERRIDE\n\nThis will bypass duplicate protection and can spend Tracerfy credits AGAIN on addresses already in your CRM.\n\nNormally leave this OFF.\n\nType RE-SPEND to enable paid re-checks."
    );
    const confirmed = phrase?.trim().toUpperCase() === "RE-SPEND";
    setForceAll(confirmed);
    setExistingRefreshConfirmed(confirmed);
  }

  function clearSavedLookupCheckpoints() {
    const phrase = window.prompt(
      "CLEAR PAID-LOOKUP CHECKPOINTS\n\nSaved checkpoints prevent accidental duplicate Tracerfy charges after a refresh or failed batch. Clearing them can make previously researched addresses eligible for another paid lookup.\n\nType CLEAR-CHECKPOINTS to continue."
    );
    if (phrase?.trim().toUpperCase() !== "CLEAR-CHECKPOINTS") return;
    window.localStorage.removeItem(LOOKUP_CHECKPOINT_KEY);
    setRecoveryMessage("Saved Tracerfy checkpoints cleared. Previously researched-but-unpushed addresses may now be eligible for paid lookup again.");
  }

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    try {
      const parsed = await Promise.all(Array.from(list).map((file) => new Promise<MatrixIntakeFile>((resolve, reject) => {
        Papa.parse<Record<string, string>>(file, {
          header: true,
          skipEmptyLines: true,
          complete: (r) => resolve(buildMatrixIntakeFile(
            file.name,
            r.meta.fields ?? [],
            r.data,
            `${file.name}-${file.size}-${file.lastModified}`
          )),
          error: reject,
        });
      })));
      setFiles((old) => {
        const next = new Map(old.map((f) => [f.id, f]));
        parsed.forEach((f) => next.set(f.id, f));
        return [...next.values()];
      });
      setReviews({});
      resetResearch();
      resetPaidGate();
    } catch (e) {
      setError(`Could not read CSV: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const expiredFiles = files.filter((f) => kindOf(f) === "expired" && !validation(f).errors.length);
  const currentFiles = files.filter((f) => kindOf(f) === "current" && !validation(f).errors.length);
  const currentFile = currentFiles[currentFiles.length - 1];
  const marketFiles = files.filter((f) => ["active", "new", "closed"].includes(kindOf(f)) && !validation(f).errors.length);

  const expiredRows = useMemo(() => {
    const unique = new Map<string, Record<string, string>>();
    expiredFiles.forEach((f) => f.rows.forEach((row) => {
      const a = normalizeAddress(String(row[MATRIX_COLUMNS.address] ?? ""));
      const c = normalizeCity(String(row[MATRIX_COLUMNS.city] ?? ""));
      const z = normalizeZip(String(row[MATRIX_COLUMNS.zip] ?? ""));
      if (a && z) unique.set(`${a}|${c}|${z}`, unique.get(`${a}|${c}|${z}`) ?? row);
    }));
    return [...unique.values()];
  }, [expiredFiles]);

  const rawExpiredCount = expiredFiles.reduce((n, f) => n + f.rows.length, 0);
  const duplicateCount = Math.max(0, rawExpiredCount - expiredRows.length);

  const decisions = useMemo<StatusDecision[] | null>(() => {
    if (!expiredRows.length || !currentFile) return null;
    const withCanonicalFolio = (row: Record<string, string>) => ({
      ...row,
      [MATRIX_COLUMNS.folio]: matrixFolioValue(row) ?? "",
    });
    return runMlsStatusCheck(
      expiredRows.map(withCanonicalFolio),
      EXPIRED_MAP,
      currentFile.rows.map(withCanonicalFolio),
      CURRENT_MAP
    );
  }, [expiredRows, currentFile]);

  const effective = decisions?.map((d) => ({ ...d, status: reviews[d.sourceIndex] ?? d.status })) ?? [];
  const clearIndexes = new Set(effective.filter((d) => d.status === "clear").map((d) => d.sourceIndex));
  const clearCount = clearIndexes.size;
  const relistedCount = effective.filter((d) => d.status === "relisted").length;
  const unresolved = decisions?.filter((d) => d.status === "review" && !reviews[d.sourceIndex]) ?? [];

  function clearLookupRows(): LookupRow[] {
    return expiredRows.map((row, i) => ({
      i,
      address: String(row[MATRIX_COLUMNS.address] ?? "").trim(),
      city: String(row[MATRIX_COLUMNS.city] ?? "").trim(),
      state: "FL",
      zip: String(row[MATRIX_COLUMNS.zip] ?? "").trim(),
    })).filter((r) => clearIndexes.has(r.i) && r.address && r.city && r.zip)
      .map(({ i: _i, ...r }) => r);
  }

  function propertyForLookup(row: { address: string; city: string; zip: string }): ExpiredPropertyPayload {
    const addressKey = normalizeAddress(row.address);
    const cityKey = normalizeCity(row.city);
    const zipKey = normalizeZip(row.zip);
    const source = expiredRows.find((candidate) => {
      const a = normalizeAddress(String(candidate[MATRIX_COLUMNS.address] ?? ""));
      const c = normalizeCity(String(candidate[MATRIX_COLUMNS.city] ?? ""));
      const z = normalizeZip(String(candidate[MATRIX_COLUMNS.zip] ?? ""));
      return a === addressKey && z === zipKey && (!cityKey || c === cityKey);
    }) ?? expiredRows.find((candidate) =>
      normalizeAddress(String(candidate[MATRIX_COLUMNS.address] ?? "")) === addressKey &&
      normalizeZip(String(candidate[MATRIX_COLUMNS.zip] ?? "")) === zipKey
    );

    return source
      ? expiredPropertyPayload(source)
      : { address: row.address, city: row.city, zip: row.zip, listingStatus: "Expired" };
  }

  async function syncExistingCrmProperties(rows: RowResult[]) {
    for (const row of rows) {
      if (!row.alreadyInCrm?.length) continue;
      try {
        const response = await fetch("/api/property-research-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            property: propertyForLookup(row),
            crmPageIds: row.alreadyInCrm.map((record) => record.id).filter(Boolean),
          }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error ?? `Failed (${response.status})`);
        row.propertySynced = true;
      } catch (e) {
        row.propertySyncError = e instanceof Error ? e.message : "Property Research sync failed";
      }
    }
  }

  function importTracerfyBackup(file: File | undefined) {
    if (!file) return;
    const currentRows = clearLookupRows();
    if (!currentRows.length) {
      setRecoveryMessage("Upload and resolve the MLS expired/current-status files first so the backup can be matched only to current CLEAR properties.");
      return;
    }

    const currentKeys = new Set(currentRows.map(lookupKey));
    Papa.parse<TracerfyHistoryRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        const newest = new Map<string, { createdAt: string; result: RowResult }>();
        let invalid = 0;

        for (const historyRow of parsed.data) {
          if (!historyRow.response_data) continue;
          try {
            const result = JSON.parse(historyRow.response_data) as RowResult;
            if (!result?.address || !result?.zip || !Array.isArray(result.persons)) {
              invalid += 1;
              continue;
            }
            const key = lookupKey(result);
            if (!currentKeys.has(key)) continue;
            const createdAt = historyRow.created_at ?? result.meta?.timestamp ?? "";
            const previous = newest.get(key);
            if (!previous || createdAt > previous.createdAt) {
              newest.set(key, { createdAt, result: { ...result, recoveredFromBackup: true } });
            }
          } catch {
            invalid += 1;
          }
        }

        const recovered = [...newest.values()].map((entry) => entry.result);
        if (!recovered.length) {
          setRecoveryMessage(`No backup rows matched the current CLEAR MLS properties.${invalid ? ` ${invalid} backup row(s) could not be parsed.` : ""}`);
          return;
        }

        const checkpoints = readLookupCheckpoints();
        for (const result of recovered) {
          checkpoints[lookupKey(result)] = {
            status: "complete",
            savedAt: new Date().toISOString(),
            result: { ...result, recoveredFromBackup: false, recoveredFromCheckpoint: false },
          };
        }
        writeLookupCheckpoints(checkpoints);

        const combined = new Map<string, RowResult>();
        for (const row of results ?? []) combined.set(lookupKey(row), row);
        for (const row of recovered) combined.set(lookupKey(row), row);
        setResults(orderedResults(currentRows, combined.values()));
        setError(null);
        const creditsAlreadyCharged = recovered.reduce((sum, row) => sum + Number(row.credits_deducted || 0), 0);
        setRecoveryMessage(
          `Recovered ${recovered.length} already-processed address${recovered.length === 1 ? "" : "es"} from the Tracerfy backup at $0 additional spend. The backup shows ${creditsAlreadyCharged} credits were already charged for those matched rows, and they are now checkpointed so normal research will not pay for them again.${invalid ? ` ${invalid} malformed backup row(s) were ignored.` : ""}`
        );
      },
      error: (e) => setRecoveryMessage(`Could not read Tracerfy backup CSV: ${e.message}`),
    });
  }

  async function researchClear() {
    if (!decisions || unresolved.length || !clearCount || !spendConfirmed) return;
    const rows = clearLookupRows();
    const checkpoints = readLookupCheckpoints();
    const completed = new Map<string, RowResult>();

    for (const result of results ?? []) {
      if (!result.rowError) completed.set(lookupKey(result), result);
    }

    let recoveredFromCheckpoint = 0;
    let uncertainBlocked = 0;
    for (const row of rows) {
      const key = lookupKey(row);
      if (completed.has(key)) continue;
      const checkpoint = checkpoints[key];
      if (checkpoint?.status === "complete") {
        completed.set(key, { ...checkpoint.result, recoveredFromCheckpoint: true });
        recoveredFromCheckpoint += 1;
      } else if (checkpoint?.status === "uncertain") {
        uncertainBlocked += 1;
      }
    }

    const pending = rows.filter((row) => {
      const key = lookupKey(row);
      return !completed.has(key) && checkpoints[key]?.status !== "uncertain";
    });

    setResults(orderedResults(rows, completed.values()));
    setError(null);
    if (recoveredFromCheckpoint > 0) {
      setRecoveryMessage(`${recoveredFromCheckpoint} address${recoveredFromCheckpoint === 1 ? " was" : "es were"} restored from saved browser checkpoints at $0 additional spend.`);
    }

    if (!pending.length) {
      if (uncertainBlocked) {
        setError(`${uncertainBlocked} address${uncertainBlocked === 1 ? " is" : "es are"} blocked from automatic retry because a prior request failed after Tracerfy may have been charged. Import your Tracerfy history backup to recover those rows, or clear checkpoints in Advanced only if you intentionally accept the risk of paying again.`);
      }
      resetPaidGate();
      return;
    }

    setProcessing(true);
    setResearchProgress({ current: 0, total: pending.length });
    let stoppedEarly = false;

    try {
      for (let i = 0; i < pending.length; i += 1) {
        const row = pending[i];
        setResearchProgress({ current: i + 1, total: pending.length });

        try {
          const response = await fetch("/api/bulk-lookup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: [row], forceAll, spendConfirmed, existingRefreshConfirmed }),
          });
          const raw = await response.text();
          let data: { error?: string; results?: RowResult[] } | null = null;
          try {
            data = raw ? JSON.parse(raw) as { error?: string; results?: RowResult[] } : null;
          } catch {
            const message = `Research stopped at ${i + 1} of ${pending.length}. The server returned a non-JSON response. Spend status for ${row.address} is uncertain, so this address has been locked against automatic paid retry.`;
            checkpointUncertain(row, message);
            completed.set(lookupKey(row), {
              address: row.address,
              city: row.city,
              state: "FL",
              zip: row.zip,
              hit: false,
              persons_count: 0,
              credits_deducted: 0,
              persons: [],
              rowError: message,
              spendUncertain: true,
            });
            setResults(orderedResults(rows, completed.values()));
            setError(message);
            stoppedEarly = true;
            break;
          }

          if (!response.ok && !data?.results?.length) {
            const message = data?.error ?? `Research request failed (${response.status}).`;
            setError(message);
            stoppedEarly = true;
            break;
          }

          const result = data?.results?.[0];
          if (!result) {
            const message = `Research stopped at ${i + 1} of ${pending.length}. No row result was returned for ${row.address}; spend status is uncertain, so this address has been locked against automatic paid retry.`;
            checkpointUncertain(row, message);
            completed.set(lookupKey(row), {
              address: row.address,
              city: row.city,
              state: "FL",
              zip: row.zip,
              hit: false,
              persons_count: 0,
              credits_deducted: 0,
              persons: [],
              rowError: message,
              spendUncertain: true,
            });
            setResults(orderedResults(rows, completed.values()));
            setError(message);
            stoppedEarly = true;
            break;
          }

          if (result.alreadyInCrm?.length) await syncExistingCrmProperties([result]);
          completed.set(lookupKey(result), result);
          setResults(orderedResults(rows, completed.values()));

          if (!result.rowError) {
            checkpointComplete(result);
          } else if (/Tracerfy error \(402\)/i.test(result.rowError)) {
            setError(`Tracerfy reported insufficient credits at ${result.address}. All earlier completed rows are preserved. This row and the remaining ${pending.length - i - 1} address${pending.length - i - 1 === 1 ? "" : "es"} were not marked complete and can be resumed after credits are available.`);
            stoppedEarly = true;
            break;
          } else if (/Tracerfy error \((429|5\d\d)\)/i.test(result.rowError)) {
            setError(`Tracerfy returned a temporary error at ${result.address}. All earlier completed rows are preserved. Research stopped rather than repeatedly hitting the service.`);
            stoppedEarly = true;
            break;
          }
        } catch (e) {
          const message = `Research stopped at ${i + 1} of ${pending.length}: ${e instanceof Error ? e.message : "network/server failure"}. Spend status for ${row.address} is uncertain, so it has been locked against automatic paid retry.`;
          checkpointUncertain(row, message);
          completed.set(lookupKey(row), {
            address: row.address,
            city: row.city,
            state: "FL",
            zip: row.zip,
            hit: false,
            persons_count: 0,
            credits_deducted: 0,
            persons: [],
            rowError: message,
            spendUncertain: true,
          });
          setResults(orderedResults(rows, completed.values()));
          setError(message);
          stoppedEarly = true;
          break;
        }
      }

      if (!stoppedEarly && uncertainBlocked) {
        setError(`${uncertainBlocked} earlier address${uncertainBlocked === 1 ? " remains" : "es remain"} blocked because its prior spend status is uncertain. Import the Tracerfy history backup to recover it without paying again.`);
      }
    } finally {
      setProcessing(false);
      resetPaidGate();
    }
  }

  async function pushPerson(row: LookupResult, person: Person, key: string) {
    setPush((p) => ({ ...p, [key]: { status: "loading" } }));
    try {
      const response = await fetch("/api/notion-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person,
          address: row.address,
          city: row.city,
          state: "FL",
          zip: row.zip,
          requestId: row.meta?.request_id,
          timestamp: row.meta?.timestamp,
          sourceSearch: expiredFiles.map((f) => f.filename).join(" + "),
          property: propertyForLookup(row),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? `Failed (${response.status})`);
      setPush((p) => ({ ...p, [key]: { status: "done" } }));
    } catch (e) {
      setPush((p) => ({ ...p, [key]: { status: "error", message: e instanceof Error ? e.message : "Push failed" } }));
    }
  }

  async function pushAll() {
    if (!results) return;

    const pending: Array<{ row: LookupResult; person: Person; key: string }> = [];
    for (let ri = 0; ri < results.length; ri += 1) {
      const row = results[ri];
      if (row.rowError || !row.hit) continue;
      for (let pi = 0; pi < row.persons.length; pi += 1) {
        const key = `${ri}-${pi}`;
        if (push[key]?.status !== "done") pending.push({ row, person: row.persons[pi], key });
      }
    }

    if (!pending.length) return;

    setPushing(true);
    setPushProgress({ current: 0, total: pending.length });
    try {
      for (let i = 0; i < pending.length; i += 1) {
        setPushProgress({ current: i + 1, total: pending.length });
        const item = pending[i];
        await pushPerson(item.row, item.person, item.key);
      }
    } finally {
      setPushing(false);
    }
  }

  const unknown = files.filter((f) => kindOf(f) === "unknown");
  const broken = files.filter((f) => validation(f).errors.length);
  const missingCurrent = expiredFiles.length > 0 && !currentFile;
  const pushable = results?.reduce((n, r) => n + (r.hit && !r.rowError ? r.persons.length : 0), 0) ?? 0;
  const pushed = (Object.values(push) as PushState[]).filter((s) => s.status === "done").length;
  const propertySyncFailures = results?.filter((r) => r.propertySyncError).length ?? 0;
  const completedResearchKeys = new Set((results ?? []).filter((r) => !r.rowError).map(lookupKey));
  const remainingResearch = clearLookupRows().filter((row) => !completedResearchKeys.has(lookupKey(row))).length;

  return (
    <div className="page">
      <div className="top-bar">
        <div><h1>MLS Intake</h1><p className="muted">Export your saved Matrix searches, drop the CSVs here, and continue from one screen.</p></div>
        <a href="/">&larr; Dashboard</a>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>1. Drop Matrix exports</h2>
        <input type="file" accept=".csv,text/csv" multiple onChange={(e) => addFiles(e.target.files)} />
        {error && <p className="error">{error}</p>}
      </div>

      {files.length > 0 && <div className="panel" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>2. Recognized exports</h2>
        {files.map((f) => {
          const k = kindOf(f); const v = validation(f); const statuses = statusSummary(f.rows);
          return <div className="person-card" key={f.id}>
            <strong>{v.errors.length ? "⚠" : k === "unknown" ? "🟡" : "✓"} {LABEL[k]}</strong>
            <p className="muted">{f.filename} · {f.rows.length} rows · {f.confidence} confidence</p>
            {statuses.length > 0 && <p className="meta">{statuses.map((s) => `${s.label}: ${s.count}`).join(" · ")}</p>}
            {v.errors.map((m) => <p className="error" key={m}>{m}</p>)}
            {v.warnings.map((m) => <p className="muted" key={m}>⚠ {m}</p>)}
            {k === "unknown" && <select value={k} onChange={(e) => { setKinds((old) => ({ ...old, [f.id]: e.target.value as MatrixExportKind })); setReviews({}); resetResearch(); resetPaidGate(); }}>
              <option value="unknown">Choose export type...</option><option value="current">Current Market Status</option><option value="expired">Expired Listings</option><option value="active">Active Inventory</option><option value="new">New Listings</option><option value="closed">Closed Sales</option>
            </select>}
            <button className="secondary" onClick={() => { setFiles((old) => old.filter((x) => x.id !== f.id)); setReviews({}); resetResearch(); resetPaidGate(); }}>Remove</button>
          </div>;
        })}
      </div>}

      {marketFiles.length > 0 && <div className="panel" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>3. Market data</h2>
        {marketFiles.map((f) => { const m = calculateMarketMetrics(f.rows); return <div className="person-card" key={f.id}>
          <strong>{LABEL[kindOf(f)]} · {m.listings} listings</strong>
          <p className="muted">Median list {money(m.medianListPrice)} · Median sale {money(m.medianSalePrice)} · Median DOM {m.medianDom ?? "—"} · Median CDOM {m.medianCdom ?? "—"}{m.medianSaleToList ? ` · Sale-to-list ${(m.medianSaleToList * 100).toFixed(1)}%` : ""}</p>
        </div>; })}
      </div>}

      {(expiredFiles.length > 0 || currentFile) && <div className="panel" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>4. Expired status gate</h2>
        {!currentFile && <p className="muted">Upload your fresh Current Market Status export to continue.</p>}
        {decisions && <>
          {expiredFiles.length > 1 && <p className="meta">{expiredFiles.length} expired exports combined · {expiredRows.length} unique properties{duplicateCount ? ` · ${duplicateCount} duplicate row(s) removed` : ""}</p>}
          {currentFiles.length > 1 && <p className="muted">⚠ Multiple current-status exports found; the most recently uploaded one is being used.</p>}
          <p className="meta">{decisions.length} checked · 🟢 {clearCount} clear · 🔴 {relistedCount} relisted · 🟡 {unresolved.length} review</p>
          {unresolved.map((d) => { const row = expiredRows[d.sourceIndex]; return <div className="person-card" key={d.sourceIndex}>
            <strong>{row[MATRIX_COLUMNS.address]}, {row[MATRIX_COLUMNS.city]} {row[MATRIX_COLUMNS.zip]}</strong>
            <p className="muted">{d.reason}</p>
            {d.matched && <p className="meta">Possible match: {d.matched.address}{d.matched.status ? ` · ${d.matched.status}` : ""}{d.matched.mls ? ` · MLS ${d.matched.mls}` : ""}</p>}
            <button className="secondary" onClick={() => { setReviews((r) => ({ ...r, [d.sourceIndex]: "clear" })); resetResearch(); resetPaidGate(); }}>Mark CLEAR</button>{" "}
            <button className="secondary" onClick={() => { setReviews((r) => ({ ...r, [d.sourceIndex]: "relisted" })); resetResearch(); resetPaidGate(); }}>Mark RELISTED</button>
          </div>; })}
          {!unresolved.length && <>
            <p className="muted">✓ Status gate complete.</p>

            <div className="person-card" style={{ marginTop: 12 }}>
              <strong>🛟 Recover already-run Tracerfy results — $0</strong>
              <p className="muted">If a previous portal run failed after Tracerfy processed addresses, export your <strong>Instant Trace API History</strong> CSV from Tracerfy and load it here. Matching CLEAR properties are restored from the raw <code>response_data</code> without making any Tracerfy API call.</p>
              <input type="file" accept=".csv,text/csv" onChange={(e) => importTracerfyBackup(e.target.files?.[0])} />
              {recoveryMessage && <p className="meta">{recoveryMessage}</p>}
            </div>

            <div className="person-card" style={{ marginTop: 12 }}>
              <strong>💳 PAID LOOKUP GATE</strong>
              <p className="muted"><strong>This next step can spend money.</strong> Tracerfy credits may be deducted only for CLEAR addresses that are not already in your CRM and do not have a saved completed lookup checkpoint. Successful results are now checkpointed one address at a time.</p>
              <label>
                <input type="checkbox" checked={spendConfirmed} onChange={(e) => setSpendConfirmed(e.target.checked)} />{" "}
                I understand that running research may spend Tracerfy credits.
              </label>
            </div>

            <details className="person-card" style={{ marginTop: 12 }}>
              <summary><strong>⚠ Danger zone: PAY to re-run addresses already in CRM</strong></summary>
              <p className="error"><strong>Normally leave this OFF.</strong> Turning this on bypasses the money-saving CRM duplicate check and can charge you again for addresses you have already researched.</p>
              <p className="muted">To enable it, you must intentionally type <strong>RE-SPEND</strong> into a confirmation prompt. Saved lookup checkpoints still take priority unless you separately clear them in Advanced.</p>
              <label>
                <input type="checkbox" checked={forceAll} onChange={(e) => changeExistingCrmPaidOverride(e.target.checked)} />{" "}
                {forceAll ? "PAID OVERRIDE ACTIVE — re-run Tracerfy on existing CRM addresses" : "Enable paid re-check of existing CRM addresses"}
              </label>
            </details>

            <div style={{ marginTop: 10 }}>
              <button disabled={processing || !clearCount || !spendConfirmed} onClick={researchClear}>
                {processing
                  ? `Researching ${researchProgress.current} of ${researchProgress.total}...`
                  : remainingResearch < clearCount
                    ? `5. Resume research — ${remainingResearch} of ${clearCount} CLEAR properties still need review`
                    : `5. Run research on ${clearCount} CLEAR properties — paid where needed`}
              </button>
              {!spendConfirmed && <p className="meta">Locked until you acknowledge the paid lookup gate. Backup recovery above is always $0 and does not require this gate.</p>}
            </div>
          </>}
        </>}
      </div>}

      {results && <div className="panel" style={{ marginTop: 16 }}>
        <div className="top-bar"><div><h2 style={{ marginTop: 0 }}>5. Research results</h2><p className="meta">{results.length} addresses preserved · {pushable} owner record(s) can be sent to Notion</p></div>
          {pushable > 0 && <button disabled={pushing || pushed === pushable} onClick={pushAll}>{pushing ? `Pushing ${pushProgress.current} of ${pushProgress.total}...` : pushed === pushable ? "All pushed ✓" : `Push all ${pushable - pushed} to Notion`}</button>}
        </div>
        {results.map((row, ri) => <div className="person-card" key={`${row.address}-${ri}`}>
          <strong>{row.address}, {row.city} FL {row.zip}</strong>
          {row.recoveredFromBackup && <p className="muted">🛟 Recovered from Tracerfy history backup — $0 additional credits spent.</p>}
          {row.recoveredFromCheckpoint && <p className="muted">↩ Restored from a saved browser checkpoint — $0 additional credits spent.</p>}
          {row.spendUncertain && <p className="error">⚠ Spend status uncertain. Automatic paid retry is blocked until this is reconciled from Tracerfy history or checkpoints are intentionally cleared.</p>}
          {row.rowError ? <p className="error">{row.rowError}</p> : row.alreadyInCrm ? <>
            <p className="muted">Already in CRM — no Tracerfy credits spent.{row.propertySynced ? " Property Research refreshed + linked ✓" : ""}</p>
            {row.propertySyncError && <p className="error">Property Research sync: {row.propertySyncError}</p>}
          </> : !row.hit ? <p className="muted">No owner/contact records found. Credits charged for this lookup: {row.credits_deducted ?? 0}.</p> : <>
            <p className="meta">Tracerfy credits charged: {row.credits_deducted ?? 0} · {row.persons_count} owner/person record{row.persons_count === 1 ? "" : "s"}</p>
            {row.persons.map((person, pi) => {
              const key = `${ri}-${pi}`; return <div key={key} style={{ marginTop: 10 }}>
                <strong>{person.full_name}</strong>{person.litigator && <span className="badge bad">LITIGATOR — DO NOT CONTACT</span>}{person.deceased && <span className="badge bad">DECEASED</span>}
                <p className="muted">DNC: {dncStatus(person)} · Eligible for: {outreachEligibility(person).join(", ")}</p>
                {person.phones?.map((phone, i) => <div className="phone-row" key={i}><span>{formatPhone(phone.number)}</span><span className="muted">{phone.type}</span>{phone.dnc ? <span className="badge bad">DNC</span> : <span className="badge ok">CLEAR</span>}{phone.tcpa && <span className="badge warn">TCPA</span>}</div>)}
                {push[key]?.status === "error" && <p className="error">{push[key].message}</p>}
                {push[key]?.status === "done" && <p className="muted">✓ CRM + Property Research linked</p>}
              </div>;
            })}
          </>}
        </div>)}
      </div>}

      {files.length > 0 && <div className="panel" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Completion</h2>
        {unknown.length > 0 ? <p className="muted">Classify {unknown.length} ambiguous export(s).</p>
          : broken.length > 0 ? <p className="muted">Fix {broken.length} invalid export(s).</p>
          : missingCurrent ? <p className="muted">Upload Current Market Status.</p>
          : unresolved.length > 0 ? <p className="muted">Resolve {unresolved.length} possible relist match(es).</p>
          : propertySyncFailures > 0 ? <p className="error">Fix {propertySyncFailures} Property Research sync failure(s) shown above.</p>
          : results && remainingResearch === 0 && pushable > 0 && pushed === pushable ? <p className="muted">✓ Intake, contact research, CRM push, and Property Research linking complete.</p>
          : results && remainingResearch > 0 ? <p className="muted">✓ {clearCount - remainingResearch} research result(s) preserved. {remainingResearch} CLEAR propert{remainingResearch === 1 ? "y" : "ies"} still need research or recovery.</p>
          : decisions && !results && clearCount > 0 ? <p className="muted">✓ Intake complete. Recover prior Tracerfy history for $0 if applicable, or unlock the paid lookup gate when ready.</p>
          : <p className="muted">✓ Uploaded files are recognized and valid.</p>}
      </div>}

      <details className="panel" style={{ marginTop: 16 }}>
        <summary className="muted">Advanced</summary>
        <p className="meta">MIAMI Matrix `St` is listing status, never property state. Paid lookup is normalized to Florida. Tracerfy research now runs one address per server request so a long batch cannot fail all-or-nothing. Each definitive result is checkpointed locally in this browser before the next paid lookup begins. A network/non-JSON failure locks that one address as spend-uncertain instead of automatically charging it again. Tracerfy Instant Trace API History CSVs can restore matching raw results without another API call. CLEAR expired rows carry their Matrix property facts into Property Research; Property Research's Mailer Tier formula drives the CRM premium-mailer flag. Legacy direct processing remains at <a href="/import">/import</a>.</p>
        <button className="secondary" onClick={clearSavedLookupCheckpoints}>Clear saved Tracerfy checkpoints</button>
      </details>
    </div>
  );
}
