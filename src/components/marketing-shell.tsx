"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Boxes,
  ChevronDown,
  Gamepad2,
  Images,
  Image as ImageIcon,
  Menu,
  PenTool,
  ScanSearch,
  Store,
  Type,
  UserRound,
  X,
} from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { LocaleSwitcher } from "./locale-switcher";
import { localePath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/lib/types";
import { brand } from "@/config/brand";
import { navCopy, type NavIcon } from "@/content/nav";

type MenuId = "product" | "solutions" | "resources" | null;

const ICONS: Record<NavIcon, React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>> = {
  text: Type,
  image: ImageIcon,
  images: Images,
  review: ScanSearch,
  store: Store,
  game: Gamepad2,
  design: PenTool,
};

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
  const nav = navCopy[locale];
  const accountHref = localePath(locale, isSignedIn ? "/dashboard" : "/login");
  const accountLabel = isSignedIn ? dict.nav.dashboard : dict.nav.signIn;
  const createHref = localePath(locale, "/dashboard/create");

  const resourceLinks = [
    { href: "/examples", title: dict.nav.examples, text: locale === "es" ? "Cómo se ve el flujo, de la foto al modelo" : "How the flow looks, from photo to model" },
    { href: "/resources", title: dict.nav.guides, text: dict.nav.guidesDesc },
    { href: "/resources/faq", title: dict.nav.faq, text: dict.nav.faqDesc },
    { href: "/resources/glb-export-and-shopify", title: dict.nav.docs, text: dict.nav.docsDesc },
    { href: "/compare/ai-3d-vs-manual", title: dict.nav.compare, text: dict.nav.compareDesc },
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

  const topLink = "whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-fg";
  const toggle = (id: Exclude<MenuId, null>) => setMenu((m) => (m === id ? null : id));
  const dropdown = (id: Exclude<MenuId, null>, label: string) => (
    <button
      type="button"
      aria-expanded={menu === id}
      aria-controls={`menu-${id}`}
      onClick={() => toggle(id)}
      className={`${topLink} inline-flex items-center gap-1 ${menu === id ? "text-fg" : ""}`}
    >
      {label}
      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${menu === id ? "rotate-180" : ""}`} aria-hidden="true" />
    </button>
  );

  const cards = (items: typeof nav.productItems, cols: string, footer: { href: string; label: string }) => (
    <>
      <ul className={`grid gap-2 ${cols}`}>
        {items.map((c) => {
          const Icon = ICONS[c.icon];
          return (
            <li key={c.href}>
              <Link
                href={localePath(locale, c.href)}
                onClick={() => setMenu(null)}
                className="group flex h-full flex-col gap-3 rounded-2xl p-2 transition-colors hover:bg-white/[0.06]"
              >
                {/* A drawn tile stands in for a screenshot: no real screenshots exist yet. */}
                <span className="mesh-lines relative flex h-24 items-center justify-center overflow-hidden rounded-xl bg-[#1b0b0c]">
                  <Icon className="h-8 w-8 text-accent" aria-hidden="true" />
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
          );
        })}
      </ul>
      <div className="mt-1 border-t border-line px-3 pb-1 pt-3">
        <Link href={localePath(locale, footer.href)} onClick={() => setMenu(null)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg hover:text-accent">
          {footer.label}
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </>
  );

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
        <div className="pill-nav mx-auto flex h-14 max-w-[1040px] items-center justify-between gap-2 rounded-full pl-5 pr-2">
          <BrandLogo locale={locale} />

          <nav aria-label={dict.common.mainNavigation} className="hidden items-center lg:flex">
            {dropdown("product", nav.product)}
            {dropdown("solutions", nav.solutions)}
            <Link href={localePath(locale, "/integrations")} className={topLink}>
              {nav.integrations}
            </Link>
            <Link href={localePath(locale, "/pricing")} className={topLink}>
              {dict.nav.pricing}
            </Link>
            {dropdown("resources", dict.nav.resources)}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <LocaleSwitcher locale={locale} label={dict.common.language} />
            <Link href={accountHref} className="hidden whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-fg transition-colors hover:bg-white/10 xl:inline-flex">
              {accountLabel}
            </Link>
            <Link
              href={accountHref}
              aria-label={accountLabel}
              className="flex h-10 w-10 items-center justify-center rounded-full text-fg transition-colors hover:bg-white/10 xl:hidden"
            >
              <UserRound className="h-5 w-5" aria-hidden="true" />
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

        {menu === "product" && (
          <div id="menu-product" className="mega-panel menu-in mx-auto mt-2 hidden max-w-[920px] rounded-[20px] p-3 lg:block">
            {cards(nav.productItems, "grid-cols-4", { href: "/features", label: nav.allFeatures })}
          </div>
        )}

        {menu === "solutions" && (
          <div id="menu-solutions" className="mega-panel menu-in mx-auto mt-2 hidden max-w-[720px] rounded-[20px] p-3 lg:block">
            {cards(nav.solutionItems, "grid-cols-3", { href: "/solutions", label: nav.allSolutions })}
          </div>
        )}

        {menu === "resources" && (
          <div id="menu-resources" className="mega-panel menu-in mx-auto mt-2 hidden max-w-[420px] rounded-[20px] p-2 lg:block">
            <ul>
              {resourceLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={localePath(locale, l.href)}
                    onClick={() => setMenu(null)}
                    className="flex items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-white/[0.06]"
                  >
                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-semibold">{l.title}</span>
                      {l.text ? <span className="block text-xs leading-relaxed text-muted">{l.text}</span> : null}
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
          <MobileGroup title={nav.product} items={nav.productItems} locale={locale} onPick={() => setMobileOpen(false)} />
          <MobileGroup title={nav.solutions} items={nav.solutionItems} locale={locale} onPick={() => setMobileOpen(false)} />
          <ul className="mt-2 space-y-1 text-xl font-semibold">
            {[
              { href: "/integrations", label: nav.integrations },
              { href: "/pricing", label: dict.nav.pricing },
              { href: "/examples", label: dict.nav.examples },
              { href: "/resources", label: dict.nav.resources },
              { href: "/compare/ai-3d-vs-manual", label: dict.nav.compare },
            ].map((l) => (
              <li key={l.href}>
                <Link onClick={() => setMobileOpen(false)} href={localePath(locale, l.href)} className="block border-b border-line py-3.5">
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
              {accountLabel}
            </Link>
          </div>
        </nav>
      )}

      <main id="main-content" className="relative z-10 flex-1">
        {children}
      </main>

      <footer className="relative z-10 border-t border-line bg-bg py-14 text-sm text-muted">
        <div className="container-page space-y-10">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
            <div className="col-span-2 space-y-3">
              <BrandLogo locale={locale} />
              <p className="max-w-xs text-xs leading-relaxed text-muted">{dict.footer.note}</p>
            </div>
            <FooterColumn
              title={dict.footer.product}
              links={[
                ...nav.productItems.map((i) => ({ href: localePath(locale, i.href), label: i.title })),
                { href: localePath(locale, "/integrations"), label: nav.integrations },
                { href: localePath(locale, "/pricing"), label: dict.nav.pricing },
              ]}
            />
            <FooterColumn title={nav.footerSolutions} links={nav.solutionItems.map((i) => ({ href: localePath(locale, i.href), label: i.title }))} />
            <FooterColumn
              title={dict.footer.resources}
              links={[
                { href: localePath(locale, "/examples"), label: dict.nav.examples },
                { href: localePath(locale, "/resources"), label: dict.nav.guides },
                { href: localePath(locale, "/resources/glb-export-and-shopify"), label: dict.nav.docs },
                { href: localePath(locale, "/resources/faq"), label: dict.nav.faq },
                { href: localePath(locale, "/compare/ai-3d-vs-manual"), label: dict.nav.compare },
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

function MobileGroup({
  title,
  items,
  locale,
  onPick,
}: {
  title: string;
  items: { href: string; icon: NavIcon; title: string; text: string }[];
  locale: Locale;
  onPick: () => void;
}) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
        <Boxes className="h-3.5 w-3.5" aria-hidden="true" />
        {title}
      </h2>
      <ul className="space-y-1">
        {items.map((i) => {
          const Icon = ICONS[i.icon];
          return (
            <li key={i.href}>
              <Link onClick={onPick} href={localePath(locale, i.href)} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blood text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-base font-semibold">{i.title}</span>
                  <span className="block text-xs text-muted">{i.text}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
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
