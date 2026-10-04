import Link from "next/link";
import { getReview } from "@/lib/review";
import { TodaySetupError } from "@/lib/today";

// Always read Notion fresh; this page is behind the portal password.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Weekly Review",
  description: "The week in one page, read from Notion",
};

const FONTS =
  "https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;600;700&family=Source+Sans+3:wght@400;600&display=swap";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const md = (ymd: string) => `${MONTHS[Number(ymd.slice(5, 7)) - 1]} ${Number(ymd.slice(8, 10))}`;
const range = (a: string, b: string) => `${md(a)} to ${md(b)}`;
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
const dayName = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
};

export default async function ReviewPage({ searchParams }: { searchParams?: { week?: string } }) {
  const which = searchParams?.week === "last" ? "last" : "this";
  const fonts = (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={FONTS} />
    </>
  );
  try {
    const r = await getReview(which);
    const ongoing = r.which === "this" && r.today < r.weekEnd;
    const upLabel = r.which === "last" ? "The week after" : "Next week";
    return (
      <>
        {fonts}
        <div className="tp">
          <div className="shell gutter">
            <div className="paper">
              <div className="holes" aria-hidden="true" />
              <header className="hd">
                <div>
                  <div className="dow"><span>Weekly Review</span></div>
                  <div className="dmy">{range(r.weekStart, r.weekEnd)}{ongoing ? " (so far)" : ""}</div>
                </div>
              </header>
              <div className="rv-switch">
                <Link className={"rv-pill" + (r.which === "this" ? " on" : "")} href="/review" replace>This week</Link>
                <Link className={"rv-pill" + (r.which === "last" ? " on" : "")} href="/review?week=last" replace>Last week</Link>
              </div>
              {r.warnings.map((w) => <p className="state-line" key={w}>{w}</p>)}

              <div className="rv-stats">
                <div className="rv-stat"><b>{r.done.total}</b><span>Done</span></div>
                <div className="rv-stat"><b>{r.moved.length}</b><span>{r.moved.length === 1 ? "Project moved" : "Projects moved"}</span></div>
                <div className="rv-stat warn"><b>{r.pastDue.more ? `${r.pastDue.count}+` : r.pastDue.count}</b><span>Past due now</span></div>
                <div className="rv-stat warn"><b>{r.inbox ?? "?"}</b><span>In the Inbox</span></div>
              </div>

              <section>
                <div className="label">Done this week ({r.done.total})</div>
                {r.done.total === 0 ? (
                  <p className="wo-empty">No finished tasks with a date in this week.</p>
                ) : (
                  <ul className="wo-list">
                    {r.done.tasks.map((t) => (
                      <li key={t.id} className="wo-card"><div className="wo-title">{t.title}</div>{t.day && <div className="wo-meta">{dayName(t.day)} {md(t.day)}</div>}</li>
                    ))}
                  </ul>
                )}
                {r.done.total > r.done.tasks.length && <p className="rv-note">Showing the latest {r.done.tasks.length} of {r.done.total}.</p>}
                {r.routine && <p className="rv-note">Routine blocks: {r.routine.done} of {r.routine.total} done so far.</p>}
                <p className="rv-note">Counts finished tasks that have a date in this week. Notion does not record when a task was finished.</p>
              </section>

              <section>
                <div className="label">Projects</div>
                {r.moved.length > 0 && (
                  <>
                    <p className="rv-sub">Moved this week</p>
                    <ul className="wo-list">{r.moved.map((p) => <li key={p.id} className="wo-card"><div className="wo-title">{p.name}</div><div className="wo-meta">Last moved {md(p.lastProgress!)}</div></li>)}</ul>
                  </>
                )}
                {r.quiet.length > 0 && (
                  <>
                    <p className="rv-sub">Gone quiet</p>
                    <ul className="wo-list">{r.quiet.slice(0, 5).map((p) => <li key={p.id} className="wo-card"><div className="wo-title">{p.name}</div><div className="wo-meta">{plural(p.quietDays, "day")} since it moved</div></li>)}</ul>
                  </>
                )}
                {r.noNext.length > 0 && (
                  <>
                    <p className="rv-sub">No next action ({r.noNext.length})</p>
                    <ul className="wo-list">{r.noNext.slice(0, 5).map((p) => <li key={p.id} className="wo-card"><div className="wo-title">{p.name}</div></li>)}</ul>
                  </>
                )}
                {r.moved.length === 0 && r.quiet.length === 0 && r.noNext.length === 0 && <p className="wo-empty">Nothing to flag on projects.</p>}
                <Link className="pj-link rv-more" href="/projects">Open Projects</Link>
              </section>

              <section>
                <div className="label">Loose ends</div>
                <ul className="wo-list">
                  <li className="wo-card"><div className="wo-title">{r.pastDue.more ? `${r.pastDue.count}+` : r.pastDue.count} past due</div>
                    <div className="wo-meta">{r.pastDue.tasks.length ? `Oldest: ${r.pastDue.tasks.map((t) => t.title).join(", ")}` : "Nothing is past due."}</div></li>
                  <li className="wo-card"><div className="wo-title">{r.waiting.length} waiting too long</div>
                    <div className="wo-meta">{r.waiting.length ? r.waiting.slice(0, 3).map((w) => w.title).join(", ") : "Nothing is overdue for a check."}</div></li>
                  <li className="wo-card"><div className="wo-title">{r.inbox ?? "?"} in the Inbox</div>
                    <div className="wo-meta">{r.inbox ? "Waiting to be sorted." : r.inbox === 0 ? "Everything is sorted." : "Could not be read."}</div></li>
                </ul>
                <p className="rv-links">
                  <Link className="pj-link" href="/loops">Open Loops</Link> <Link className="pj-link" href="/waiting">Waiting On</Link> <Link className="pj-link" href="/inbox">Inbox</Link>
                </p>
              </section>

              <section>
                <div className="label">{upLabel}, {range(r.nextStart, r.nextEnd)} ({r.upcoming.total})</div>
                {r.upcoming.total === 0 ? (
                  <p className="wo-empty">Nothing is scheduled yet.</p>
                ) : (
                  <ul className="wo-list">
                    {r.upcoming.tasks.map((t) => (
                      <li key={t.id} className="wo-card">
                        <div className="wo-title">{t.title}</div>
                        <div className="wo-meta">{t.day ? `${dayName(t.day)} ${md(t.day)}` : ""}{t.appointment ? " · Appointment" : ""}</div>
                      </li>
                    ))}
                  </ul>
                )}
                {r.upcoming.total > r.upcoming.tasks.length && <p className="rv-note">Showing the first {r.upcoming.tasks.length} of {r.upcoming.total}.</p>}
                {r.upcoming.blocks > 0 && <p className="rv-note">Plus {plural(r.upcoming.blocks, "routine block")} already on the calendar.</p>}
              </section>
            </div>
          </div>
        </div>
      </>
    );
  } catch (err) {
    const message = err instanceof TodaySetupError ? err.message : "Something went wrong while reading Notion.";
    return (
      <>
        {fonts}
        <div className="wrap">
          <div className="err">
            <h2>Weekly Review could not load</h2>
            <p>{message}</p>
            <p><a className="portal-link" href="/review">Try again</a> &middot; <a className="portal-link" href="/">Portal home</a></p>
          </div>
        </div>
      </>
    );
  }
}
