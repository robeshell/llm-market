import { SiteHeader } from "@/components/SiteHeader";
import { CompareProvider } from "@/components/CompareContext";
import { CompareTray } from "@/components/CompareControls";

export function PageShell({
  active,
  showCompareTray = true,
  children,
}: {
  active?: "models" | "prices" | "rankings" | "popularity" | "custom-ranking";
  showCompareTray?: boolean;
  children: React.ReactNode;
}) {
  return (
    <CompareProvider>
      <div className="min-h-full site-app">
        <a href="#main" className="skip-link">
          跳到内容
        </a>
        <SiteHeader active={active} />
        <main
          id="main"
          className="site-content mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10"
          style={{ scrollMarginTop: "var(--header-height)" }}
        >
          {children}
        </main>
        {showCompareTray ? <CompareTray /> : null}
      </div>
    </CompareProvider>
  );
}

export function PageHeading({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1
          id="page-title"
          className="text-2xl font-medium tracking-tight text-foreground sm:text-[1.75rem]"
        >
          {title}
        </h1>
        {meta ? (
          <p className="text-sm text-muted-foreground">{meta}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
