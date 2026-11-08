import Link from "next/link";
import { Info } from "lucide-react";
import { brand, legalConfigured, legalOperator } from "@/config/brand";
import { innerPagesCopy } from "@/content/inner-pages";
import { LEGAL_SLUGS, legalDoc, legalIndexCopy, legalRoute, type LegalSlug } from "@/content/legal";
import { localePath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/lib/types";

type Section = { h: string; p: readonly string[] };

/** Shared body of every legal page: draft notice, operator details and the sections with placeholders filled. */
export function LegalDocument({ dict, locale, title, summary, sections, current }: { dict: Dictionary; locale: Locale; title: string; summary?: string; sections: readonly Section[]; current?: LegalSlug }) {
  const pending = `[${dict.legal.pending}]`;
  const fill = (text: string) =>
    text
      .replaceAll("{brand}", brand.fullName)
      .replaceAll("{operator}", legalOperator.name ?? pending)
      .replaceAll("{email}", brand.supportEmail ?? pending)
      .replaceAll("{jurisdiction}", legalOperator.jurisdiction ?? pending);

  const o = dict.legal.operator;
  const rows: [string, string | null][] = [
    [o.name, legalOperator.name],
    [o.taxId, legalOperator.taxId],
    [o.address, legalOperator.address],
    [o.country, legalOperator.country],
    [o.email, brand.supportEmail],
  ];
  const tocLabel = innerPagesCopy[locale].legal.toc;

  return (
    <div className="container-page max-w-5xl space-y-8">
      <div className="max-w-3xl space-y-3">
        <h1 className="hero-title text-[clamp(2rem,4.6vw,3.25rem)]">{title}</h1>
        {summary && <p className="text-lg leading-relaxed text-muted">{summary}</p>}
        <p className="text-sm text-muted">{dict.legal.lastUpdated.replace("{date}", legalOperator.lastUpdated)}</p>
      </div>

      <div role="note" className="flex max-w-3xl items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-sm leading-relaxed text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <p>{dict.legal.draft}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-8">
        <div className="sticky top-28 hidden max-h-[calc(100vh-8rem)] overflow-y-auto lg:block">
          <nav aria-label={tocLabel} className="card p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{tocLabel}</p>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#operator" className="text-muted hover:text-fg">
                  {o.title}
                </a>
              </li>
              {sections.map((s, i) => (
                <li key={s.h}>
                  <a href={`#section-${i + 1}`} className="text-muted hover:text-fg">
                    {fill(s.h)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="min-w-0 max-w-3xl space-y-4">
          <section id="operator" aria-labelledby="operator-title" className="card space-y-4 p-6 md:p-8">
            <h2 id="operator-title" className="text-xl font-semibold leading-snug">
              {o.title}
            </h2>
            {!legalConfigured() && (
              <p role="note" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-fg">
                {o.notConfigured}
              </p>
            )}
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
              {rows.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-muted">{label}</dt>
                  <dd className="break-words">
                    {value && label === o.email ? (
                      <a href={`mailto:${value}`} className="text-accent hover:underline">
                        {value}
                      </a>
                    ) : (
                      (value ?? pending)
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="card space-y-8 p-6 md:p-8">
            {sections.map((s, i) => (
              <section key={s.h} id={`section-${i + 1}`} className={`scroll-mt-28 space-y-3 ${i > 0 ? "border-t border-line pt-8" : ""}`}>
                <h2 className="text-xl font-semibold leading-snug">{fill(s.h)}</h2>
                {s.p.map((p) => (
                  <p key={p} className="text-base leading-[1.75] text-fg/80">
                    {fill(p)}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <nav aria-label={legalIndexCopy[locale].related} className="card space-y-3 p-6 md:p-8">
            <h2 className="text-base font-semibold">{legalIndexCopy[locale].related}</h2>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {LEGAL_SLUGS.filter((s) => s !== current).map((s) => (
                <li key={s}>
                  <Link href={localePath(locale, legalRoute(s))} className="text-muted hover:text-fg">
                    {legalDoc(locale, s).title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
