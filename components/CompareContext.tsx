"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

export const MAX_COMPARE_MODELS = 4;

export type CompareItem = {
  slug: string;
  name: string;
  provider: string;
};

type CompareContextValue = {
  items: CompareItem[];
  canAdd: boolean;
  isSelected: (slug: string) => boolean;
  toggle: (item: CompareItem) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "llm-model-comparison.selection";
const EMPTY_SNAPSHOT = "[]";
const subscribers = new Set<() => void>();
const CompareContext = createContext<CompareContextValue | null>(null);

function parseItems(snapshot: string): CompareItem[] {
  try {
    const parsed = JSON.parse(snapshot);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is CompareItem =>
          item &&
          typeof item.slug === "string" &&
          typeof item.name === "string" &&
          typeof item.provider === "string",
      )
      .slice(0, MAX_COMPARE_MODELS);
  } catch {
    return [];
  }
}

function getSnapshot() {
  if (typeof window === "undefined") return EMPTY_SNAPSHOT;
  return window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_SNAPSHOT;
}

function subscribe(callback: () => void) {
  subscribers.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    subscribers.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function writeItems(items: CompareItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore unavailable local storage.
  }
  subscribers.forEach((callback) => callback());
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => EMPTY_SNAPSHOT,
  );
  const items = useMemo(() => parseItems(snapshot), [snapshot]);

  const value = useMemo<CompareContextValue>(
    () => ({
      items,
      canAdd: items.length < MAX_COMPARE_MODELS,
      isSelected: (slug) => items.some((item) => item.slug === slug),
      toggle: (item) => {
        if (items.some((selected) => selected.slug === item.slug)) {
          writeItems(items.filter((selected) => selected.slug !== item.slug));
          return;
        }
        if (items.length >= MAX_COMPARE_MODELS) return;
        writeItems([...items, item]);
      },
      remove: (slug) => {
        writeItems(items.filter((item) => item.slug !== slug));
      },
      clear: () => writeItems([]),
    }),
    [items],
  );

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const value = useContext(CompareContext);
  if (!value) {
    throw new Error("useCompare must be used inside CompareProvider");
  }
  return value;
}
