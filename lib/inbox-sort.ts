// Free, rule-based sorting for the Inbox page. No AI and no outside service: plain rules that read the words
// she typed. It is deliberately cautious. When it is not sure, it says so and leaves the item in the Inbox.
// This file has no imports so it can be tested on its own.

export const CAPTURE_TYPES = [
  "Task", "Idea", "Buy", "Question", "Lead / Contact", "Home Issue", "WGU / Study", "Reference", "Other",
] as const;
export type CaptureType = (typeof CAPTURE_TYPES)[number];

/** Where an item of each type usually lives. Idea and Question have no obvious home, so they get none. */
export const ROUTE_FOR: Record<CaptureType, string | null> = {
  Task: "Tasks",
  Idea: null,
  Buy: "Execution Supplies",
  Question: null,
  "Lead / Contact": "CRM",
  "Home Issue": "Home Operations",
  "WGU / Study": "WGU",
  Reference: "Resources / Notes",
  Other: null,
};

export type ProjectRef = { id: string; name: string };

export type Sorted = {
  /** What goes in the task title: her words, with filler and the date phrase removed. */
  title: string;
  /** Exactly what she typed. */
  original: string;
  type: CaptureType;
  route: string | null;
  projectId: string | null;
  projectName: string | null;
  due: string | null;
  /** True when the portal is confident enough to file it as a normal task. False means it waits in the Inbox. */
  sorted: boolean;
  /** Short reasons, shown under the item. */
  why: string[];
};

// ---------- dates ----------

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const dn = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
};
const fromDn = (n: number) => new Date(n * 86400000).toISOString().slice(0, 10);
const dow = (ymd: string) => new Date(dn(ymd) * 86400000).getUTCDay(); // 0 = Sunday
const validYmd = (y: number, m: number, d: number) => {
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
};
const pad = (n: number) => String(n).padStart(2, "0");

/** The next date (strictly after today) that falls on weekday `wd`. */
function nextWeekday(today: string, wd: number): string {
  const diff = ((wd - dow(today) + 6) % 7) + 1; // 1..7
  return fromDn(dn(today) + diff);
}

/** The weekday in the calendar week (Mon to Sun) after this one. */
function weekdayNextWeek(today: string, wd: number): string {
  const sinceMonday = (dow(today) + 6) % 7;
  const nextMonday = dn(today) - sinceMonday + 7;
  return fromDn(nextMonday + ((wd + 6) % 7));
}

function dayIndex(word: string): number {
  return DAYS.indexOf(word.slice(0, 3).toLowerCase());
}

type DateHit = { due: string; start: number; end: number; label: string };

/** Finds the first date phrase. Returns null when there is none or it is not clear. */
export function findDate(text: string, today: string): DateHit | null {
  const hits: DateHit[] = [];
  const add = (m: RegExpMatchArray, due: string, label: string) => {
    if (m.index === undefined) return;
    hits.push({ due, start: m.index, end: m.index + m[0].length, label });
  };
  const lower = text;
  const [ty] = today.split("-").map(Number);

  let m: RegExpMatchArray | null;
  if ((m = lower.match(/\b(?:by\s+|on\s+|for\s+)?(today|tonight)\b/i))) add(m, today, "today");
  if ((m = lower.match(/\b(?:by\s+|on\s+|for\s+)?(tomorrow|tmrw|tmw)\b/i))) add(m, fromDn(dn(today) + 1), "tomorrow");
  if ((m = lower.match(/\bin\s+(\d{1,2})\s+(day|days|week|weeks)\b/i))) {
    const n = Number(m[1]) * (/week/i.test(m[2]) ? 7 : 1);
    if (n >= 1 && n <= 120) add(m, fromDn(dn(today) + n), `in ${m[1]} ${m[2].toLowerCase()}`);
  }
  if ((m = lower.match(/\bnext\s+week\b/i))) add(m, weekdayNextWeek(today, 1), "next week");
  if ((m = lower.match(/\bthis\s+weekend\b/i))) add(m, dow(today) === 6 ? today : nextWeekday(today, 6), "this weekend");

  // Weekday names. Short forms ("fri") only count after on/by/this/next, so ordinary words are left alone.
  const wk = /\b(?:(on|by|this|next)\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tues|tue|wed|thurs|thur|thu|fri|sat|sun)\b/gi;
  for (const w of lower.matchAll(wk)) {
    const prefix = (w[1] || "").toLowerCase();
    const name = w[2].toLowerCase();
    const full = name.length >= 6 || name === "monday" || name === "friday" || name === "sunday";
    if (!full && !prefix) continue;
    const wd = dayIndex(name);
    if (wd < 0) continue;
    const due = prefix === "next" ? weekdayNextWeek(today, wd) : nextWeekday(today, wd);
    add(w, due, prefix === "next" ? `next ${name}` : name);
  }

  // Month name and day: "oct 15", "October 15th", "oct 15, 2026".
  const mon = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?\b/gi;
  for (const w of lower.matchAll(mon)) {
    const mi = MONTHS.indexOf(w[1].toLowerCase().slice(0, 3));
    const d = Number(w[2]);
    let y = w[3] ? Number(w[3]) : ty;
    if (mi < 0 || !validYmd(y, mi + 1, d)) continue;
    let ymd = `${y}-${pad(mi + 1)}-${pad(d)}`;
    if (ymd < today) {
      if (w[3]) continue; // an explicit past year is not a due date
      y += 1;
      if (!validYmd(y, mi + 1, d)) continue;
      ymd = `${y}-${pad(mi + 1)}-${pad(d)}`;
    }
    add(w, ymd, `${w[1]} ${d}`);
    break;
  }

  // 10/15 or 10/15/26. Only after on/by/due/before/until, because things like "aligner 10/21" are not dates.
  const sl = /\b(?:on|by|due|before|until)\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?\b/gi;
  for (const w of lower.matchAll(sl)) {
    const mo = Number(w[1]);
    const d = Number(w[2]);
    let y = w[3] ? (w[3].length === 2 ? 2000 + Number(w[3]) : Number(w[3])) : ty;
    if (!validYmd(y, mo, d)) continue;
    let ymd = `${y}-${pad(mo)}-${pad(d)}`;
    if (ymd < today) {
      if (w[3]) continue;
      y += 1;
      if (!validYmd(y, mo, d)) continue;
      ymd = `${y}-${pad(mo)}-${pad(d)}`;
    }
    add(w, ymd, `${mo}/${d}`);
    break;
  }

  if (hits.length === 0) return null;
  // Two different dates in one line is not clear. Leave the date for her to set.
  const distinct = new Set(hits.map((h) => h.due));
  if (distinct.size > 1) return null;
  return hits.sort((a, b) => a.start - b.start)[0];
}

// ---------- projects ----------

const PROJECT_STOP = new Set([
  "the", "and", "for", "with", "new", "set", "up", "old", "project", "plan", "system", "campaign", "setup", "launch", "build",
  "finish", "activation", "validation", "run", "tools", "tool", "sell", "get", "make", "work", "page", "list", "from", "into",
]);

const stem = (w: string) => (w.length > 4 && w.endsWith("s") ? w.slice(0, -1) : w);
const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

function projectTokens(name: string): string[] {
  return Array.from(new Set(words(name).filter((w) => w.length >= 3 && !PROJECT_STOP.has(w)).map(stem)));
}

/** Picks the one project the text clearly belongs to, or null. Ties and weak matches return null. */
export function matchProject(text: string, projects: ProjectRef[]): { project: ProjectRef; matched: string[] } | null {
  const textTokens = new Set(words(text).map(stem));
  const withTokens = projects.map((p) => ({ p, tokens: projectTokens(p.name) })).filter((x) => x.tokens.length > 0);
  const count = new Map<string, number>();
  for (const x of withTokens) for (const t of x.tokens) count.set(t, (count.get(t) ?? 0) + 1);

  const scored = withTokens
    .map((x) => {
      const matched = x.tokens.filter((t) => textTokens.has(t));
      const score = matched.reduce((sum, t) => sum + ((count.get(t) ?? 0) === 1 ? 1 : 0.4), 0);
      return { project: x.p, matched, score };
    })
    .filter((x) => x.score >= 0.8)
    .sort((a, b) => b.score - a.score);
  if (scored.length === 0) return null;
  if (scored.length > 1 && scored[1].score === scored[0].score) return null;
  return { project: scored[0].project, matched: scored[0].matched };
}

// ---------- type ----------

const VERBS = new Set(`add answer apply arrange ask assemble audit back backup bake book bring build call cancel change check choose clean clear
click close collect compare complete confirm contact copy create cut declutter decide delete deliver design download draft drop email enter
file fill find finalize finish fix fold follow forward gather generate get give go grab hang import install invite journal label launch
list load log mail make mark meet measure move note open order organize pack paint pay pick plan post practice prep prepare print
publish put read record register renew reorganize repair reply request research reschedule reset restock return review revise run
save schedule scan search send set share shop ship sign sort start stop study submit swap take test text throw tidy track transfer
trim turn unpack mow vacuum sweep mop water feed walk charge update upload verify visit wash watch wipe write`.split(/\s+/));

const FILLER = /^(?:(?:please\s+)?(?:remember\s+to|need\s+to|have\s+to|don'?t\s+forget\s+to|dont\s+forget\s+to|gotta|should|must|todo:?|to[- ]do:?|task:?|reminder:?)\s+)+/i;

function tidy(s: string): string {
  let t = s.replace(/\s+/g, " ").replace(/\s+([,.;:!?])/g, "$1").replace(/^[\s,.;:\-–—]+|[\s,.;:\-–—]+$/g, "").trim();
  // Drop a dangling "on", "by" or "for" left behind when the date phrase was removed.
  t = t.replace(/\s+(on|by|for|due|before|until|at)$/i, "").trim();
  if (!t || /^https?:\/\//i.test(t)) return t;
  return t[0].toUpperCase() + t.slice(1);
}

function classify(text: string): { type: CaptureType; reason: string } {
  const t = text.trim().toLowerCase();
  if (/\?\s*$/.test(t) || /^(what|why|how|when|where|who|which|should i|can i|could i|is there|are there|do i|does)\b/.test(t)) {
    return { type: "Question", reason: "reads like a question" };
  }
  if (/^(idea\b|what if\b|maybe\b|someday\b|it would be (cool|nice)\b|would be (cool|nice)\b|brainstorm\b)/.test(t)) {
    return { type: "Idea", reason: "reads like an idea" };
  }
  if (/https?:\/\//.test(t) || /^(note|ref|reference|link|save|bookmark)\b[: ]/.test(t)) {
    return { type: "Reference", reason: "looks like something to keep" };
  }
  if (/\b(new lead|inquiry|enquiry|referral|prospect)\b|phone number|\S+@\S+\.\S+|\b\d{3}[-. ]\d{3}[-. ]\d{4}\b/.test(t)) {
    return { type: "Lead / Contact", reason: "mentions a lead or contact" };
  }
  if (/\b(wgu|d\d{3}|c\d{3}|course|exam|assessment|lecture|study|module|competenc\w*)\b/.test(t)) {
    return { type: "WGU / Study", reason: "mentions school" };
  }
  if (/\b(leak\w*|clog\w*|broken|crack\w*|mold|dishwasher|faucet|toilet|roof|fridge|refrigerator|dryer|garage door|smoke detector|plumber|electrician|hvac|water heater|drywall|termite\w*|pest\w*)\b/.test(t)) {
    return { type: "Home Issue", reason: "sounds like a home repair" };
  }
  if (/^(buy|order|purchase|restock|reorder|get more)\b|\b(running low on|out of|need more)\b/.test(t)) {
    return { type: "Buy", reason: "something to buy" };
  }
  return { type: "Task", reason: "" };
}

// ---------- the whole sort ----------

export function sortLine(raw: string, today: string, projects: ProjectRef[]): Sorted {
  const original = raw.replace(/\s+/g, " ").trim();
  const why: string[] = [];

  // Date first, then take the phrase out of the title.
  const date = findDate(original, today);
  let working = original;
  if (date) working = `${original.slice(0, date.start)} ${original.slice(date.end)}`;
  working = working.replace(FILLER, "").trim();
  const title = tidy(working) || tidy(original) || original;

  const project = matchProject(original, projects);
  let { type, reason } = classify(original.replace(FILLER, ""));
  if (project && (type === "Buy" || type === "Home Issue" || type === "WGU / Study")) {
    type = "Task"; // it belongs to a project, so it is that project's task
    reason = "";
  }

  const firstWord = words(original.replace(FILLER, ""))[0] ?? "";
  const hasVerb = VERBS.has(firstWord);

  let sorted = false;
  if (type === "Task") {
    sorted = Boolean(project) || Boolean(date) || hasVerb;
    if (!sorted) why.push("could not tell what kind of item this is");
  } else {
    why.push(`${reason}, so it stays here for you to place`);
  }

  if (project) why.push(`project: ${project.project.name}`);
  if (date) why.push(`date: ${date.label}`);

  return {
    title,
    original,
    type,
    route: ROUTE_FOR[type],
    projectId: project?.project.id ?? null,
    projectName: project?.project.name ?? null,
    due: date?.due ?? null,
    sorted,
    why,
  };
}

/** Splits what she typed into separate items: one per line, blank lines ignored, bullets and numbers stripped. */
export function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d{1,2}[.)])\s+/, "").trim())
    .filter(Boolean);
}
