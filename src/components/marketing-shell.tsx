"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, User } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { LocaleSwitcher } from "./locale-switcher";
import { localePath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/lib/types";
import { brand } from "@/config/brand";

export function MarketingShell({
  locale,
  dict,
  isSignedIn,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  isSignedIn: boolean;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-bg text-fg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-mint focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-bg"
      >
        {dict.common.skipToContent}
      </a>

      {/* Floating Glass Pill Navbar (matches reference design) */}
      <header className="sticky top-0 z-30 pt-4 pb-2">
        <div className="container-page">
          <div className="flex h-14 items-center justify-between gap-4 rounded-2xl border border-line/90 bg-surface/85 px-4 sm:px-6 backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.65)]">
            <BrandLogo locale={locale} />

            <nav aria-label={dict.common.mainNavigation} className="hidden lg:flex items-center gap-7 text-xs font-medium">
              <div className="group relative">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 py-2 text-muted hover:text-fg transition-colors"
                >
                  <span>{dict.nav.product}</span>
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity absolute left-0 top-full w-72 rounded-2xl border border-line bg-surface p-2 shadow-2xl">
                  <Link
                    href={localePath(locale, "/dashboard/create")}
                    className="block rounded-xl p-2.5 hover:bg-surface-2"
                  >
                    <div className="font-medium text-fg">{dict.nav.generate}</div>
                    <div className="text-xs text-muted">{dict.nav.generateDesc}</div>
                  </Link>
                  <Link
                    href={localePath(locale, "/dashboard/models")}
                    className="block rounded-xl p-2.5 hover:bg-surface-2"
                  >
                    <div className="font-medium text-fg">{dict.nav.review}</div>
                    <div className="text-xs text-muted">{dict.nav.reviewDesc}</div>
                  </Link>
                  <Link
                    href={localePath(locale, "/dashboard/embeds")}
                    className="block rounded-xl p-2.5 hover:bg-surface-2"
                  >
                    <div className="flex items-center justify-between font-medium text-fg">
                      <span>{dict.nav.viewer}</span>
                      <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-mint">
                        {dict.nav.plannedBadge}
                      </span>
                    </div>
                    <div className="text-xs text-muted">{dict.nav.viewerDesc}</div>
                  </Link>
                </div>
              </div>

              <Link href={localePath(locale, "/how-it-works")} className="text-muted hover:text-fg transition-colors">
                {dict.nav.howItWorks}
              </Link>
              <Link href={localePath(locale, "/examples")} className="text-muted hover:text-fg transition-colors">
                {dict.nav.examples}
              </Link>
              <Link href={localePath(locale, "/pricing")} className="text-muted hover:text-fg transition-colors">
                {dict.nav.pricing}
              </Link>

              <div className="group relative">
                <Link
                  href={localePath(locale, "/resources")}
                  className="inline-flex items-center gap-1 py-2 text-muted hover:text-fg transition-colors"
                >
                  <span>{dict.nav.resources}</span>
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity absolute left-0 top-full w-72 rounded-2xl border border-line bg-surface p-2 shadow-2xl">
                  <Link href={localePath(locale, "/resources")} className="block rounded-xl p-2.5 hover:bg-surface-2">
                    <div className="font-medium text-fg">{dict.nav.guides}</div>
                    <div className="text-xs text-muted">{dict.nav.guidesDesc}</div>
                  </Link>
                  <Link
                    href={localePath(locale, "/resources/glb-export-and-shopify")}
                    className="block rounded-xl p-2.5 hover:bg-surface-2"
                  >
                    <div className="font-medium text-fg">{dict.nav.docs}</div>
                    <div className="text-xs text-muted">{dict.nav.docsDesc}</div>
                  </Link>
                  <Link
                    href={localePath(locale, "/resources/faq")}
                    className="block rounded-xl p-2.5 hover:bg-surface-2"
                  >
                    <div className="font-medium text-fg">{dict.nav.faq}</div>
                    <div className="text-xs text-muted">{dict.nav.faqDesc}</div>
                  </Link>
                  <Link
                    href={localePath(locale, "/compare/ai-3d-vs-manual")}
                    className="block rounded-xl p-2.5 hover:bg-surface-2"
                  >
                    <div className="font-medium text-fg">{dict.nav.compare}</div>
                  </Link>
                </div>
              </div>
            </nav>

            <div className="hidden lg:flex items-center gap-2.5">
              <LocaleSwitcher locale={locale} label={dict.common.language} />
              <Link
                href={localePath(locale, isSignedIn ? "/dashboard" : "/login")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface-2/80 px-3.5 py-1.5 text-xs font-medium text-fg hover:border-mint transition-colors"
              >
                <User className="h-3.5 w-3.5 text-mint" aria-hidden="true" />
                <span>{isSignedIn ? dict.nav.dashboard : dict.nav.signIn}</span>
              </Link>
            </div>

            <div className="flex lg:hidden items-center gap-2">
              <LocaleSwitcher locale={locale} label={dict.common.language} />
              <button
                type="button"
                aria-expanded={mobileOpen}
                aria-controls="mobile-marketing-menu"
                aria-label={mobileOpen ? dict.common.closeMenu : dict.common.openMenu}
                onClick={() => setMobileOpen((v) => !v)}
                className="rounded-xl border border-line bg-surface-2 p-2 text-fg"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {mobileOpen && (
            <nav
              id="mobile-marketing-menu"
              aria-label={dict.common.mobileNavigation}
              className="lg:hidden mt-2 rounded-2xl border border-line bg-surface px-6 py-4 space-y-3 text-sm shadow-2xl"
            >
              <Link onClick={() => setMobileOpen(false)} href={localePath(locale, "/how-it-works")} className="block py-1 text-fg">
                {dict.nav.howItWorks}
              </Link>
              <Link onClick={() => setMobileOpen(false)} href={localePath(locale, "/examples")} className="block py-1 text-fg">
                {dict.nav.examples}
              </Link>
              <Link onClick={() => setMobileOpen(false)} href={localePath(locale, "/pricing")} className="block py-1 text-fg">
                {dict.nav.pricing}
              </Link>
              <Link onClick={() => setMobileOpen(false)} href={localePath(locale, "/resources")} className="block py-1 text-fg">
                {dict.nav.resources}
              </Link>
              <Link onClick={() => setMobileOpen(false)} href={localePath(locale, "/compare/ai-3d-vs-manual")} className="block py-1 text-fg">
                {dict.nav.compare}
              </Link>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  onClick={() => setMobileOpen(false)}
                  href={localePath(locale, isSignedIn ? "/dashboard" : "/login")}
                  className="rounded-xl border border-line px-3 py-2 text-center font-medium text-fg"
                >
                  {isSignedIn ? dict.nav.dashboard : dict.nav.signIn}
                </Link>
                <Link
                  onClick={() => setMobileOpen(false)}
                  href={localePath(locale, "/dashboard/create")}
                  className="rounded-xl bg-mint px-4 py-2.5 text-center font-semibold text-bg"
                >
                  {dict.nav.cta}
                </Link>
              </div>
            </nav>
          )}
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-line/70 bg-bg py-14 text-sm text-muted">
        <div className="container-page space-y-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-3">
              <BrandLogo locale={locale} />
              <p className="text-xs leading-relaxed text-muted">{dict.footer.note}</p>
            </div>
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg">{dict.footer.product}</h2>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href={localePath(locale, "/how-it-works")} className="hover:text-fg">
                    {dict.nav.howItWorks}
                  </Link>
                </li>
                <li>
                  <Link href={localePath(locale, "/examples")} className="hover:text-fg">
                    {dict.nav.examples}
                  </Link>
                </li>
                <li>
                  <Link href={localePath(locale, "/pricing")} className="hover:text-fg">
                    {dict.nav.pricing}
                  </Link>
                </li>
                <li>
                  <Link href={localePath(locale, "/compare/ai-3d-vs-manual")} className="hover:text-fg">
                    {dict.nav.compare}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg">{dict.footer.resources}</h2>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href={localePath(locale, "/resources")} className="hover:text-fg">
                    {dict.nav.guides}
                  </Link>
                </li>
                <li>
                  <Link href={localePath(locale, "/resources/glb-export-and-shopify")} className="hover:text-fg">
                    {dict.nav.docs}
                  </Link>
                </li>
                <li>
                  <Link href={localePath(locale, "/resources/faq")} className="hover:text-fg">
                    {dict.nav.faq}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg">{dict.footer.legal}</h2>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href={localePath(locale, "/privacy")} className="hover:text-fg">
                    {dict.footer.privacy}
                  </Link>
                </li>
                <li>
                  <Link href={localePath(locale, "/terms")} className="hover:text-fg">
                    {dict.footer.terms}
                  </Link>
                </li>
                <li>
                  <a href={`mailto:${brand.supportEmail}`} className="hover:text-fg">
                    {dict.footer.contact}: {brand.supportEmail}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-line/60 pt-6 text-xs">
            <span>© 2026 {brand.fullName}</span>
            <span>{dict.footer.rights}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
