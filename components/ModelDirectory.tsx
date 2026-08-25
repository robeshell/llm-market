"use client";

import { useMemo, useState } from "react";
import type {
  CatalogFamily,
  CatalogModel,
  CatalogType,
  CatalogView,
} from "@/lib/model-catalog";
import {
  CATALOG_TYPE_OPTIONS,
  filterCatalog,
  groupCatalog,
  variantLabelFromName,
} from "@/lib/model-catalog";
import {
  DEFAULT_CURRENCY,
  type CurrencyCode,
  currencySymbol,
  formatPricePerMillion,
} from "@/lib/currency";
import { formatNumber } from "@/lib/format";
import { logoForCreator } from "@/lib/vendors";
import { MenuSelect } from "@/components/MenuSelect";
import { VendorBadge } from "@/components/VendorBadge";
import { CompareToggle } from "@/components/CompareControls";

const VIEW_OPTIONS: { key: CatalogView; label: string }[] = [
  { key: "featured", label: "精选" },
  { key: "mainstream", label: "主流" },
  { key: "open", label: "开源" },
  { key: "all", label: "全部" },
];

function pricePair(model: CatalogModel, currency: CurrencyCode) {
  return `${formatPricePerMillion(model.inputPerMillion, currency)} / ${formatPricePerMillion(model.outputPerMillion, currency)}`;
}

function modelRow(
  model: CatalogModel,
  currency: CurrencyCode,
  variant = false,
) {
  return (
    <>
      <td className={variant ? "model-cell model-cell-variant" : "model-cell"}>
        <div className="model-name-line">
          {variant ? <span className="model-variant-mark" aria-hidden /> : null}
          <span className="cell-name text-foreground">
            {variant ? variantLabelFromName(model.name, model.family) : model.name}
          </span>
        </div>
        {variant ? null : <span className="model-family-slug">{model.family}</span>}
      </td>
      <td className="pr-4 text-muted-foreground">
        <VendorBadge
          name={model.provider}
          logoSrc={logoForCreator(model.provider, model.creatorLogo)}
        />
      </td>
      <td className="pr-4 num text-foreground">
        {formatNumber(model.intelligenceIndex)}
      </td>
      <td className="pr-4 num text-muted-foreground">
        {pricePair(model, currency)}
      </td>
      <td className="pr-4 num text-muted-foreground">
        {model.contextLength ? model.contextLength.toLocaleString("en-US") : "—"}
      </td>
      <td className="model-tags-cell">
        <div className="model-tags">
          {model.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="catalog-tag">
              {tag}
            </span>
          ))}
        </div>
      </td>
      <td>
        <CompareToggle
          model={{
            slug: model.slug,
            name: model.name,
            provider: model.provider,
          }}
        />
      </td>
    </>
  );
}

function FamilyRow({
  group,
  index,
  currency,
  expanded,
  onToggle,
}: {
  group: CatalogFamily;
  index: number;
  currency: CurrencyCode;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasVariants = group.variants.length > 1;
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
                aria-expanded={expanded}
                aria-label={`${expanded ? "收起" : "展开"}${group.label}的版本`}
                onClick={onToggle}
              >
                {expanded ? "−" : "+"}
              </button>
            ) : (
              <span className="family-toggle-placeholder" aria-hidden />
            )}
            <span className="cell-name text-foreground">{group.label}</span>
          </div>
          <span className="model-family-slug">
            {hasVariants ? `${group.variants.length} 个版本` : "单一版本"}
          </span>
        </td>
        {modelRow(group.representative, currency).props.children.slice(1)}
      </tr>
      {expanded
        ? group.variants.slice(1).map((model) => (
            <tr key={model.slug} className="model-variant-row">
              <td className="model-index" aria-hidden />
              {modelRow(model, currency, true)}
            </tr>
          ))
        : null}
    </>
  );
}

export function ModelDirectory({
  models,
  defaultView = "featured",
}: {
  models: CatalogModel[];
  defaultView?: CatalogView;
}) {
  const [view, setView] = useState<CatalogView>(defaultView);
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("");
  const [modelType, setModelType] = useState<CatalogType>("all");
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(
    new Set(),
  );

  const providerOptions = useMemo(() => {
    const providers = [...new Set(models.map((model) => model.provider))].sort(
      (a, b) => a.localeCompare(b, "zh-CN", { sensitivity: "base" }),
    );
    return [
      { value: "", label: "全部厂商" },
      ...providers.map((name) => ({ value: name, label: name })),
    ];
  }, [models]);

  const currencyOptions = [
    { value: "USD", label: "USD ($)" },
    { value: "CNY", label: "CNY (¥)" },
  ];

  const visibleModels = useMemo(
    () => filterCatalog(models, view, query, provider, modelType),
    [models, modelType, view, query, provider],
  );
  const groups = useMemo(() => groupCatalog(visibleModels), [visibleModels]);
  const viewCounts = useMemo(
    () =>
      Object.fromEntries(
        VIEW_OPTIONS.map((option) => [
          option.key,
          groupCatalog(
            filterCatalog(models, option.key, "", "", modelType),
          ).length,
        ]),
      ) as Record<CatalogView, number>,
    [modelType, models],
  );
  const typeCounts = useMemo(
    () =>
      Object.fromEntries(
        CATALOG_TYPE_OPTIONS.map((option) => [
          option.key,
          groupCatalog(filterCatalog(models, "all", "", "", option.key)).length,
        ]),
      ) as Record<CatalogType, number>,
    [models],
  );

  function setNextView(nextView: CatalogView) {
    setView(nextView);
    setExpandedFamilies(new Set());
  }

  function setNextType(nextType: CatalogType) {
    setModelType(nextType);
    setExpandedFamilies(new Set());
  }

  function toggleFamily(key: string) {
    setExpandedFamilies((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="model-directory">
      <div className="filter-groups">
        <div className="filter-group" role="tablist" aria-label="模型范围">
          {VIEW_OPTIONS.map((option) => {
            const active = option.key === view;
            return (
              <button
                key={option.key}
                type="button"
                role="tab"
                aria-selected={active}
                className={active ? "model-view-tab model-view-tab-active" : "model-view-tab"}
                onClick={() => setNextView(option.key)}
              >
                {option.label}
                <span className="model-view-count">{viewCounts[option.key]}</span>
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
                onClick={() => setNextType(option.key)}
              >
                {option.label}
                <span className="model-view-count">{typeCounts[option.key]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="directory-toolbar">
        <label className="sr-only" htmlFor="model-filter">
          筛选模型
        </label>
        <input
          id="model-filter"
          className="field directory-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索模型、厂商或模型家族"
          autoComplete="off"
        />
        <MenuSelect
          id="model-provider"
          label="厂商"
          value={provider}
          options={providerOptions}
          onChange={setProvider}
        />
        <MenuSelect
          id="model-currency"
          label="币种"
          value={currency}
          options={currencyOptions}
          onChange={(next) => setCurrency(next as CurrencyCode)}
        />
        <p className="directory-count num" role="status" aria-live="polite">
          {groups.length} 个模型家族 · {visibleModels.length} 个版本 · {currencySymbol(currency)}/M tokens
        </p>
      </div>

      <div className="table-shell">
        <table className="data-table model-table" aria-labelledby="page-title">
          <caption>模型选择列表</caption>
          <thead>
            <tr>
              <th scope="col" className="model-index-heading">序</th>
              <th scope="col">模型</th>
              <th scope="col">厂商</th>
              <th scope="col">综合</th>
              <th scope="col">输入 / 输出</th>
              <th scope="col">上下文</th>
              <th scope="col">特点</th>
              <th scope="col">对比</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group, index) => (
              <FamilyRow
                key={group.key}
                group={group}
                index={index}
                currency={currency}
                expanded={expandedFamilies.has(group.key)}
                onToggle={() => toggleFamily(group.key)}
              />
            ))}
            {groups.length === 0 ? (
              <tr>
                <td colSpan={8} className="directory-empty">
                  没有匹配的模型。可以切换到“全部”查看完整目录。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="directory-footnote">
        AA 数据 · 价格为参考价 · 视觉 / 多模态按名称识别。
      </p>
    </div>
  );
}
