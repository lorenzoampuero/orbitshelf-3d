"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Coins, Menu, X, LogOut, ArrowLeft, UserRound } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { LocaleSwitcher } from "./locale-switcher";
import { localePath, stripLocale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale, SessionUser } from "@/lib/types";
import { studioCopy } from "@/content/studio-copy";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; planned?: boolean; matches?: string[] };

export function DashboardShell({
  locale,
  dict,
  user,
  providerReady,
  billingLive = false,
  adminLabel,
  balance,
  balanceLabel,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  user: SessionUser;
  providerReady: boolean;
  billingLive?: boolean;
  /** Set only for owner accounts (ADMIN_EMAILS): adds the admin entry to the account menu. */
  adminLabel?: string;
  /** Credits left in this workspace, shown in the top bar and linked to billing. */
  balance: number;
  balanceLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/dashboard";
  const neutralPath = stripLocale(pathname);
  const router = useRouter();
  const copy = studioCopy[locale].nav;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const mainItems: NavItem[] = [
    { href: "/dashboard", label: copy.create, matches: ["/dashboard/create"] },
    { href: "/dashboard/models", label: dict.dash.nav.models },
    { href: "/dashboard/explore", label: copy.explore },
    { href: "/dashboard/connections", label: copy.connections, matches: ["/dashboard/embeds"] },
    { href: "/dashboard/api", label: copy.agents },
  ];

  const accountItems: NavItem[] = [
    { href: "/dashboard/usage", label: dict.dash.nav.usage },
    { href: "/dashboard/billing", label: dict.dash.nav.billing, planned: !billingLive },
    { href: "/dashboard/settings", label: dict.dash.nav.settings },
    { href: "/dashboard/help", label: dict.dash.nav.help },
    ...(adminLabel ? [{ href: "/dashboard/admin", label: adminLabel }] : []),
  ];

  function isActive(item: NavItem): boolean {
    const targets = [item.href, ...(item.matches ?? [])];
    return targets.some((t) => (t === "/dashboard" ? neutralPath === t : neutralPath === t || neutralPath.startsWith(t + "/")));
  }

  // The account menu closes on a click outside it and on Escape, like any other menu.
  useEffect(() => {
    if (!accountOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(localePath(locale, "/login"));
    router.refresh();
  }

  const closeAll = () => {
    setAccountOpen(false);
    setMobileOpen(false);
  };

  const plannedTag = <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">{dict.common.planned}</span>;

  return (
    <div data-theme="app" className="flex min-h-screen flex-col bg-bg text-fg">
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-bg"
      >
        {dict.common.skipToContent}
      </a>

      <header className="sticky top-0 z-40 px-3 pt-3 md:px-5">
        <div className="pill-nav mx-auto flex h-14 max-w-[1320px] items-center justify-between gap-3 rounded-full pl-5 pr-2">
          <div className="flex min-w-0 items-center gap-6">
            <BrandLogo locale={locale} href={localePath(locale, "/dashboard")} />
            <nav aria-label={dict.dash.nav.sidebar} className="hidden lg:block">
              <ul className="flex items-center gap-0.5">
                {mainItems.map((item) => {
                  const active = isActive(item);
                  return (
                    <li key={item.href}>
                      <Link
                        href={localePath(locale, item.href)}
                        aria-current={active ? "page" : undefined}
                        className={cn("whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-colors", active ? "bg-accent/15 text-accent" : "text-muted hover:text-fg")}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={localePath(locale, "/dashboard/billing")}
              data-testid="credit-chip"
              aria-label={`${balanceLabel}: ${balance}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent",
                balance < 1 ? "border-warn/60 text-warn" : "border-line text-fg",
              )}
            >
              <Coins className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-mono text-sm font-semibold tabular-nums">{balance}</span>
              <span className="hidden text-muted xl:inline">{balanceLabel}</span>
            </Link>
            <span
              data-testid="provider-mode-pill"
              className={cn("hidden rounded-full border px-3 py-1.5 text-xs font-medium xl:inline-block", providerReady ? "border-accent/50 text-accent" : "border-line text-muted")}
            >
              {providerReady ? dict.dash.source.ai : dict.dash.source.demo}
            </span>
            <div className="hidden md:block">
              <LocaleSwitcher locale={locale} label={dict.common.language} />
            </div>

            <div ref={accountRef} className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                aria-expanded={accountOpen}
                aria-controls="account-menu"
                aria-label={copy.menu}
                data-testid="account-menu-btn"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-fg hover:text-accent"
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
              </button>
              {accountOpen && (
                <div id="account-menu" className="mega-panel menu-in absolute right-0 top-12 w-64 rounded-[20px] p-2">
                  <p className="truncate px-3 py-2 text-xs text-muted">{user.email}</p>
                  <ul>
                    {accountItems.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={localePath(locale, item.href)}
                          onClick={closeAll}
                          aria-current={isActive(item) ? "page" : undefined}
                          className={cn("flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5", isActive(item) ? "text-accent" : "text-fg")}
                        >
                          <span>{item.label}</span>
                          {item.planned && plannedTag}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <hr className="my-1 border-line" />
                  <Link href={localePath(locale, "/")} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-fg">
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    {dict.dash.nav.marketing}
                  </Link>
                  <button type="button" onClick={handleSignOut} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-fg">
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                    {dict.nav.signOut}
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-dashboard-drawer"
              aria-label={mobileOpen ? dict.common.closeMenu : dict.dash.nav.openNavigation}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-fg lg:hidden"
            >
              {mobileOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <nav id="mobile-dashboard-drawer" aria-label={dict.common.mobileNavigation} className="fixed inset-x-0 bottom-0 top-[76px] z-30 overflow-y-auto bg-bg p-4 lg:hidden">
          <ul className="space-y-1">
            {[...mainItems, ...accountItems].map((item) => (
              <li key={item.href}>
                <Link
                  href={localePath(locale, item.href)}
                  onClick={closeAll}
                  aria-current={isActive(item) ? "page" : undefined}
                  className={cn("flex items-center justify-between rounded-2xl px-4 py-3 text-base font-medium", isActive(item) ? "bg-accent/15 text-accent" : "text-fg")}
                >
                  <span>{item.label}</span>
                  {item.planned && plannedTag}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
            <span className="min-w-0 truncate text-xs text-muted">{user.email}</span>
            <div className="md:hidden">
              <LocaleSwitcher locale={locale} label={dict.common.language} />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Link onClick={closeAll} href={localePath(locale, "/")} className="text-sm text-muted hover:text-fg">
              ← {dict.dash.nav.marketing}
            </Link>
            <button type="button" onClick={handleSignOut} className="text-sm text-muted hover:text-fg">
              {dict.nav.signOut}
            </button>
          </div>
        </nav>
      )}

      <main id="dashboard-main" className="mx-auto w-full max-w-[1320px] flex-1 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
