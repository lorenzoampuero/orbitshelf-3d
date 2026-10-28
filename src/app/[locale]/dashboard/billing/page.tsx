import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/dashboard/billing",
    title: t.dash.billing.title,
    description: t.dash.billing.subtitle,
    noIndex: true,
  });
}

export default async function BillingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">{t.dash.billing.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.dash.billing.subtitle}</p>
      </div>

      <div className="rounded-[16px] border border-line bg-surface p-6">
        <span className="inline-flex rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-amber">
          {t.dash.settings.planned}
        </span>
        <h2 className="mt-3 font-display text-base font-semibold text-fg">{t.dash.billing.plannedTitle}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t.dash.billing.plannedText}</p>
        <Link
          href={localePath(locale, "/pricing")}
          className="mt-5 inline-flex rounded-xl bg-mint px-4 py-2 text-xs font-semibold text-bg hover:bg-mint-strong"
        >
          {t.dash.billing.seePricing}
        </Link>
      </div>
    </div>
  );
}
