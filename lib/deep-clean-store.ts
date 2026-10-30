import { getStore } from "@netlify/blobs";
import { ALL_CLEAN_IDS, CLEAN_DATE } from "./deep-clean-data";

export type DeepCleanProgress = { checks: Record<string, boolean> };
type StoredState = { progress: DeepCleanProgress; etag: string | null; exists: boolean };
const STORE = "home-cleaning";
const KEY = `deep-clean/${CLEAN_DATE}`;
const store = () => getStore({ name: STORE, consistency: "strong" });

function sanitize(value: unknown): DeepCleanProgress {
  const checks: Record<string, boolean> = {};
  if (value && typeof value === "object" && "checks" in value) {
    const possible = (value as { checks?: unknown }).checks;
    if (possible && typeof possible === "object" && !Array.isArray(possible)) {
      for (const [id, checked] of Object.entries(possible)) {
        if (ALL_CLEAN_IDS.has(id) && checked === true) checks[id] = true;
      }
    }
  }
  return { checks };
}

async function readState(): Promise<StoredState> {
  const hit = await store().getWithMetadata(KEY, { type: "json" });
  if (!hit) return { progress: { checks: {} }, etag: null, exists: false };
  return { progress: sanitize(hit.data), etag: hit.etag ?? null, exists: true };
}

export async function loadDeepCleanProgress(): Promise<DeepCleanProgress> {
  return (await readState()).progress;
}

/** Strong-consistency, compare-and-swap update; single checkbox changes do not overwrite other devices. */
export async function saveDeepCleanCheck(id: string, done: boolean): Promise<DeepCleanProgress> {
  if (!ALL_CLEAN_IDS.has(id)) throw new Error("Unknown cleaning task");
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const current = await readState();
    const checks = { ...current.progress.checks };
    if (done) checks[id] = true;
    else delete checks[id];
    const condition = current.etag
      ? { onlyIfMatch: current.etag }
      : current.exists ? {} : { onlyIfNew: true };
    const result = await store().setJSON(KEY, { checks }, condition);
    if (result.modified) return { checks };
  }
  throw new Error("Could not save because another device kept updating.");
}
