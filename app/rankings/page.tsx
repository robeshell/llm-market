import { PageHeading, PageShell } from "@/components/PageShell";
import { RankingsTable } from "@/components/RankingsTable";
import { loadRankings } from "@/lib/data";
import { formatUpdatedAt } from "@/lib/format";

export default async function RankingsPage() {
  const snapshot = await loadRankings();
  const items = snapshot?.items ?? [];
  const meta = snapshot
    ? `${snapshot.source} · 跑分 · ${formatUpdatedAt(snapshot.updatedAt)}`
    : "暂无数据";

  return (
    <PageShell active="rankings">
      <PageHeading title="排行" meta={meta} />
      {items.length > 0 ? (
        <RankingsTable items={items} />
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
