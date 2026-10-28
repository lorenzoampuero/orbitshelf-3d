import Link from "next/link";
import { brand } from "@/config/brand";
import { localePath } from "@/i18n/config";
import type { Locale } from "@/lib/types";

export function BrandLogo({ locale, href }: { locale: Locale; href?: string }) {
  const target = href ?? localePath(locale, "/");
  return (
    <Link
      href={target}
      className="inline-flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-fg"
    >
      <span
        aria-hidden="true"
        className="inline-block h-4 w-4 rounded-[5px] bg-gradient-to-br from-mint to-violet shadow-sm"
      />
      <span>
        {brand.wordmark.lead}
        <span className="text-mint">{brand.wordmark.tail}</span>
        <span className="ml-1.5 rounded bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted">
          {brand.suffix}
        </span>
      </span>
    </Link>
  );
}
