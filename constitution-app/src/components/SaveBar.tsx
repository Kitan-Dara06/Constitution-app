"use client";

import Link from "next/link";
import { useApp } from "@/components/AppProviders";
import { BookmarkIcon, NoteIcon } from "@/components/icons";

export function SaveBar({ bookKey }: { bookKey: string }) {
  const { isBookmarked, toggleBookmark, notes } = useApp();
  const saved = isBookmarked(bookKey);
  const hasNote = Boolean(notes[bookKey]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => toggleBookmark(bookKey)}
        className={saved ? "btn-primary" : "btn-outline"}
        aria-pressed={saved}
      >
        <BookmarkIcon width={16} height={16} filled={saved} />
        {saved ? "Saved" : "Save"}
      </button>
      {hasNote && (
        <Link href="/bookmarks" className="btn-ghost" aria-label="You have a note">
          <NoteIcon width={16} height={16} />
        </Link>
      )}
    </div>
  );
}