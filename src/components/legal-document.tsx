import { brand, legalConfigured, legalOperator } from "@/config/brand";
import type { Dictionary } from "@/i18n/dictionaries/en";

type Section = { h: string; p: readonly string[] };

/** Shared body of /privacy and /terms: draft notice, operator details and the dictionary sections with placeholders filled. */
export function LegalDocument({ dict, title, sections }: { dict: Dictionary; title: string; sections: readonly Section[] }) {
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

  return (
    <div className="container-page max-w-3xl space-y-10">
      <div className="space-y-3">
        <h1 className="font-display text-4xl font-bold leading-[1.02] md:text-5xl">{title}</h1>
        <p className="text-sm text-muted">{dict.legal.lastUpdated.replace("{date}", legalOperator.lastUpdated)}</p>
      </div>
      <p className="border-l-2 border-accent pl-4 text-sm leading-relaxed text-muted">{dict.legal.draft}</p>

      <section id="operator" aria-labelledby="operator-title" className="space-y-3 border-t border-line pt-7">
        <h2 id="operator-title" className="font-display text-xl font-bold">
          {o.title}
        </h2>
        {!legalConfigured() && (
          <p role="note" className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-fg">
            {o.notConfigured}
          </p>
        )}
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted">{label}</dt>
              <dd>
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

      <div className="border-b border-line">
        {sections.map((s) => (
          <section key={s.h} className="space-y-2 border-t border-line py-7">
            <h2 className="font-display text-xl font-bold">{fill(s.h)}</h2>
            {s.p.map((p) => (
              <p key={p} className="text-base leading-relaxed text-muted">
                {fill(p)}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
