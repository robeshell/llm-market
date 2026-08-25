"use client";

import Link from "next/link";
import type { CatalogModel } from "@/lib/model-catalog";
import { formatNumber } from "@/lib/format";
import { formatPricePerMillion } from "@/lib/currency";
import { useCompare } from "@/components/CompareContext";

type ComparisonRow = {
  label: string;
  getValue: (model: CatalogModel) => React.ReactNode;
  numeric?: boolean;
  getNumeric?: (model: CatalogModel) => number | null;
  lowerIsBetter?: boolean;
};

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: "厂商",
    getValue: (model) => model.provider,
  },
  {
    label: "综合",
    getValue: (model) => formatNumber(model.intelligenceIndex),
    numeric: true,
    getNumeric: (model) => model.intelligenceIndex,
  },
  {
    label: "编程",
    getValue: (model) => formatNumber(model.codingIndex),
    numeric: true,
    getNumeric: (model) => model.codingIndex,
  },
  {
    label: "Agent",
    getValue: (model) => formatNumber(model.agenticIndex),
    numeric: true,
    getNumeric: (model) => model.agenticIndex,
  },
  {
    label: "输入价格",
    getValue: (model) => formatPricePerMillion(model.inputPerMillion),
    numeric: true,
    getNumeric: (model) => model.inputPerMillion,
    lowerIsBetter: true,
  },
  {
    label: "输出价格",
    getValue: (model) => formatPricePerMillion(model.outputPerMillion),
    numeric: true,
    getNumeric: (model) => model.outputPerMillion,
    lowerIsBetter: true,
  },
  {
    label: "上下文",
    getValue: (model) =>
      model.contextLength
        ? `${model.contextLength.toLocaleString("en-US")} tokens`
        : "—",
    numeric: true,
    getNumeric: (model) => model.contextLength,
  },
  {
    label: "开源权重",
    getValue: (model) => (model.isOpenWeights ? "是" : "否"),
  },
  {
    label: "发布时间",
    getValue: (model) => model.releaseDate || "—",
  },
];

function comparisonClass(row: ComparisonRow, model: CatalogModel, selected: CatalogModel[]) {
  const classes = [row.numeric ? "num text-foreground" : "text-muted-foreground"];
  if (!row.getNumeric) return classes.join(" ");

  const values = selected
    .map(row.getNumeric)
    .filter((value): value is number => value !== null && Number.isFinite(value));
  const value = row.getNumeric(model);
  if (value === null || values.length < 2) return classes.join(" ");

  const best = row.lowerIsBetter ? Math.min(...values) : Math.max(...values);
  const worst = row.lowerIsBetter ? Math.max(...values) : Math.min(...values);
  if (value === best) classes.push("compare-best");
  if (value === worst && worst !== best) classes.push("compare-worst");
  return classes.join(" ");
}

export function CompareTable({ catalog }: { catalog: CatalogModel[] }) {
  const { items, remove } = useCompare();
  const catalogBySlug = new Map(catalog.map((model) => [model.slug, model]));
  const selected = items
    .map((item) => catalogBySlug.get(item.slug))
    .filter((model): model is CatalogModel => Boolean(model));

  if (selected.length === 0) {
    return (
      <div className="compare-empty">
        <p>还没有选择模型。</p>
        <p className="text-muted-foreground">
          <Link href="/models" className="compare-empty-link">
            返回模型目录
          </Link>
          ，点击“+ 对比”后再查看差异。
        </p>
      </div>
    );
  }

  return (
    <div className="compare-table-shell">
      <table className="data-table compare-table">
        <caption>模型对比表</caption>
        <thead>
          <tr>
            <th scope="col">指标</th>
            {selected.map((model) => (
              <th key={model.slug} scope="col" className="compare-model-heading">
                <div className="compare-model-name">{model.name}</div>
                <button
                  type="button"
                  className="compare-remove"
                  onClick={() => remove(model.slug)}
                >
                  移除
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="compare-label">
                {row.label}
              </th>
              {selected.map((model) => (
                <td
                  key={`${row.label}-${model.slug}`}
                  className={comparisonClass(row, model, selected)}
                >
                  {row.getValue(model)}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <th scope="row" className="compare-label">标签</th>
            {selected.map((model) => (
              <td key={`tags-${model.slug}`}>
                <div className="model-tags">
                  {model.tags.length > 0 ? model.tags.map((tag) => (
                    <span key={tag} className="catalog-tag">{tag}</span>
                  )) : <span className="text-muted-foreground">—</span>}
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="directory-footnote">
        价格为 USD / M tokens 参考价 · 分数来自 Artificial Analysis。
      </p>
    </div>
  );
}
