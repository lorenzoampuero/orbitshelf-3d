"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
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
  const links = [
    { href: "/how-it-works", label: dict.nav.howItWorks },
    { href: "/examples", label: dict.nav.examples },
    { href: "/pricing", label: dict.nav.pricing },
    { href: "/resources", label: dict.nav.resources },
  ];
  const accountHref = localePath(locale, isSignedIn ? "/dashboard" : "/login");

  return (
    <div className="min-h-screen flex flex-col bg-bg text-fg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
      >
        {dict.common.skipToContent}
      </a>

      {/* Flat, full-width bar: no glass, no hover menus. Every destination is one visible link. */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg">
        <div className="container-page flex h-16 items-center justify-between gap-6">
          <BrandLogo locale={locale} />

          <nav aria-label={dict.common.mainNavigation} className="hidden lg:flex items-center gap-8 text-sm font-medium">
            {links.map((l) => (
              <Link key={l.href} href={localePath(locale, l.href)} className="text-muted transition-colors hover:text-fg">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <LocaleSwitcher locale={locale} label={dict.common.language} />
            <Link href={accountHref} className="btn-pill btn-outline px-4 py-2 text-fg">
              {isSignedIn ? dict.nav.dashboard : dict.nav.signIn}
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
              className="rounded-full border border-line p-2 text-fg"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav id="mobile-marketing-menu" aria-label={dict.common.mobileNavigation} className="lg:hidden border-t border-line bg-bg">
            <div className="container-page space-y-1 py-4 text-base">
              {links.map((l) => (
                <Link key={l.href} onClick={() => setMobileOpen(false)} href={localePath(locale, l.href)} className="block py-2 text-fg">
                  {l.label}
                </Link>
              ))}
              <Link onClick={() => setMobileOpen(false)} href={localePath(locale, "/compare/ai-3d-vs-manual")} className="block py-2 text-muted">
                {dict.nav.compare}
              </Link>
              <div className="flex flex-col gap-2 pt-3">
                <Link onClick={() => setMobileOpen(false)} href={accountHref} className="btn-pill btn-outline text-fg">
                  {isSignedIn ? dict.nav.dashboard : dict.nav.signIn}
                </Link>
                <Link onClick={() => setMobileOpen(false)} href={localePath(locale, "/dashboard/create")} className="btn-pill btn-solid">
                  {dict.nav.cta}
                </Link>
              </div>
            </div>
          </nav>
        )}
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-line bg-bg py-14 text-sm text-muted">
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
                  {brand.supportEmail ? (
                    <a href={`mailto:${brand.supportEmail}`} className="hover:text-fg">
                      {dict.footer.contact}: {brand.supportEmail}
                    </a>
                  ) : (
                    <Link href={localePath(locale, "/privacy")} className="hover:text-fg">
                      {dict.footer.contact}: {dict.legal.pending}
                    </Link>
                  )}
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-line pt-6 text-xs">
            <span>© 2026 {brand.fullName}</span>
            <span>{dict.footer.rights}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
