"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/AppProviders";
import { resolveKey } from "@/lib/content-key";
import {
  BookmarkIcon,
  ChevronRight,
  NoteIcon,
  CloseIcon,
} from "@/components/icons";

export default function BookmarksPage() {
  const { bookmarks, toggleBookmark, notes, setNote } = useApp();
  const [openNote, setOpenNote] = useState<string | null>(null);

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-xl font-semibold tracking-tight">Saved</h1>
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-muted">
            <BookmarkIcon width={22} height={22} />
          </span>
          <p className="text-sm text-muted">
            Nothing saved yet. Tap the <strong>Save</strong> button on any article
            to keep it here.
          </p>
          <Link href="/articles" className="btn-outline">
            Browse articles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Saved</h1>
          <p className="text-sm text-muted">
            {bookmarks.length} bookmarked · notes stored on this device
          </p>
        </div>
      </header>

      <ul className="flex flex-col gap-2.5">
        {bookmarks.map((key) => {
          const r = resolveKey(key);
          if (!r) return null;
          const noteOpen = openNote === key;
          return (
            <li key={key} className="card p-4">
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[0.7rem] font-medium text-muted">
                  {r.kind}
                </span>
                <Link
                  href={r.href}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-medium hover:text-accent transition">
                    {r.title}
                  </p>
                  <p className="truncate text-xs text-muted">{r.subtitle}</p>
                </Link>
                <button
                  onClick={() => setOpenNote(noteOpen ? null : key)}
                  className={`btn-ghost !p-2 ${notes[key] ? "text-accent" : ""}`}
                  aria-label="Add note"
                  title="Note"
                >
                  <NoteIcon width={18} height={18} />
                </button>
                <button
                  onClick={() => toggleBookmark(key)}
                  className="btn-ghost !p-2 text-muted"
                  aria-label="Remove bookmark"
                  title="Remove"
                >
                  <CloseIcon width={18} height={18} />
                </button>
              </div>

              {noteOpen && (
                <div className="mt-3 animate-fadeIn">
                  <textarea
                    value={notes[key] || ""}
                    onChange={(e) => setNote(key, e.target.value)}
                    placeholder="Add a private note…"
                    className="input min-h-[80px] resize-y"
                  />
                  <p className="mt-1 text-[0.7rem] text-muted">
                    Notes live only on this device.
                  </p>
                </div>
              )}
              {!noteOpen && notes[key] && (
                <p className="clamp-2 mt-2 text-sm text-muted">{notes[key]}</p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-end text-muted">
        <Link href="/settings" className="text-sm hover:text-fg transition">
          Clear all data in Settings →
        </Link>
      </div>
    </div>
  );
}