import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireUser } from "@/lib/require-user";
import { creditsFor, PLAN_TIERS } from "@/lib/credits";
import { refreshEngineSwitches } from "@/lib/jobs";
import { allEngines, engineEnabled, planReference, priceOf } from "@/lib/provider/registry";
import { TEXTURE_RESOLUTIONS } from "@/lib/types";
import { buildPageMetadata } from "@/lib/seo";
import { store } from "@/lib/store";
import { PlanCards } from "@/components/plan-cards";
import { CheckoutPanel, type CheckoutGroup } from "@/components/checkout-panel";
import { CHECKOUT_CATALOG, whopCheckoutConfig } from "@/lib/whop";

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
  const user = await requireUser(locale);
  const usage = await store.usage(user.orgId);
  // The buy panel exists only when Whop is configured; otherwise the page keeps saying billing is not connected.
  const live = whopCheckoutConfig() !== null;
  const groups: CheckoutGroup[] = [
    ...PLAN_TIERS.map((tier) => ({ id: tier.id, name: tier.name, recurring: true, options: tier.steps.map((s) => ({ key: `plan:${tier.id}:${s.priceUsd}`, priceUsd: s.priceUsd, credits: s.credits })) })),
    ...CHECKOUT_CATALOG.filter((i) => !i.recurring).map((i) => ({ id: i.key, name: `${c.buyPackName} ${i.label.replace(/^\S+\s*/, "")}`, recurring: false, options: [{ key: i.key, priceUsd: i.priceUsd, credits: i.credits }] })),
  ];
  const bases = PLAN_TIERS.map((tier) => ({ name: tier.name, units: tier.steps[0].credits }));
  await refreshEngineSwitches().catch(() => undefined);
  // Only engines that are switched on, by the most expensive thing each can be asked to do. No vendor names and no provider prices: credits only.
  const engines = allEngines()
    .filter((e) => engineEnabled(e))
    .map((e) => {
      let dearest = 0;
      for (const mode of e.modes) {
        for (const texture of TEXTURE_RESOLUTIONS) {
          if (texture === "none" && !e.geometryOnly) continue;
          const counts = mode === "text" ? [0] : mode === "image" ? [1] : Array.from({ length: Math.max(e.maxPhotos - 1, 1) }, (_, i) => i + 2);
          for (const photoCount of counts) dearest = Math.max(dearest, creditsFor(priceOf(e, { mode, photoCount, texture }).usd));
        }
      }
      return { id: e.id, credits: dearest };
    })
    .sort((a, b) => a.credits - b.credits || a.id.localeCompare(b.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">{c.title}</h1>
        <p className="mt-1 text-sm text-muted">{live ? c.subtitleLive : c.subtitle}</p>
      </div>

      {live ? (
        <section className="space-y-4" aria-labelledby="buy-heading">
          <div className="rounded-[16px] border border-line bg-surface p-6">
            <h2 id="buy-heading" className="font-display text-base font-semibold text-fg">{c.buyTitle}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{c.buyText}</p>
            <p className="mt-3 text-sm font-medium text-fg" data-testid="billing-balance">{c.balance.replace("{n}", String(usage.balance))}</p>
          </div>
          <CheckoutPanel
            groups={groups}
            copy={{ plans: c.buyPlans, packs: c.buyPacks, credits: c.buyCredits, perMonth: c.buyPerMonth, once: c.buyOnce, button: c.buyButton, opening: c.buyOpening, error: c.buyError }}
          />
        </section>
      ) : (
        <>
          <div className="rounded-[16px] border border-line bg-surface p-6">
            <span className="inline-flex rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-amber">{t.dash.settings.planned}</span>
            <h2 className="mt-3 font-display text-base font-semibold text-fg">{c.plannedTitle}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{c.plannedText}</p>
            <p className="mt-3 text-sm font-medium text-fg" data-testid="billing-balance">{c.balance.replace("{n}", String(usage.balance))}</p>
            <Link href={localePath(locale, "/pricing")} className="mt-5 inline-flex rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-bg hover:bg-accent-strong">
              {c.seePricing}
            </Link>
          </div>

          <section className="space-y-4" aria-labelledby="plans-heading">
            <h2 id="plans-heading" className="font-display text-lg font-semibold">{c.plansTitle}</h2>
            <PlanCards copy={t.pricing} locale={locale} reference={planReference()} />
          </section>
        </>
      )}

      <section className="space-y-3" aria-labelledby="calc-heading">
        <h2 id="calc-heading" className="font-display text-lg font-semibold">{c.calcTitle}</h2>
        <p className="max-w-3xl text-xs leading-relaxed text-muted" data-testid="billing-hypothesis">{live ? c.calcNoteLive : c.calcNote}</p>
        <div className="overflow-x-auto" role="region" aria-label={c.calcTitle} tabIndex={0}>
          <table className="w-full min-w-[640px] text-left text-xs" data-testid="billing-calculator">
            <thead className="border-b border-line text-muted">
              <tr>
                <th scope="col" className="py-2 pr-4 font-medium">{c.engine}</th>
                <th scope="col" className="py-2 pr-4 font-medium">{c.perModel}</th>
                {bases.map((p) => (
                  <th key={p.name} scope="col" className="py-2 pr-4 font-medium">{p.name} ({p.units})</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {engines.map((e, i) => (
                <tr key={e.id}>
                  <th scope="row" className="py-2.5 pr-4 font-semibold text-fg">{c.engineName.replace("{n}", String(i + 1))}</th>
                  <td className="py-2.5 pr-4 tabular-nums text-muted">{e.credits}</td>
                  {bases.map((p) => (
                    <td key={p.name} className="py-2.5 pr-4 tabular-nums text-muted">{e.credits > 0 ? Math.floor(p.units / e.credits) : 0}</td>
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
