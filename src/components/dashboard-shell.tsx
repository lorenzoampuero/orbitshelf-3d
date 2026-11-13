"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Boxes,
  Braces,
  Coins,
  Compass,
  LifeBuoy,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Search,
  Settings,
  Sparkles,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { LocaleSwitcher } from "./locale-switcher";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { brand } from "@/config/brand";
import { localePath, stripLocale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale, SessionUser, UseCase } from "@/lib/types";
import { studioCopy } from "@/content/studio-copy";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; planned?: boolean; matches?: string[] };

/**
 * The app frame: a side rail (icons, widening to icons and names) on desktop, a 56 px top bar with the workspace, search, mode, credits,
 * language and account, and a bottom bar of the five destinations on phones. The account menu keeps its id and testids.
 */
export function DashboardShell({
  locale,
  dict,
  user,
  providerReady,
  billingLive = false,
  adminLabel,
  balance,
  balanceLabel,
  workspace,
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
  /** The use case the profile has chosen (null until it picks one); the top bar lets it change. */
  workspace: UseCase | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/dashboard";
  const neutralPath = stripLocale(pathname);
  const router = useRouter();
  const copy = studioCopy[locale].nav;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [wide, setWide] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const mainItems: NavItem[] = [
    { href: "/dashboard", label: copy.create, icon: Sparkles, matches: ["/dashboard/create"] },
    { href: "/dashboard/models", label: dict.dash.nav.models, icon: Boxes },
    { href: "/dashboard/explore", label: copy.explore, icon: Compass },
    { href: "/dashboard/connections", label: copy.connections, icon: Plug, matches: ["/dashboard/embeds"] },
    { href: "/dashboard/api", label: copy.agents, icon: Braces },
  ];
  const footItems: NavItem[] = [
    { href: "/dashboard/help", label: dict.dash.nav.help, icon: LifeBuoy },
    { href: "/dashboard/settings", label: dict.dash.nav.settings, icon: Settings },
  ];

  const accountItems: Omit<NavItem, "icon">[] = [
    { href: "/dashboard/usage", label: dict.dash.nav.usage },
    { href: "/dashboard/billing", label: dict.dash.nav.billing, planned: !billingLive },
    { href: "/dashboard/settings", label: dict.dash.nav.settings },
    { href: "/dashboard/help", label: dict.dash.nav.help },
    ...(adminLabel ? [{ href: "/dashboard/admin", label: adminLabel }] : []),
  ];

  function isActive(item: { href: string; matches?: string[] }): boolean {
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

  const railLink = (item: NavItem) => {
    const active = isActive(item);
    const Icon = item.icon;
    return (
      <li key={item.href}>
        <Link
          href={localePath(locale, item.href)}
          aria-current={active ? "page" : undefined}
          aria-label={wide ? undefined : item.label}
          title={wide ? undefined : item.label}
          className={cn(
            "group relative flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition-colors",
            active ? "bg-accent-fill/20 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
          )}
        >
          {active && <span aria-hidden="true" className="absolute -left-3 top-2.5 h-6 w-1 rounded-full bg-[var(--accent-grad)] [background:var(--accent-grad)]" />}
          <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-accent" : "")} aria-hidden="true" />
          {wide && <span className="truncate">{item.label}</span>}
        </Link>
      </li>
    );
  };

  return (
    <div data-theme="app" className="min-h-screen bg-bg text-fg">
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-bg"
      >
        {dict.common.skipToContent}
      </a>

      {/* Side rail (desktop). */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-surface-1 px-3 pb-3 pt-3 transition-[width] duration-[var(--t-panel)] ease-[var(--ease-out)] lg:flex",
          wide ? "w-[232px]" : "w-[72px]",
        )}
      >
        <Link
          href={localePath(locale, "/dashboard")}
          aria-label={`${brand.wordmark.lead}${brand.wordmark.tail}`}
          className="flex h-11 items-center gap-3 rounded-xl px-3.5 font-display text-base font-bold tracking-tight text-fg"
        >
          <span aria-hidden="true" className="inline-block h-3.5 w-3.5 shrink-0 rounded-full bg-accent" />
          {wide && (
            <span className="truncate">
              {brand.wordmark.lead}
              {brand.wordmark.tail}
            </span>
          )}
        </Link>
        <nav aria-label={dict.dash.nav.sidebar} className="mt-4 flex-1">
          <ul className="space-y-1.5">{mainItems.map(railLink)}</ul>
        </nav>
        <ul className="space-y-1.5 border-t border-line pt-3">
          {footItems.map(railLink)}
          <li>
            <button
              type="button"
              onClick={() => setWide((v) => !v)}
              aria-label={wide ? copy.collapse : copy.expand}
              title={wide ? copy.collapse : copy.expand}
              className="flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              {wide ? <PanelLeftClose className="h-[18px] w-[18px] shrink-0" aria-hidden="true" /> : <PanelLeftOpen className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />}
              {wide && <span className="truncate">{copy.collapse}</span>}
            </button>
          </li>
        </ul>
      </aside>

      <div className={cn("flex min-h-screen min-w-0 flex-col transition-[padding] duration-[var(--t-panel)] ease-[var(--ease-out)]", wide ? "lg:pl-[232px]" : "lg:pl-[72px]")}>
        {/* Top bar. */}
        <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-xl">
          <div className="flex h-14 items-center justify-between gap-3 px-3 md:px-6">
            <div className="flex min-w-0 items-center gap-4">
              <div className="lg:hidden">
                <BrandLogo locale={locale} href={localePath(locale, "/dashboard")} />
              </div>
              <div className="hidden lg:block">
                <WorkspaceSwitcher dict={dict} active={workspace} />
              </div>
              <form role="search" action={localePath(locale, "/dashboard/models")} method="get" className="relative hidden md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input
                  type="search"
                  name="q"
                  maxLength={120}
                  aria-label={copy.search}
                  placeholder={copy.searchPlaceholder}
                  data-testid="topbar-search"
                  className="h-9 w-44 rounded-full border border-line bg-surface-1 pl-9 pr-3 text-sm text-fg placeholder:text-muted focus:w-60 lg:w-56 lg:focus:w-72 transition-[width]"
                />
              </form>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span
                data-testid="provider-mode-pill"
                className={cn("hidden rounded-full border px-3 py-1.5 text-xs font-medium xl:inline-block", providerReady ? "border-accent/50 text-accent" : "border-line text-muted")}
              >
                {providerReady ? dict.dash.source.ai : dict.dash.source.demo}
              </span>
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
          <nav id="mobile-dashboard-drawer" aria-label={dict.common.mobileNavigation} className="fixed inset-x-0 bottom-16 top-14 z-30 overflow-y-auto bg-bg p-4 lg:hidden">
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
            <div className="mt-4 space-y-3 border-t border-line pt-4">
              <WorkspaceSwitcher dict={dict} active={workspace} />
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-xs text-muted">{user.email}</span>
                <div className="md:hidden">
                  <LocaleSwitcher locale={locale} label={dict.common.language} />
                </div>
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

        <main id="dashboard-main" className="mx-auto w-full max-w-[1320px] flex-1 p-4 pb-24 md:p-8 md:pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Bottom bar (phones and tablets). */}
      <nav aria-label={copy.main} className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface-1/95 backdrop-blur-xl lg:hidden">
        <ul className="grid grid-cols-5">
          {mainItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <li key={item.href} className="min-w-0">
                <Link
                  href={localePath(locale, item.href)}
                  onClick={closeAll}
                  aria-current={active ? "page" : undefined}
                  className={cn("flex h-16 flex-col items-center justify-center gap-1 px-1 text-xs font-medium", active ? "text-accent" : "text-muted")}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span className="w-full truncate text-center">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
