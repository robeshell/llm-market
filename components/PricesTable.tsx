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
import { MenuSelect } from "@/components/MenuSelect";
import { SortableTh, useTableSort, compareValues } from "@/components/table-sort";

type SortKey =
  | "name"
  | "provider"
  | "intelligenceIndex"
  | "contextLength"
  | "inputPerMillion"
  | "outputPerMillion";

const ALL_PROVIDERS = "";

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

/** 价格排序时把 0 / 空值沉底，避免免费模型占满表头看起来像「丢数据」 */
function priceSortValue(value: number | null): number | null {
  if (value === null || Number.isNaN(value) || value === 0) return null;
  return value;
}

function comparePriceRows(
  a: PriceRecord,
  b: PriceRecord,
  key: "inputPerMillion" | "outputPerMillion",
  dir: "asc" | "desc",
): number {
  return compareValues(priceSortValue(a[key]), priceSortValue(b[key]), dir);
}

export function PricesTable({ items }: { items: PriceRecord[] }) {
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState(ALL_PROVIDERS);
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const { sortKey, sortDir, toggle } = useTableSort<SortKey>(
    "intelligenceIndex",
    "desc",
  );

  const providerOptions = useMemo(() => {
    const names = [...new Set(items.map((row) => row.provider))].sort((a, b) =>
      a.localeCompare(b, "zh-CN", { sensitivity: "base" }),
    );
    return [
      { value: ALL_PROVIDERS, label: "全部" },
      ...names.map((name) => ({ value: name, label: name })),
    ];
  }, [items]);

  const currencyOptions = [
    { value: "USD", label: "USD ($)" },
    { value: "CNY", label: "CNY (¥)" },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((row) => {
      if (provider && row.provider !== provider) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.provider.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q)
      );
    });
  }, [items, query, provider]);

  const rows = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortKey === "inputPerMillion" || sortKey === "outputPerMillion") {
        const byPrice = comparePriceRows(a, b, sortKey, sortDir);
        if (byPrice !== 0) return byPrice;
        return compareValues(
          a.intelligenceIndex,
          b.intelligenceIndex,
          "desc",
        );
      }
      return compareValues(valueOf(a, sortKey), valueOf(b, sortKey), sortDir);
    });
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
            placeholder="筛选模型"
            autoComplete="off"
          />
          <MenuSelect
            id="price-provider"
            label="厂商"
            value={provider}
            options={providerOptions}
            onChange={setProvider}
          />
          <MenuSelect
            id="price-currency"
            label="币种"
            value={currency}
            options={currencyOptions}
            onChange={(next) => setCurrency(next as CurrencyCode)}
          />
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
                onClick={() => toggle("inputPerMillion", "desc")}
              />
              <SortableTh
                label="输出"
                active={sortKey === "outputPerMillion"}
                dir={sortDir}
                onClick={() => toggle("outputPerMillion", "desc")}
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
