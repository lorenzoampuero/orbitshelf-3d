import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { MarketingShell } from "@/components/marketing-shell";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/pricing",
    title: dict.meta.pricing.title,
    description: dict.meta.pricing.description,
  });
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <section className="py-14 md:py-20">
        <div className="container-page space-y-10">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-mint">
              {dict.pricing.eyebrow}
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">{dict.pricing.title}</h1>
            <p className="text-base text-muted">{dict.pricing.intro}</p>
          </div>

          <div className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-xs text-muted">
            {dict.pricing.banner}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {dict.pricing.plans.map((p) => (
              <div
                key={p.id}
                className="flex flex-col justify-between rounded-[16px] border border-line bg-surface p-6 space-y-5"
              >
                <div className="space-y-3">
                  <h2 className="font-display text-xl font-bold">{p.name}</h2>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-3xl font-bold">US${p.price}</span>
                    <span className="text-xs text-muted">
                      {p.period === "once" ? dict.pricing.perOnce : dict.pricing.perMonth}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-mint">
                    {p.attempts} {dict.pricing.attempts}
                  </div>
                  <ul className="space-y-2 pt-2 text-xs text-fg">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="text-mint">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                    {p.planned.map((pl) => (
                      <li key={pl} className="flex items-center justify-between gap-2 text-muted">
                        <span>• {pl}</span>
                        <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-violet">
                          {dict.pricing.plannedLabel}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={localePath(locale, "/dashboard/create")}
                  className="block rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-center text-xs font-semibold text-fg hover:border-mint"
                >
                  {dict.pricing.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="rounded-[16px] border border-line bg-surface p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold">{dict.pricing.rulesTitle}</h2>
            <ul className="list-disc pl-5 text-xs text-muted space-y-1.5">
              {dict.pricing.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="pt-2 text-xs text-muted">{dict.pricing.disclaimer}</p>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
