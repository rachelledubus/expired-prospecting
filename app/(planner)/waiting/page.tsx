import { getWaiting, TodaySetupError, type WaitingItem } from "@/lib/today";

// Always read Notion fresh; this page is behind the portal password.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Waiting On",
  description: "Things waiting on someone or something, read from Notion",
};

const FONTS =
  "https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;600;700&family=Source+Sans+3:wght@400;600&display=swap";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function md(ymd: string): string {
  const [, m, d] = ymd.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function sinceText(i: WaitingItem): string {
  if (i.since === null || i.daysWaiting === null) return "";
  if (i.daysWaiting === 0) return i.sinceEstimated ? "Added today" : "Since today";
  const age = plural(i.daysWaiting, "day");
  return i.sinceEstimated ? `${age}, added ${md(i.since)}` : `${age}, since ${md(i.since)}`;
}

function checkText(i: WaitingItem): string {
  if (i.checkBack === null || i.daysToCheck === null) return "";
  if (i.daysToCheck < 0) return `Check was due ${md(i.checkBack)}`;
  if (i.daysToCheck === 0) return "Check back today";
  return `Check back ${md(i.checkBack)}`;
}

function Card({ item, quiet }: { item: WaitingItem; quiet?: boolean }) {
  const meta = [sinceText(item), checkText(item)].filter(Boolean).join(" · ");
  const more = item.full && item.full.replace(/\s+/g, " ").trim() !== item.short;
  return (
    <li className={`wo-card${quiet ? " quiet" : ""}`}>
      <div className="wo-title">{item.title}</div>
      {item.short && <div className="wo-note">{item.short}</div>}
      {meta && <div className="wo-meta">{meta}</div>}
      {(more || item.url) && (
        <details className="wo-more">
          <summary>{more ? "Full note" : "Open"}</summary>
          {more && <p>{item.full}</p>}
          <a className="portal-link" href={item.url} target="_blank" rel="noreferrer">
            Open in Notion
          </a>
        </details>
      )}
    </li>
  );
}

export default async function WaitingPage() {
  const fonts = (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={FONTS} />
    </>
  );

  try {
    const data = await getWaiting();
    const total = data.due.length + data.waiting.length;
    const [y, m, d] = data.today.split("-").map(Number);
    const dow = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
    const undated = data.waiting.filter((i) => i.checkBack === null).length;
    return (
      <>
        {fonts}
        <div className="tp">
          <div className="shell gutter">
           <div className="paper">
            <div className="holes" aria-hidden="true" />
            <header className="hd">
              <div>
                <div className="dow"><span>Waiting On</span></div>
                <div className="dmy">
                  {dow}, {MONTHS[m - 1]} {d}
                </div>
              </div>
            </header>

            {data.due.length > 0 && (
              <>
                <div className="label">Time to check ({data.due.length})</div>
                <ul className="wo-list">
                  {data.due.map((i) => (
                    <Card key={i.id} item={i} />
                  ))}
                </ul>
              </>
            )}

            <div className="label">
              {data.due.length > 0 ? "Still waiting" : "Waiting"} ({data.waiting.length})
            </div>
            {data.waiting.length === 0 ? (
              <p className="wo-empty">{total === 0 ? "Nothing is waiting on anyone right now." : "Nothing else is waiting."}</p>
            ) : (
              <ul className="wo-list">
                {data.waiting.map((i) => (
                  <Card key={i.id} item={i} quiet={i.daysToCheck !== null && i.daysToCheck > 0} />
                ))}
              </ul>
            )}
            {undated > 0 && (
              <p className="wo-hint">
                {plural(undated, "item")} {undated === 1 ? "has" : "have"} no check-back date. Fill in <b>Check back on</b> in Notion
                and {undated === 1 ? "it" : "they"} will stay quiet until that day.
              </p>
            )}

            {data.hold.length > 0 && (
              <details className="wo-hold">
                <summary>On hold, blocked by something ({data.hold.length})</summary>
                <ul className="wo-list">
                  {data.hold.map((i) => (
                    <Card key={i.id} item={i} quiet />
                  ))}
                </ul>
              </details>
            )}
           </div>
          </div>
        </div>
      </>
    );
  } catch (err) {
    const message =
      err instanceof TodaySetupError ? err.message : "Something went wrong while reading Notion.";
    return (
      <>
        {fonts}
        <div className="tp">
          <div className="wrap">
            <div className="err">
              <h2>Waiting On could not load</h2>
              <p>{message}</p>
              <p>
                <a className="portal-link" href="/waiting">Try again</a> &middot;{" "}
                <a className="portal-link" href="/">Portal home</a>
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }
}
