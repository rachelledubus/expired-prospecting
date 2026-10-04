import {
  config, etDate, explain, firstSentence, notion, readDate, readNumber, readText, TodaySetupError,
} from "@/lib/today";

const DEFAULT_PROJECTS_DATA_SOURCE_ID = "3a2f408a-fdce-822a-abbb-87df8f4efd77";
const projectsId = () => process.env.NOTION_PROJECTS_DATA_SOURCE_ID || DEFAULT_PROJECTS_DATA_SOURCE_ID;

/** Statuses the card lets her pick. Anything else in Notion is left alone. */
export const PROJECT_STATUSES = ["Not started", "In progress", "Waiting on Client", "Someday Maybe", "Done"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type ProjectCard = {
  id: string;
  url: string;
  name: string;
  status: string;
  scope: string | null;
  priority: string | null;
  /** The whole Next Physical Action text. The card shows the first sentence and opens the rest. */
  next: string;
  nextShort: string;
  due: string | null;
  lastProgress: string | null;
  stallAfterDays: number | null;
  openTasks: number | null;
};

export type ProjectsData = {
  fetchedAt: string;
  today: string;
  canEdit: boolean;
  active: ProjectCard[];
  someday: ProjectCard[];
};

function openTaskCount(prop: any): number | null {
  if (!prop) return null;
  if (prop.type === "rollup" && prop.rollup?.type === "number") return prop.rollup.number ?? null;
  return readNumber(prop);
}

function toCard(page: any): ProjectCard {
  const p = page.properties ?? {};
  const next = readText(p["Next Physical Action"]).trim();
  return {
    id: page.id,
    url: page.url,
    name: readText(p["Name"]) || "(untitled)",
    status: readText(p["Status"]) || "Not started",
    scope: readText(p["Project Scope"]) || null,
    priority: readText(p["Priority"]) || null,
    next,
    nextShort: firstSentence(next),
    due: readDate(p["Due Date"]).start?.slice(0, 10) ?? null,
    lastProgress: readDate(p["Last Progress"]).start?.slice(0, 10) ?? null,
    stallAfterDays: readNumber(p["Stall After Days"]),
    openTasks: openTaskCount(p["Open Task Count"]),
  };
}

const PRIORITY_RANK: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
const STATUS_RANK: Record<string, number> = { "In progress": 0, "Waiting on Client": 1, Inbox: 2, "Not started": 3 };

function order(a: ProjectCard, b: ProjectCard): number {
  const pr = (PRIORITY_RANK[a.priority ?? ""] ?? 3) - (PRIORITY_RANK[b.priority ?? ""] ?? 3);
  if (pr) return pr;
  const st = (STATUS_RANK[a.status] ?? 4) - (STATUS_RANK[b.status] ?? 4);
  if (st) return st;
  if (a.due && b.due) return a.due.localeCompare(b.due);
  if (a.due || b.due) return a.due ? -1 : 1;
  return a.name.localeCompare(b.name);
}

export async function getProjects(): Promise<ProjectsData> {
  const now = new Date();
  const rows: any[] = [];
  try {
    let cursor: string | undefined;
    for (let i = 0; i < 3; i += 1) {
      const res = await notion(`/v1/data_sources/${projectsId()}/query`, {
        method: "POST",
        body: {
          filter: {
            and: [
              { property: "Status", status: { does_not_equal: "Done" } },
              { property: "Execution Retired", checkbox: { equals: false } },
            ],
          },
          page_size: 100,
          ...(cursor ? { start_cursor: cursor } : {}),
        },
      });
      rows.push(...(res.results ?? []));
      if (!res.has_more) break;
      cursor = res.next_cursor;
    }
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 403 || status === 404) {
      throw new TodaySetupError(
        "Notion could not find the Projects database (it is titled \"This Week\"). In Notion, open it, choose ••• then Connections, " +
          "and add \"Today (read only)\". To edit projects from the portal, also add \"Today (edit times)\".",
      );
    }
    throw explain(err, "the projects list");
  }
  const cards = rows.map(toCard);
  return {
    fetchedAt: now.toISOString(),
    today: etDate(now),
    canEdit: Boolean(config().editKey),
    active: cards.filter((c) => c.status !== "Someday Maybe").sort(order),
    someday: cards.filter((c) => c.status === "Someday Maybe").sort(order),
  };
}

// ---------- editing ----------

export type ProjectEdit =
  | { field: "moved" }
  | { field: "next"; value: string }
  | { field: "status"; value: ProjectStatus }
  | { field: "due"; value: string | null };

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** Checks the request before anything is sent to Notion. Returns an error message, or null when it is fine. */
export function checkProjectEdit(edit: any): string | null {
  if (!edit || typeof edit !== "object") return "No change was given.";
  switch (edit.field) {
    case "moved":
      return null;
    case "next":
      if (typeof edit.value !== "string") return "No text was given.";
      return edit.value.length > 1900 ? "That is too long for Notion. Shorten it below about 1,900 characters." : null;
    case "status":
      return PROJECT_STATUSES.includes(edit.value) ? null : "That is not a status this page can set.";
    case "due":
      if (edit.value === null) return null;
      if (typeof edit.value !== "string" || !YMD.test(edit.value)) return "That date is not valid.";
      return Number.isNaN(Date.parse(`${edit.value}T00:00:00Z`)) ? "That date is not valid." : null;
    default:
      return "That field cannot be changed from here.";
  }
}

/**
 * Changes one field on one project. Reads the page first and refuses anything that is not a row of the
 * Projects database, so a wrong id can never edit a task or another page that has a field with the same name.
 */
export async function updateProject(key: string, pageId: string, edit: ProjectEdit): Promise<{ lastProgress?: string }> {
  const page = await notion(`/v1/pages/${pageId}`, { key });
  const parent: string | null = page.parent?.data_source_id ?? page.parent?.database_id ?? null;
  if (parent === null || parent !== projectsId() || page.properties?.["Next Physical Action"]?.type !== "rich_text") {
    throw new TodaySetupError("That page is not one of your projects, so nothing was changed.");
  }
  let properties: Record<string, unknown>;
  let result: { lastProgress?: string } = {};
  switch (edit.field) {
    case "moved": {
      const today = etDate(new Date());
      properties = { "Last Progress": { date: { start: today, end: null } } };
      result = { lastProgress: today };
      break;
    }
    case "next":
      properties = {
        "Next Physical Action": { rich_text: edit.value.trim() ? [{ type: "text", text: { content: edit.value.trim() } }] : [] },
      };
      break;
    case "status":
      properties = { Status: { status: { name: edit.value } } };
      break;
    case "due":
      properties = { "Due Date": { date: edit.value ? { start: edit.value, end: null } : null } };
      break;
  }
  await notion(`/v1/pages/${pageId}`, { method: "PATCH", key, body: { properties } });
  return result;
}
