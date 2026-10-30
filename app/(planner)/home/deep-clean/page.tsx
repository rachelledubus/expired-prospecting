import DeepCleanTracker from "./DeepCleanTracker";
import { loadDeepCleanProgress } from "@/lib/deep-clean-store";
import "./deep-clean.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Whole-Home Deep Clean", description: "Room-by-room cleaning checklist for October 30" };

export default async function HomeDeepCleanPage() {
  let initial: Record<string, boolean> = {};
  let loaded = true;
  try { initial = (await loadDeepCleanProgress()).checks; }
  catch (error) {
    console.error("Unable to load cleaning progress", error);
    loaded = false;
  }
  return <DeepCleanTracker initial={initial} loaded={loaded} />;
}
