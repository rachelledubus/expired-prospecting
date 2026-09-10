export type CsvRow = Record<string, string>;

export type ExpiredColumnMap = {
  address: string;
  city: string;
  state: string;
  zip: string;
  folio: string;
};

export type CurrentMarketColumnMap = {
  address: string;
  city: string;
  state: string;
  zip: string;
  folio: string;
  status: string;
  mls: string;
};

export type StatusDecision = {
  sourceIndex: number;
  status: "clear" | "relisted" | "review";
  reason: string;
  matchMethod?: "folio" | "address+zip" | "address+city" | "address-only";
  matchCount?: number;
  matched?: {
    address: string;
    city: string;
    state: string;
    zip: string;
    folio: string;
    status: string;
    mls: string;
  };
};

// Official MIAMI REALTORS MLS status abbreviations.
// Source: MIAMI REALTORS Help Center, "What do the MLS Status Codes mean and when do you use them"
// (verified September 10, 2026 against the June 17, 2025 help-center article).
export const MIAMI_MLS_STATUS_LABELS: Record<string, string> = {
  A: "Active / Available",
  AC: "Active with Contract",
  C: "Cancelled",
  CS: "Closed Sale",
  PS: "Pending Sale / Rental",
  R: "Rented",
  T: "Temporarily Off Market",
  W: "Withdrawn",
  X: "Expired",
};

export function expandMiamiMlsStatus(value: string): string {
  const code = value.trim().toUpperCase();
  if (!code) return "";
  const label = MIAMI_MLS_STATUS_LABELS[code];
  return label ? `${label} (${code})` : `Unknown MLS status (${code})`;
}

const SUFFIXES: [RegExp, string][] = [
  [/\bSTREET\b/g, "ST"],
  [/\bAVENUE\b/g, "AVE"],
  [/\bBOULEVARD\b/g, "BLVD"],
  [/\bROAD\b/g, "RD"],
  [/\bDRIVE\b/g, "DR"],
  [/\bLANE\b/g, "LN"],
  [/\bCOURT\b/g, "CT"],
  [/\bPLACE\b/g, "PL"],
  [/\bTERRACE\b/g, "TER"],
  [/\bCIRCLE\b/g, "CIR"],
  [/\bPARKWAY\b/g, "PKWY"],
  [/\bHIGHWAY\b/g, "HWY"],
  [/\bTRAIL\b/g, "TRL"],
  [/\bWAY\b/g, "WAY"],
];

const DIRECTIONS: [RegExp, string][] = [
  [/\bNORTHWEST\b/g, "NW"],
  [/\bNORTHEAST\b/g, "NE"],
  [/\bSOUTHWEST\b/g, "SW"],
  [/\bSOUTHEAST\b/g, "SE"],
  [/\bNORTH\b/g, "N"],
  [/\bSOUTH\b/g, "S"],
  [/\bEAST\b/g, "E"],
  [/\bWEST\b/g, "W"],
];

function raw(row: CsvRow, column: string): string {
  return column ? String(row[column] ?? "").trim() : "";
}

export function normalizeFolio(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function normalizeZip(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.slice(0, 5);
}

export function normalizeCity(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeAddress(value: string): string {
  let normalized = value
    .toUpperCase()
    .replace(/[.,'’]/g, " ")
    .replace(/\b(\d+)(ST|ND|RD|TH)\b/g, "$1")
    .replace(/\s+(APT|APARTMENT|UNIT|STE|SUITE)\s*#?\s*[A-Z0-9-]+.*$/g, "")
    .replace(/\s+#\s*[A-Z0-9-]+.*$/g, "")
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const [pattern, replacement] of DIRECTIONS) {
    normalized = normalized.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of SUFFIXES) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized.replace(/\s+/g, " ").trim();
}

function currentDisplay(row: CsvRow, map: CurrentMarketColumnMap) {
  // MIAMI Matrix exports the listing status under the header `St`.
  // Use the manually mapped status column when present, otherwise fall back
  // specifically to `St`. We do not treat `St` as a property-state field.
  const statusCode = raw(row, map.status) || raw(row, "St");

  return {
    address: raw(row, map.address),
    city: raw(row, map.city),
    state: raw(row, map.state),
    zip: raw(row, map.zip),
    folio: raw(row, map.folio),
    status: expandMiamiMlsStatus(statusCode),
    mls: raw(row, map.mls),
  };
}

function addIndex(index: Map<string, number[]>, key: string, rowIndex: number) {
  if (!key) return;
  const existing = index.get(key);
  if (existing) existing.push(rowIndex);
  else index.set(key, [rowIndex]);
}

export function runMlsStatusCheck(
  expiredRows: CsvRow[],
  expiredMap: ExpiredColumnMap,
  currentRows: CsvRow[],
  currentMap: CurrentMarketColumnMap
): StatusDecision[] {
  const folioIndex = new Map<string, number[]>();
  const addressZipIndex = new Map<string, number[]>();
  const addressCityIndex = new Map<string, number[]>();
  const addressOnlyIndex = new Map<string, number[]>();

  currentRows.forEach((row, rowIndex) => {
    const folio = normalizeFolio(raw(row, currentMap.folio));
    const address = normalizeAddress(raw(row, currentMap.address));
    const zip = normalizeZip(raw(row, currentMap.zip));
    const city = normalizeCity(raw(row, currentMap.city));

    addIndex(folioIndex, folio, rowIndex);
    addIndex(addressZipIndex, address && zip ? `${address}|${zip}` : "", rowIndex);
    addIndex(addressCityIndex, address && city ? `${address}|${city}` : "", rowIndex);
    addIndex(addressOnlyIndex, address, rowIndex);
  });

  return expiredRows.map((row, sourceIndex) => {
    const folio = normalizeFolio(raw(row, expiredMap.folio));
    const address = normalizeAddress(raw(row, expiredMap.address));
    const zip = normalizeZip(raw(row, expiredMap.zip));
    const city = normalizeCity(raw(row, expiredMap.city));

    const makeRelisted = (
      matches: number[],
      matchMethod: StatusDecision["matchMethod"],
      reason: string
    ): StatusDecision => ({
      sourceIndex,
      status: "relisted",
      reason,
      matchMethod,
      matchCount: matches.length,
      matched: currentDisplay(currentRows[matches[0]], currentMap),
    });

    if (folio) {
      const folioMatches = folioIndex.get(folio) ?? [];
      if (folioMatches.length > 0) {
        return makeRelisted(
          folioMatches,
          "folio",
          "Same property folio appears in the current market export."
        );
      }
    }

    if (address && zip) {
      const exactZipMatches = addressZipIndex.get(`${address}|${zip}`) ?? [];
      if (exactZipMatches.length > 0) {
        return makeRelisted(
          exactZipMatches,
          "address+zip",
          "Normalized street address and ZIP match the current market export."
        );
      }
    }

    if (address && city) {
      const exactCityMatches = addressCityIndex.get(`${address}|${city}`) ?? [];
      if (exactCityMatches.length > 0) {
        return makeRelisted(
          exactCityMatches,
          "address+city",
          "Normalized street address and city match the current market export."
        );
      }
    }

    if (address) {
      const addressMatches = addressOnlyIndex.get(address) ?? [];
      if (addressMatches.length > 0) {
        return {
          sourceIndex,
          status: "review",
          reason:
            addressMatches.length === 1
              ? "Street address matches, but city/ZIP could not confirm the property."
              : "Street address matches multiple current-market rows; confirm the correct property manually.",
          matchMethod: "address-only",
          matchCount: addressMatches.length,
          matched: currentDisplay(currentRows[addressMatches[0]], currentMap),
        };
      }
    }

    return {
      sourceIndex,
      status: "clear",
      reason: "No folio or confirmed normalized-address match found in the current market export.",
    };
  });
}
