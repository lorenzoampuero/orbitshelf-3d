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
      <section className="py-14 md:py-24">
        <div className="container-page space-y-14">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">{dict.pricing.eyebrow}</span>
            <h1 className="font-display text-4xl font-bold leading-[1.02] md:text-6xl">{dict.pricing.title}</h1>
            <p className="text-lg leading-relaxed text-muted">{dict.pricing.intro}</p>
          </div>

          <p className="border-l-2 border-accent pl-4 text-sm leading-relaxed text-muted">{dict.pricing.banner}</p>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            {dict.pricing.plans.map((p, i) => (
              <div
                key={p.id}
                className={`flex flex-col justify-between gap-8 lg:px-7 lg:first:pl-0 lg:last:pr-0 ${i > 0 ? "lg:border-l lg:border-line" : ""}`}
              >
                <div className="space-y-5">
                  <h2 className="font-display text-xl font-bold">{p.name}</h2>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-5xl font-bold leading-none">US${p.price}</span>
                    <span className="text-sm text-muted">{p.period === "once" ? dict.pricing.perOnce : dict.pricing.perMonth}</span>
                  </div>
                  <div className="text-sm font-semibold text-accent">
                    {p.credits.toLocaleString(locale)} {dict.pricing.credits}
                  </div>
                  <ul className="space-y-2 text-sm text-muted">
                    {p.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                    {p.planned.map((pl) => (
                      <li key={pl}>
                        {pl} ({dict.pricing.plannedLabel})
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href={localePath(locale, "/dashboard/create")} className="btn-pill btn-outline self-start text-fg">
                  {dict.pricing.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-line pt-10 md:grid-cols-12 md:gap-10">
            <h2 className="font-display text-2xl font-bold md:col-span-4">{dict.pricing.rulesTitle}</h2>
            <div className="space-y-5 md:col-span-8">
              <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted marker:text-accent">
                {dict.pricing.rules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="text-sm leading-relaxed text-muted">{dict.pricing.disclaimer}</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
