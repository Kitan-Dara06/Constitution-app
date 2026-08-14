"use client";

import { useEffect } from "react";
import { useApp } from "@/components/AppProviders";

/** Records that a content item was opened (drives "Recently read"). */
export function RecentTracker({ bookKey }: { bookKey: string }) {
  const addRecent = useApp().addRecent;
  useEffect(() => {
    addRecent(bookKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookKey]);
  return null;
}