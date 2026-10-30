import { getStore } from "@netlify/blobs";
import { randomUUID } from "crypto";
import { CLEAN_AREAS } from "@/lib/deep-clean-data";
import { loadDeepCleanProgress } from "@/lib/deep-clean-store";
import { config, notion, readBool, readText } from "@/lib/today";

export type CleaningType = "quick-reset" | "weekly-clean" | "deep-clean";
export type Resolution = "done" | "not-needed";
export type CleaningItem = { id: string; text: string };
export type CleaningArea = { id: string; name: string; icon: string; items: CleaningItem[] };
export type CleaningTemplate = { id: CleaningType; name: string; duration: string; description: string; areas: CleaningArea[] };
export type CleaningStatus = "active" | "completed" | "incomplete";
export type CleaningPhase = { taskId: string; areaIds: string[]; synced: boolean };
export type CleaningSession = {
  id: string; templateId: CleaningType; status: CleaningStatus; startedAt: string; updatedAt: string;
  finishedAt?: string; resolutions: Record<string, Resolution>; queue: string[]; phases: CleaningPhase[];
};
const LEGACY_ID = "legacy-2026-10-30";
const PREFIX = "sessions/";
const store = () => getStore({ name: "home-cleaning", consistency: "strong" });
const keyOf = (id: string) => PREFIX + id;
const quick: CleaningArea[] = [
  { id: "pickup", name: "Clear the space", icon: "🧺", items: [
    { id: "q-tidy", text: "Put loose things back in their usual places" },
    { id: "q-trash", text: "Collect trash and recycling" },
    { id: "q-dishes", text: "Gather dishes and load the dishwasher or sink" }
  ] },
  { id: "surfaces", name: "Refresh surfaces", icon: "✨", items: [
    { id: "q-counters", text: "Wipe kitchen counters and dining table" },
    { id: "q-bath", text: "Quickly wipe bathroom sink and counter" },
    { id: "q-sofa", text: "Straighten cushions and remove obvious dog hair" }
  ] },
  { id: "finish", name: "Finish", icon: "🧹", items: [
    { id: "q-floors", text: "Spot-vacuum high-traffic areas" },
    { id: "q-reset", text: "Put supplies away and take out the collected trash" }
  ] }
];
const weekly: CleaningArea[] = [
  { id: "prep", name: "Prepare", icon: "🧺", items: [
    { id: "w-supplies", text: "Gather supplies, laundry and cleaning cloths" },
    { id: "w-clutter", text: "Return visible clutter to its place" },
    { id: "w-laundry", text: "Start a load of laundry or bedding" }
  ] },
  { id: "kitchen", name: "Kitchen", icon: "🍋", items: [
    { id: "w-dishes", text: "Wash or load dishes" },
    { id: "w-counter", text: "Clean counters, sink and stovetop" },
    { id: "w-fronts", text: "Wipe appliance exteriors and high-touch handles" },
    { id: "w-trash", text: "Empty kitchen trash" }
  ] },
  { id: "bath", name: "Bathroom(s)", icon: "🫧", items: [
    { id: "w-toilets", text: "Clean and disinfect toilets" },
    { id: "w-sinks", text: "Clean bathroom sinks, counters and mirrors" },
    { id: "w-shower", text: "Wipe or scrub shower and tub surfaces" }
  ] },
  { id: "living", name: "Living + bedrooms", icon: "🛏️", items: [
    { id: "w-dust", text: "Dust reachable surfaces and furniture" },
    { id: "w-beds", text: "Change or straighten bed linens" },
    { id: "w-fur", text: "Remove dog hair from sofas, blankets and beds" },
    { id: "w-pet", text: "Refresh dog bowls and blankets" }
  ] },
  { id: "floors", name: "Floors + finish", icon: "🧹", items: [
    { id: "w-vacuum", text: "Vacuum bedrooms, living spaces and corners" },
    { id: "w-hard", text: "Vacuum or sweep kitchen and bathroom floors" },
    { id: "w-mop", text: "Mop hard floors as needed" },
    { id: "w-last", text: "Put away supplies, laundry and trash" }
  ] }
];
export const CLEANING_TEMPLATES: CleaningTemplate[] = [
  { id: "quick-reset", name: "Quick Reset", duration: "15–30 minutes", description: "A focused tidy and surface refresh without a full clean.", areas: quick },
  { id: "weekly-clean", name: "Weekly Clean", duration: "1–2 hours", description: "Regular upkeep with attention to dog hair and high-traffic areas.", areas: weekly },
  { id: "deep-clean", name: "Whole-Home Deep Clean", duration: "Several hours", description: "The full 43-step apartment deep clean, including both bedrooms and pet areas.",
    areas: CLEAN_AREAS.map((area) => ({ id: area.id, name: area.name, icon: area.icon, items: area.items })) }
];
export const getTemplate = (id: string) => CLEANING_TEMPLATES.find((t) => t.id === id);
export const allIds = (t: CleaningTemplate) => t.areas.flatMap((area) => area.items.map((item) => item.id));
export const resolvedCount = (s: CleaningSession) => Object.keys(s.resolutions).length;
const legacyPhases = (): CleaningPhase[] => [
  { taskId: "409f408a-fdce-81ad-a4a2-c941041e2d3e", areaIds: ["prep", "kitchen", "bath"], synced: false },
  { taskId: "409f408a-fdce-81fe-8020-df8e7dac51cc", areaIds: ["bedrooms", "living", "details"], synced: false },
  { taskId: "409f408a-fdce-81be-b608-e4158a912397", areaIds: ["floors"], synced: false }
];
async function legacySession(): Promise<CleaningSession> {
  const progress = await loadDeepCleanProgress();
  const now = new Date().toISOString();
  const resolutions: Record<string, Resolution> = {};
  for (const [id, done] of Object.entries(progress.checks)) if (done) resolutions[id] = "done";
  const template = getTemplate("deep-clean")!;
  return { id: LEGACY_ID, templateId: "deep-clean", status: "active", startedAt: "2026-10-30T09:00:00-04:00",
    updatedAt: now, resolutions, queue: allIds(template), phases: legacyPhases() };
}
async function stored(id: string): Promise<{ value: CleaningSession; etag: string | null } | null> {
  const hit = await store().getWithMetadata(keyOf(id), { type: "json" });
  return hit && hit.data ? { value: hit.data as CleaningSession, etag: hit.etag ?? null } : null;
}
export async function getSession(id: string): Promise<CleaningSession | null> {
  if (id !== LEGACY_ID && !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const hit = await stored(id);
  if (hit) return hit.value;
  return id === LEGACY_ID ? legacySession() : null;
}
async function put(session: CleaningSession, previous: string | null): Promise<void> {
  const options = previous ? { onlyIfMatch: previous } : { onlyIfNew: true };
  const response = await store().setJSON(keyOf(session.id), session, options);
  if (!response.modified) throw new Error("This cleaning session changed on another device. Refresh and retry.");
}
export async function getSessions(): Promise<CleaningSession[]> {
  const out: CleaningSession[] = [];
  let cursor: string | undefined;
  for (let round = 0; round < 10; round += 1) {
    const result = await store().list({ prefix: PREFIX, ...(cursor ? { cursor } : {}) });
    for (const blob of result.blobs) {
      const id = blob.key.slice(PREFIX.length);
      const hit = await stored(id);
      if (hit) out.push(hit.value);
    }
    if (!result.cursor) break;
    cursor = result.cursor;
  }
  if (!out.some((s) => s.id === LEGACY_ID)) out.push(await legacySession());
  return out.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}
export async function startSession(templateId: CleaningType, startFresh: boolean): Promise<CleaningSession> {
  const template = getTemplate(templateId);
  if (!template) throw new Error("Unknown cleaning routine.");
  const sessions = await getSessions();
  const existing = sessions.find((s) => s.templateId === templateId && s.status === "active");
  if (existing && !startFresh) return existing;
  if (existing) {
    const hit = await stored(existing.id);
    const incomplete = { ...existing, status: "incomplete" as const, finishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await put(incomplete, hit?.etag ?? null);
  }
  const now = new Date().toISOString();
  const created: CleaningSession = { id: randomUUID(), templateId, status: "active", startedAt: now,
    updatedAt: now, resolutions: {}, queue: allIds(template), phases: [] };
  await put(created, null);
  return created;
}
async function markNotionDone(taskId: string): Promise<void> {
  const key = process.env.NOTION_TODAY_EDIT_API_KEY;
  if (!key) throw new Error("Notion edit access is not configured.");
  const cfg = config();
  const page = await notion("/v1/pages/" + taskId, { key });
  const parent = page.parent?.data_source_id ?? page.parent?.database_id ?? null;
  if (parent !== cfg.tasksDataSourceId || page.properties?.Status?.type !== "status" || page.archived || readBool(page.properties?.Archive)) {
    throw new Error("The linked Notion task is unavailable or archived.");
  }
  const current = readText(page.properties.Status);
  if (current === "Done") return;
  if (current !== "Scheduled" && current !== "In progress") throw new Error("A linked Notion task is no longer scheduled.");
  await notion("/v1/pages/" + taskId, { key, method: "PATCH", body: { properties: { Status: { status: { name: "Done" } } } } });
}
export async function updateSession(
  id: string, action: "resolve" | "skip" | "sync", taskId?: string, resolution?: Resolution | null
): Promise<{ session: CleaningSession; warning: string | null }> {
  const before = await getSession(id);
  if (!before) throw new Error("Cleaning session not found.");
  const template = getTemplate(before.templateId)!;
  if (before.status !== "active" && action !== "sync") throw new Error("This session has already ended.");
  const ids = allIds(template);
  if (action !== "sync" && (!taskId || !ids.includes(taskId))) throw new Error("Unknown cleaning task.");
  const next: CleaningSession = { ...before, resolutions: { ...before.resolutions }, queue: [...before.queue],
    phases: before.phases.map((phase) => ({ ...phase })) };
  if (action === "resolve") {
    if (resolution === null) delete next.resolutions[taskId!];
    else if (resolution === "done" || resolution === "not-needed") next.resolutions[taskId!] = resolution;
    else throw new Error("Invalid task choice.");
  }
  if (action === "skip") {
    const pending = next.queue.filter((item) => !next.resolutions[item]);
    if (pending.length > 1) next.queue = next.queue.filter((item) => item !== taskId).concat(taskId!);
  }
  if (next.status === "active" && ids.every((item) => Boolean(next.resolutions[item]))) {
    next.status = "completed";
    next.finishedAt = new Date().toISOString();
  }
  next.updatedAt = new Date().toISOString();
  const hit = await stored(id);
  await put(next, hit?.etag ?? null); // Save checkbox before attempting optional Notion sync.
  const pending = next.phases.filter((phase) => !phase.synced && phase.areaIds.every((areaId) =>
    template.areas.filter((area) => area.id === areaId).every((area) =>
      area.items.every((item) => Boolean(next.resolutions[item.id])))));
  let warning: string | null = null;
  for (const phase of pending) {
    try { await markNotionDone(phase.taskId); phase.synced = true; }
    catch { warning = "Your checklist was saved, but at least one linked Notion task couldn't be marked Done. Use Retry Notion sync."; }
  }
  if (pending.some((phase) => phase.synced)) {
    const saved = await stored(id);
    if (saved) { try { await put(next, saved.etag); } catch { warning = "Notion updated, but the portal couldn't confirm its sync state. Retry to reconcile."; } }
  }
  return { session: next, warning };
}
