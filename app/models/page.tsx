import { ModelDirectory } from "@/components/ModelDirectory";
import { PageHeading, PageShell } from "@/components/PageShell";
import { buildCatalog } from "@/lib/model-catalog";
import { loadPrices, loadRankings } from "@/lib/data";
import { formatUpdatedAt } from "@/lib/format";

export default async function ModelsPage() {
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
  const latest = timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : null;
  const meta = latest
    ? `精选模型 · 数据更新至 ${formatUpdatedAt(latest)}`
    : "暂无数据";

  return (
    <PageShell active="models">
      <PageHeading
        title="模型目录"
        meta={meta}
      />
      {models.length > 0 ? (
        <ModelDirectory models={models} />
      ) : (
        <p className="text-sm text-muted-foreground">
          暂无数据。可在项目目录运行 <code className="font-mono text-foreground">npm run fetch</code> 后刷新。
        </p>
      )}
    </PageShell>
  );
}
