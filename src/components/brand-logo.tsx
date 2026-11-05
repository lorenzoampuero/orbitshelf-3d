import Link from "next/link";
import { brand } from "@/config/brand";
import { localePath } from "@/i18n/config";
import type { Locale } from "@/lib/types";

/** `tone="ink"` is for use on the orange hero field, where the logo must be dark. */
export function BrandLogo({ locale, href, tone = "default" }: { locale: Locale; href?: string; tone?: "default" | "ink" }) {
  const target = href ?? localePath(locale, "/");
  const ink = tone === "ink";
  return (
    <Link href={target} className={`inline-flex items-center gap-2.5 font-display text-lg font-bold tracking-tight ${ink ? "text-ink" : "text-fg"}`}>
      <span aria-hidden="true" className={`inline-block h-3.5 w-3.5 rounded-full ${ink ? "bg-ink" : "bg-accent"}`} />
      <span>
        {brand.wordmark.lead}
        {brand.wordmark.tail}
        <span className={`ml-1 font-medium ${ink ? "text-ink/70" : "text-muted"}`}>{brand.suffix}</span>
      </span>
    </Link>
  );
}
