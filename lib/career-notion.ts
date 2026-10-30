/**
 * Career tracker reads and writes the user's EXISTING Notion skills and milestone data sources.
 * No parallel database or automatic reconciliation: Notion is the only source of truth.
 * The API token is server-side only and must have access to BOTH data sources.
 */
import { CAREER_GATES, CAREER_SKILLS } from "./career-skills";
import { notion, NotionHttpError } from "./today";

const SKILLS_SOURCE = "53eb2478-1286-4418-8ffa-469ed9806af9";
const GATES_SOURCE = "89506274-1a9e-4606-801f-448f3120feb9";
const VALID_IDS = new Set(CAREER_SKILLS.map((item) => item.id));
const VALID_GATES = new Set(CAREER_GATES.map((item) => item.id));
const STATUS_OPTIONS = ["Not Started", "Learning", "Practicing", "Verified"] as const;

export type CareerSkillState = {
  status: string;
  evidenceUrl: string;
  verified: boolean;
  proofComplete: boolean;
  updatedAt: string;
};
export type CareerProgress = {
  skills: Record<string, CareerSkillState>;
  actions: Record<string, boolean>;
  actionUpdatedAt: Record<string, string>;
};
export type CareerPatch =
  | { type: "skill"; id: string; status: string; evidenceUrl: string; verified: boolean; expectedEditedAt: string }
  | { type: "action"; gate: number; taken: boolean; expectedEditedAt: string };

export class CareerNotionSetupError extends Error {}
export class CareerNotionConflictError extends Error {}

function careerKey(): string {
  // Reuse the existing portal's editing integration if a dedicated career key was not provided.
  // The integration must be explicitly connected to the TWO Career Hub databases in Notion.
  const key = process.env.NOTION_CAREER_API_KEY || process.env.NOTION_TODAY_EDIT_API_KEY;
  if (!key) {
    throw new CareerNotionSetupError(
      "Notion editing is not configured. Set NOTION_CAREER_API_KEY, or use the existing NOTION_TODAY_EDIT_API_KEY, in Netlify's server environment."
    );
  }
  return key;
}

export function validCareerLink(value: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function text(prop: any): string {
  if (prop?.type === "title") return (prop.title ?? []).map((part: any) => part.plain_text ?? part.text?.content ?? "").join("");
  if (prop?.type === "rich_text") return (prop.rich_text ?? []).map((part: any) => part.plain_text ?? part.text?.content ?? "").join("");
  return "";
}

function accessError(error: unknown): never {
  if (error instanceof NotionHttpError && (error.status === 403 || error.status === 404)) {
    throw new CareerNotionSetupError(
      "The portal's Notion integration cannot access your Career Hub. In Notion, connect the editing integration to BOTH 'Software Career Skills — Evidence Tracker' and 'Software Career Milestones — Readiness Gates'. Then reload this page."
    );
  }
  throw error;
}

async function queryAll(dataSourceId: string, key: string): Promise<any[]> {
  const rows: any[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 3; i += 1) {
    const res = await notion("/v1/data_sources/" + dataSourceId + "/query", {
      key, method: "POST", body: { page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) },
    });
    rows.push(...(res.results ?? []));
    if (!res.has_more) return rows;
    cursor = res.next_cursor;
  }
  throw new Error("Notion returned too many Career Hub pages. Nothing was changed.");
}

export async function getCareerProgress(): Promise<CareerProgress> {
  const key = careerKey();
  let skillRows: any[], gateRows: any[];
  try {
    [skillRows, gateRows] = await Promise.all([queryAll(SKILLS_SOURCE, key), queryAll(GATES_SOURCE, key)]);
  } catch (error) {
    accessError(error);
  }

  const skills: CareerProgress["skills"] = {};
  for (const page of skillRows) {
    const id = String(page.id ?? "").replace(/-/g, "");
    // The Notion query already limits results to the known skills data source.
    if (!VALID_IDS.has(id)) continue;
    const p = page.properties ?? {};
    const status = p["Status"]?.status?.name ?? "Not Started";
    const evidenceUrl = p["Evidence URL"]?.url ?? "";
    const verified = p["Verified"]?.checkbox === true;
    const formula = p["Proof Complete"]?.formula;
    const proofComplete = formula?.type === "boolean" && typeof formula.boolean === "boolean"
      ? formula.boolean
      : verified && validCareerLink(evidenceUrl) && status === "Verified";
    skills[id] = {
      status,
      evidenceUrl,
      verified,
      proofComplete,
      updatedAt: page.last_edited_time ?? "",
    };
  }

  const actions: CareerProgress["actions"] = {};
  const actionUpdatedAt: CareerProgress["actionUpdatedAt"] = {};
  for (const page of gateRows) {
    const p = page.properties ?? {};
    const number = p["Order"]?.number;
    if (!VALID_GATES.has(number)) continue;
    actions[String(number)] = p["Action Taken"]?.checkbox === true;
    actionUpdatedAt[String(number)] = page.last_edited_time ?? "";
  }

  // An incomplete API response must NOT turn a previously completed skill into an unchecked one.
  if (Object.keys(skills).length !== CAREER_SKILLS.length || Object.keys(actions).length !== CAREER_GATES.length) {
    throw new CareerNotionSetupError(
      "Notion returned an incomplete career tracker. Confirm that the portal integration can access all 33 skills and all four milestone records, then reload."
    );
  }

  return { skills, actions, actionUpdatedAt };
}

export function parseCareerPatch(input: unknown): CareerPatch | string {
  if (!input || typeof input !== "object") return "No update provided.";
  const item = input as Record<string, unknown>;
  if (typeof item.expectedEditedAt !== "string" || !item.expectedEditedAt) {
    return "This page is out of date. Refresh to load the latest Notion progress.";
  }
  if (item.type === "action") {
    if (typeof item.gate !== "number" || !VALID_GATES.has(item.gate) || typeof item.taken !== "boolean") {
      return "Invalid milestone action.";
    }
    return { type: "action", gate: item.gate, taken: item.taken, expectedEditedAt: item.expectedEditedAt };
  }
  if (item.type !== "skill" || typeof item.id !== "string" || !VALID_IDS.has(item.id)) return "Unknown skill.";
  if (typeof item.status !== "string" || !STATUS_OPTIONS.includes(item.status as typeof STATUS_OPTIONS[number])) return "Invalid skill status.";
  if (typeof item.verified !== "boolean") return "Verification must be checked or unchecked.";
  if (typeof item.evidenceUrl !== "string" || item.evidenceUrl.length > 1000) return "Evidence link is too long.";
  const evidenceUrl = item.evidenceUrl.trim();
  if (evidenceUrl && !validCareerLink(evidenceUrl)) return "Use a valid http(s) link for evidence.";
  if (item.verified && !evidenceUrl) return "Add your evidence link before verifying this skill.";
  const status = item.verified ? "Verified" : item.status === "Verified" ? "Practicing" : item.status;
  return { type: "skill", id: item.id, status, evidenceUrl, verified: item.verified, expectedEditedAt: item.expectedEditedAt };
}

async function fetchPage(id: string, key: string): Promise<any> {
  return notion("/v1/pages/" + id, { key });
}

export async function applyCareerPatch(patch: CareerPatch): Promise<CareerProgress> {
  const key = careerKey();
  let page: any;
  let pageId: string;
  let source: string;
  if (patch.type === "skill") {
    pageId = patch.id;
    source = SKILLS_SOURCE;
  } else {
    // Find the milestone by Order, rather than trusting an arbitrary ID from the browser.
    const rows = await queryAll(GATES_SOURCE, key).catch(accessError);
    page = rows.find((row) => row.properties?.["Order"]?.number === patch.gate);
    if (!page) throw new Error("That milestone could not be found. Nothing was changed.");
    pageId = page.id;
    source = GATES_SOURCE;
  }
  try {
    page = await fetchPage(pageId, key);
  } catch (error) {
    accessError(error);
  }
  const parentId = String(page.parent?.data_source_id ?? page.parent?.database_id ?? "").replace(/-/g, "");
  if (parentId !== source.replace(/-/g, "")) {
    throw new Error("That record is not in the expected Notion career database. Nothing was changed.");
  }
  if (page.last_edited_time !== patch.expectedEditedAt) {
    throw new CareerNotionConflictError(
      "This record changed in Notion since the portal loaded. Refresh the Career page, then apply your edit again."
    );
  }
  if (patch.type === "skill") {
    if (page.properties?.["Verified"]?.type !== "checkbox" ||
        page.properties?.["Evidence URL"]?.type !== "url" ||
        page.properties?.["Status"]?.type !== "status") {
      throw new Error("The Notion skill fields have changed. No edit was made.");
    }
  } else if (page.properties?.["Action Taken"]?.type !== "checkbox") {
    throw new Error("The Notion milestone checkbox is unavailable. No edit was made.");
  }

  const properties = patch.type === "skill"
    ? {
        "Verified": { checkbox: patch.verified },
        "Evidence URL": { url: patch.evidenceUrl || null },
        "Status": { status: { name: patch.status } },
      }
    : { "Action Taken": { checkbox: patch.taken } };

  try {
    await notion("/v1/pages/" + pageId, { method: "PATCH", key, body: { properties } });
  } catch (error) {
    accessError(error);
  }
  // Re-read Notion so the displayed checkboxes and readiness match what's actually stored.
  return getCareerProgress();
}
