"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * SSR-safe localStorage state. Reads after mount (no hydration mismatch),
 * persists on change, and stays in sync across tabs via the `storage` event.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const keyRef = useRef(key);
  keyRef.current = key;

  // Read once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore corrupt/missing */
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Write on change (after hydration so we don't overwrite stored value).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota / private mode */
    }
  }, [key, value, hydrated]);

  // Cross-tab sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== keyRef.current) return;
      try {
        setValue(e.newValue == null ? initial : (JSON.parse(e.newValue) as T));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback((next: T | ((prev: T) => T)) => {
    setValue((cur) =>
      typeof next === "function" ? (next as (p: T) => T)(cur) : next,
    );
  }, []);

  return [value, update, hydrated] as const;
}