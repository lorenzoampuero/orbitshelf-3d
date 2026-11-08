import Link from "next/link";
import { localePath } from "@/i18n/config";
import type { AdminCopy } from "@/content/admin-copy";
import type { Locale } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", href: "/dashboard/admin" },
  { key: "workspaces", href: "/dashboard/admin/workspaces" },
  { key: "payments", href: "/dashboard/admin/payments" },
] as const;

/** Sections of the admin panel. A plain list of links: the page you are on is marked, not scripted. */
export function AdminTabs({ locale, copy, current }: { locale: Locale; copy: AdminCopy["nav"]; current: (typeof TABS)[number]["key"] }) {
  return (
    <nav aria-label={copy.label} className="flex flex-wrap gap-2">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={localePath(locale, t.href)}
          aria-current={t.key === current ? "page" : undefined}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            t.key === current ? "border-accent bg-accent/10 text-accent" : "border-line text-muted hover:text-fg",
          )}
        >
          {copy[t.key]}
        </Link>
      ))}
    </nav>
  );
}
