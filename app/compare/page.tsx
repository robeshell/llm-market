import { CompareTable } from "@/components/CompareTable";
import { PageHeading, PageShell } from "@/components/PageShell";
import { buildCatalog } from "@/lib/model-catalog";
import { loadPrices, loadRankings } from "@/lib/data";
import { formatUpdatedAt } from "@/lib/format";

export default async function ComparePage() {
  const [pricesSnapshot, rankingsSnapshot] = await Promise.all([
    loadPrices(),
    loadRankings(),
  ]);
  const catalog = buildCatalog(
    pricesSnapshot?.items ?? [],
    rankingsSnapshot?.items ?? [],
  );
  const timestamps = [pricesSnapshot?.updatedAt, rankingsSnapshot?.updatedAt]
    .filter(Boolean)
    .map((value) => new Date(value!).getTime())
    .filter((value) => Number.isFinite(value));
  const latest =
    timestamps.length > 0
      ? new Date(Math.max(...timestamps)).toISOString()
      : null;

  return (
    <PageShell active="models">
      <PageHeading
        title="模型对比"
        meta={latest ? `数据更新至 ${formatUpdatedAt(latest)}` : "暂无数据"}
      />
      <CompareTable catalog={catalog} />
    </PageShell>
  );
}

