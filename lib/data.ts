import { readFile } from "node:fs/promises";
import path from "node:path";
import type {
  PopularSnapshot,
  PriceSnapshot,
  RankingSnapshot,
} from "./types";

export {
  formatNumber,
  formatUpdatedAt,
  formatUsdPerMillion,
} from "./format";

const dataDir = path.join(process.cwd(), "data");

async function readJson<T>(filename: string): Promise<T | null> {
  try {
    const raw = await readFile(path.join(dataDir, filename), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadPrices() {
  return readJson<PriceSnapshot>("prices.json");
}

export function loadRankings() {
  return readJson<RankingSnapshot>("rankings.json");
}

export function loadPopularity() {
  return readJson<PopularSnapshot>("popularity.json");
}
