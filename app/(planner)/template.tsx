// A template re-mounts on every page change, which is what lets the page-turn animation replay.
export default function PlannerTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-turn">{children}</div>;
}
