"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import type { ContentKey } from "@/lib/content-key";

type ThemeChoice = "light" | "dark" | "system";

interface AppContextValue {
  // settings
  theme: ThemeChoice;
  setTheme: (t: ThemeChoice) => void;
  resolvedDark: boolean;
  fontScale: number;
  setFontScale: (n: number) => void;
  // library
  bookmarks: ContentKey[];
  toggleBookmark: (key: ContentKey) => void;
  isBookmarked: (key: ContentKey) => boolean;
  notes: Record<ContentKey, string>;
  setNote: (key: ContentKey, text: string) => void;
  recents: ContentKey[];
  addRecent: (key: ContentKey) => void;
  clearLibrary: () => void;
  hydrated: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export const FONT_SCALES: { label: string; value: number }[] = [
  { label: "S", value: 0.9 },
  { label: "M", value: 1 },
  { label: "L", value: 1.15 },
  { label: "XL", value: 1.32 },
];
const MAX_RECENTS = 8;

export function AppProviders({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage<ThemeChoice>("cc:theme", "system");
  const [fontScale, setFontScale] = useLocalStorage<number>("cc:fs", 1);
  const [bookmarks, setBookmarks] = useLocalStorage<ContentKey[]>(
    "cc:bookmarks",
    [],
  );
  const [notes, setNotes] = useLocalStorage<Record<string, string>>(
    "cc:notes",
    {},
  );
  const [recents, setRecents] = useLocalStorage<ContentKey[]>("cc:recents", []);

  // Resolve system pref + apply .dark class on <html>.
  const resolvedDark = useMemo(() => {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedDark);
    root.style.colorScheme = resolvedDark ? "dark" : "light";
  }, [resolvedDark]);

  // Keep "system" in sync if the OS preference flips.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      document.documentElement.classList.toggle("dark", mq.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  // Apply font scale globally.
  useEffect(() => {
    document.documentElement.style.setProperty("--fs", String(fontScale));
  }, [fontScale]);

  const toggleBookmark = useCallback(
    (key: ContentKey) => {
      setBookmarks((cur) =>
        cur.includes(key) ? cur.filter((k) => k !== key) : [key, ...cur],
      );
    },
    [setBookmarks],
  );
  const isBookmarked = useCallback(
    (key: ContentKey) => bookmarks.includes(key),
    [bookmarks],
  );

  const setNote = useCallback(
    (key: ContentKey, text: string) => {
      setNotes((cur) => {
        const next = { ...cur };
        if (text.trim()) next[key] = text;
        else delete next[key];
        return next;
      });
    },
    [setNotes],
  );

  const addRecent = useCallback(
    (key: ContentKey) => {
      setRecents((cur) => {
        const next = [key, ...cur.filter((k) => k !== key)];
        return next.slice(0, MAX_RECENTS);
      });
    },
    [setRecents],
  );

  const clearLibrary = useCallback(() => {
    setBookmarks([]);
    setNotes({});
    setRecents([]);
  }, [setBookmarks, setNotes, setRecents]);

  const value: AppContextValue = {
    theme,
    setTheme,
    resolvedDark,
    fontScale,
    setFontScale,
    bookmarks,
    toggleBookmark,
    isBookmarked,
    notes,
    setNote,
    recents,
    addRecent,
    clearLibrary,
    hydrated: true,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProviders");
  return ctx;
}