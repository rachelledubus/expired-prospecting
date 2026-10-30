"use client";

import { useMemo, useState } from "react";
import { DREAMLIGHT_ITEM_INDEX, type DreamlightItemGuide } from "@/lib/dreamlight-item-index";

export function ItemDetails({ item, qty }: { item: string; qty?: number }) {
 const entry = DREAMLIGHT_ITEM_INDEX[item];
 return (
   <div className="gm-dv-item-detail">
     <b>{qty ? qty + "× " : ""}{item}</b>
     {entry ? (
       <>
         <span className="gm-dv-method">{entry.method}</span>
         <p className="gm-dv-where">{entry.where}</p>
         {entry.tip && <p className="gm-dv-tip">{entry.tip}</p>}
       </>
     ) : (
       <p className="gm-dv-unverified">No confirmed location saved for this specific quest item yet.</p>
     )}
   </div>
 );
}

const entries: DreamlightItemGuide[] = Object.values(DREAMLIGHT_ITEM_INDEX);
export default function DreamlightItems() {
 const [query, setQuery] = useState("");
 const [all, setAll] = useState(false);
 const [limit, setLimit] = useState(35);
 const q = query.trim().toLocaleLowerCase();
 const results = useMemo(() => {
   if (!q) return all ? entries : [];
   const matched = entries.filter(item =>
     (item.name + " " + item.method + " " + item.where + " " + (item.tip ?? "")).toLocaleLowerCase().includes(q));
   return matched.sort((a, b) => {
     const aName = a.name.toLocaleLowerCase(), bName = b.name.toLocaleLowerCase();
     const aRank = aName === q ? 0 : aName.startsWith(q) ? 1 : aName.includes(q) ? 2 : 3;
     const bRank = bName === q ? 0 : bName.startsWith(q) ? 1 : bName.includes(q) ? 2 : 3;
     return aRank - bRank || aName.localeCompare(bName);
   });
 }, [q, all]);
 const visible = results.slice(0, limit);
 return (
  <section className="gm-card gm-dv-items" aria-label="In-page Dreamlight Valley item finder">
    <div className="gm-panel-label">🔎 Item locations & recipes</div>
    <h3 className="gm-h2">Where do I get it?</h3>
    <p className="gm-note">Search an item, ingredient, biome or method. Locations and alternate sources appear right here; no wiki pages to open.</p>
    <label className="gm-note gm-dv-search-label">
      Find an item or recipe
      <input className="gm-input" type="search" value={query}
        placeholder="e.g. Hearty Salad, clay, iron, Frosted Heights…"
        onChange={event => { setQuery(event.target.value); setAll(false); setLimit(35); }} />
    </label>
    <div className="gm-dv-shortcuts">
      {["Hearty Salad","Clay","Iron Ore","Golden Honey","Driftwood"].map(name => (
       <button key={name} className="gm-dv-shortcut" type="button" onClick={() => { setQuery(name); setAll(false); setLimit(35); }}>{name}</button>
      ))}
      {query && <button className="gm-dv-shortcut" type="button" onClick={() => setQuery("")}>Clear search</button>}
    </div>
    <div className="gm-dv-item-results" aria-live="polite">
      {visible.map(item => <ItemDetails key={item.name} item={item.name} />)}
      {q && results.length === 0 && <p className="gm-dv-unverified">No saved location matches “{query.trim()}” yet. You can search by part of the name, location, or ingredient type.</p>}
      {results.length > visible.length && <button className="gm-pill ghost gm-dv-show-all" type="button" onClick={() => setLimit(n => n + 35)}>Show more ({visible.length} of {results.length})</button>}
    </div>
    {!q && !all && <button className="gm-pill ghost gm-dv-show-all" type="button" onClick={() => { setAll(true); setLimit(35); }}>
      Browse the full item directory ({entries.length} entries)
    </button>}
    {!q && all && <button className="gm-pill ghost gm-dv-show-all" type="button" onClick={() => { setAll(false); setLimit(35); }}>
      Show popular items
    </button>}
    <p className="gm-note gm-dv-caveat">Includes base Valley and Honeyglow Woods items. Quest-only drops may be available only when their story step is active.</p>
  </section>
 );
}
