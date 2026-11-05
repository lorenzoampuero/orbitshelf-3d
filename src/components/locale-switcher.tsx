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
      className="inline-flex items-center rounded-full border border-line p-0.5 text-xs font-semibold"
    >
      <Link
        href={enHref}
        hrefLang="en"
        aria-current={locale === "en" ? "page" : undefined}
        data-testid="locale-en"
        className={cn(
          "rounded-full px-2.5 py-1 transition-colors",
          locale === "en" ? "bg-accent text-ink" : "text-muted hover:text-fg",
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
          "rounded-full px-2.5 py-1 transition-colors",
          locale === "es" ? "bg-accent text-ink" : "text-muted hover:text-fg",
        )}
      >
        ES
      </Link>
    </div>
  );
}
