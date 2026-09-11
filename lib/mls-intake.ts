import { expandMiamiMlsStatus, type CsvRow } from "./mls-status";

export type MatrixExportKind = "expired" | "current" | "active" | "new" | "closed" | "unknown";

export type MatrixIntakeFile = {
  id: string;
  filename: string;
  headers: string[];
  rows: CsvRow[];
  kind: MatrixExportKind;
  confidence: "high" | "medium" | "low";
  reasons: string[];
  errors: string[];
  warnings: string[];
};

export type ExpiredPropertyPayload = {
  address: string;
  city: string;
  zip: string;
  listingStatus: "Expired";
  folioNumber?: string;
  dateOffMarket?: string;
  originalPrice?: number;
  finalPrice?: number;
  dom?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  yearBuilt?: number;
  propertyType?: string;
  hoaAmount?: number;
  hoaCadence?: string;
};

export const MATRIX_COLUMNS = {
  mls: "MLS # Link",
  status: "St",
  propertyType: "Property Type",
  address: "Address",
  city: "City Name",
  zip: "Zip Code",
  entryDate: "Entry Date",
  expirationDate: "Expiration Date",
  originalListPrice: "Original List Price",
  listPrice: "List Price",
  salePrice: "Sale Price",
  closingDate: "Closing Date",
  cdom: "CDOM (Days on Market)",
  dom: "DOM",
  pendingDate: "Pending Date",
  beds: "#Beds",
  fullBaths: "#FBaths",
  halfBaths: "#HBaths",
  sqft: "SqFt LA",
  typeOfProperty: "Type of Property",
  yearBuilt: "Year Built",
  garage: "#Garage Spaces",
  pool: "Pool YN",
  waterfront: "Waterfront Property (Y/N)",
  lotSqft: "Lot SqFt",
  associationFee: "Association Fee",
  associationCadence: "Assoc Fee Paid Per",
  folio: "Folio Number",
} as const;

export const MATRIX_FOLIO_COLUMNS = [
  "Folio Number",
  "Folio",
  "Tax ID",
  "Tax ID #",
  "Parcel ID",
  "Property ID",
  "Tax Folio Number",
] as const;

const CORE_COLUMNS = [MATRIX_COLUMNS.address, MATRIX_COLUMNS.city, MATRIX_COLUMNS.zip, MATRIX_COLUMNS.status];

const REQUIRED_BY_KIND: Record<MatrixExportKind, string[]> = {
  expired: [MATRIX_COLUMNS.address, MATRIX_COLUMNS.city, MATRIX_COLUMNS.zip],
  current: [MATRIX_COLUMNS.address, MATRIX_COLUMNS.city, MATRIX_COLUMNS.zip, MATRIX_COLUMNS.status],
  active: [MATRIX_COLUMNS.address, MATRIX_COLUMNS.city, MATRIX_COLUMNS.zip, MATRIX_COLUMNS.status, MATRIX_COLUMNS.listPrice, MATRIX_COLUMNS.dom],
  new: [MATRIX_COLUMNS.address, MATRIX_COLUMNS.city, MATRIX_COLUMNS.zip, MATRIX_COLUMNS.status, MATRIX_COLUMNS.entryDate, MATRIX_COLUMNS.listPrice],
  closed: [MATRIX_COLUMNS.address, MATRIX_COLUMNS.city, MATRIX_COLUMNS.zip, MATRIX_COLUMNS.status, MATRIX_COLUMNS.salePrice, MATRIX_COLUMNS.closingDate, MATRIX_COLUMNS.dom],
  unknown: CORE_COLUMNS,
};

function normalizedFilename(filename: string) {
  return filename.toUpperCase().replace(/[^A-Z0-9]+/g, " ");
}

function statusCounts(rows: CsvRow[]) {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const code = String(row[MATRIX_COLUMNS.status] ?? "").trim().toUpperCase();
    if (!code) continue;
    counts[code] = (counts[code] ?? 0) + 1;
  }
  return counts;
}

function dominantStatus(rows: CsvRow[]) {
  const counts = statusCounts(rows);
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return entries[0] ?? ["", 0];
}

export function recognizeMatrixExport(filename: string, headers: string[], rows: CsvRow[]): Pick<MatrixIntakeFile, "kind" | "confidence" | "reasons"> {
  const name = normalizedFilename(filename);
  const reasons: string[] = [];

  if (/\b(EXPIRED|EXPIREDS|NEW EXPIRED)\b/.test(name)) {
    return { kind: "expired", confidence: "high", reasons: ["Filename identifies an expired-listing export."] };
  }
  if (/\bCURRENT\b/.test(name) && /\b(MARKET|STATUS|LIVE)\b/.test(name)) {
    return { kind: "current", confidence: "high", reasons: ["Filename identifies the Current Market Status export."] };
  }
  if (/\bCLOSED\b/.test(name)) {
    return { kind: "closed", confidence: "high", reasons: ["Filename identifies a closed-sales export."] };
  }
  if (/\bNEW\b/.test(name) && !/EXPIRED/.test(name)) {
    return { kind: "new", confidence: "high", reasons: ["Filename identifies a new-listings export."] };
  }
  if (/\bACTIVE\b/.test(name)) {
    return { kind: "active", confidence: "high", reasons: ["Filename identifies an active-inventory export."] };
  }

  const [dominant, count] = dominantStatus(rows);
  const share = rows.length ? count / rows.length : 0;
  if (dominant === "X" && share >= 0.8) {
    reasons.push(`${Math.round(share * 100)}% of rows have Expired (X) status.`);
    return { kind: "expired", confidence: "medium", reasons };
  }
  if (dominant === "CS" && share >= 0.8) {
    reasons.push(`${Math.round(share * 100)}% of rows have Closed Sale (CS) status.`);
    return { kind: "closed", confidence: "medium", reasons };
  }
  const liveCodes = new Set(["A", "AC", "PS"]);
  const liveCount = rows.reduce((sum, row) => sum + (liveCodes.has(String(row[MATRIX_COLUMNS.status] ?? "").trim().toUpperCase()) ? 1 : 0), 0);
  if (rows.length && liveCount / rows.length >= 0.8) {
    reasons.push(`${Math.round((liveCount / rows.length) * 100)}% of rows have market-live MLS statuses.`);
    return { kind: "current", confidence: "medium", reasons };
  }

  const matrixCorePresent = CORE_COLUMNS.filter((h) => headers.includes(h)).length;
  if (matrixCorePresent >= 3) reasons.push("The file matches the known MIAMI Matrix residential schema, but its purpose is ambiguous.");
  else reasons.push("The file does not match enough of the known MIAMI Matrix schema to classify safely.");
  return { kind: "unknown", confidence: "low", reasons };
}

export function validateMatrixExport(kind: MatrixExportKind, headers: string[], rows: CsvRow[]) {
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const required of REQUIRED_BY_KIND[kind]) {
    if (!headers.includes(required)) errors.push(`Missing required Matrix column: ${required}`);
  }

  const unknownCodes = Array.from(new Set(rows.map((r) => String(r[MATRIX_COLUMNS.status] ?? "").trim().toUpperCase()).filter(Boolean)))
    .filter((code) => expandMiamiMlsStatus(code).startsWith("Unknown"));
  if (unknownCodes.length) warnings.push(`Unrecognized MIAMI MLS status code(s): ${unknownCodes.join(", ")}. They will not be guessed.`);

  if (headers.includes(MATRIX_COLUMNS.propertyType)) {
    const nonResidential = rows.filter((r) => {
      const v = String(r[MATRIX_COLUMNS.propertyType] ?? "").toLowerCase();
      return v && !v.includes("residential");
    }).length;
    if (nonResidential) warnings.push(`${nonResidential} row(s) do not appear to be Residential property type.`);
  }

  return { errors, warnings };
}

export function buildMatrixIntakeFile(filename: string, headers: string[], rows: CsvRow[], id: string): MatrixIntakeFile {
  const recognized = recognizeMatrixExport(filename, headers, rows);
  const validation = validateMatrixExport(recognized.kind, headers, rows);
  return { id, filename, headers, rows, ...recognized, ...validation };
}

function toNumber(value: string | undefined) {
  if (!value) return null;
  const cleaned = value.replace(/[$,%\s,]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function toIsoDate(value: string | undefined) {
  const raw = value?.trim();
  if (!raw) return undefined;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const us = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!us) return undefined;
  const year = us[3].length === 2 ? `20${us[3]}` : us[3];
  return `${year}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
}

function firstValue(row: CsvRow, keys: string[]) {
  for (const key of keys) {
    const value = String(row[key] ?? "").trim();
    if (value) return value;
  }
  return undefined;
}

/** Reads an optional Matrix ownership identifier without making it required. */
export function matrixFolioValue(row: CsvRow): string | undefined {
  const normalizedHeaders = new Map(
    Object.keys(row).map((header) => [header.trim().toLowerCase(), header])
  );
  for (const alias of MATRIX_FOLIO_COLUMNS) {
    const header = normalizedHeaders.get(alias.toLowerCase());
    if (!header) continue;
    const normalized = String(row[header] ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (normalized) return normalized;
  }
  return undefined;
}

export function expiredPropertyPayload(row: CsvRow): ExpiredPropertyPayload {
  const fullBaths = toNumber(String(row[MATRIX_COLUMNS.fullBaths] ?? ""));
  const halfBaths = toNumber(String(row[MATRIX_COLUMNS.halfBaths] ?? ""));
  const baths = fullBaths !== null || halfBaths !== null
    ? (fullBaths ?? 0) + (halfBaths ?? 0) * 0.5
    : undefined;

  const dateOffMarket = toIsoDate(firstValue(row, [
    MATRIX_COLUMNS.expirationDate,
    "Expire Date",
    "Expired Date",
    "Date Off Market",
    "Off Market Date",
  ]));

  const propertyType = firstValue(row, [MATRIX_COLUMNS.typeOfProperty, MATRIX_COLUMNS.propertyType]);
  const originalPrice = toNumber(String(row[MATRIX_COLUMNS.originalListPrice] ?? ""));
  const finalPrice = toNumber(String(row[MATRIX_COLUMNS.listPrice] ?? ""));
  const dom = toNumber(String(row[MATRIX_COLUMNS.dom] ?? ""));
  const beds = toNumber(String(row[MATRIX_COLUMNS.beds] ?? ""));
  const sqft = toNumber(String(row[MATRIX_COLUMNS.sqft] ?? ""));
  const yearBuilt = toNumber(String(row[MATRIX_COLUMNS.yearBuilt] ?? ""));
  const hoaAmount = toNumber(String(row[MATRIX_COLUMNS.associationFee] ?? ""));
  const hoaCadence = firstValue(row, [MATRIX_COLUMNS.associationCadence]);
  const folioNumber = matrixFolioValue(row);

  return {
    address: String(row[MATRIX_COLUMNS.address] ?? "").trim(),
    city: String(row[MATRIX_COLUMNS.city] ?? "").trim(),
    zip: String(row[MATRIX_COLUMNS.zip] ?? "").trim(),
    listingStatus: "Expired",
    ...(folioNumber ? { folioNumber } : {}),
    ...(dateOffMarket ? { dateOffMarket } : {}),
    ...(originalPrice !== null ? { originalPrice } : {}),
    ...(finalPrice !== null ? { finalPrice } : {}),
    ...(dom !== null ? { dom } : {}),
    ...(beds !== null ? { beds } : {}),
    ...(baths !== undefined ? { baths } : {}),
    ...(sqft !== null ? { sqft } : {}),
    ...(yearBuilt !== null ? { yearBuilt } : {}),
    ...(propertyType ? { propertyType } : {}),
    ...(hoaAmount !== null ? { hoaAmount } : {}),
    ...(hoaCadence ? { hoaCadence } : {}),
  };
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export type MarketMetrics = {
  listings: number;
  medianListPrice: number | null;
  medianSalePrice: number | null;
  medianDom: number | null;
  medianCdom: number | null;
  medianSaleToList: number | null;
};

export function calculateMarketMetrics(rows: CsvRow[]): MarketMetrics {
  const listPrices = rows.map((r) => toNumber(r[MATRIX_COLUMNS.listPrice])).filter((v): v is number => v !== null && v > 0);
  const salePrices = rows.map((r) => toNumber(r[MATRIX_COLUMNS.salePrice])).filter((v): v is number => v !== null && v > 0);
  const dom = rows.map((r) => toNumber(r[MATRIX_COLUMNS.dom])).filter((v): v is number => v !== null && v >= 0);
  const cdom = rows.map((r) => toNumber(r[MATRIX_COLUMNS.cdom])).filter((v): v is number => v !== null && v >= 0);
  const ratios = rows.map((r) => {
    const sale = toNumber(r[MATRIX_COLUMNS.salePrice]);
    const list = toNumber(r[MATRIX_COLUMNS.listPrice]);
    return sale && list ? sale / list : null;
  }).filter((v): v is number => v !== null && v > 0);
  return {
    listings: rows.length,
    medianListPrice: median(listPrices),
    medianSalePrice: median(salePrices),
    medianDom: median(dom),
    medianCdom: median(cdom),
    medianSaleToList: median(ratios),
  };
}

export function statusSummary(rows: CsvRow[]) {
  return Object.entries(statusCounts(rows))
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => ({ code, label: expandMiamiMlsStatus(code), count }));
}
