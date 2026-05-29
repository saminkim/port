"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Persists a string to localStorage. Returns [value, setValue, hydrated].
 * Waits until after mount to read/write storage to avoid hydration mismatches.
 */
export function useLocalStorageString(
  key: string,
  initialValue: string,
): [string, (next: string) => void, boolean] {
  const [value, setValueState] = useState(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) setValueState(stored);
    } catch {
      // ignore quota / private mode
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }, [hydrated, key, value]);

  const setValue = useCallback((next: string) => {
    setValueState(next);
  }, []);

  return [value, setValue, hydrated];
}
