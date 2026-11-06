import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, localePath } from "@/i18n/config";
import { forBilling } from "@/i18n/billing-copy";
import { getDictionary } from "@/i18n/get-dictionary";
import { billingUnit } from "@/lib/env";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/dashboard/help",
    title: t.dash.help.title,
    description: t.dash.help.subtitle,
    noIndex: true,
  });
}

export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = forBilling(getDictionary(locale), locale, billingUnit());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">{t.dash.help.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.dash.help.subtitle}</p>
      </div>

      <div className="space-y-3">
        {t.dash.help.items.map((item) => (
          <div key={item.q} className="rounded-[16px] border border-line bg-surface p-5">
            <h2 className="font-display text-sm font-semibold text-fg">{item.q}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.a}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[16px] border border-line bg-surface p-5">
        <h2 className="font-display text-sm font-semibold text-fg">{t.dash.help.moreTitle}</h2>
        <Link
          href={localePath(locale, "/resources")}
          className="mt-3 inline-flex rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-bg hover:bg-accent-strong"
        >
          {t.dash.help.moreLink}
        </Link>
      </div>
    </div>
  );
}
