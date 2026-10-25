import { getStore } from "@netlify/blobs";
import { CAREER_GATES, CAREER_SKILLS } from "./career-skills";

const STORE = "career-readiness";
const KEY = "skills/progress-v1";
const statuses = ["Not started", "Learning", "Practicing", "Verified"] as const;

export type CareerSkillState = {
  status: string;
  evidenceUrl: string;
  verified: boolean;
  notes: string;
  updatedAt: string;
};
export type CareerProgress = {
  skills: Record<string, CareerSkillState>;
  actions: Record<string, string>;
};
export type CareerPatch =
  | { type: "skill"; id: string; status: string; evidenceUrl: string; verified: boolean; notes: string }
  | { type: "action"; gate: number; taken: boolean };

const validIds = new Set(CAREER_SKILLS.map((skill) => skill.id));
const validGates = new Set(CAREER_GATES.map((gate) => gate.id));
const getCareerStore = () => getStore({ name: STORE, consistency: "strong" });
const empty = (): CareerProgress => ({ skills: {}, actions: {} });

export function validLink(value: string) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return ["https:", "http:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function clean(input: unknown): CareerProgress {
  const output = empty();
  if (!input || typeof input !== "object") return output;
  const obj = input as Partial<CareerProgress>;
  for (const [id, state] of Object.entries(obj.skills ?? {})) {
    if (!validIds.has(id) || !state || typeof state !== "object") continue;
    const evidenceUrl = typeof state.evidenceUrl === "string" ? state.evidenceUrl.slice(0, 1000) : "";
    const verified = state.verified === true && validLink(evidenceUrl);
    output.skills[id] = {
      status: verified ? "Verified" : statuses.includes(state.status as typeof statuses[number]) ? state.status : "Not started",
      evidenceUrl: validLink(evidenceUrl) ? evidenceUrl : "",
      verified,
      notes: typeof state.notes === "string" ? state.notes.slice(0, 600) : "",
      updatedAt: typeof state.updatedAt === "string" ? state.updatedAt : "",
    };
  }
  for (const [gate, time] of Object.entries(obj.actions ?? {})) {
    if (validGates.has(Number(gate)) && typeof time === "string" && time.length < 80) {
      output.actions[gate] = time;
    }
  }
  return output;
}

export function parseCareerPatch(input: unknown): CareerPatch | string {
  if (!input || typeof input !== "object") return "No update provided.";
  const raw = input as Record<string, unknown>;
  if (raw.type === "action") {
    if (!validGates.has(raw.gate as number) || typeof raw.taken !== "boolean") return "Invalid milestone action.";
    return { type: "action", gate: raw.gate as number, taken: raw.taken };
  }
  if (raw.type !== "skill" || typeof raw.id !== "string" || !validIds.has(raw.id)) return "Unknown skill.";
  if (typeof raw.status !== "string" || !statuses.includes(raw.status as typeof statuses[number])) return "Choose a valid learning status.";
  if (typeof raw.evidenceUrl !== "string" || raw.evidenceUrl.length > 1000) return "Evidence link is too long.";
  if (typeof raw.notes !== "string" || raw.notes.length > 600) return "Notes must be under 600 characters.";
  const link = raw.evidenceUrl.trim();
  if (link && !validLink(link)) return "Evidence must be a valid http(s) URL.";
  if (typeof raw.verified !== "boolean") return "Verification checkbox is required.";
  if (raw.verified && !validLink(link)) return "A valid evidence URL is required before verifying a skill.";
  return {
    type: "skill",
    id: raw.id,
    status: raw.verified ? "Verified" : raw.status === "Verified" ? "Practicing" : raw.status,
    evidenceUrl: link,
    verified: raw.verified,
    notes: raw.notes.trim(),
  };
}

export async function getCareerProgress(): Promise<CareerProgress> {
  return clean(await getCareerStore().get(KEY, { type: "json" }));
}

export async function applyCareerPatch(patch: CareerPatch): Promise<CareerProgress> {
  const store = getCareerStore();
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const hit = await store.getWithMetadata(KEY, { type: "json" });
    const progress = clean(hit?.data);
    if (patch.type === "skill") {
      progress.skills[patch.id] = {
        status: patch.status,
        evidenceUrl: patch.evidenceUrl,
        verified: patch.verified,
        notes: patch.notes,
        updatedAt: new Date().toISOString(),
      };
    } else {
      if (patch.taken) progress.actions[String(patch.gate)] = new Date().toISOString();
      else delete progress.actions[String(patch.gate)];
    }
    const options = hit?.etag ? { onlyIfMatch: hit.etag } : { onlyIfNew: true };
    const updated = await store.setJSON(KEY, progress, options);
    if (updated.modified) return progress;
  }
  throw new Error("Progress changed at the same time on another device. Refresh and try again.");
}
