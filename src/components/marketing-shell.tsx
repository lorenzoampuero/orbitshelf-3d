"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Box, ChevronDown, Code2, Menu, ScanSearch, Store, X } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { LocaleSwitcher } from "./locale-switcher";
import { localePath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/lib/types";
import { brand } from "@/config/brand";

type MenuId = "product" | "resources" | null;

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
  const [menu, setMenu] = useState<MenuId>(null);
  const headerRef = useRef<HTMLElement>(null);
  const accountHref = localePath(locale, isSignedIn ? "/dashboard" : "/login");
  const createHref = localePath(locale, "/dashboard/create");

  const productCards = [
    { href: "/how-it-works", icon: Box, title: dict.nav.generate, text: dict.nav.generateDesc },
    { href: "/how-it-works", icon: ScanSearch, title: dict.nav.review, text: dict.nav.reviewDesc },
    { href: "/resources/glb-export-and-shopify", icon: Store, title: dict.nav.viewer, text: dict.nav.viewerDesc },
    { href: "/compare/ai-3d-vs-manual", icon: Code2, title: dict.nav.compare, text: dict.nav.compareDesc },
  ];
  const resourceLinks = [
    { href: "/resources", title: dict.nav.guides, text: dict.nav.guidesDesc },
    { href: "/resources/faq", title: dict.nav.faq, text: dict.nav.faqDesc },
    { href: "/resources/glb-export-and-shopify", title: dict.nav.docs, text: dict.nav.docsDesc },
  ];

  // Close the open panel on Escape or on a click outside the bar.
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    const onPointer = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [menu]);

  // Lock page scroll behind the full-screen mobile menu.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const topLink = "rounded-full px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:text-fg";
  const toggle = (id: Exclude<MenuId, null>) => setMenu((m) => (m === id ? null : id));

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-bg text-fg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
      >
        {dict.common.skipToContent}
      </a>

      {/* Background light: two blood-red pools. They sit behind everything and never take clicks. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[1100px] overflow-hidden">
        <div className="glow -left-40 -top-32 h-[620px] w-[620px]" />
        <div className="glow -right-48 top-24 h-[520px] w-[520px] opacity-70" />
      </div>

      {/* Floating pill: small, fixed, centred. Dropdown panels open under it. */}
      <header ref={headerRef} className="fixed inset-x-0 top-3 z-40 px-3">
        <div className="pill-nav mx-auto flex h-14 max-w-[920px] items-center justify-between gap-2 rounded-full pl-5 pr-2">
          <BrandLogo locale={locale} />

          <nav aria-label={dict.common.mainNavigation} className="hidden items-center lg:flex">
            <button
              type="button"
              aria-expanded={menu === "product"}
              aria-controls="menu-product"
              onClick={() => toggle("product")}
              className={`${topLink} inline-flex items-center gap-1 ${menu === "product" ? "text-fg" : ""}`}
            >
              {dict.nav.product}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${menu === "product" ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            <Link href={localePath(locale, "/examples")} className={topLink}>
              {dict.nav.examples}
            </Link>
            <Link href={localePath(locale, "/pricing")} className={topLink}>
              {dict.nav.pricing}
            </Link>
            <button
              type="button"
              aria-expanded={menu === "resources"}
              aria-controls="menu-resources"
              onClick={() => toggle("resources")}
              className={`${topLink} inline-flex items-center gap-1 ${menu === "resources" ? "text-fg" : ""}`}
            >
              {dict.nav.resources}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${menu === "resources" ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <LocaleSwitcher locale={locale} label={dict.common.language} />
            <Link href={accountHref} className="whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium text-fg transition-colors hover:bg-white/10">
              {isSignedIn ? dict.nav.dashboard : dict.nav.signIn}
            </Link>
            <Link href={createHref} className="btn-pill btn-solid px-5 py-2.5">
              {dict.nav.ctaShort}
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <LocaleSwitcher locale={locale} label={dict.common.language} />
            <button
              type="button"
              aria-expanded={mobileOpen}
              aria-controls="mobile-marketing-menu"
              aria-label={mobileOpen ? dict.common.closeMenu : dict.common.openMenu}
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-fg"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Product panel: four cards. Each has a drawn tile in place of a screenshot, because no real screenshots exist yet. */}
        {menu === "product" && (
          <div id="menu-product" className="mega-panel menu-in mx-auto mt-2 hidden max-w-[920px] rounded-[20px] p-3 lg:block">
            <ul className="grid grid-cols-4 gap-2">
              {productCards.map((c) => (
                <li key={c.title}>
                  <Link
                    href={localePath(locale, c.href)}
                    onClick={() => setMenu(null)}
                    className="group flex h-full flex-col gap-3 rounded-2xl p-2 transition-colors hover:bg-white/[0.06]"
                  >
                    <span className="mesh-lines relative flex h-24 items-center justify-center overflow-hidden rounded-xl bg-[#1b0b0c]">
                      <c.icon className="h-8 w-8 text-accent" aria-hidden="true" />
                    </span>
                    <span className="px-1 pb-1">
                      <span className="flex items-center justify-between text-sm font-semibold">
                        {c.title}
                        <ArrowUpRight className="h-4 w-4 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted">{c.text}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {menu === "resources" && (
          <div id="menu-resources" className="mega-panel menu-in mx-auto mt-2 hidden max-w-[420px] rounded-[20px] p-2 lg:ml-auto lg:mr-[calc(50%-460px)] lg:block">
            <ul>
              {resourceLinks.map((l) => (
                <li key={l.title}>
                  <Link
                    href={localePath(locale, l.href)}
                    onClick={() => setMenu(null)}
                    className="flex items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-white/[0.06]"
                  >
                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-semibold">{l.title}</span>
                      <span className="block text-xs leading-relaxed text-muted">{l.text}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      {/* Mobile: full-screen menu under the pill. */}
      {mobileOpen && (
        <nav
          id="mobile-marketing-menu"
          aria-label={dict.common.mobileNavigation}
          className="fixed inset-0 z-30 overflow-y-auto bg-bg/95 px-5 pb-10 pt-24 backdrop-blur-xl lg:hidden"
        >
          <ul className="space-y-1 text-2xl font-semibold">
            {[
              { href: "/how-it-works", label: dict.nav.howItWorks },
              { href: "/examples", label: dict.nav.examples },
              { href: "/pricing", label: dict.nav.pricing },
              { href: "/resources", label: dict.nav.resources },
              { href: "/compare/ai-3d-vs-manual", label: dict.nav.compare },
            ].map((l) => (
              <li key={l.href}>
                <Link onClick={() => setMobileOpen(false)} href={localePath(locale, l.href)} className="block border-b border-line py-4">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3">
            <Link onClick={() => setMobileOpen(false)} href={createHref} className="btn-pill btn-solid py-3.5">
              {dict.nav.cta}
            </Link>
            <Link onClick={() => setMobileOpen(false)} href={accountHref} className="btn-pill btn-outline py-3.5">
              {isSignedIn ? dict.nav.dashboard : dict.nav.signIn}
            </Link>
          </div>
        </nav>
      )}

      <main id="main-content" className="relative z-10 flex-1">
        {children}
      </main>

      <footer className="relative z-10 border-t border-line bg-bg py-14 text-sm text-muted">
        <div className="container-page space-y-10">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
            <div className="col-span-2 space-y-3">
              <BrandLogo locale={locale} />
              <p className="max-w-xs text-xs leading-relaxed text-muted">{dict.footer.note}</p>
            </div>
            <FooterColumn
              title={dict.footer.product}
              links={[
                { href: localePath(locale, "/how-it-works"), label: dict.nav.howItWorks },
                { href: localePath(locale, "/examples"), label: dict.nav.examples },
                { href: localePath(locale, "/pricing"), label: dict.nav.pricing },
                { href: localePath(locale, "/compare/ai-3d-vs-manual"), label: dict.nav.compare },
              ]}
            />
            <FooterColumn
              title={dict.footer.resources}
              links={[
                { href: localePath(locale, "/resources"), label: dict.nav.guides },
                { href: localePath(locale, "/resources/glb-export-and-shopify"), label: dict.nav.docs },
                { href: localePath(locale, "/resources/faq"), label: dict.nav.faq },
              ]}
            />
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
          <div className="flex flex-col items-start justify-between gap-2 border-t border-line pt-6 text-xs sm:flex-row sm:items-center">
            <span>© 2026 {brand.fullName}</span>
            <span>{dict.footer.rights}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg">{title}</h2>
      <ul className="space-y-2 text-xs">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="hover:text-fg">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
