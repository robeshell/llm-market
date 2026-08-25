"use client";

import { useMemo, useState } from "react";
import type { CatalogModel } from "@/lib/model-catalog";
import type { PopularRecord } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { formatPricePerMillion } from "@/lib/currency";
import { logoForProvider } from "@/lib/vendors";
import { CompareToggle } from "@/components/CompareControls";
import { VendorBadge } from "@/components/VendorBadge";
import {
  RankingPosterExport,
  type RankingPosterRow,
} from "@/components/RankingPosterExport";

const MODALITY_LABELS: Record<string, string> = {
  text: "文本",
  image: "图像",
  audio: "音频",
  video: "视频",
  file: "文件",
  embeddings: "向量",
};

function normalizeKey(value: string): string {
  return value
    .split("/")
    .pop()!
    .toLowerCase()
    .replace(/:free$/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function buildCatalogIndex(catalog: CatalogModel[]) {
  const index = new Map<string, CatalogModel>();
  for (const model of catalog) {
    for (const value of [model.slug, model.name]) {
      const key = normalizeKey(value);
      if (key && !index.has(key)) index.set(key, model);
    }
  }
  return index;
}

function modalityLabel(model: PopularRecord): string {
  const values = [
    ...model.inputModalities,
    ...model.outputModalities,
  ];
  const labels = [...new Set(values)].map(
    (value) => MODALITY_LABELS[value] ?? value,
  );
  return labels.length > 0 ? labels.join(" · ") : "—";
}

function pricePair(model: PopularRecord): string {
  return `${formatPricePerMillion(model.inputPerMillion)} / ${formatPricePerMillion(model.outputPerMillion)}`;
}

export function PopularityTable({
  items,
  catalog,
  updatedAt,
  source,
}: {
  items: PopularRecord[];
  catalog: CatalogModel[];
  updatedAt: string;
  source: string;
}) {
  const [query, setQuery] = useState("");
  const catalogIndex = useMemo(() => buildCatalogIndex(catalog), [catalog]);
  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      if (!normalizedQuery) return true;
      return [item.name, item.provider, item.id].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [items, query]);

  const posterRows = useMemo<RankingPosterRow[]>(
    () =>
      rows.slice(0, 8).map((item) => ({
        rank: item.rank,
        name: item.name,
        provider: item.provider,
        value: "",
        valueLabel: "",
      })),
    [rows],
  );

  return (
    <div className="model-directory">
      <div className="directory-toolbar">
        <label className="sr-only" htmlFor="popularity-filter">
          筛选模型
        </label>
        <input
          id="popularity-filter"
          className="field directory-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索模型或厂商"
          autoComplete="off"
        />
        <p className="directory-count num" role="status" aria-live="polite">
          {rows.length} / {items.length}
        </p>
        <RankingPosterExport
          rows={posterRows}
          title="热门模型使用榜"
          scopeLabel="OpenRouter · 近 7 天"
          dimensionLabel=""
          updatedAt={updatedAt}
          source={source}
          description="按 OpenRouter 近 7 天使用排行生成，适合发到 X / 推特和朋友圈。"
        />
      </div>

      <div className="table-shell">
        <table className="data-table popular-table" aria-labelledby="page-title">
          <caption>OpenRouter 模型使用排行</caption>
          <colgroup>
            <col className="popular-col-index" />
            <col className="popular-col-model" />
            <col className="popular-col-provider" />
            <col className="popular-col-score" />
            <col className="popular-col-price" />
            <col className="popular-col-context" />
            <col className="popular-col-modality" />
            <col className="popular-col-compare" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="model-index-heading">序</th>
              <th scope="col">模型</th>
              <th scope="col">厂商</th>
              <th scope="col">综合</th>
              <th scope="col">输入 / 输出</th>
              <th scope="col">上下文</th>
              <th scope="col">模态</th>
              <th scope="col">对比</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const matched =
                catalogIndex.get(normalizeKey(item.canonicalSlug)) ??
                catalogIndex.get(normalizeKey(item.id)) ??
                catalogIndex.get(normalizeKey(item.name));
              return (
                <tr key={item.id}>
                  <td className="model-index num">{item.rank}</td>
                  <td className="model-cell">
                    <span className="cell-name text-foreground">{item.name}</span>
                    <span className="model-family-slug">{item.id}</span>
                  </td>
                  <td className="pr-4 text-muted-foreground">
                    <VendorBadge
                      name={item.provider}
                      logoSrc={logoForProvider(item.providerSlug)}
                    />
                  </td>
                  <td className="pr-4 num text-foreground">
                    {formatNumber(matched?.intelligenceIndex ?? null)}
                  </td>
                  <td className="pr-4 num text-muted-foreground">
                    {pricePair(item)}
                  </td>
                  <td className="pr-4 num text-muted-foreground">
                    {item.contextLength
                      ? item.contextLength.toLocaleString("en-US")
                      : "—"}
                  </td>
                  <td className="pr-4 text-muted-foreground">
                    {modalityLabel(item)}
                  </td>
                  <td>
                    {matched ? (
                      <CompareToggle
                        model={{
                          slug: matched.slug,
                          name: matched.name,
                          provider: matched.provider,
                        }}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="directory-empty">
                  没有匹配的模型。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="directory-footnote">
        价格来自 OpenRouter 路由，可能与模型官方 API 价格不同；排行仅代表 OpenRouter 流量。
      </p>
    </div>
  );
}
