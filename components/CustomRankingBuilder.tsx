"use client";

import { useEffect, useMemo, useState } from "react";
import type { DragEvent as ReactDragEvent } from "react";
import type { CatalogModel } from "@/lib/model-catalog";
import { logoForCreator } from "@/lib/vendors";
import { VendorBadge } from "@/components/VendorBadge";
import {
  TierListPosterExport,
  type TierListRow,
} from "@/components/TierListPosterExport";

type TierKey = "s" | "a" | "b" | "c" | "d";

type TierState = TierListRow & {
  key: TierKey;
};

const STORAGE_KEY = "llm-model-comparison.custom-ranking";

const DEFAULT_TIERS: TierState[] = [
  { key: "s", label: "S · 王牌", color: "#caff27", modelSlugs: [] },
  { key: "a", label: "A · 很强", color: "#ffb55b", modelSlugs: [] },
  { key: "b", label: "B · 好用", color: "#f8d36a", modelSlugs: [] },
  { key: "c", label: "C · 一般", color: "#78d47a", modelSlugs: [] },
  { key: "d", label: "D · 不推荐", color: "#e36baa", modelSlugs: [] },
];

type SavedRanking = {
  title?: string;
  author?: string;
  tiers?: unknown;
};

function cloneDefaultTiers(): TierState[] {
  return DEFAULT_TIERS.map((tier) => ({
    ...tier,
    modelSlugs: [],
  }));
}

function normalizeTiers(value: unknown, validSlugs: Set<string>): TierState[] {
  if (!Array.isArray(value)) return cloneDefaultTiers();
  return DEFAULT_TIERS.map((defaultTier) => {
    const saved = value.find(
      (item): item is Partial<TierState> =>
        Boolean(item) && typeof item === "object" && item.key === defaultTier.key,
    );
    const modelSlugs = Array.isArray(saved?.modelSlugs)
      ? [...new Set(saved.modelSlugs.filter((slug): slug is string =>
          typeof slug === "string" && validSlugs.has(slug),
        ))]
      : [];
    return {
      ...defaultTier,
      label:
        typeof saved?.label === "string" && saved.label.trim()
          ? saved.label
          : defaultTier.label,
      modelSlugs,
    };
  });
}

function readSavedRanking(): SavedRanking | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as SavedRanking | null;
  } catch {
    return null;
  }
}

export function CustomRankingBuilder({
  models,
  updatedAt,
}: {
  models: CatalogModel[];
  updatedAt: string;
}) {
  const validSlugs = useMemo(() => new Set(models.map((model) => model.slug)), [models]);
  const modelBySlug = useMemo(
    () => new Map(models.map((model) => [model.slug, model])),
    [models],
  );
  const [title, setTitle] = useState("我的模型榜单");
  const [author, setAuthor] = useState("");
  const [tiers, setTiers] = useState<TierState[]>(cloneDefaultTiers);
  const [query, setQuery] = useState("");
  const [draggingSlug, setDraggingSlug] = useState<string | null>(null);
  const [dropOverTier, setDropOverTier] = useState<TierKey | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = readSavedRanking();
    const timer = window.setTimeout(() => {
      if (saved) {
        if (typeof saved.title === "string") setTitle(saved.title);
        if (typeof saved.author === "string") setAuthor(saved.author);
        setTiers(normalizeTiers(saved.tiers, validSlugs));
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [validSlugs]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ title, author, tiers }),
    );
  }, [author, hydrated, tiers, title]);

  const candidateModels = useMemo(
    () =>
      models
        .filter((model) => model.isFeatured || model.isMainstream)
        .sort(
          (a, b) =>
            (b.intelligenceIndex ?? Number.NEGATIVE_INFINITY) -
            (a.intelligenceIndex ?? Number.NEGATIVE_INFINITY),
        ),
    [models],
  );

  const assignedSlugs = useMemo(
    () => new Set(tiers.flatMap((tier) => tier.modelSlugs)),
    [tiers],
  );

  const poolModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return candidateModels
      .filter((model) => !assignedSlugs.has(model.slug))
      .filter((model) => {
        if (!normalizedQuery) return true;
        return [model.name, model.family, model.provider, model.slug].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      })
      .slice(0, 72);
  }, [assignedSlugs, candidateModels, query]);

  const assignedCount = assignedSlugs.size;

  function moveModel(slug: string, targetKey: TierKey, targetIndex?: number) {
    if (!modelBySlug.has(slug)) return;
    setTiers((current) => {
      const next = current.map((tier) => ({
        ...tier,
        modelSlugs: tier.modelSlugs.filter((item) => item !== slug),
      }));
      const target = next.find((tier) => tier.key === targetKey);
      if (!target) return current;
      const index = targetIndex === undefined
        ? target.modelSlugs.length
        : Math.min(targetIndex, target.modelSlugs.length);
      target.modelSlugs.splice(index, 0, slug);
      return next;
    });
  }

  function removeModel(slug: string) {
    setTiers((current) =>
      current.map((tier) => ({
        ...tier,
        modelSlugs: tier.modelSlugs.filter((item) => item !== slug),
      })),
    );
  }

  function updateTierLabel(key: TierKey, label: string) {
    setTiers((current) =>
      current.map((tier) => (tier.key === key ? { ...tier, label } : tier)),
    );
  }

  function onDragStart(event: ReactDragEvent<HTMLElement>, slug: string) {
    event.dataTransfer.setData("text/plain", slug);
    event.dataTransfer.effectAllowed = "move";
    setDraggingSlug(slug);
    setDropOverTier(null);
  }

  function onDrop(
    event: ReactDragEvent<HTMLElement>,
    targetKey: TierKey,
    targetIndex?: number,
  ) {
    event.preventDefault();
    const slug = event.dataTransfer.getData("text/plain") || draggingSlug;
    if (slug) moveModel(slug, targetKey, targetIndex);
    setDraggingSlug(null);
    setDropOverTier(null);
  }

  function reset() {
    setTitle("我的模型榜单");
    setAuthor("");
    setTiers(cloneDefaultTiers());
    setQuery("");
  }

  return (
    <div className="custom-ranking-builder">
      <div className="custom-ranking-toolbar">
        <div className="custom-ranking-fields">
          <label>
            <span>榜单标题</span>
            <input
              className="field"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={28}
            />
          </label>
          <label>
            <span>署名</span>
            <input
              className="field"
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              placeholder="可选"
              maxLength={28}
            />
          </label>
        </div>
        <div className="custom-ranking-toolbar-actions">
          <button type="button" className="custom-ranking-reset" onClick={reset}>
            重置
          </button>
          <TierListPosterExport
            title={title}
            author={author}
            tiers={tiers}
            models={models}
            updatedAt={updatedAt}
          />
        </div>
      </div>

      <div className="custom-ranking-workspace">
        <section className="custom-ranking-board" aria-label="自定义等级榜单">
        <div className="custom-ranking-board-heading">
          <div>
            <p className="custom-ranking-eyebrow">CUSTOM RANKING</p>
            <h2>{title || "我的模型榜单"}</h2>
          </div>
          <p>{assignedCount} 个模型已加入</p>
        </div>
        <div className="custom-ranking-tier-list">
          {tiers.map((tier) => (
            <div
              key={tier.key}
              className={[
                "custom-ranking-tier",
                draggingSlug ? "custom-ranking-tier-drop-target" : "",
                dropOverTier === tier.key ? "custom-ranking-tier-drop-active" : "",
              ].filter(Boolean).join(" ")}
              onDragEnter={() => setDropOverTier(tier.key)}
              onDragOver={(event) => {
                event.preventDefault();
                setDropOverTier(tier.key);
              }}
              onDrop={(event) => onDrop(event, tier.key)}
            >
              <div
                className="custom-ranking-tier-label"
                style={{ backgroundColor: tier.color }}
              >
                <input
                  aria-label={`${tier.key} 级名称`}
                  value={tier.label}
                  onChange={(event) => updateTierLabel(tier.key, event.target.value)}
                  maxLength={16}
                />
              </div>
              <div className="custom-ranking-tier-models">
                {tier.modelSlugs.map((slug, index) => {
                  const model = modelBySlug.get(slug);
                  if (!model) return null;
                  return (
                    <div
                      key={slug}
                      className={draggingSlug === slug ? "custom-ranking-card custom-ranking-card-dragging" : "custom-ranking-card"}
                      draggable
                      onDragStart={(event) => onDragStart(event, slug)}
                      onDragEnd={() => {
                        setDraggingSlug(null);
                        setDropOverTier(null);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDropOverTier(tier.key);
                      }}
                      onDrop={(event) => {
                        event.stopPropagation();
                        onDrop(event, tier.key, index);
                      }}
                    >
                      <div className="custom-ranking-card-content">
                        <span className="custom-ranking-card-name" title={model.name}>
                          {model.name}
                        </span>
                        <span className="custom-ranking-card-provider">{model.provider}</span>
                      </div>
                      <button
                        type="button"
                        className="custom-ranking-card-remove"
                        aria-label={`从${tier.label}移除${model.name}`}
                        onClick={() => removeModel(slug)}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
                {dropOverTier === tier.key && draggingSlug ? (
                  <span className="custom-ranking-tier-drop-hint">松开即可放入 {tier.label}</span>
                ) : tier.modelSlugs.length === 0 ? (
                  <span className="custom-ranking-tier-empty">把模型拖到这里</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <p className="custom-ranking-board-hint">
          拖动模型卡片调整顺序；手机上可以直接点击模型，默认加入 S 级。
        </p>
        </section>

        <section className="custom-ranking-pool" aria-label="模型池">
        <div className="custom-ranking-pool-heading">
          <div>
            <p className="custom-ranking-eyebrow">MODEL POOL</p>
            <h2>模型池</h2>
          </div>
          <p>精选 / 主流 · {poolModels.length} 个可加入</p>
        </div>
        <label className="sr-only" htmlFor="custom-ranking-search">
          搜索模型
        </label>
        <input
          id="custom-ranking-search"
          className="field custom-ranking-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索模型、厂商或模型家族"
          autoComplete="off"
        />
        <div className="custom-ranking-pool-grid">
          {poolModels.map((model) => (
            <button
              key={model.slug}
              type="button"
              className={draggingSlug === model.slug ? "custom-ranking-pool-card custom-ranking-pool-card-dragging" : "custom-ranking-pool-card"}
              draggable
              onDragStart={(event) => onDragStart(event, model.slug)}
              onDragEnd={() => {
                setDraggingSlug(null);
                setDropOverTier(null);
              }}
              onClick={() => moveModel(model.slug, "s")}
              title="点击加入 S 级，也可以拖动到任意等级"
            >
              <span className="custom-ranking-pool-card-main">
                <VendorBadge
                  name={model.provider}
                  logoSrc={logoForCreator(model.provider, model.creatorLogo)}
                />
                <span className="custom-ranking-pool-name" title={model.name}>
                  {model.name}
                </span>
              </span>
              <span className="custom-ranking-pool-add" aria-hidden>
                +
              </span>
            </button>
          ))}
        </div>
        {poolModels.length === 0 ? (
          <p className="custom-ranking-empty">没有匹配的模型，或模型已经全部加入榜单。</p>
        ) : null}
        </section>
      </div>
    </div>
  );
}
