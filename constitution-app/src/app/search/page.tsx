"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { search, type SearchHit } from "@/lib/data";
import { constitution } from "@/lib/data";
import { SearchIcon, ChevronRight } from "@/components/icons";

const FILTER_KEYS = [
  "article",
  "section",
  "appendix",
  "anthem",
  "bill",
] as const;
type FilterKey = (typeof FILTER_KEYS)[number];
type SearchFiltersType = Record<FilterKey, boolean>;
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "article", label: "Articles" },
  { key: "section", label: "Sections" },
  { key: "appendix", label: "Appendix" },
  { key: "anthem", label: "Anthems" },
  { key: "bill", label: "Bills" },
];

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRe(q)})`, "ig"));
  return (
    <>
      {parts.map((p, i) =>
        p && p.toLowerCase() === q.toLowerCase() ? (
          <mark
            key={i}
            className="rounded bg-accent-soft px-0.5 text-accent"
          >
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function SearchInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQ = params.get("q") || "";
  const [q, setQ] = useState(initialQ);
  const [filters, setFilters] = useState<SearchFiltersType>({
    article: true,
    section: true,
    appendix: true,
    anthem: true,
    bill: true,
  });

  const query = q.trim();
  useEffect(() => {
    const id = setTimeout(() => {
      const next = query ? `/search?q=${encodeURIComponent(query)}` : "/search";
      router.replace(next, { scroll: false });
    }, 250);
    return () => clearTimeout(id);
  }, [query, router]);

  const hits = useMemo(
    () => (query ? search(query, filters) : []),
    [query, filters],
  );
  const anyFilter = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="sr-only">Search</h1>

      <div className="relative">
        <SearchIcon
          width={18}
          height={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input !pl-10 text-base"
          placeholder="Search articles, sections, topics…"
          enterKeyHint="search"
          autoComplete="off"
        />
      </div>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map(({ key, label }) => {
          const active = filters[key];
          return (
            <button
              key={key}
              onClick={() =>
                setFilters((f) => ({ ...f, [key]: !f[key] }))
              }
              className={`chip shrink-0 ${active ? "chip-active" : "chip-idle"}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {!query && (
        <div className="flex flex-col gap-4 py-6">
          <p className="text-sm text-muted">
            Search by article number, keyword, or topic — then filter by content
            type.
          </p>
          <div className="flex flex-wrap gap-2">
            {["election", "finance", "senate", "judiciary", "amendment", "loan"].map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setQ(s)}
                  className="chip chip-idle"
                >
                  {s}
                </button>
              ),
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {constitution.articles.slice(0, 6).map((a) => (
              <Link
                key={a.number}
                href={`/articles/${a.number}`}
                className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 hover:bg-surface-2 transition"
              >
                <span className="rounded-md bg-accent-soft px-2 py-0.5 text-sm font-semibold text-accent">
                  {a.number}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{a.title}</span>
                <ChevronRight width={16} height={16} className="text-muted" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {query && (
        <p className="text-xs text-muted">
          {anyFilter
            ? `${hits.length} result${hits.length === 1 ? "" : "s"} for “${query}”`
            : "No filters selected — turn one on to see results."}
        </p>
      )}

      {query && anyFilter && (
        <ul className="flex flex-col gap-2.5">
          {hits.map((h, i) => (
            <li key={i}>
              <Link
                href={h.href}
                className="group block rounded-2xl border bg-card p-4 transition hover:bg-surface-2"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[0.7rem] font-medium text-muted">
                    {h.kind}
                  </span>
                  <span className="min-w-0 flex-1 font-medium">
                    <Highlight text={h.title} q={query} />
                  </span>
                </div>
                {h.snippet && (
                  <p className="clamp-2 mt-1.5 text-sm text-muted">
                    <Highlight text={h.snippet} q={query} />
                  </p>
                )}
              </Link>
            </li>
          ))}
          {hits.length === 0 && (
            <li className="py-12 text-center text-sm text-muted">
              No matches. Try another term or a filter.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted">Searching…</div>}>
      <SearchInner />
    </Suspense>
  );
}