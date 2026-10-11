import { getDeployStore, getStore } from "@netlify/blobs";
import {
  GAMES,
  SEASONS,
  emptyProgress,
  knownCheckKeys,
  knownFieldKeys,
  seasonKey,
  type Game,
  type GameProgress,
  type GameProgressPatch,
} from "./games-data";

// Saved Games progress lives in Netlify Blobs, so your phone and computer see the same boxes.
//
// It uses ONE site-wide store that every deploy shares, with strong consistency. Do not switch this to a deploy store:
// a deploy store belongs to a single deploy, so every new deploy would start with an empty tracker. (An earlier version
// picked the store from process.env.CONTEXT. Netlify does not set CONTEXT while the site is running, only while it
// builds, so it always fell back to a per-deploy store and progress was lost on each deploy.)
const STORE_NAME = "game-progress";

function store() {
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

// Progress saved before that fix sits in the per-deploy stores of the deploys that were live at the time. These are
// the ones known to exist, oldest first. The first save after the fix copies their boxes into the permanent store.
// Deploy stores cannot be listed, so a deploy that is not named here cannot be recovered.
const LEGACY_DEPLOY_IDS = ["6ac2ef5f27c97d0008dc085f", "6ac3d31085e534000895caef"];

const blobKey = (gameId: string) => `progress/${gameId}`;

export function findGame(id: unknown): Game | undefined {
  return typeof id === "string" ? GAMES.find((g) => g.id === id) : undefined;
}

/** Keep only boxes and fields that exist in the game today. */
function clean(game: Game, raw: unknown): GameProgress {
  const out = emptyProgress();
  if (!raw || typeof raw !== "object") return out;
  const r = raw as Partial<GameProgress>;
  const checkKeys = knownCheckKeys(game);
  const fieldKeys = knownFieldKeys(game);
  for (const k of Object.keys(r.checks ?? {})) if (checkKeys.has(k) && r.checks?.[k]) out.checks[k] = true;
  for (const [k, v] of Object.entries(r.fields ?? {})) if (fieldKeys.has(k) && typeof v === "string") out.fields[k] = v;
  return out;
}

/** Boxes from the old per-deploy stores, combined. A box ticked on any of them counts; for text, the newest deploy wins. */
async function legacyProgress(game: Game): Promise<GameProgress | null> {
  const merged = emptyProgress();
  let found = false;
  for (const deployID of LEGACY_DEPLOY_IDS) {
    try {
      const raw = await getDeployStore({ name: STORE_NAME, deployID, consistency: "strong" }).get(blobKey(game.id), {
        type: "json",
      });
      if (!raw) continue;
      const old = clean(game, raw);
      found = true;
      Object.assign(merged.checks, old.checks);
      Object.assign(merged.fields, old.fields);
    } catch (error) {
      console.warn("Games legacy progress read failed", deployID, error);
    }
  }
  return found ? merged : null;
}

type State = { progress: GameProgress; etag: string | null; exists: boolean };

/** The saved progress, plus the version tag a later write must match. No saved copy yet starts from the old deploys' boxes. */
async function readState(game: Game): Promise<State> {
  const hit = await store().getWithMetadata(blobKey(game.id), { type: "json" });
  if (hit) return { progress: clean(game, hit.data), etag: hit.etag ?? null, exists: true };
  return { progress: (await legacyProgress(game)) ?? emptyProgress(), etag: null, exists: false };
}

export async function loadProgress(game: Game): Promise<GameProgress> {
  return (await readState(game)).progress;
}

const MAX_FIELD_LENGTH = 200;
const MAX_CUSTOM_COMPLETION_FIELD_LENGTH = 12000;

/**
 * Check a request body. Returns a clean patch, or a message saying what is wrong.
 * A box or field that no longer exists is skipped, not an error, so a page that was open before an update still saves
 * everything else. Wrong types are still rejected.
 */
export function parsePatch(game: Game, body: unknown): GameProgressPatch | string {
  if (!body || typeof body !== "object") return "No changes were given.";
  const b = body as Record<string, unknown>;
  const checkKeys = knownCheckKeys(game);
  const fieldKeys = knownFieldKeys(game);
  const patch: GameProgressPatch = {};

  if (b.reset !== undefined) {
    if (typeof b.reset !== "boolean") return "reset must be true or false.";
    if (b.reset) patch.reset = true;
  }
  if (b.checks !== undefined) {
    if (!b.checks || typeof b.checks !== "object" || Array.isArray(b.checks)) return "checks must be an object.";
    patch.checks = {};
    for (const [k, v] of Object.entries(b.checks)) {
      if (typeof v !== "boolean") return "Each box must be true or false.";
      if (checkKeys.has(k)) patch.checks[k] = v;
    }
  }
  if (b.fields !== undefined) {
    if (!b.fields || typeof b.fields !== "object" || Array.isArray(b.fields)) return "fields must be an object.";
    patch.fields = {};
    for (const [k, v] of Object.entries(b.fields)) {
      if (typeof v !== "string") return "Each text field must be text.";
      if (!fieldKeys.has(k)) continue;
      if (k === seasonKey(game.id) && v !== "" && !(SEASONS as readonly string[]).includes(v)) return "That is not a season.";
      const maxLength =
        k.includes("|completion|") && k.endsWith("|custom-items")
          ? MAX_CUSTOM_COMPLETION_FIELD_LENGTH
          : MAX_FIELD_LENGTH;
      patch.fields[k] = v.slice(0, maxLength);
    }
  }
  return patch;
}

const MAX_ATTEMPTS = 8;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Apply a patch to saved progress and store the result. Each box is merged into whatever is saved, and the write only
 * goes through if nothing else saved in the meantime. If something did, it reads again and redoes the merge, so two
 * devices (or two quick taps) never overwrite each other.
 */
export async function applyPatch(game: Game, patch: GameProgressPatch): Promise<GameProgress> {
  const s = store();
  const nothingToDo = !patch.reset && !Object.keys(patch.checks ?? {}).length && !Object.keys(patch.fields ?? {}).length;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const state = await readState(game);
    if (nothingToDo) return state.progress;

    const progress = patch.reset ? emptyProgress() : state.progress;
    for (const [k, v] of Object.entries(patch.checks ?? {})) {
      if (v) progress.checks[k] = true;
      else delete progress.checks[k];
    }
    for (const [k, v] of Object.entries(patch.fields ?? {})) {
      if (v === "") delete progress.fields[k];
      else progress.fields[k] = v;
    }

    const conditions = state.etag ? { onlyIfMatch: state.etag } : state.exists ? {} : { onlyIfNew: true };
    const result = await s.setJSON(blobKey(game.id), progress, conditions);
    if (result.modified) return progress;
    await sleep(20 + Math.random() * 60 * (attempt + 1));
  }
  throw new Error("Could not save: other changes kept arriving first.");
}
