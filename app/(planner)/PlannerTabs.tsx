"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Add a page here and it gets a tab. Colors reuse the Today palette.
const PAGES = [
  { href: "/today", label: "Today", bg: "#F4E6B8" },
  { href: "/waiting", label: "Waiting On", bg: "var(--work-bg)" },
  { href: "/projects", label: "Projects", bg: "var(--routine-bg)" },
  { href: "/loops", label: "Open Loops", bg: "var(--other-bg, #EFE7DA)" },
];

export default function PlannerTabs() {
  const path = usePathname() ?? "";
  return (
    <nav className="ptabs" aria-label="Planner pages">
      <div className="ptabs-row">
        {PAGES.map((p) => {
          const active = path === p.href || path.startsWith(`${p.href}/`);
          return (
            <Link
              key={p.href}
              href={p.href}
              className={"ptab" + (active ? " on" : "")}
              style={active ? undefined : { background: p.bg }}
              aria-current={active ? "page" : undefined}
            >
              {p.label}
            </Link>
          );
        })}
        <a className="ptab-home" href="/">Portal</a>
      </div>
    </nav>
  );
}
