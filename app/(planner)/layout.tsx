import "./today/today.css";
import "./waiting/waiting.css";
import "./inbox/inbox.css";
import "./review/review.css";
import "./projects/projects.css";
import "./loops/loops.css";
import "./games/games.css";
import "./planner.css";
import PlannerTabs from "./PlannerTabs";

// The planner: one frame with page tabs along the top. Each page (Today, Waiting On, and later
// ones) renders below it, so flipping pages keeps the tabs where they are.
export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tp planner">
      <PlannerTabs />
      {children}
    </div>
  );
}
