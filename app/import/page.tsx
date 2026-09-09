"use client";

import { useState } from "react";
import Papa from "papaparse";
import {
  formatPhone,
  outreachEligibility,
  dncStatus,
  type LookupResult,
  type Person,
} from "@/lib/tracerfy";

type ColumnMap = {
  address: string;
  city: string;
  state: string;
  zip: string;
};

const FIELD_GUESSES: Record<keyof ColumnMap, string[]> = {
  address: ["address", "street address", "street", "property address"],
  city: ["city"],
  state: ["state", "st"],
  zip: ["zip", "zip code", "postal code", "postal"],
};

function guessColumn(headers: string[], field: keyof ColumnMap): string {
  const guesses = FIELD_GUESSES[field];
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

type PushKey = string;
type RowResult = LookupResult & { rowError?: string };
type PushState = { status: "loading" | "done" | "error"; message?: string };

export default function ImportPage() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [columnMap, setColumnMap] = useState<ColumnMap>({ address: "", city: "", state: "", zip: "" });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RowResult[] | null>(null);
  const [pushStatus, setPushStatus] = useState<Record<PushKey, PushState>>({});

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        const fields = parsed.meta.fields ?? [];
        setHeaders(fields);
        setCsvRows(parsed.data);
        setColumnMap({
          address: guessColumn(fields, "address"),
          city: guessColumn(fields, "city"),
          state: guessColumn(fields, "state"),
          zip: guessColumn(fields, "zip"),
        });
        setResults(null);
        setError(null);
      },
      error: (err) => setError(`Could not read CSV: ${err.message}`),
    });
  }

  const mappingComplete = columnMap.address && columnMap.city && columnMap.state && columnMap.zip;

  async function handleProcess() {
    if (!mappingComplete) return;
    setProcessing(true);
    setError(null);

    const rows = csvRows.map((row) => ({
      address: row[columnMap.address]?.trim() ?? "",
      city: row[columnMap.city]?.trim() ?? "",
      state: row[columnMap.state]?.trim() ?? "",
      zip: row[columnMap.zip]?.trim() ?? "",
    })).filter((r) => r.address && r.city && r.state && r.zip);

    try {
      const res = await fetch("/api/bulk-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
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
      setPushStatus((prev) => ({ ...prev, [key]: { status: "done" } }));
    } catch {
      setPushStatus((prev) => ({ ...prev, [key]: { status: "error", message: "Network error" } }));
    }
  }

  const hitCount = results?.filter((r) => r.hit).length ?? 0;

  return (
    <div className="page">
      <div className="top-bar">
        <div>
          <h1>Import Expired Listings</h1>
          <p className="muted">Upload an MLS export CSV, map the address columns, then run it through Tracerfy.</p>
        </div>
        <a href="/">&larr; Dashboard</a>
      </div>

      <div className="panel">
        <div className="field">
          <label htmlFor="csv">CSV file</label>
          <input id="csv" type="file" accept=".csv" onChange={handleFile} />
        </div>

        {headers.length > 0 && (
          <>
            <p className="muted">{csvRows.length} row(s) found. Map the address columns below.</p>
            {(["address", "city", "state", "zip"] as const).map((field) => (
              <div className="field" key={field}>
                <label htmlFor={field}>{field[0].toUpperCase() + field.slice(1)} column</label>
                <select
                  id={field}
                  value={columnMap[field]}
                  onChange={(e) => setColumnMap((prev) => ({ ...prev, [field]: e.target.value }))}
                >
                  <option value="">-- select column --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <button onClick={handleProcess} disabled={!mappingComplete || processing}>
              {processing ? "Processing..." : `Process ${csvRows.length} properties`}
            </button>
          </>
        )}
        {error && <p className="error">{error}</p>}
      </div>

      {results && (
        <div style={{ marginTop: 20 }}>
          <p className="meta">
            {results.length} address(es) checked · {hitCount} with owner/contact info found
          </p>

          {results.map((row, i) => (
            <div className="panel" key={i} style={{ marginTop: 12 }}>
              <strong>
                {row.address}, {row.city} {row.state} {row.zip}
              </strong>

              {row.rowError ? (
                <p className="error" style={{ marginTop: 8 }}>
                  {row.rowError}
                </p>
              ) : !row.hit || row.persons_count === 0 ? (
                <p className="muted" style={{ marginTop: 8 }}>
                  No owner/contact records found.
                </p>
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
                            ? "Added to CRM"
                            : push?.status === "loading"
                              ? "Adding..."
                              : "Add to Notion"}
                        </button>
                        {push?.status === "error" && <span className="error"> {push.message}</span>}
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
