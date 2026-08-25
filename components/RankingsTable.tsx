"use client";

import { useMemo, useState } from "react";
import type { CatalogModel, CatalogType } from "@/lib/model-catalog";
import type { RankingRecord } from "@/lib/types";
import {
  BENCHMARK_META,
  type BenchmarkKey,
} from "@/lib/benchmarks";
import { formatNumber, formatScore } from "@/lib/format";
import { logoForCreator } from "@/lib/vendors";
import { VendorBadge } from "@/components/VendorBadge";
import { MenuSelect } from "@/components/MenuSelect";
import { CompareToggle } from "@/components/CompareControls";
import { RankingsMetricGuide } from "@/components/RankingsMetricGuide";
import {
  RankingPosterExport,
  type RankingPosterRow,
} from "@/components/RankingPosterExport";
import {
  CATALOG_TYPE_OPTIONS,
  matchesCatalogType,
  variantLabelFromName,
} from "@/lib/model-catalog";
import {
  SortableTh,
  compareValues,
  type SortDir,
} from "@/components/table-sort";

type RankingScope = "featured" | "mainstream" | "all";
type RankingDimension =
  | "intelligenceIndex"
  | "codingIndex"
  | "agenticIndex"
  | "lcr";
type SortKey = "shortName" | "creator" | "current" | "intelligenceIndex";

type RankingEntry = {
  ranking: RankingRecord;
  catalog: CatalogModel | undefined;
  familyKey: string;
  familyLabel: string;
};

type RankingFamily = {
  key: string;
  label: string;
  representative: RankingEntry;
  variants: RankingEntry[];
};

const SCOPE_OPTIONS: { key: RankingScope; label: string }[] = [
  { key: "featured", label: "精选" },
  { key: "mainstream", label: "主流" },
  { key: "all", label: "全部" },
];

const DIMENSION_OPTIONS: {
  key: RankingDimension;
  label: string;
}[] = [
  { key: "intelligenceIndex", label: "AA 综合" },
  { key: "codingIndex", label: "编程" },
  { key: "agenticIndex", label: "Agent" },
  { key: "lcr", label: "长上下文" },
];

const DETAIL_KEYS: BenchmarkKey[] = [
  "intelligenceIndex",
  "codingIndex",
  "agenticIndex",
  "gpqa",
  "hle",
  "scicode",
  "terminalbench",
  "lcr",
];

function scoreOf(
  entry: RankingEntry,
  dimension: RankingDimension,
): number | null {
  return entry.ranking[dimension];
}

function compareEntries(
  a: RankingEntry,
  b: RankingEntry,
  dimension: RankingDimension,
): number {
  const scoreResult = compareValues(
    scoreOf(a, dimension),
    scoreOf(b, dimension),
    "desc",
  );
  if (scoreResult !== 0) return scoreResult;

  const intelligenceResult = compareValues(
    a.ranking.intelligenceIndex,
    b.ranking.intelligenceIndex,
    "desc",
  );
  if (intelligenceResult !== 0) return intelligenceResult;
  return a.ranking.rank - b.ranking.rank;
}

function buildEntries(
  items: RankingRecord[],
  catalog: CatalogModel[],
): RankingEntry[] {
  const catalogBySlug = new Map(catalog.map((model) => [model.slug, model]));
  return items.map((ranking) => {
    const model = catalogBySlug.get(ranking.slug);
    return {
      ranking,
      catalog: model,
      familyKey: model?.familyKey ?? ranking.slug,
      familyLabel: model?.family ?? ranking.shortName,
    };
  });
}

function matchesScope(entry: RankingEntry, scope: RankingScope): boolean {
  if (scope === "all") return true;
  if (!entry.catalog) return false;
  return scope === "featured"
    ? entry.catalog.isFeatured
    : entry.catalog.isMainstream;
}

function groupEntries(
  entries: RankingEntry[],
  dimension: RankingDimension,
): RankingFamily[] {
  const grouped = new Map<string, RankingEntry[]>();
  for (const entry of entries) {
    const current = grouped.get(entry.familyKey) ?? [];
    current.push(entry);
    grouped.set(entry.familyKey, current);
  }

  return [...grouped.entries()]
    .map(([key, variants]) => {
      const sorted = [...variants].sort((a, b) =>
        compareEntries(a, b, dimension),
      );
      return {
        key,
        label: sorted[0]?.familyLabel ?? key,
        representative: sorted[0],
        variants: sorted,
      };
    })
    .sort((a, b) =>
      compareEntries(a.representative, b.representative, dimension),
    );
}

function valueForSort(
  entry: RankingEntry,
  sortKey: SortKey,
  dimension: RankingDimension,
): string | number | null {
  if (sortKey === "shortName") return entry.ranking.shortName;
  if (sortKey === "creator") return entry.ranking.creator;
  if (sortKey === "current") return scoreOf(entry, dimension);
  return entry.ranking.intelligenceIndex;
}

function DetailMetrics({ entry }: { entry: RankingEntry }) {
  return (
    <div className="ranking-detail-grid">
      {DETAIL_KEYS.map((key) => {
        const value = entry.ranking[key];
        const formatted =
          key === "intelligenceIndex" ||
          key === "codingIndex" ||
          key === "agenticIndex"
            ? formatNumber(value)
            : formatScore(value);
        return (
          <div key={key} className="ranking-detail-item">
            <span>{BENCHMARK_META[key].label}</span>
            <strong className="num">{formatted}</strong>
          </div>
        );
      })}
    </div>
  );
}

function RankingEntryRow({
  entry,
  family,
  index,
  dimension,
  variant,
  detailsOpen,
  onToggleDetails,
}: {
  entry: RankingEntry;
  family: RankingFamily;
  index: number;
  dimension: RankingDimension;
  variant: boolean;
  detailsOpen: boolean;
  onToggleDetails: () => void;
}) {
  const showOverallColumn = dimension !== "intelligenceIndex";

  return (
    <>
      <tr className={variant ? "model-variant-row" : "model-family-row"}>
        <td className="model-index num">{variant ? "" : index + 1}</td>
        <td className={variant ? "model-cell model-cell-variant" : "model-cell"}>
          <div className="model-name-line">
            {variant ? <span className="model-variant-mark" aria-hidden /> : null}
            <span className="cell-name text-foreground">
              {variant
                ? variantLabelFromName(entry.ranking.shortName, family.label)
                : family.label}
            </span>
          </div>
          <span className="model-family-slug">
            {variant ? null : "单一版本"}
          </span>
        </td>
        <td className="pr-4 text-muted-foreground">
          <VendorBadge
            name={entry.ranking.creator}
            logoSrc={logoForCreator(entry.ranking.creator, entry.ranking.creatorLogo)}
          />
        </td>
        <td className="pr-4 num text-foreground">
          {formatNumber(scoreOf(entry, dimension))}
        </td>
        {showOverallColumn ? (
          <td className="pr-4 num text-muted-foreground">
            {formatNumber(entry.ranking.intelligenceIndex)}
          </td>
        ) : null}
        <td>
          <button
            type="button"
            className="ranking-detail-toggle"
            aria-expanded={detailsOpen}
            onClick={onToggleDetails}
          >
            {detailsOpen ? "收起 ←" : "指标 →"}
          </button>
        </td>
        <td>
          <CompareToggle
            model={{
              slug: entry.ranking.slug,
              name: entry.ranking.shortName,
              provider: entry.ranking.creator,
            }}
          />
        </td>
      </tr>
      {detailsOpen ? (
        <tr className="ranking-detail-row">
          <td colSpan={showOverallColumn ? 7 : 6}>
            <DetailMetrics entry={entry} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function FamilyRankingRows({
  family,
  index,
  dimension,
  familyOpen,
  detailsOpen,
  onToggleFamily,
  onToggleDetails,
}: {
  family: RankingFamily;
  index: number;
  dimension: RankingDimension;
  familyOpen: boolean;
  detailsOpen: Set<string>;
  onToggleFamily: () => void;
  onToggleDetails: (slug: string) => void;
}) {
  const representative = family.representative;
  const hasVariants = family.variants.length > 1;
  const showOverallColumn = dimension !== "intelligenceIndex";
  const representativeDetailsOpen = detailsOpen.has(
    representative.ranking.slug,
  );

  return (
    <>
      <tr className="model-family-row">
        <td className="model-index num">{index + 1}</td>
        <td className="model-cell">
          <div className="model-name-line">
            {hasVariants ? (
              <button
                type="button"
                className="family-toggle"
                aria-expanded={familyOpen}
                aria-label={`${familyOpen ? "收起" : "展开"}${family.label}的版本`}
                onClick={onToggleFamily}
              >
                {familyOpen ? "−" : "+"}
              </button>
            ) : (
              <span className="family-toggle-placeholder" aria-hidden />
            )}
            <span className="cell-name text-foreground">{family.label}</span>
          </div>
          <span className="model-family-slug">
            {hasVariants ? `${family.variants.length} 个版本` : "单一版本"}
          </span>
        </td>
        <td className="pr-4 text-muted-foreground">
          <VendorBadge
            name={representative.ranking.creator}
            logoSrc={logoForCreator(
              representative.ranking.creator,
              representative.ranking.creatorLogo,
            )}
          />
        </td>
        <td className="pr-4 num text-foreground">
          {formatNumber(scoreOf(representative, dimension))}
        </td>
        {showOverallColumn ? (
          <td className="pr-4 num text-muted-foreground">
            {formatNumber(representative.ranking.intelligenceIndex)}
          </td>
        ) : null}
        <td>
          <button
            type="button"
            className="ranking-detail-toggle"
            aria-expanded={representativeDetailsOpen}
            onClick={() => onToggleDetails(representative.ranking.slug)}
          >
            {representativeDetailsOpen ? "收起 ←" : "指标 →"}
          </button>
        </td>
        <td>
          <CompareToggle
            model={{
              slug: representative.ranking.slug,
              name: representative.ranking.shortName,
              provider: representative.ranking.creator,
            }}
          />
        </td>
      </tr>
      {representativeDetailsOpen ? (
        <tr className="ranking-detail-row">
          <td colSpan={showOverallColumn ? 7 : 6}>
            <DetailMetrics entry={representative} />
          </td>
        </tr>
      ) : null}
      {familyOpen
        ? family.variants.slice(1).map((entry) => (
            <RankingEntryRow
              key={entry.ranking.slug}
              entry={entry}
              family={family}
              index={index}
              dimension={dimension}
              variant
              detailsOpen={detailsOpen.has(entry.ranking.slug)}
              onToggleDetails={() => onToggleDetails(entry.ranking.slug)}
            />
          ))
        : null}
    </>
  );
}

export function RankingsTable({
  items,
  catalog,
  updatedAt,
  source,
}: {
  items: RankingRecord[];
  catalog: CatalogModel[];
  updatedAt: string;
  source: string;
}) {
  const [scope, setScope] = useState<RankingScope>("featured");
  const [dimension, setDimension] = useState<RankingDimension>(
    "intelligenceIndex",
  );
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("");
  const [modelType, setModelType] = useState<CatalogType>("all");
  const [sortKey, setSortKey] = useState<SortKey>("current");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(
    new Set(),
  );
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(
    new Set(),
  );

  const entries = useMemo(() => buildEntries(items, catalog), [items, catalog]);

  const providerOptions = useMemo(() => {
    const providers = [
      ...new Set(entries.map((entry) => entry.ranking.creator)),
    ].sort((a, b) => a.localeCompare(b, "zh-CN", { sensitivity: "base" }));
    return [
      { value: "", label: "全部厂商" },
      ...providers.map((name) => ({ value: name, label: name })),
    ];
  }, [entries]);

  const scopeCounts = useMemo(
    () =>
      Object.fromEntries(
        SCOPE_OPTIONS.map((option) => [
          option.key,
          groupEntries(
            entries.filter(
              (entry) =>
                matchesScope(entry, option.key) &&
                matchesCatalogType(entry.catalog, modelType),
            ),
            dimension,
          ).length,
        ]),
      ) as Record<RankingScope, number>,
    [dimension, entries, modelType],
  );

  const typeCounts = useMemo(
    () =>
      Object.fromEntries(
        CATALOG_TYPE_OPTIONS.map((option) => [
          option.key,
          groupEntries(
            entries.filter(
              (entry) =>
                matchesScope(entry, scope) &&
                matchesCatalogType(entry.catalog, option.key),
            ),
            dimension,
          ).length,
        ]),
      ) as Record<CatalogType, number>,
    [dimension, entries, scope],
  );

  const activeDimension = DIMENSION_OPTIONS.find(
    (option) => option.key === dimension,
  );

  const groups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = entries.filter((entry) => {
      if (!matchesScope(entry, scope)) return false;
      if (!matchesCatalogType(entry.catalog, modelType)) return false;
      if (provider && entry.ranking.creator !== provider) return false;
      if (!normalizedQuery) return true;
      return [
        entry.ranking.shortName,
        entry.ranking.name,
        entry.ranking.creator,
        entry.familyLabel,
        entry.ranking.slug,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
    const grouped = groupEntries(filtered, dimension);
    return grouped.sort((a, b) => {
      const result = compareValues(
        valueForSort(a.representative, sortKey, dimension),
        valueForSort(b.representative, sortKey, dimension),
        sortDir,
      );
      return result !== 0
        ? result
        : compareEntries(a.representative, b.representative, dimension);
    });
  }, [dimension, entries, modelType, provider, query, scope, sortDir, sortKey]);

  const posterRows = useMemo<RankingPosterRow[]>(
    () =>
      groups.slice(0, 8).map((group, index) => ({
        rank: index + 1,
        name: group.label,
        provider: group.representative.ranking.creator,
        value: formatNumber(scoreOf(group.representative, dimension)),
        valueLabel: activeDimension?.label ?? "AA 综合",
      })),
    [activeDimension?.label, dimension, groups],
  );

  const scopeLabel =
    SCOPE_OPTIONS.find((option) => option.key === scope)?.label ?? "精选";
  const modelTypeLabel =
    CATALOG_TYPE_OPTIONS.find((option) => option.key === modelType)?.label ??
    "全部类型";

  function changeScope(nextScope: RankingScope) {
    setScope(nextScope);
    setExpandedFamilies(new Set());
    setExpandedDetails(new Set());
  }

  function changeDimension(nextDimension: RankingDimension) {
    setDimension(nextDimension);
    setSortKey("current");
    setSortDir("desc");
    setExpandedFamilies(new Set());
    setExpandedDetails(new Set());
  }

  function changeModelType(nextType: CatalogType) {
    setModelType(nextType);
    setExpandedFamilies(new Set());
    setExpandedDetails(new Set());
  }

  function toggleSort(nextKey: SortKey, initialDir: SortDir = "desc") {
    if (sortKey === nextKey) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDir(initialDir);
  }

  function toggleSet(
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    key: string,
  ) {
    setter((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="model-directory">
      <div className="filter-groups">
        <div className="filter-group" role="tablist" aria-label="排行范围">
          {SCOPE_OPTIONS.map((option) => {
            const active = option.key === scope;
            return (
              <button
                key={option.key}
                type="button"
                role="tab"
                aria-selected={active}
                className={active ? "model-view-tab model-view-tab-active" : "model-view-tab"}
                onClick={() => changeScope(option.key)}
              >
                {option.label}
                <span className="model-view-count">{scopeCounts[option.key]}</span>
              </button>
            );
          })}
        </div>

        <div className="filter-group" role="tablist" aria-label="能力维度">
          {DIMENSION_OPTIONS.map((option) => {
            const active = option.key === dimension;
            return (
              <button
                key={option.key}
                type="button"
                role="tab"
                aria-selected={active}
                className={active ? "ranking-dimension-tab ranking-dimension-tab-active" : "ranking-dimension-tab"}
                onClick={() => changeDimension(option.key)}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="filter-group" role="tablist" aria-label="模型类型">
          {CATALOG_TYPE_OPTIONS.map((option) => {
            const active = option.key === modelType;
            return (
              <button
                key={option.key}
                type="button"
                role="tab"
                aria-selected={active}
                className={active ? "catalog-type-tab catalog-type-tab-active" : "catalog-type-tab"}
                onClick={() => changeModelType(option.key)}
              >
                {option.label}
                <span className="model-view-count">{typeCounts[option.key]}</span>
              </button>
            );
          })}
        </div>
        <RankingsMetricGuide />
      </div>

      <div className="directory-toolbar">
        <label className="sr-only" htmlFor="rank-filter">
          筛选模型
        </label>
        <input
          id="rank-filter"
          className="field directory-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索模型、厂商或模型家族"
          autoComplete="off"
        />
        <MenuSelect
          id="rank-provider"
          label="厂商"
          value={provider}
          options={providerOptions}
          onChange={setProvider}
        />
        <p className="directory-count num" role="status" aria-live="polite">
          {groups.length} 个模型家族 · {groups.reduce((count, group) => count + group.variants.length, 0)} 个版本
        </p>
        <RankingPosterExport
          rows={posterRows}
          title="模型评测榜"
          scopeLabel={`${scopeLabel} · ${modelTypeLabel}`}
          dimensionLabel={activeDimension?.label ?? "AA 综合"}
          updatedAt={updatedAt}
          source={source}
        />
      </div>

      <div className="table-shell">
        <table className="data-table ranking-table" aria-labelledby="page-title">
          <caption>模型能力排行列表</caption>
          <thead>
            <tr>
              <th scope="col" className="model-index-heading">序</th>
              <SortableTh
                label="模型"
                active={sortKey === "shortName"}
                dir={sortDir}
                onClick={() => toggleSort("shortName", "asc")}
              />
              <SortableTh
                label="厂商"
                active={sortKey === "creator"}
                dir={sortDir}
                onClick={() => toggleSort("creator", "asc")}
              />
              <SortableTh
                label={activeDimension?.label ?? "当前"}
                active={sortKey === "current"}
                dir={sortDir}
                onClick={() => toggleSort("current")}
              />
              {dimension !== "intelligenceIndex" ? (
                <SortableTh
                  label="AA 综合"
                  active={sortKey === "intelligenceIndex"}
                  dir={sortDir}
                  onClick={() => toggleSort("intelligenceIndex")}
                />
              ) : null}
              <th scope="col">细分</th>
              <th scope="col">对比</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group, index) => (
              <FamilyRankingRows
                key={group.key}
                family={group}
                index={index}
                dimension={dimension}
                familyOpen={expandedFamilies.has(group.key)}
                detailsOpen={expandedDetails}
                onToggleFamily={() => toggleSet(setExpandedFamilies, group.key)}
                onToggleDetails={(slug) => toggleSet(setExpandedDetails, slug)}
              />
            ))}
            {groups.length === 0 ? (
              <tr>
                <td colSpan={dimension === "intelligenceIndex" ? 6 : 7} className="directory-empty">
                  没有匹配的模型。可以切换到“全部”查看完整目录。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="directory-footnote">
        AA 分数 · 视觉 / 多模态按名称识别。
      </p>
    </div>
  );
}
