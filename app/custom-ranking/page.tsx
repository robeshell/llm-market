import { CustomRankingBuilder } from "@/components/CustomRankingBuilder";
import { PageHeading, PageShell } from "@/components/PageShell";
import { buildCatalog } from "@/lib/model-catalog";
import { loadPrices, loadRankings } from "@/lib/data";
import { formatUpdatedAt } from "@/lib/format";

export default async function CustomRankingPage() {
  const [pricesSnapshot, rankingsSnapshot] = await Promise.all([
    loadPrices(),
    loadRankings(),
  ]);
  const models = buildCatalog(
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
      : "";

  return (
    <PageShell active="custom-ranking" showCompareTray={false}>
      <PageHeading
        title="自定义榜单"
        meta={latest ? `拖拽模型 · 数据更新至 ${formatUpdatedAt(latest)}` : "拖拽模型，生成你的榜单图片"}
      />
      {models.length > 0 ? (
        <CustomRankingBuilder models={models} updatedAt={latest} />
      ) : (
        <p className="text-sm text-muted-foreground">
          暂无模型数据。可在项目目录运行 <code className="font-mono text-foreground">npm run fetch</code> 后刷新。
        </p>
      )}
    </PageShell>
  );
}
