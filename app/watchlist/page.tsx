"use client";

import { useState } from "react";
import Papa from "papaparse";

type RequiredMap = { address: string; city: string; zip: string };
type OptionalField =
  | "beds"
  | "baths"
  | "sqft"
  | "yearBuilt"
  | "originalPrice"
  | "currentPrice"
  | "dom"
  | "priceChanges";
type OptionalMap = Record<OptionalField, string>;

const REQUIRED_GUESSES: Record<keyof RequiredMap, string[]> = {
  address: ["address", "street address", "street", "property address"],
  city: ["city"],
  zip: ["zip", "zip code", "postal code", "postal"],
};

const OPTIONAL_GUESSES: Record<OptionalField, string[]> = {
  beds: ["beds", "bedrooms", "br"],
  baths: ["baths", "bathrooms", "ba"],
  sqft: ["sq ft", "sqft", "square feet", "living area", "total sqft"],
  yearBuilt: ["year built", "yr built"],
  originalPrice: ["original list price", "original price", "orig list price", "orig price"],
  currentPrice: ["list price", "current price", "final list price", "price"],
  dom: ["dom", "days on market"],
  priceChanges: ["number of price changes", "price changes", "# price changes"],
};

const OPTIONAL_LABELS: Record<OptionalField, string> = {
  beds: "Beds",
  baths: "Baths",
  sqft: "Sq Ft",
  yearBuilt: "Year Built",
  originalPrice: "Original List Price",
  currentPrice: "Current List Price",
  dom: "DOM",
  priceChanges: "# Price Changes",
};

function guessColumn(headers: string[], guesses: string[]): string {
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

function parseNumber(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[$,]/g, "").trim();
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

type ResultRow = { address: string; action?: "created" | "updated"; url?: string; error?: string };

export default function WatchlistPage() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [requiredMap, setRequiredMap] = useState<RequiredMap>({ address: "", city: "", zip: "" });
  const [optionalMap, setOptionalMap] = useState<OptionalMap>({
    beds: "",
    baths: "",
    sqft: "",
    yearBuilt: "",
    originalPrice: "",
    currentPrice: "",
    dom: "",
    priceChanges: "",
  });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultRow[] | null>(null);

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
        setRequiredMap({
          address: guessColumn(fields, REQUIRED_GUESSES.address),
          city: guessColumn(fields, REQUIRED_GUESSES.city),
          zip: guessColumn(fields, REQUIRED_GUESSES.zip),
        });
        setOptionalMap({
          beds: guessColumn(fields, OPTIONAL_GUESSES.beds),
          baths: guessColumn(fields, OPTIONAL_GUESSES.baths),
          sqft: guessColumn(fields, OPTIONAL_GUESSES.sqft),
          yearBuilt: guessColumn(fields, OPTIONAL_GUESSES.yearBuilt),
          originalPrice: guessColumn(fields, OPTIONAL_GUESSES.originalPrice),
          currentPrice: guessColumn(fields, OPTIONAL_GUESSES.currentPrice),
          dom: guessColumn(fields, OPTIONAL_GUESSES.dom),
          priceChanges: guessColumn(fields, OPTIONAL_GUESSES.priceChanges),
        });
        setResults(null);
        setError(null);
      },
      error: (err) => setError(`Could not read CSV: ${err.message}`),
    });
  }

  const mappingComplete = requiredMap.address && requiredMap.city && requiredMap.zip;

  async function handleProcess() {
    if (!mappingComplete) return;
    setProcessing(true);
    setError(null);

    const rows = csvRows
      .map((row) => ({
        address: row[requiredMap.address]?.trim() ?? "",
        city: row[requiredMap.city]?.trim() ?? "",
        zip: row[requiredMap.zip]?.trim() ?? "",
        beds: parseNumber(optionalMap.beds ? row[optionalMap.beds] : undefined),
        baths: parseNumber(optionalMap.baths ? row[optionalMap.baths] : undefined),
        sqft: parseNumber(optionalMap.sqft ? row[optionalMap.sqft] : undefined),
        yearBuilt: parseNumber(optionalMap.yearBuilt ? row[optionalMap.yearBuilt] : undefined),
        originalPrice: parseNumber(optionalMap.originalPrice ? row[optionalMap.originalPrice] : undefined),
        currentPrice: parseNumber(optionalMap.currentPrice ? row[optionalMap.currentPrice] : undefined),
        dom: parseNumber(optionalMap.dom ? row[optionalMap.dom] : undefined),
        priceChanges: parseNumber(optionalMap.priceChanges ? row[optionalMap.priceChanges] : undefined),
      }))
      .filter((r) => r.address && r.city && r.zip);

    try {
      const res = await fetch("/api/watchlist-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Watchlist import failed.");
        return;
      }

      setResults(data.results);
    } catch {
      setError("Something went wrong reaching the import service.");
    } finally {
      setProcessing(false);
    }
  }

  const createdCount = results?.filter((r) => r.action === "created").length ?? 0;
  const updatedCount = results?.filter((r) => r.action === "updated").length ?? 0;
  const errorCount = results?.filter((r) => r.error).length ?? 0;

  return (
    <div className="page">
      <div className="top-bar">
        <div>
          <h1>Import Watchlist</h1>
          <p className="muted">
            Price Reductions or Stale Listings from MLS — logged into Property Research for later
            context. No Tracerfy lookups here; these aren't leads yet.
          </p>
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
            <p className="muted">{csvRows.length} row(s) found. Map the required columns:</p>
            {(["address", "city", "zip"] as const).map((field) => (
              <div className="field" key={field}>
                <label htmlFor={field}>{field[0].toUpperCase() + field.slice(1)} column</label>
                <select
                  id={field}
                  value={requiredMap[field]}
                  onChange={(e) => setRequiredMap((prev) => ({ ...prev, [field]: e.target.value }))}
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

            <p className="muted" style={{ marginTop: 12 }}>
              Optional columns (leave as "none" if your export doesn't have one):
            </p>
            {(Object.keys(OPTIONAL_LABELS) as OptionalField[]).map((field) => (
              <div className="field" key={field}>
                <label htmlFor={field}>{OPTIONAL_LABELS[field]}</label>
                <select
                  id={field}
                  value={optionalMap[field]}
                  onChange={(e) => setOptionalMap((prev) => ({ ...prev, [field]: e.target.value }))}
                >
                  <option value="">-- none --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <button onClick={handleProcess} disabled={!mappingComplete || processing} style={{ marginTop: 12 }}>
              {processing ? "Importing..." : `Import ${csvRows.length} properties`}
            </button>
          </>
        )}
        {error && <p className="error">{error}</p>}
      </div>

      {results && (
        <div className="panel" style={{ marginTop: 20 }}>
          <p className="meta">
            {createdCount} created · {updatedCount} updated{errorCount > 0 ? ` · ${errorCount} failed` : ""}
          </p>
          {results.map((r, i) => (
            <p key={i} className={r.error ? "error" : "muted"} style={{ marginTop: 6 }}>
              {r.address} —{" "}
              {r.error ? (
                r.error
              ) : (
                <>
                  {r.action}{" "}
                  <a href={r.url} target="_blank" rel="noreferrer">
                    Open in Notion
                  </a>
                </>
              )}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
