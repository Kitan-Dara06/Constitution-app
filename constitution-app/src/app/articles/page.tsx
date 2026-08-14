"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { constitution } from "@/lib/data";
import { SearchIcon, ChevronRight } from "@/components/icons";

export default function ArticlesPage() {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const list = useMemo(() => {
    if (!query) return constitution.articles;
    return constitution.articles.filter((a) =>
      `${a.number} ${a.title} ${a.intro.join(" ")} ${a.sections
        .map((s) => s.title)
        .join(" ")}`
        .toLowerCase()
        .includes(query),
    );
  }, [query]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Articles</h1>
          <p className="text-sm text-muted">
            {constitution.articles.length} articles · the body of the constitution
          </p>
        </div>
      </header>

      <div className="relative">
        <SearchIcon
          width={18}
          height={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input !pl-10"
          placeholder="Filter by number or title…"
          autoComplete="off"
        />
      </div>

      {list.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          No articles match “{q}”.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {list.map((a) => (
            <li key={a.number}>
              <Link
                href={`/articles/${a.number}`}
                className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition hover:bg-surface-2"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-base font-semibold text-accent">
                  {a.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{a.title}</span>
                  <span className="block truncate text-xs text-muted">
                    {a.sections.length} section
                    {a.sections.length === 1 ? "" : "s"}
                    {a.intro[0] ? ` · ${a.intro[0].slice(0, 60)}…` : ""}
                  </span>
                </span>
                <ChevronRight
                  width={18}
                  height={18}
                  className="text-muted transition group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}