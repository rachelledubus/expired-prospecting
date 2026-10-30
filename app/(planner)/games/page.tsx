import { GAMES, emptyProgress, type GameProgress } from "@/lib/games-data";
import { loadProgress } from "@/lib/games-store";
import GamesPlanner from "./GamesPlanner";

// Saved progress is read fresh each visit; this page is behind the portal password.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Games",
  description: "Custom game progression checklists",
};

const FONTS =
  "https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;600;700&family=Source+Sans+3:wght@400;600&display=swap";

export default async function GamesPage() {
  const initial: Record<string, GameProgress> = {};
  let loaded = true;
  for (const game of GAMES) {
    try {
      initial[game.id] = await loadProgress(game);
    } catch (error) {
      console.error("Games progress read failed", error);
      initial[game.id] = emptyProgress();
      loaded = false;
    }
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={FONTS} />
      <GamesPlanner initial={initial} loaded={loaded} />
    </>
  );
}
