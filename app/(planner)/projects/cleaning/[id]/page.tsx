import { notFound } from "next/navigation";
import { getSession } from "@/lib/cleaning-system";
import CleaningSessionView from "./CleaningSessionView";
import "../../cleaning.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "Cleaning Checklist", description: "Guided cleaning and saved progress" };
export default async function CleaningSessionPage({ params }: { params: { id: string } }) {
  const session = await getSession(params.id);
  if (!session) notFound();
  return <CleaningSessionView initial={session} />;
}
