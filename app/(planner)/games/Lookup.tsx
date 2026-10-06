"use client";

import { useRef, useState } from "react";
import type { LookupLink, LookupResult } from "@/lib/wiki-lookup";

type State =
  | { kind: "idle" }
  | { kind: "loading"; q: string }
  | { kind: "done"; result: LookupResult }
  | { kind: "error"; message: string; links: LookupLink[] };

const FALLBACK_LINKS = (q: string): LookupLink[] => [
  { label: "Search the Stardew Valley wiki", url: `https://stardewvalleywiki.com/mediawiki/index.php?search=${encodeURIComponent(q)}` },
];

/** A search box for the Games page: type an item, fish or crop and see where, when and in what season to get it. */
export default function Lookup() {
  const [q, setQ] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const latest = useRef(0);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = q.trim();
    if (text.length < 2) return;
    const id = (latest.current += 1);
    setState({ kind: "loading", q: text });
    try {
      const res = await fetch(`/api/games/lookup?q=${encodeURIComponent(text)}`, { headers: { Accept: "application/json" } });
      if (res.redirected) throw Object.assign(new Error("signed out"), { signedOut: true });
      const data = await res.json();
      if (id !== latest.current) return;
      if (data?.ok) setState({ kind: "done", result: data as LookupResult });
      else setState({ kind: "error", message: data?.message ?? "Lookup failed.", links: data?.links ?? FALLBACK_LINKS(text) });
    } catch (error) {
      if (id !== latest.current) return;
      const signedOut = (error as { signedOut?: boolean }).signedOut;
      setState({
        kind: "error",
        message: signedOut ? "You were signed out. Log in again to use the lookup." : "Could not reach the lookup. Check your connection and try again.",
        links: FALLBACK_LINKS(text),
      });
    }
  };

  const clear = () => {
    latest.current += 1;
    setQ("");
    setState({ kind: "idle" });
  };

  return (
    <section className="gm-lookup" aria-label="Item lookup">
      <form onSubmit={run} className="gm-lookup-form" role="search">
        <input
          type="search"
          className="gm-input"
          value={q}
          maxLength={60}
          placeholder="Look up an item, fish or crop"
          aria-label="Look up an item, fish or crop"
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="gm-pill" disabled={q.trim().length < 2 || state.kind === "loading"}>
          Look up
        </button>
      </form>

      <div aria-live="polite">
        {state.kind === "loading" && <p className="gm-note">Looking up “{state.q}” on the Stardew Valley wiki…</p>}

        {state.kind === "error" && (
          <div className="gm-callout warn">
            {state.message}
            <LinkRow links={state.links} />
          </div>
        )}

        {state.kind === "done" && (
          <div className="gm-results">
            {state.result.hits.length === 0 && <p className="gm-note">The Stardew Valley wiki has nothing for “{state.result.query}”.</p>}
            {state.result.hits.map((hit) => (
              <article key={hit.url} className="gm-card gm-hit">
                <h3 className="gm-hit-title">{hit.title}</h3>
                {hit.facts.length > 0 && (
                  <dl className="gm-facts">
                    {hit.facts.map((f) => (
                      <div key={f.label}>
                        <dt>{f.label}</dt>
                        <dd>{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {hit.text.map((t, i) => (
                  <p key={i} className="gm-hit-text">
                    {t}
                  </p>
                ))}
                <a className="gm-hit-link" href={hit.url} target="_blank" rel="noopener noreferrer">
                  Read it on the wiki
                </a>
              </article>
            ))}
            <p className="gm-note">From the Stardew Valley wiki, which covers the base game. Mods can change a spot. For mod items:</p>
            <LinkRow links={state.result.links} />
          </div>
        )}
      </div>

      {state.kind !== "idle" && (
        <button type="button" className="gm-pill ghost" onClick={clear}>
          Clear
        </button>
      )}
    </section>
  );
}

function LinkRow({ links }: { links: LookupLink[] }) {
  return (
    <p className="gm-lookup-links">
      {links.map((l) => (
        <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">
          {l.label}
        </a>
      ))}
    </p>
  );
}
