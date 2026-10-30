import { config, etDate, notion, readDate, readText } from "@/lib/today";
import { getTemplate } from "@/lib/cleaning-templates";
import type { CleaningPhase, CleaningType } from "@/lib/cleaning-templates";

export type ScheduledCleaning = { id: string; date: string; templateId: CleaningType; title: string; phases: CleaningPhase[] };
const TYPES: { word: RegExp; id: CleaningType }[] = [
  { word: /whole.home deep clean/i, id: "deep-clean" },
  { word: /weekly clean/i, id: "weekly-clean" },
  { word: /quick reset/i, id: "quick-reset" }
];
const indexOfType = (name: string): CleaningType | null => TYPES.find((t) => t.word.test(name))?.id ?? null;
function areasFor(title: string, templateId: CleaningType): string[] {
  if (templateId !== "deep-clean") return getTemplate(templateId)!.areas.map((a) => a.id);
  if (/kitchen.*bath|kitchen \+ bath/i.test(title)) return ["prep", "kitchen", "bath"];
  if (/bedroom.*living|living.*details/i.test(title)) return ["bedrooms", "living", "details"];
  if (/floor.*final|final reset/i.test(title)) return ["floors"];
  return getTemplate(templateId)!.areas.map((a) => a.id);
}
/** Finds future scheduled cleaning tasks by explicit cleaning routine names. Never changes Notion. */
export async function getScheduledCleaning(): Promise<ScheduledCleaning[]> {
  const now = etDate(new Date());
  const end = new Date(Date.parse(now + "T12:00:00Z") + 15 * 86400000).toISOString().slice(0, 10);
  const groups = new Map<string, ScheduledCleaning>();
  let cursor: string | undefined;
  for (let pageNumber = 0; pageNumber < 3; pageNumber += 1) {
    const result = await notion("/v1/data_sources/" + config().tasksDataSourceId + "/query", {
      method: "POST", body: {
        filter: { and: [
          { property: "Due Date", date: { on_or_after: now } },
          { property: "Due Date", date: { before: end } },
          { property: "Archive", checkbox: { equals: false } },
          { or: [
            { property: "Status", status: { equals: "Scheduled" } },
            { property: "Status", status: { equals: "In progress" } }
          ] },
          { or: [
            { property: "Task", title: { contains: "Deep Clean" } },
            { property: "Task", title: { contains: "Weekly Clean" } },
            { property: "Task", title: { contains: "Quick Reset" } }
          ] }
        ] },
        page_size: 100, ...(cursor ? { start_cursor: cursor } : {})
      }
    });
    for (const p of result.results ?? []) {
      const name = readText(p.properties?.Task), type = indexOfType(name);
      if (!type || p.archived) continue;
      const date = readDate(p.properties?.["Due Date"]).start?.slice(0, 10);
      if (!date) continue;
      const key = type + ":" + date;
      if (!groups.has(key)) groups.set(key, { id: key, date, templateId: type, title: getTemplate(type)!.name, phases: [] });
      groups.get(key)!.phases.push({ taskId: p.id, areaIds: areasFor(name, type), synced: false });
    }
    if (!result.has_more) break;
    cursor = result.next_cursor;
  }
  return [...groups.values()].sort((a, b) => a.date.localeCompare(b.date));
}
