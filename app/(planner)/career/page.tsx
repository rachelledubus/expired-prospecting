import { getCareerProgress, CareerNotionSetupError } from "@/lib/career-notion";
import CareerPlanner from "./CareerPlanner";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Career Readiness",
  description: "Evidence-based milestones for software development and consulting",
};

const FONTS =
  "https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;600;700&family=Source+Sans+3:wght@400;600&display=swap";

export default async function CareerPage() {
  const fonts = (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={FONTS} />
    </>
  );

  try {
    const progress = await getCareerProgress();
    return <>{fonts}<CareerPlanner initial={progress} /></>;
  } catch (error) {
    if (!(error instanceof CareerNotionSetupError)) console.error("Career progress could not load", error);
    return (
      <>
        {fonts}
        <div className="shell gutter cr-shell">
          <div className="paper cr-paper">
            <div className="cr-inner" role="alert">
              <h1>Career sync needs attention</h1>
              <p>{error instanceof CareerNotionSetupError ? error.message : "Could not reach Notion. Your saved evidence is safe; refresh and try again."}</p>
              <a href="/career">Reload tracker</a>
            </div>
          </div>
        </div>
      </>
    );
  }
}
