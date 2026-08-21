"use client";

import { useMemo, useState } from "react";
import type { RankingRecord } from "@/lib/types";
import { formatNumber, formatScore } from "@/lib/format";
import {
  BENCHMARK_META,
  type BenchmarkKey,
} from "@/lib/benchmarks";
import { logoForCreator } from "@/lib/vendors";
import { VendorBadge } from "@/components/VendorBadge";
import { SortableTh, useTableSort, compareValues } from "@/components/table-sort";
import { RankingsMetricGuide } from "@/components/RankingsMetricGuide";

type SortKey =
  | "rank"
  | "shortName"
  | "creator"
  | BenchmarkKey;

function valueOf(row: RankingRecord, key: SortKey): string | number | null {
  return row[key];
}

const headers: { key: SortKey; label: string; hint?: string }[] = [
  { key: "rank", label: "#" },
  { key: "shortName", label: "模型" },
  { key: "creator", label: "厂商" },
  {
    key: "intelligenceIndex",
    label: BENCHMARK_META.intelligenceIndex.label,
    hint: BENCHMARK_META.intelligenceIndex.summary,
  },
  {
    key: "codingIndex",
    label: BENCHMARK_META.codingIndex.label,
    hint: BENCHMARK_META.codingIndex.summary,
  },
  {
    key: "agenticIndex",
    label: BENCHMARK_META.agenticIndex.label,
    hint: BENCHMARK_META.agenticIndex.summary,
  },
  {
    key: "gpqa",
    label: BENCHMARK_META.gpqa.label,
    hint: BENCHMARK_META.gpqa.summary,
  },
  {
    key: "hle",
    label: BENCHMARK_META.hle.label,
    hint: BENCHMARK_META.hle.summary,
  },
  {
    key: "scicode",
    label: BENCHMARK_META.scicode.label,
    hint: BENCHMARK_META.scicode.summary,
  },
  {
    key: "terminalbench",
    label: BENCHMARK_META.terminalbench.label,
    hint: BENCHMARK_META.terminalbench.summary,
  },
  {
    key: "lcr",
    label: BENCHMARK_META.lcr.label,
    hint: BENCHMARK_META.lcr.summary,
  },
];

export function RankingsTable({ items }: { items: RankingRecord[] }) {
  const [query, setQuery] = useState("");
  const { sortKey, sortDir, toggle } = useTableSort<SortKey>("rank", "asc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (row) =>
        row.shortName.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.creator.toLowerCase().includes(q),
    );
  }, [items, query]);

  const rows = useMemo(() => {
    return [...filtered].sort((a, b) =>
      compareValues(valueOf(a, sortKey), valueOf(b, sortKey), sortDir),
    );
  }, [filtered, sortKey, sortDir]);

  return (
    <div className="space-y-4">
      <RankingsMetricGuide />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="sr-only" htmlFor="rank-filter">
          筛选
        </label>
        <input
          id="rank-filter"
          className="field"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="筛选模型或厂商"
          autoComplete="off"
        />
        <p
          className="text-sm text-muted-foreground num"
          role="status"
          aria-live="polite"
        >
          {rows.length} / {items.length}
        </p>
      </div>

      <div className="table-shell">
        <table className="data-table" aria-labelledby="page-title">
          <caption>模型跑分排行列表</caption>
          <thead>
            <tr>
              {headers.map((h) => (
                <SortableTh
                  key={h.key}
                  label={h.label}
                  hint={h.hint}
                  active={sortKey === h.key}
                  dir={sortDir}
                  onClick={() =>
                    toggle(
                      h.key,
                      h.key === "shortName" || h.key === "creator"
                        ? "asc"
                        : h.key === "rank"
                          ? "asc"
                          : "desc",
                    )
                  }
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.rank}-${row.slug}`}>
                <td className="pr-4 num text-muted-foreground">{row.rank}</td>
                <td className="cell-name pr-4 text-foreground">
                  {row.shortName}
                </td>
                <td className="pr-4 text-muted-foreground">
                  <VendorBadge
                    name={row.creator}
                    logoSrc={logoForCreator(row.creator, row.creatorLogo)}
                  />
                </td>
                <td className="pr-4 num text-foreground">
                  {formatNumber(row.intelligenceIndex)}
                </td>
                <td className="pr-4 num text-muted-foreground">
                  {formatNumber(row.codingIndex)}
                </td>
                <td className="pr-4 num text-muted-foreground">
                  {formatNumber(row.agenticIndex)}
                </td>
                <td className="pr-4 num text-muted-foreground">
                  {formatScore(row.gpqa)}
                </td>
                <td className="pr-4 num text-muted-foreground">
                  {formatScore(row.hle)}
                </td>
                <td className="pr-4 num text-muted-foreground">
                  {formatScore(row.scicode)}
                </td>
                <td className="pr-4 num text-muted-foreground">
                  {formatScore(row.terminalbench)}
                </td>
                <td className="num text-muted-foreground">
                  {formatScore(row.lcr)}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-10 text-muted-foreground">
                  无匹配
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
