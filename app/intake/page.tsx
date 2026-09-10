"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import {
  MATRIX_COLUMNS,
  buildMatrixIntakeFile,
  calculateMarketMetrics,
  expiredPropertyPayload,
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

type RowResult = LookupResult & {
  rowError?: string;
  alreadyInCrm?: ExistingLeadRecord[];
  propertySynced?: boolean;
  propertySyncError?: string;
};
type PushState = { status: "loading" | "done" | "error"; message?: string };

function money(v: number | null) {
  return v === null
    ? "—"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

export default function MlsIntakePage() {
  const [files, setFiles] = useState<MatrixIntakeFile[]>([]);
  const [kinds, setKinds] = useState<Record<string, MatrixExportKind>>({});
  const [reviews, setReviews] = useState<Record<number, "clear" | "relisted">>({});
  const [results, setResults] = useState<RowResult[] | null>(null);
  const [push, setPush] = useState<Record<string, PushState>>({});
  const [processing, setProcessing] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [spendConfirmed, setSpendConfirmed] = useState(false);
  const [forceAll, setForceAll] = useState(false);
  const [existingRefreshConfirmed, setExistingRefreshConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kindOf = (f: MatrixIntakeFile) => kinds[f.id] ?? f.kind;
  const validation = (f: MatrixIntakeFile) => validateMatrixExport(kindOf(f), f.headers, f.rows);
  const resetResearch = () => { setResults(null); setPush({}); setError(null); };
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
    return runMlsStatusCheck(expiredRows, EXPIRED_MAP, currentFile.rows, CURRENT_MAP);
  }, [expiredRows, currentFile]);

  const effective = decisions?.map((d) => ({ ...d, status: reviews[d.sourceIndex] ?? d.status })) ?? [];
  const clearIndexes = new Set(effective.filter((d) => d.status === "clear").map((d) => d.sourceIndex));
  const clearCount = clearIndexes.size;
  const relistedCount = effective.filter((d) => d.status === "relisted").length;
  const unresolved = decisions?.filter((d) => d.status === "review" && !reviews[d.sourceIndex]) ?? [];

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

  async function researchClear() {
    if (!decisions || unresolved.length || !clearCount || !spendConfirmed) return;
    const rows = expiredRows.map((row, i) => ({
      i,
      address: String(row[MATRIX_COLUMNS.address] ?? "").trim(),
      city: String(row[MATRIX_COLUMNS.city] ?? "").trim(),
      state: "FL",
      zip: String(row[MATRIX_COLUMNS.zip] ?? "").trim(),
    })).filter((r) => clearIndexes.has(r.i) && r.address && r.city && r.zip)
      .map(({ i: _i, ...r }) => r);

    setProcessing(true); resetResearch();
    try {
      const response = await fetch("/api/bulk-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, forceAll, spendConfirmed, existingRefreshConfirmed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Bulk lookup failed");
      const nextResults = data.results as RowResult[];
      await syncExistingCrmProperties(nextResults);
      setResults(nextResults);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk lookup failed");
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
    setPushing(true);
    for (let ri = 0; ri < results.length; ri += 1) {
      const row = results[ri];
      if (row.rowError || !row.hit) continue;
      for (let pi = 0; pi < row.persons.length; pi += 1) {
        const key = `${ri}-${pi}`;
        if (push[key]?.status !== "done") await pushPerson(row, row.persons[pi], key);
      }
    }
    setPushing(false);
  }

  const unknown = files.filter((f) => kindOf(f) === "unknown");
  const broken = files.filter((f) => validation(f).errors.length);
  const missingCurrent = expiredFiles.length > 0 && !currentFile;
  const pushable = results?.reduce((n, r) => n + (r.hit && !r.rowError ? r.persons.length : 0), 0) ?? 0;
  const pushed = (Object.values(push) as PushState[]).filter((s) => s.status === "done").length;
  const propertySyncFailures = results?.filter((r) => r.propertySyncError).length ?? 0;

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
            <p className="muted">✓ Status gate complete. No Tracerfy request can run until you explicitly unlock the spending gate below.</p>

            <div className="person-card" style={{ marginTop: 12 }}>
              <strong>💳 PAID LOOKUP GATE</strong>
              <p className="muted"><strong>This next step can spend money.</strong> Tracerfy credits may be deducted for CLEAR addresses that are not already in your CRM. Addresses already in CRM are skipped at $0 by default.</p>
              <label>
                <input
                  type="checkbox"
                  checked={spendConfirmed}
                  onChange={(e) => setSpendConfirmed(e.target.checked)}
                />{" "}
                I understand that running research may spend Tracerfy credits.
              </label>
            </div>

            <details className="person-card" style={{ marginTop: 12 }}>
              <summary><strong>⚠ Danger zone: PAY to re-run addresses already in CRM</strong></summary>
              <p className="error"><strong>Normally leave this OFF.</strong> Turning this on bypasses the money-saving duplicate check and can charge you again for addresses you have already researched.</p>
              <p className="muted">To enable it, you must intentionally type <strong>RE-SPEND</strong> into a confirmation prompt.</p>
              <label>
                <input
                  type="checkbox"
                  checked={forceAll}
                  onChange={(e) => changeExistingCrmPaidOverride(e.target.checked)}
                />{" "}
                {forceAll ? "PAID OVERRIDE ACTIVE — re-run Tracerfy on existing CRM addresses" : "Enable paid re-check of existing CRM addresses"}
              </label>
            </details>

            <div style={{ marginTop: 10 }}>
              <button disabled={processing || !clearCount || !spendConfirmed} onClick={researchClear}>
                {processing ? "Researching..." : `5. Run research on ${clearCount} CLEAR properties — paid where needed`}
              </button>
              {!spendConfirmed && <p className="meta">Locked until you acknowledge the paid lookup gate.</p>}
            </div>
          </>}
        </>}
      </div>}

      {results && <div className="panel" style={{ marginTop: 16 }}>
        <div className="top-bar"><div><h2 style={{ marginTop: 0 }}>5. Research results</h2><p className="meta">{results.length} addresses processed · {pushable} owner record(s) can be sent to Notion</p></div>
          {pushable > 0 && <button disabled={pushing || pushed === pushable} onClick={pushAll}>{pushing ? "Pushing..." : pushed === pushable ? "All pushed ✓" : `Push all ${pushable - pushed} to Notion`}</button>}
        </div>
        {results.map((row, ri) => <div className="person-card" key={`${row.address}-${ri}`}>
          <strong>{row.address}, {row.city} FL {row.zip}</strong>
          {row.rowError ? <p className="error">{row.rowError}</p> : row.alreadyInCrm ? <>
            <p className="muted">Already in CRM — no Tracerfy credits spent.{row.propertySynced ? " Property Research refreshed + linked ✓" : ""}</p>
            {row.propertySyncError && <p className="error">Property Research sync: {row.propertySyncError}</p>}
          </> : !row.hit ? <p className="muted">No owner/contact records found.</p> : row.persons.map((person, pi) => {
            const key = `${ri}-${pi}`; return <div key={key} style={{ marginTop: 10 }}>
              <strong>{person.full_name}</strong>{person.litigator && <span className="badge bad">LITIGATOR — DO NOT CONTACT</span>}{person.deceased && <span className="badge bad">DECEASED</span>}
              <p className="muted">DNC: {dncStatus(person)} · Eligible for: {outreachEligibility(person).join(", ")}</p>
              {person.phones?.map((phone, i) => <div className="phone-row" key={i}><span>{formatPhone(phone.number)}</span><span className="muted">{phone.type}</span>{phone.dnc ? <span className="badge bad">DNC</span> : <span className="badge ok">CLEAR</span>}{phone.tcpa && <span className="badge warn">TCPA</span>}</div>)}
              {push[key]?.status === "error" && <p className="error">{push[key].message}</p>}
              {push[key]?.status === "done" && <p className="muted">✓ CRM + Property Research linked</p>}
            </div>;
          })}
        </div>)}
      </div>}

      {files.length > 0 && <div className="panel" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Completion</h2>
        {unknown.length > 0 ? <p className="muted">Classify {unknown.length} ambiguous export(s).</p>
          : broken.length > 0 ? <p className="muted">Fix {broken.length} invalid export(s).</p>
          : missingCurrent ? <p className="muted">Upload Current Market Status.</p>
          : unresolved.length > 0 ? <p className="muted">Resolve {unresolved.length} possible relist match(es).</p>
          : propertySyncFailures > 0 ? <p className="error">Fix {propertySyncFailures} Property Research sync failure(s) shown above.</p>
          : results && pushable > 0 && pushed === pushable ? <p className="muted">✓ Intake, contact research, CRM push, and Property Research linking complete.</p>
          : decisions && !results && clearCount > 0 ? <p className="muted">✓ Intake complete. Unlock the paid lookup gate only when you are ready to run Tracerfy; no re-upload is required.</p>
          : <p className="muted">✓ Uploaded files are recognized and valid.</p>}
      </div>}

      <details className="panel" style={{ marginTop: 16 }}><summary className="muted">Advanced</summary><p className="meta">MIAMI Matrix `St` is listing status, never property state. Paid lookup is normalized to Florida. Every Tracerfy run requires an explicit spending acknowledgment; paid re-checks of existing CRM addresses require a separate RE-SPEND confirmation. CLEAR expired rows carry their Matrix property facts into Property Research; Property Research's Mailer Tier formula drives the CRM premium-mailer flag. Legacy direct processing remains at <a href="/import">/import</a>.</p></details>
    </div>
  );
}
