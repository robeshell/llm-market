"use client";

import { useMemo, useState } from "react";
import type { PriceRecord } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import {
  DEFAULT_CURRENCY,
  type CurrencyCode,
  currencySymbol,
  formatPricePerMillion,
} from "@/lib/currency";
import { logoForCreator } from "@/lib/vendors";
import { VendorBadge } from "@/components/VendorBadge";
import { SortableTh, useTableSort, compareValues } from "@/components/table-sort";

type SortKey =
  | "name"
  | "provider"
  | "intelligenceIndex"
  | "contextLength"
  | "inputPerMillion"
  | "outputPerMillion";

function valueOf(row: PriceRecord, key: SortKey): string | number | null {
  switch (key) {
    case "name":
      return row.name;
    case "provider":
      return row.provider;
    case "intelligenceIndex":
      return row.intelligenceIndex;
    case "contextLength":
      return row.contextLength;
    case "inputPerMillion":
      return row.inputPerMillion;
    case "outputPerMillion":
      return row.outputPerMillion;
  }
}

export function PricesTable({ items }: { items: PriceRecord[] }) {
  const [query, setQuery] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const { sortKey, sortDir, toggle } = useTableSort<SortKey>(
    "intelligenceIndex",
    "desc",
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.provider.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q),
    );
  }, [items, query]);

  const rows = useMemo(() => {
    return [...filtered].sort((a, b) =>
      compareValues(valueOf(a, sortKey), valueOf(b, sortKey), sortDir),
    );
  }, [filtered, sortKey, sortDir]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="price-filter">
            筛选
          </label>
          <input
            id="price-filter"
            className="field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="筛选模型或厂商"
            autoComplete="off"
          />
          <label className="currency-label" htmlFor="price-currency">
            币种
          </label>
          <select
            id="price-currency"
            className="currency-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
          >
            <option value="USD">USD ($)</option>
            <option value="CNY">CNY (¥)</option>
          </select>
        </div>
        <p
          className="text-sm text-muted-foreground num"
          role="status"
          aria-live="polite"
        >
          {rows.length} / {items.length} · {currencySymbol(currency)}/M tokens
        </p>
      </div>

      <div className="table-shell">
        <table className="data-table" aria-labelledby="page-title">
          <caption>模型价格列表</caption>
          <thead>
            <tr>
              <SortableTh
                label="模型"
                active={sortKey === "name"}
                dir={sortDir}
                onClick={() => toggle("name", "asc")}
              />
              <SortableTh
                label="厂商"
                active={sortKey === "provider"}
                dir={sortDir}
                onClick={() => toggle("provider", "asc")}
              />
              <SortableTh
                label="综合"
                active={sortKey === "intelligenceIndex"}
                dir={sortDir}
                onClick={() => toggle("intelligenceIndex", "desc")}
              />
              <SortableTh
                label="上下文"
                active={sortKey === "contextLength"}
                dir={sortDir}
                onClick={() => toggle("contextLength", "desc")}
              />
              <SortableTh
                label="输入"
                active={sortKey === "inputPerMillion"}
                dir={sortDir}
                onClick={() => toggle("inputPerMillion", "asc")}
              />
              <SortableTh
                label="输出"
                active={sortKey === "outputPerMillion"}
                dir={sortDir}
                onClick={() => toggle("outputPerMillion", "asc")}
              />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="cell-name pr-4 text-foreground">{row.name}</td>
                <td className="pr-4 text-muted-foreground">
                  <VendorBadge
                    name={row.provider}
                    logoSrc={logoForCreator(row.provider, row.creatorLogo)}
                  />
                </td>
                <td className="pr-4 num text-muted-foreground">
                  {formatNumber(row.intelligenceIndex)}
                </td>
                <td className="pr-4 num text-muted-foreground">
                  {row.contextLength
                    ? row.contextLength.toLocaleString("en-US")
                    : "—"}
                </td>
                <td className="pr-4 num text-foreground">
                  {formatPricePerMillion(row.inputPerMillion, currency)}
                </td>
                <td className="num text-foreground">
                  {formatPricePerMillion(row.outputPerMillion, currency)}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-muted-foreground">
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
