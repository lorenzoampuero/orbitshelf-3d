import Link from "next/link";
import { notFound } from "next/navigation";
import { adminCopy } from "@/content/admin-copy";
import { isLocale, localePath } from "@/i18n/config";
import { requireAdmin } from "@/lib/admin";
import { buildPageMetadata } from "@/lib/seo";
import { store, billingNeedsAttention } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { AdminTabs } from "./admin-tabs";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const c = adminCopy[locale].overview;
  return buildPageMetadata({ locale, path: "/dashboard/admin", title: c.title, description: c.subtitle, noIndex: true });
}

const num = new Intl.NumberFormat("en-US");

export default async function AdminOverviewPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin();
  const copy = adminCopy[locale];
  const c = copy.overview;
  const [summary, pending, engines] = await Promise.all([store.adminSummary(), store.listBillingEvents(8, true), store.engineStats()]);

  const stats: { label: string; value: number; tone?: "attention" }[] = [
    { label: c.stats.workspaces, value: summary.workspaces },
    { label: c.stats.users, value: summary.users },
    { label: c.stats.models, value: summary.models },
    { label: c.stats.ready, value: summary.ready },
    { label: c.stats.failed, value: summary.failed },
    { label: c.stats.processing, value: summary.processing },
    { label: c.stats.paymentsCredited, value: summary.paymentsCredited },
    { label: c.stats.creditsGranted, value: summary.creditsGranted },
    { label: c.stats.needsAttention, value: summary.needsAttention, tone: summary.needsAttention > 0 ? "attention" : undefined },
  ];

  return (
    <div className="space-y-8" data-testid="admin-overview">
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{c.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{c.subtitle}</p>
        </div>
        <AdminTabs locale={locale} copy={copy.nav} current="overview" />
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className={s.tone === "attention" ? "rounded-[20px] border border-warn/50 bg-surface p-4" : "rounded-[var(--radius-card)] border border-line bg-surface-1 p-4"}>
            <dt className="text-xs text-muted">{s.label}</dt>
            <dd className={s.tone === "attention" ? "mt-1 font-display text-2xl font-bold text-warn" : "mt-1 font-display text-2xl font-bold"}>{num.format(s.value)}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="attention-h" className="space-y-3 rounded-[var(--radius-card)] border border-line bg-surface-1 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="attention-h" className="font-display text-lg font-semibold">{c.attentionTitle}</h2>
          <Link href={localePath(locale, "/dashboard/admin/payments")} className="text-xs font-medium text-accent hover:underline">{c.attentionAll} →</Link>
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-muted">{c.attentionEmpty}</p>
        ) : (
          <ul className="divide-y divide-line">
            {pending.filter(billingNeedsAttention).map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className="font-medium">{copy.payments.kinds[e.kind] ?? e.kind}</span>
                <span className="font-mono text-xs text-muted">{e.paymentId ?? "—"}</span>
                <span className="rounded-full bg-warn/15 px-2.5 py-0.5 text-xs font-medium text-warn">{copy.payments.outcomes[e.outcome] ?? e.outcome}</span>
                <span className="text-xs text-muted">{formatDate(e.createdAt, locale)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="engines-h" className="space-y-3 rounded-[var(--radius-card)] border border-line bg-surface-1 p-5">
        <h2 id="engines-h" className="font-display text-lg font-semibold">{c.enginesTitle}</h2>
        {engines.length === 0 ? (
          <p className="text-sm text-muted">{c.enginesEmpty}</p>
        ) : (
          <div className="relative overflow-x-auto" role="region" tabIndex={0} aria-labelledby="engines-h">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-medium">{c.cols.engine}</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">{c.cols.jobs}</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">{c.cols.ready}</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">{c.cols.failed}</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">{c.cols.approved}</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">{c.cols.rejected}</th>
                  <th scope="col" className="py-2 pl-3 text-right font-medium">{c.cols.cost}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {engines.map((e) => (
                  <tr key={e.engineId}>
                    <th scope="row" className="py-2.5 pr-3 font-mono text-xs font-medium">{e.engineId}</th>
                    <td className="px-3 text-right tabular-nums">{e.jobs}</td>
                    <td className="px-3 text-right tabular-nums">{e.ready}</td>
                    <td className="px-3 text-right tabular-nums">{e.failed}</td>
                    <td className="px-3 text-right tabular-nums">{e.approved}</td>
                    <td className="px-3 text-right tabular-nums">{e.rejected}</td>
                    <td className="pl-3 text-right tabular-nums">US${e.publishedUsd.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted">{c.enginesNote}</p>
      </section>

      <p className="text-xs text-muted">{c.envNote}</p>
    </div>
  );
}
