import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { currentUser } from "@/lib/api";
import { creditsFor, PLAN_STRUCTURES } from "@/lib/credits";
import { allEngines, priceOf } from "@/lib/provider/registry";
import { buildPageMetadata } from "@/lib/seo";
import { store } from "@/lib/store";
import { CreditPicker } from "./credit-picker";

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
  const c = t.dash.billing;
  const user = (await currentUser())!;
  const usage = await store.usage(user.orgId);
  const structure = PLAN_STRUCTURES.find((s) => s.id === "plans")!;
  const engines = allEngines().map((e) => {
    const mode = e.modes[0];
    const usd = priceOf(e, { mode, photoCount: mode === "text" ? 0 : 1, texture: "1k" }).usd;
    return { id: e.id, label: e.label, usd, credits: creditsFor(usd) };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">{c.title}</h1>
        <p className="mt-1 text-sm text-muted">{c.subtitle}</p>
      </div>

      <div className="rounded-[16px] border border-line bg-surface p-6">
        <span className="inline-flex rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-amber">{t.dash.settings.planned}</span>
        <h2 className="mt-3 font-display text-base font-semibold text-fg">{c.plannedTitle}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{c.plannedText}</p>
        <p className="mt-3 text-sm font-medium text-fg" data-testid="billing-balance">{c.balance.replace("{n}", String(usage.balance))}</p>
        <Link href={localePath(locale, "/pricing")} className="mt-5 inline-flex rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-bg hover:bg-accent-strong">
          {c.seePricing}
        </Link>
      </div>

      <CreditPicker c={c} engines={engines} />

      <section className="space-y-3" aria-labelledby="calc-heading">
        <h2 id="calc-heading" className="font-display text-lg font-semibold">{c.calcTitle}</h2>
        <p className="max-w-3xl text-xs leading-relaxed text-muted" data-testid="billing-hypothesis">{c.calcNote}</p>
        <div className="overflow-x-auto" role="region" aria-label={c.calcTitle} tabIndex={0}>
          <table className="w-full min-w-[640px] text-left text-xs" data-testid="billing-calculator">
            <thead className="border-b border-line text-muted">
              <tr>
                <th scope="col" className="py-2 pr-4 font-medium">{c.engine}</th>
                <th scope="col" className="py-2 pr-4 font-medium">{c.perModel}</th>
                {structure.plans.map((p) => (
                  <th key={p.name} scope="col" className="py-2 pr-4 font-medium">{p.name} ({p.units})</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {engines.map((e) => (
                <tr key={e.id}>
                  <th scope="row" className="py-2.5 pr-4 font-semibold text-fg">{e.label}</th>
                  <td className="py-2.5 pr-4 tabular-nums text-muted">{e.credits}</td>
                  {structure.plans.map((p) => (
                    <td key={p.name} className="py-2.5 pr-4 tabular-nums text-muted">{Math.floor(p.units / e.credits)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
