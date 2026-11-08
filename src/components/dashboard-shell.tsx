"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PlusSquare,
  Boxes,
  Compass,
  KeyRound,
  Share2,
  Activity,
  CreditCard,
  Settings,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { LocaleSwitcher } from "./locale-switcher";
import { localePath, stripLocale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale, SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  planned?: boolean;
};

export function DashboardShell({
  locale,
  dict,
  user,
  providerReady,
  billingLive = false,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  user: SessionUser;
  providerReady: boolean;
  billingLive?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/dashboard";
  const neutralPath = stripLocale(pathname);
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const workItems: NavItem[] = [
    { href: "/dashboard", label: dict.dash.nav.overview, icon: LayoutDashboard },
    { href: "/dashboard/create", label: dict.dash.nav.create, icon: PlusSquare },
    { href: "/dashboard/models", label: dict.dash.nav.models, icon: Boxes },
    { href: "/dashboard/explore", label: dict.dash.nav.explore, icon: Compass },
  ];

  const manageItems: NavItem[] = [
    { href: "/dashboard/embeds", label: dict.dash.nav.embeds, icon: Share2 },
    { href: "/dashboard/usage", label: dict.dash.nav.usage, icon: Activity },
    { href: "/dashboard/api", label: dict.dash.nav.api, icon: KeyRound },
    { href: "/dashboard/billing", label: dict.dash.nav.billing, icon: CreditCard, planned: !billingLive },
  ];

  const bottomItems: NavItem[] = [
    { href: "/dashboard/settings", label: dict.dash.nav.settings, icon: Settings },
    { href: "/dashboard/help", label: dict.dash.nav.help, icon: HelpCircle },
  ];

  function isActive(target: string): boolean {
    if (target === "/dashboard") return neutralPath === "/dashboard";
    return neutralPath === target || neutralPath.startsWith(target + "/");
  }

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(localePath(locale, "/login"));
    router.refresh();
  }

  function renderNavList(items: NavItem[], onClick?: () => void) {
    return (
      <ul className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={localePath(locale, item.href)}
                onClick={onClick}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-surface-2 text-accent border border-line"
                    : "text-muted hover:bg-surface-2/60 hover:text-fg border border-transparent",
                )}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </span>
                {!collapsed && item.planned && (
                  <span className="rounded bg-bg px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-accent">
                    {dict.common.planned}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div data-theme="app" className="min-h-screen flex bg-bg text-fg">
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-bg"
      >
        {dict.common.skipToContent}
      </a>

      {/* Desktop Sidebar */}
      <aside
        aria-label={dict.dash.nav.sidebar}
        data-collapsed={collapsed ? "true" : "false"}
        className={cn(
          "hidden md:flex flex-col justify-between border-r border-line bg-surface p-3 transition-[width]",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-2 px-1">
            {!collapsed && <BrandLogo locale={locale} href={localePath(locale, "/dashboard")} />}
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? dict.dash.nav.expand : dict.dash.nav.collapse}
              data-testid="sidebar-collapse-btn"
              className="rounded-lg border border-line p-1.5 text-muted hover:text-fg"
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>

          <nav aria-label={dict.dash.nav.sidebar} className="space-y-4">
            <div>
              {!collapsed && (
                <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {dict.dash.nav.groupWork}
                </div>
              )}
              {renderNavList(workItems)}
            </div>
            <hr className="border-line" />
            <div>
              {!collapsed && (
                <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {dict.dash.nav.groupManage}
                </div>
              )}
              {renderNavList(manageItems)}
            </div>
            <hr className="border-line" />
            <div>{renderNavList(bottomItems)}</div>
          </nav>
        </div>

        <div className="space-y-2 border-t border-line pt-3">
          {!collapsed && (
            <div className="rounded-xl border border-line bg-bg px-3 py-2 text-xs">
              <div className="font-medium text-fg truncate">{user.email}</div>
              <div className="text-[11px] text-muted">{dict.dash.localBadge}</div>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            {!collapsed && (
              <Link
                href={localePath(locale, "/")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:text-fg"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{dict.dash.nav.marketing}</span>
              </Link>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              aria-label={dict.nav.signOut}
              title={dict.nav.signOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:text-fg"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              {!collapsed && <span>{dict.nav.signOut}</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-14 items-center justify-between gap-3 border-b border-line bg-surface px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-dashboard-drawer"
              aria-label={mobileOpen ? dict.common.closeMenu : dict.dash.nav.openNavigation}
              className="md:hidden rounded-lg border border-line p-1.5 text-fg"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <span className="text-sm font-medium text-muted">{dict.dash.workspace}</span>
          </div>

          <div className="flex items-center gap-3">
            <span
              data-testid="provider-mode-pill"
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                providerReady ? "border-accent/50 text-accent" : "border-line text-muted",
              )}
            >
              {providerReady ? dict.dash.source.ai : dict.dash.source.demo}
            </span>
            <LocaleSwitcher locale={locale} label={dict.common.language} />
          </div>
        </header>

        {mobileOpen && (
          <nav
            id="mobile-dashboard-drawer"
            aria-label={dict.common.mobileNavigation}
            className="md:hidden border-b border-line bg-surface p-4 space-y-3"
          >
            {renderNavList([...workItems, ...manageItems, ...bottomItems], () => setMobileOpen(false))}
            <div className="flex items-center justify-between border-t border-line pt-3">
              <Link
                onClick={() => setMobileOpen(false)}
                href={localePath(locale, "/")}
                className="text-xs text-muted hover:text-fg"
              >
                ← {dict.dash.nav.marketing}
              </Link>
              <button type="button" onClick={handleSignOut} className="text-xs text-muted hover:text-fg">
                {dict.nav.signOut}
              </button>
            </div>
          </nav>
        )}

        <main id="dashboard-main" className="flex-1 p-4 md:p-8 max-w-[1240px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
