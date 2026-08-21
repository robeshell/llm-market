"use client";

import { useState } from "react";

export function VendorBadge({
  name,
  logoSrc,
}: {
  name: string;
  logoSrc?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(logoSrc) && !failed;
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoSrc!}
          alt=""
          width={16}
          height={16}
          className="h-4 w-4 shrink-0 object-contain"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          aria-hidden
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center border border-border text-[10px] leading-none text-muted-foreground"
        >
          {initial}
        </span>
      )}
      <span className="min-w-0 break-words" title={name}>
        {name}
      </span>
    </span>
  );
}
