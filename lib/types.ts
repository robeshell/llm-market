export type PriceRecord = {
  id: string;
  name: string;
  provider: string;
  creatorLogo: string;
  contextLength: number | null;
  inputPerMillion: number | null;
  outputPerMillion: number | null;
  intelligenceIndex: number | null;
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
};

export type RankingSnapshot = {
  updatedAt: string;
  source: string;
  items: RankingRecord[];
};
