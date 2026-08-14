"use client";

import Link from "next/link";
import { useApp } from "@/components/AppProviders";
import { resolveKey } from "@/lib/content-key";
import { BookmarkIcon, ChevronRight } from "@/components/icons";

function Row({ bookKey }: { bookKey: string }) {
  const r = resolveKey(bookKey);
  if (!r) return null;
  return (
    <Link
      href={r.href}
      className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 transition hover:bg-surface-2"
    >
      <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[0.7rem] font-medium text-muted">
        {r.kind}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{r.title}</span>
        <span className="block truncate text-xs text-muted">{r.subtitle}</span>
      </span>
      <ChevronRight width={16} height={16} />
    </Link>
  );
}

export function HomeLibrary() {
  const { recents, bookmarks } = useApp();

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <section>
        <h2 className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted">
          Recently read
        </h2>
        {recents.length ? (
          <div className="flex flex-col gap-2">
            {recents.slice(0, 5).map((k) => (
              <Row key={k} bookKey={k} />
            ))}
          </div>
        ) : (
          <div className="card flex items-center gap-3 p-4 text-sm text-muted">
            <span>Articles you open show up here.</span>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted">
          Bookmarks
        </h2>
        {bookmarks.length ? (
          <div className="flex flex-col gap-2">
            {bookmarks.slice(0, 5).map((k) => (
              <Row key={k} bookKey={k} />
            ))}
            {bookmarks.length > 5 && (
              <Link
                href="/bookmarks"
                className="self-start text-sm text-accent hover:underline"
              >
                View all {bookmarks.length} →
              </Link>
            )}
          </div>
        ) : (
          <div className="card flex items-center gap-3 p-4 text-sm text-muted">
            <BookmarkIcon width={18} height={18} />
            <span>Tap “Save” on any article to keep it here.</span>
          </div>
        )}
      </section>
    </div>
  );
}