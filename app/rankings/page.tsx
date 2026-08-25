import { PageHeading, PageShell } from "@/components/PageShell";
import { RankingsTable } from "@/components/RankingsTable";
import { buildCatalog } from "@/lib/model-catalog";
import { loadPrices, loadRankings } from "@/lib/data";
import { formatUpdatedAt } from "@/lib/format";

export default async function RankingsPage() {
  const [snapshot, pricesSnapshot] = await Promise.all([
    loadRankings(),
    loadPrices(),
  ]);
  const items = snapshot?.items ?? [];
  const catalog = buildCatalog(
    pricesSnapshot?.items ?? [],
    snapshot?.items ?? [],
  );
  const meta = snapshot
    ? `数据更新至 ${formatUpdatedAt(snapshot.updatedAt)}`
    : "暂无数据";

  return (
    <PageShell active="rankings">
      <PageHeading title="模型评测" meta={meta} />
      {items.length > 0 ? (
        <RankingsTable
          items={items}
          catalog={catalog}
          updatedAt={snapshot?.updatedAt ?? ""}
          source={snapshot?.source ?? "Artificial Analysis"}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          暂无数据。可在项目目录运行{" "}
          <code className="font-mono text-foreground">npm run fetch:rankings</code>{" "}
          后刷新。
        </p>
      )}
    </PageShell>
  );
}
