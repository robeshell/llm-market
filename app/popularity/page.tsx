import { PageHeading, PageShell } from "@/components/PageShell";
import { PopularityTable } from "@/components/PopularityTable";
import { buildCatalog } from "@/lib/model-catalog";
import { loadPopularity, loadPrices, loadRankings } from "@/lib/data";
import { formatUpdatedAt } from "@/lib/format";

export default async function PopularityPage() {
  const [snapshot, pricesSnapshot, rankingsSnapshot] = await Promise.all([
    loadPopularity(),
    loadPrices(),
    loadRankings(),
  ]);
  const catalog = buildCatalog(
    pricesSnapshot?.items ?? [],
    rankingsSnapshot?.items ?? [],
  );
  const items = snapshot?.items ?? [];
  const meta = snapshot
    ? `OpenRouter · 近 7 天 · 更新至 ${formatUpdatedAt(snapshot.updatedAt)}`
    : "暂无数据";

  return (
    <PageShell active="popularity">
      <PageHeading title="使用排行" meta={meta} />
      {items.length > 0 ? (
        <PopularityTable
          items={items}
          catalog={catalog}
          updatedAt={snapshot?.updatedAt ?? ""}
          source={snapshot?.source ?? "OpenRouter"}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          暂无数据。可在项目目录运行{" "}
          <code className="font-mono text-foreground">npm run fetch:popularity</code>{" "}
          后刷新。
        </p>
      )}
    </PageShell>
  );
}
