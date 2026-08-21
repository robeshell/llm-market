import Link from "next/link";

const links = [
  { href: "/prices", label: "价格", key: "prices" },
  { href: "/rankings", label: "排行", key: "rankings" },
] as const;

export function SiteHeader({
  active,
}: {
  active?: "prices" | "rankings";
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-[2px]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link
          href="/prices"
          className="text-[0.9375rem] font-medium tracking-tight text-foreground transition-opacity duration-200 hover:opacity-70"
        >
          llm-market
        </Link>
        <nav className="flex items-center gap-1" aria-label="主导航">
          {links.map((link) => {
            const isActive = active === link.key;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "inline-flex h-11 items-center px-3 text-sm transition-colors duration-200",
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
