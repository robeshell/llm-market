export type PriceRecord = {
  id: string;
  name: string;
  provider: string;
  creatorLogo: string;
  contextLength: number | null;
  inputPerMillion: number | null;
  outputPerMillion: number | null;
  intelligenceIndex: number | null;
  isOpenWeights?: boolean | null;
  releaseDate?: string | null;
  huggingFaceUrl?: string | null;
};

export type PriceSnapshot = {
  updatedAt: string;
  source: string;
  items: PriceRecord[];
};

export type RankingRecord = {
  rank: number;
  name: string;
  shortName: string;
  creator: string;
  creatorSlug: string;
  creatorLogo: string;
  intelligenceIndex: number;
  codingIndex: number | null;
  agenticIndex: number | null;
  gpqa: number | null;
  hle: number | null;
  scicode: number | null;
  terminalbench: number | null;
  lcr: number | null;
  isReasoning: boolean;
  slug: string;
  isOpenWeights?: boolean | null;
  releaseDate?: string | null;
  huggingFaceUrl?: string | null;
};

export type RankingSnapshot = {
  updatedAt: string;
  source: string;
  items: RankingRecord[];
};

export type PopularRecord = {
  rank: number;
  id: string;
  canonicalSlug: string;
  name: string;
  provider: string;
  providerSlug: string;
  contextLength: number | null;
  inputPerMillion: number | null;
  outputPerMillion: number | null;
  inputModalities: string[];
  outputModalities: string[];
};

export type PopularSnapshot = {
  updatedAt: string;
  source: string;
  window: string;
  items: PopularRecord[];
};
