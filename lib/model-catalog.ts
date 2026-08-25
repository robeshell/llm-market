import type { PriceRecord, RankingRecord } from "./types";

export type CatalogView = "featured" | "mainstream" | "open" | "all";
export type CatalogType = "all" | "vision" | "multimodal";

export const CATALOG_TYPE_OPTIONS: {
  key: CatalogType;
  label: string;
}[] = [
  { key: "all", label: "全部类型" },
  { key: "vision", label: "视觉" },
  { key: "multimodal", label: "多模态" },
];

export type CatalogModel = {
  slug: string;
  name: string;
  provider: string;
  intelligenceIndex: number | null;
  codingIndex: number | null;
  agenticIndex: number | null;
  isVision: boolean;
  isMultimodal: boolean;
  isReasoning: boolean;
  inputPerMillion: number | null;
  outputPerMillion: number | null;
  contextLength: number | null;
  releaseDate: string | null;
  creatorLogo: string | null;
  isOpenWeights: boolean;
  family: string;
  familyKey: string;
  isFeatured: boolean;
  isMainstream: boolean;
  tags: string[];
};

export type CatalogFamily = {
  key: string;
  label: string;
  representative: CatalogModel;
  variants: CatalogModel[];
};

const OPEN_SOURCE_PREFIXES = [
  "deepseek-",
  "qwen",
  "mistral",
  "llama",
  "gemma",
  "granite",
  "phi-",
  "apertus-",
  "olmo-",
];

const MULTIMODAL_HINT = /\b(?:multimodal|omni)\b/i;
const VISION_HINT = /\b(?:vision|vl)\b/i;

function familyKeyFromSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/-(?:xhigh|high|medium|low|max)$/g, "")
    .replace(/-(?:non-reasoning|reasoning)$/g, "")
    .replace(/-\d{4}$/g, "");
}

function familyLabelFromName(name: string): string {
  return name
    .replace(/\s*\((?:max|xhigh|high|medium|low|reasoning|non-reasoning)\)/gi, "")
    .replace(/\s*\(with fallback\)/gi, "")
    .replace(/\s+(?:max|xhigh|high|medium|low|reasoning|non-reasoning)$/i, "")
    .trim();
}

export function variantLabelFromName(name: string, family: string): string {
  const normalizedName = name.trim();
  const normalizedFamily = family.trim();
  const startsWithFamily = normalizedName
    .toLowerCase()
    .startsWith(normalizedFamily.toLowerCase());
  const remainder = startsWithFamily
    ? normalizedName.slice(normalizedFamily.length).trim()
    : "";
  const label =
    remainder || normalizedName.match(/\(([^)]+)\)\s*$/)?.[1] || normalizedName;
  return label.replace(/^\(|\)$/g, "").trim();
}

function hasOpenSourceHint(slug: string): boolean {
  return OPEN_SOURCE_PREFIXES.some((prefix) =>
    slug.toLowerCase().startsWith(prefix),
  );
}

function modalityFlags(slug: string, name: string) {
  const value = `${slug} ${name}`;
  const isMultimodal = MULTIMODAL_HINT.test(value);
  return {
    isVision: isMultimodal || VISION_HINT.test(value),
    isMultimodal,
  };
}

function isOpenWeights(
  slug: string,
  price: PriceRecord | undefined,
  ranking: RankingRecord | undefined,
): boolean {
  if (price?.isOpenWeights !== null && price?.isOpenWeights !== undefined) {
    return price.isOpenWeights;
  }
  if (
    ranking?.isOpenWeights !== null &&
    ranking?.isOpenWeights !== undefined
  ) {
    return ranking.isOpenWeights;
  }
  return hasOpenSourceHint(slug);
}

function modelTags(model: {
  intelligenceIndex: number | null;
  codingIndex: number | null;
  contextLength: number | null;
  inputPerMillion: number | null;
  outputPerMillion: number | null;
  isOpenWeights: boolean;
  isVision: boolean;
  isMultimodal: boolean;
}): string[] {
  const tags: string[] = [];
  if (model.isMultimodal) tags.push("多模态");
  else if (model.isVision) tags.push("视觉");
  if (model.intelligenceIndex !== null && model.intelligenceIndex >= 50) {
    tags.push("高性能");
  }
  if (model.codingIndex !== null && model.codingIndex >= 40) {
    tags.push("适合编程");
  }
  if (model.contextLength !== null && model.contextLength >= 200_000) {
    tags.push("长上下文");
  }
  if (
    model.intelligenceIndex !== null &&
    model.inputPerMillion !== null &&
    model.outputPerMillion !== null &&
    model.intelligenceIndex >= 20 &&
    model.inputPerMillion * 0.4 + model.outputPerMillion * 0.6 <= 5
  ) {
    tags.push("高性价比");
  }
  if (model.isOpenWeights) tags.push("开源");
  return tags;
}

const FEATURED_FAMILY_LIMIT = 36;

function topFamilyKeys(
  models: CatalogModel[],
  getValue: (model: CatalogModel) => number | null,
  limit: number,
): string[] {
  const bestByFamily = new Map<string, { key: string; value: number }>();
  for (const model of models) {
    const value = getValue(model);
    if (value === null || !Number.isFinite(value)) continue;
    const current = bestByFamily.get(model.familyKey);
    if (!current || value > current.value) {
      bestByFamily.set(model.familyKey, { key: model.familyKey, value });
    }
  }
  return [...bestByFamily.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((item) => item.key);
}

function recentFamilyKeys(models: CatalogModel[], limit: number): string[] {
  const latestByFamily = new Map<string, { key: string; date: number }>();
  for (const model of models) {
    if (!model.releaseDate) continue;
    const date = Date.parse(model.releaseDate);
    if (!Number.isFinite(date)) continue;
    const current = latestByFamily.get(model.familyKey);
    if (!current || date > current.date) {
      latestByFamily.set(model.familyKey, { key: model.familyKey, date });
    }
  }
  return [...latestByFamily.values()]
    .sort((a, b) => b.date - a.date)
    .slice(0, limit)
    .map((item) => item.key);
}

function selectFeaturedFamilies(models: CatalogModel[]): Set<string> {
  const selected = new Set<string>();
  const priced = models.filter(
    (model) =>
      model.intelligenceIndex !== null &&
      (model.inputPerMillion !== null || model.outputPerMillion !== null),
  );

  const topScore = topFamilyKeys(
    priced,
    (model) => model.intelligenceIndex,
    20,
  );
  const recent = recentFamilyKeys(priced, 8);
  const topCoding = topFamilyKeys(priced, (model) => model.codingIndex, 5);
  const topContext = topFamilyKeys(priced, (model) => model.contextLength, 5);
  const topValue = topFamilyKeys(
    priced.filter(
      (model) =>
        model.inputPerMillion !== null && model.outputPerMillion !== null,
    ),
    (model) => {
      const price =
        model.inputPerMillion! * 0.4 + model.outputPerMillion! * 0.6;
      return model.intelligenceIndex! / Math.max(price, 0.25);
    },
    5,
  );

  for (const key of [
    ...recent,
    ...topScore,
    ...topCoding,
    ...topContext,
    ...topValue,
  ]) {
    if (selected.size >= FEATURED_FAMILY_LIMIT) break;
    selected.add(key);
  }
  return selected;
}

const MAINSTREAM_FAMILY_LIMIT = 72;

function selectMainstreamFamilies(
  models: CatalogModel[],
  featuredFamilies: Set<string>,
): Set<string> {
  const selected = new Set(featuredFamilies);
  const priced = models.filter(
    (model) =>
      model.intelligenceIndex !== null &&
      (model.inputPerMillion !== null || model.outputPerMillion !== null),
  );
  const candidates = [
    ...recentFamilyKeys(priced, 12),
    ...topFamilyKeys(priced, (model) => model.intelligenceIndex, 60),
    ...topFamilyKeys(priced, (model) => model.codingIndex, 12),
    ...topFamilyKeys(priced, (model) => model.contextLength, 12),
  ];
  for (const key of candidates) {
    if (selected.size >= MAINSTREAM_FAMILY_LIMIT) break;
    selected.add(key);
  }
  return selected;
}

export function buildCatalog(
  prices: PriceRecord[],
  rankings: RankingRecord[],
): CatalogModel[] {
  const pricesBySlug = new Map(prices.map((item) => [item.id, item]));
  const rankingsBySlug = new Map(rankings.map((item) => [item.slug, item]));
  const slugs = new Set([...pricesBySlug.keys(), ...rankingsBySlug.keys()]);

  const models = [...slugs]
    .map((slug) => {
      const price = pricesBySlug.get(slug);
      const ranking = rankingsBySlug.get(slug);
      const name = price?.name || ranking?.shortName || ranking?.name || slug;
      const provider = price?.provider || ranking?.creator || "—";
      const familyKey = familyKeyFromSlug(slug);
      const openWeights = isOpenWeights(slug, price, ranking);
      const { isVision, isMultimodal } = modalityFlags(slug, name);
      const model: CatalogModel = {
        slug,
        name,
        provider,
        intelligenceIndex:
          price?.intelligenceIndex ?? ranking?.intelligenceIndex ?? null,
        codingIndex: ranking?.codingIndex ?? null,
        agenticIndex: ranking?.agenticIndex ?? null,
        isVision,
        isMultimodal,
        isReasoning:
          ranking?.isReasoning ?? /\breasoning\b/i.test(`${slug} ${name}`),
        inputPerMillion: price?.inputPerMillion ?? null,
        outputPerMillion: price?.outputPerMillion ?? null,
        contextLength: price?.contextLength ?? null,
        releaseDate: price?.releaseDate || ranking?.releaseDate || null,
        creatorLogo: price?.creatorLogo || ranking?.creatorLogo || null,
        isOpenWeights: openWeights,
        family: familyLabelFromName(name),
        familyKey,
        isFeatured: false,
        isMainstream: false,
        tags: [],
      };
      model.tags = modelTags(model);
      return model;
  });
  const featuredFamilies = selectFeaturedFamilies(models);
  const mainstreamFamilies = selectMainstreamFamilies(
    models,
    featuredFamilies,
  );

  return models
    .map((model) => ({
      ...model,
      isFeatured: featuredFamilies.has(model.familyKey),
      isMainstream: mainstreamFamilies.has(model.familyKey),
    }))
    .sort(
      (a, b) =>
        (b.intelligenceIndex ?? Number.NEGATIVE_INFINITY) -
        (a.intelligenceIndex ?? Number.NEGATIVE_INFINITY),
    );
}

export function filterCatalog(
  models: CatalogModel[],
  view: CatalogView,
  query: string,
  provider: string,
  type: CatalogType = "all",
): CatalogModel[] {
  const normalizedQuery = query.trim().toLowerCase();
  return models.filter((model) => {
    if (view === "featured" && !model.isFeatured) return false;
    if (view === "mainstream" && !model.isMainstream) return false;
    if (view === "open" && !model.isOpenWeights) return false;
    if (type === "vision" && !model.isVision) return false;
    if (type === "multimodal" && !model.isMultimodal) return false;
    if (provider && model.provider !== provider) return false;
    if (!normalizedQuery) return true;
    return [model.name, model.family, model.provider, model.slug].some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    );
  });
}

export function matchesCatalogType(
  model: CatalogModel | undefined,
  type: CatalogType,
): boolean {
  if (type === "all") return true;
  if (!model) return false;
  return type === "vision" ? model.isVision : model.isMultimodal;
}

export function groupCatalog(models: CatalogModel[]): CatalogFamily[] {
  const groups = new Map<string, CatalogModel[]>();
  for (const model of models) {
    const existing = groups.get(model.familyKey) ?? [];
    existing.push(model);
    groups.set(model.familyKey, existing);
  }

  return [...groups.entries()]
    .map(([key, variants]) => {
      const sorted = [...variants].sort(
        (a, b) =>
          (b.intelligenceIndex ?? Number.NEGATIVE_INFINITY) -
          (a.intelligenceIndex ?? Number.NEGATIVE_INFINITY),
      );
      return {
        key,
        label: sorted[0].family,
        representative: sorted[0],
        variants: sorted,
      };
    })
    .sort(
      (a, b) =>
        (b.representative.intelligenceIndex ?? Number.NEGATIVE_INFINITY) -
        (a.representative.intelligenceIndex ?? Number.NEGATIVE_INFINITY),
    );
}
