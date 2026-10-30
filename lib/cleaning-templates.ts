import { CLEAN_AREAS } from "@/lib/deep-clean-data";

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
