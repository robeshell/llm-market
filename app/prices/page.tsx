import { PageHeading, PageShell } from "@/components/PageShell";
import { PricesTable } from "@/components/PricesTable";
import { loadPrices } from "@/lib/data";
import { formatUpdatedAt } from "@/lib/format";

export default async function PricesPage() {
  const snapshot = await loadPrices();
  const items = snapshot?.items ?? [];
  const meta = snapshot
    ? `${snapshot.source} · ${formatUpdatedAt(snapshot.updatedAt)}`
    : "暂无数据";

  return (
    <PageShell active="prices">
      <PageHeading title="价格" meta={meta} />
      {items.length > 0 ? (
        <PricesTable items={items} />
      ) : (
        <p className="text-sm text-muted-foreground">
          暂无数据。可在项目目录运行{" "}
          <code className="font-mono text-foreground">npm run fetch:prices</code>{" "}
          后刷新。
        </p>
      )}
    </PageShell>
  );
}
