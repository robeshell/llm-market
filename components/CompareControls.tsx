"use client";

import Link from "next/link";
import { CompareItem, MAX_COMPARE_MODELS, useCompare } from "@/components/CompareContext";

export function CompareToggle({ model }: { model: CompareItem }) {
  const { canAdd, isSelected, toggle } = useCompare();
  const selected = isSelected(model.slug);
  const disabled = !selected && !canAdd;

  return (
    <button
      type="button"
      className={selected ? "compare-toggle compare-toggle-selected" : "compare-toggle"}
      aria-pressed={selected}
      disabled={disabled}
      title={disabled ? `最多选择 ${MAX_COMPARE_MODELS} 个模型` : undefined}
      onClick={() => toggle(model)}
    >
      {selected ? "已选" : "+ 对比"}
    </button>
  );
}

export function CompareTray() {
  const { clear, items, remove } = useCompare();
  if (items.length === 0) return null;

  return (
    <aside className="compare-tray" aria-label="模型对比栏">
      <div className="compare-tray-inner">
        <span className="compare-tray-count num">
          已选 {items.length}/{MAX_COMPARE_MODELS}
        </span>
        <div className="compare-tray-items">
          {items.map((item) => (
            <button
              key={item.slug}
              type="button"
              className="compare-tray-item"
              title={`移除 ${item.name}`}
              onClick={() => remove(item.slug)}
            >
              <span>{item.name}</span>
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
        <div className="compare-tray-actions">
          <Link className="compare-submit" href="/compare">
            查看对比
          </Link>
          <button type="button" className="compare-clear" onClick={clear}>
            清空
          </button>
        </div>
      </div>
    </aside>
  );
}

