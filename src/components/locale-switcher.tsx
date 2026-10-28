"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { switchLocalePath } from "@/i18n/config";
import type { Locale } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() || "/";
  const enHref = switchLocalePath(pathname, "en");
  const esHref = switchLocalePath(pathname, "es");

  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center rounded-lg border border-line bg-surface-2 p-0.5 text-xs font-semibold"
    >
      <Link
        href={enHref}
        hrefLang="en"
        aria-current={locale === "en" ? "page" : undefined}
        data-testid="locale-en"
        className={cn(
          "rounded-md px-2.5 py-1 transition-colors",
          locale === "en" ? "bg-mint text-bg" : "text-muted hover:text-fg",
        )}
      >
        EN
      </Link>
      <Link
        href={esHref}
        hrefLang="es"
        aria-current={locale === "es" ? "page" : undefined}
        data-testid="locale-es"
        className={cn(
          "rounded-md px-2.5 py-1 transition-colors",
          locale === "es" ? "bg-mint text-bg" : "text-muted hover:text-fg",
        )}
      >
        ES
      </Link>
    </div>
  );
}
