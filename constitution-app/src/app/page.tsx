import Link from "next/link";
import { categories } from "@/lib/data";
import { HomeLibrary } from "@/components/HomeLibrary";
import { SearchIcon, ChevronRight, ScaleIcon, ListIcon } from "@/components/icons";

export default function HomePage() {
  const cats = categories();

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <section className="flex flex-col gap-3 pt-2">
        <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-accent">
          Federal University of Agriculture, Abeokuta
        </span>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          The 2019 Revised Constitution of FUNAABSU
        </h1>
        <p className="text-sm text-muted">
          The Student Union Constitution — readable, searchable, and always in
          your pocket.
        </p>
      </section>

      {/* Search */}
      <form action="/search" role="search" className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon
            width={18}
            height={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            name="q"
            className="input !pl-10"
            placeholder="Search articles, sections or keywords…"
            enterKeyHint="search"
            autoComplete="off"
          />
        </div>
        <button type="submit" className="btn-primary shrink-0">
          Search
        </button>
      </form>

      {/* Categories */}
      <section>
        <h2 className="mb-3 text-[0.7rem] font-semibold uppercase tracking-wider text-muted">
          Browse
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {cats.map((c) => (
            <Link
              key={c.key}
              href={c.href}
              className={`group flex items-center gap-3 rounded-2xl border p-4 transition hover:bg-surface-2 ${
                c.accent ? "bg-accent-soft/60 border-accent/30" : "bg-card"
              }`}
            >
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                  c.accent ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted"
                }`}
              >
                {c.key === "articles" ? (
                  <ListIcon width={20} height={20} />
                ) : c.key === "preamble" ? (
                  <ScaleIcon width={20} height={20} />
                ) : (
                  <ChevronRight width={20} height={20} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-medium">{c.label}</span>
                  {typeof c.count === "number" && (
                    <span className="rounded-full bg-surface-2 px-2 text-[0.7rem] text-muted">
                      {c.count}
                    </span>
                  )}
                </span>
                <span className="block truncate text-xs text-muted">
                  {c.blurb}
                </span>
              </span>
              <ChevronRight
                width={18}
                height={18}
                className="text-muted transition group-hover:translate-x-0.5"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Recently read / Bookmarks */}
      <section>
        <HomeLibrary />
      </section>
    </div>
  );
}