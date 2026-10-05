import { getDeployStore, getStore } from "@netlify/blobs";
import {
  GAMES,
  emptyProgress,
  knownCheckKeys,
  knownFieldKeys,
  type Game,
  type GameProgress,
  type GameProgressPatch,
} from "./games-data";

// Saved Games progress lives in Netlify Blobs, so your phone and computer see the same boxes.
// Same store pattern as the market snapshot: strong consistency in production, per-deploy store elsewhere.
function store() {
  return process.env.CONTEXT === "production"
    ? getStore("game-progress", { consistency: "strong" })
    : getDeployStore("game-progress");
}

const blobKey = (gameId: string) => `progress/${gameId}`;

export function findGame(id: unknown): Game | undefined {
  return typeof id === "string" ? GAMES.find((g) => g.id === id) : undefined;
}

export async function loadProgress(game: Game): Promise<GameProgress> {
  const raw = (await store().get(blobKey(game.id), { type: "json" })) as Partial<GameProgress> | null;
  const checkKeys = knownCheckKeys(game);
  const fieldKeys = knownFieldKeys(game);
  const out = emptyProgress();
  if (raw && typeof raw === "object") {
    for (const k of Object.keys(raw.checks ?? {})) if (checkKeys.has(k) && raw.checks?.[k]) out.checks[k] = true;
    for (const [k, v] of Object.entries(raw.fields ?? {})) if (fieldKeys.has(k) && typeof v === "string") out.fields[k] = v;
  }
  return out;
}

const MAX_FIELD_LENGTH = 200;

/** Check a request body. Returns a clean patch, or a message saying what is wrong. */
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
      if (!checkKeys.has(k)) return "That box does not exist in this checklist.";
      if (typeof v !== "boolean") return "Each box must be true or false.";
      patch.checks[k] = v;
    }
  }
  if (b.fields !== undefined) {
    if (!b.fields || typeof b.fields !== "object" || Array.isArray(b.fields)) return "fields must be an object.";
    patch.fields = {};
    for (const [k, v] of Object.entries(b.fields)) {
      if (!fieldKeys.has(k)) return "That text field does not exist in this checklist.";
      if (typeof v !== "string") return "Each text field must be text.";
      patch.fields[k] = v.slice(0, MAX_FIELD_LENGTH);
    }
  }
  return patch;
}

/** Apply a patch to saved progress and store the result. Changes are merged, so two devices do not overwrite each other. */
export async function applyPatch(game: Game, patch: GameProgressPatch): Promise<GameProgress> {
  const progress = patch.reset ? emptyProgress() : await loadProgress(game);
  for (const [k, v] of Object.entries(patch.checks ?? {})) {
    if (v) progress.checks[k] = true;
    else delete progress.checks[k];
  }
  for (const [k, v] of Object.entries(patch.fields ?? {})) {
    if (v === "") delete progress.fields[k];
    else progress.fields[k] = v;
  }
  await store().setJSON(blobKey(game.id), progress);
  return progress;
}
