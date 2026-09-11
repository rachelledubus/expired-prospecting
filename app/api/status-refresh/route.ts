import { NextResponse } from "next/server";
import { MATRIX_COLUMNS, matrixFolioValue } from "@/lib/mls-intake";
import {
  normalizeAddress,
  normalizeCity,
  normalizeZip,
  runMlsStatusCheck,
  type CsvRow,
  type CurrentMarketColumnMap,
  type ExpiredColumnMap,
} from "@/lib/mls-status";

const NOTION_VERSION = "2022-06-28";
const APPLY_BATCH_LIMIT = 25;

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

type NotionListingStatus = "Expired" | "Withdrawn" | "Cancelled" | "Sold" | "Active" | "Pending";

type BacklogProperty = {
  id: string;
  address: string;
  city: string;
  zip: string;
  folio: string;
};

type PlannedUpdate = {
  id: string;
  address: string;
  listingStatus: NotionListingStatus;
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

const notionHeaders = () => ({
  Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
  "Notion-Version": NOTION_VERSION,
  "Content-Type": "application/json",
});

function richText(property: any): string {
  const parts = property?.title ?? property?.rich_text ?? [];
  return parts.map((part: any) => part?.plain_text ?? part?.text?.content ?? "").join("").trim();
}

function easternDate(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

function statusCodeFromDisplay(display?: string): string {
  return display?.match(/\(([A-Z]+)\)$/)?.[1] ?? "";
}

function notionStatusForMiamiCode(code: string): NotionListingStatus | null {
  switch (code.toUpperCase()) {
    case "A":
    case "AC":
    case "CSL":
      return "Active";
    case "PS":
      return "Pending";
    case "CS":
      return "Sold";
    case "C":
      return "Cancelled";
    case "W":
    case "T":
      return "Withdrawn";
    case "X":
      return "Expired";
    default:
      return null;
  }
}

async function queryBacklogProperties(): Promise<BacklogProperty[]> {
  const databaseId = process.env.NOTION_PROPERTY_RESEARCH_DATABASE_ID;
  if (!process.env.NOTION_API_KEY || !databaseId) {
    throw new Error("Notion Property Research is not configured on the server.");
  }

  const results: BacklogProperty[] = [];
  let cursor: string | undefined;

  do {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: notionHeaders(),
      body: JSON.stringify({
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
        filter: {
          and: [
            { property: "Source", select: { equals: "MLS Pull" } },
            { property: "Listing Status", select: { equals: "Expired" } },
            {
              or: [
                { property: "Owner Verification Status", select: { is_empty: true } },
                { property: "Owner Verification Status", select: { equals: "Not Checked" } },
                { property: "Owner Verification Status", select: { equals: "Needs Owner Contact Research" } },
                { property: "Owner Verification Status", select: { equals: "Needs Identity Review — Duplicate Name" } },
                { property: "Owner Verification Status", select: { equals: "Needs Deed Review" } },
              ],
            },
          ],
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.message ?? "Could not read Property Research backlog.");

    for (const page of data.results ?? []) {
      results.push({
        id: page.id,
        address: richText(page.properties?.["Property Address"]),
        city: page.properties?.City?.select?.name ?? "",
        zip: richText(page.properties?.ZIP),
        folio: richText(page.properties?.["Folio Number"]),
      });
    }

    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return results;
}

function makeExpiredRows(properties: BacklogProperty[]): CsvRow[] {
  return properties.map((property) => ({
    [MATRIX_COLUMNS.address]: property.address,
    [MATRIX_COLUMNS.city]: property.city,
    [MATRIX_COLUMNS.zip]: property.zip,
    [MATRIX_COLUMNS.folio]: property.folio,
  }));
}

async function applyOne(update: PlannedUpdate) {
  const response = await fetch(`https://api.notion.com/v1/pages/${update.id}`, {
    method: "PATCH",
    headers: notionHeaders(),
    body: JSON.stringify({
      properties: {
        "Listing Status": { select: { name: update.listingStatus } },
        "Market Status Checked At": { date: { start: update.checkedAt } },
      },
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message ?? `Notion update failed for ${update.address}.`);
}

async function applyUpdates(updates: PlannedUpdate[]) {
  const queue = [...updates];
  const errors: { address: string; error: string }[] = [];
  let applied = 0;

  const worker = async () => {
    while (queue.length) {
      const update = queue.shift();
      if (!update) return;
      try {
        await applyOne(update);
        applied += 1;
      } catch (error) {
        errors.push({
          address: update.address,
          error: error instanceof Error ? error.message : "Unknown Notion update error",
        });
      }
    }
  };

  await Promise.all([worker(), worker(), worker()]);
  return { applied, errors };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mode = body?.mode;

    if (mode === "plan") {
      const currentRows = Array.isArray(body?.rows) ? body.rows as CsvRow[] : [];
      if (!currentRows.length) {
        return NextResponse.json({ error: "The Current Market Status export has no rows." }, { status: 400 });
      }

      const backlog = await queryBacklogProperties();
      const checkedAt = easternDate();
      const normalizedCurrentRows = currentRows.map((row) => ({
        ...row,
        [MATRIX_COLUMNS.folio]: matrixFolioValue(row) ?? "",
      }));
      const decisions = runMlsStatusCheck(makeExpiredRows(backlog), EXPIRED_MAP, normalizedCurrentRows, CURRENT_MAP);
      const updates: PlannedUpdate[] = [];
      const reviews: ReviewItem[] = [];

      decisions.forEach((decision) => {
        const property = backlog[decision.sourceIndex];
        if (!property?.id || !property.address) {
          reviews.push({
            id: property?.id ?? "",
            address: property?.address ?? "Missing Property Address",
            reason: "Property Research is missing a usable address, so status was not stamped current.",
          });
          return;
        }

        if (decision.status === "review") {
          reviews.push({
            id: property.id,
            address: property.address,
            reason: decision.reason,
            matchedStatus: decision.matched?.status,
          });
          return;
        }

        if (decision.status === "clear") {
          updates.push({
            id: property.id,
            address: property.address,
            listingStatus: "Expired",
            checkedAt,
            reason: decision.reason,
          });
          return;
        }

        const code = statusCodeFromDisplay(decision.matched?.status);
        const listingStatus = notionStatusForMiamiCode(code);
        if (!listingStatus) {
          reviews.push({
            id: property.id,
            address: property.address,
            reason: `Matched a current-market row with unsupported status ${decision.matched?.status || code || "unknown"}; review manually.`,
            matchedStatus: decision.matched?.status,
          });
          return;
        }

        updates.push({
          id: property.id,
          address: property.address,
          listingStatus,
          checkedAt,
          reason: decision.reason,
          matchedStatus: decision.matched?.status,
        });
      });

      const relisted = updates.filter((update) => update.listingStatus !== "Expired").length;
      return NextResponse.json({
        ok: true,
        checkedAt,
        backlogCount: backlog.length,
        clearExpired: updates.length - relisted,
        relisted,
        reviews,
        updates,
      });
    }

    if (mode === "apply") {
      const updates = Array.isArray(body?.updates) ? body.updates as PlannedUpdate[] : [];
      if (!updates.length) return NextResponse.json({ ok: true, applied: 0, errors: [] });
      if (updates.length > APPLY_BATCH_LIMIT) {
        return NextResponse.json({ error: `Apply batches are limited to ${APPLY_BATCH_LIMIT} rows.` }, { status: 400 });
      }

      const validStatuses = new Set<NotionListingStatus>(["Expired", "Withdrawn", "Cancelled", "Sold", "Active", "Pending"]);
      const invalid = updates.find((update) => !update?.id || !update?.address || !validStatuses.has(update.listingStatus));
      if (invalid) return NextResponse.json({ error: "One or more planned status updates are invalid." }, { status: 400 });

      const result = await applyUpdates(updates);
      return NextResponse.json({ ok: result.errors.length === 0, ...result }, { status: result.errors.length ? 207 : 200 });
    }

    return NextResponse.json({ error: "Unknown status-refresh mode." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Status refresh failed." },
      { status: 500 }
    );
  }
}
