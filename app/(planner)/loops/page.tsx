import { getLoops } from "@/lib/loops";
import { TodaySetupError } from "@/lib/today";
import LoopsPlanner from "./LoopsPlanner";

// Always read Notion fresh; this page is behind the portal password.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Open Loops",
  description: "Loose ends worth a look, read from Notion",
};

const FONTS =
  "https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;600;700&family=Source+Sans+3:wght@400;600&display=swap";

export default async function LoopsPage() {
  const fonts = (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={FONTS} />
    </>
  );
  try {
    const data = await getLoops();
    return (
      <>
        {fonts}
        <LoopsPlanner data={data} />
      </>
    );
  } catch (err) {
    const message = err instanceof TodaySetupError ? err.message : "Something went wrong while reading Notion.";
    return (
      <>
        {fonts}
        <div className="wrap">
          <div className="err">
            <h2>Open Loops could not load</h2>
            <p>{message}</p>
            <p><a className="portal-link" href="/loops">Try again</a> &middot; <a className="portal-link" href="/">Portal home</a></p>
          </div>
        </div>
      </>
    );
  }
}
