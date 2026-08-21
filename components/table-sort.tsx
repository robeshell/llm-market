"use client";

import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

export function useTableSort<Key extends string>(
  defaultKey: Key,
  defaultDir: SortDir = "desc",
) {
  const [sortKey, setSortKey] = useState<Key>(defaultKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultDir);

  function toggle(key: Key, initialDir: SortDir = "desc") {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(initialDir);
  }

  return { sortKey, sortDir, toggle };
}

export function compareValues(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
  dir: SortDir,
): number {
  const empty = dir === "asc" ? 1 : -1;
  if (a === null || a === undefined) return empty;
  if (b === null || b === undefined) return -empty;

  let result = 0;
  if (typeof a === "number" && typeof b === "number") {
    result = a - b;
  } else {
    result = String(a).localeCompare(String(b), "zh-CN", {
      numeric: true,
      sensitivity: "base",
    });
  }
  return dir === "asc" ? result : -result;
}

export function sortRows<T>(
  rows: T[],
  sortKey: keyof T,
  sortDir: SortDir,
): T[] {
  return [...rows].sort((a, b) =>
    compareValues(
      a[sortKey] as string | number | null,
      b[sortKey] as string | number | null,
      sortDir,
    ),
  );
}

export function SortableTh({
  label,
  active,
  dir,
  onClick,
  hint,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  hint?: string;
}) {
  const marker = active ? (dir === "asc" ? "↑" : "↓") : "↕";
  const sortState = active
    ? dir === "asc"
      ? "ascending"
      : "descending"
    : "none";

  return (
    <th scope="col" aria-sort={sortState} title={hint}>
      <button
        type="button"
        className="sort-th"
        onClick={onClick}
        title={hint}
        aria-label={hint ? `按${label}排序。${hint}` : `按${label}排序`}
      >
        {label}
        <span
          className={active ? "sort-marker sort-marker-active" : "sort-marker"}
          aria-hidden
        >
          {marker}
        </span>
      </button>
    </th>
  );
}

export function useSortedRows<T, Key extends string>(
  rows: T[],
  defaultKey: Key,
  defaultDir: SortDir,
  getValue: (row: T, key: Key) => string | number | null,
) {
  const { sortKey, sortDir, toggle } = useTableSort(defaultKey, defaultDir);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) =>
      compareValues(getValue(a, sortKey), getValue(b, sortKey), sortDir),
    );
  }, [rows, sortKey, sortDir, getValue]);

  return { sorted, sortKey, sortDir, toggle };
}
