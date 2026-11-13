import { notFound, redirect } from "next/navigation";
import { isLocale, localePath } from "@/i18n/config";
import { forBilling } from "@/i18n/billing-copy";
import { getDictionary } from "@/i18n/get-dictionary";
import { billingUnit } from "@/lib/env";
import { currentUser } from "@/lib/api";
import { store, toDto } from "@/lib/store";
import { buildPageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/dashboard/usage",
    title: t.dash.usage.title,
    description: t.dash.usage.subtitle,
    noIndex: true,
  });
}

export default async function UsagePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = forBilling(getDictionary(locale), locale, billingUnit());
  const session = await currentUser();
  if (!session) redirect(localePath(locale, "/login"));

  const [usage, rows] = await Promise.all([
    store.usage(session.orgId),
    store.listModels(session.orgId),
  ]);
  const models = rows.map(toDto);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">{t.dash.usage.title}</h1>
          <p className="mt-1 text-sm text-muted">{t.dash.usage.subtitle}</p>
        </div>
        <a
          href="/api/export/jobs.csv"
          className="rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-medium text-fg hover:border-accent"
        >
          {t.dash.usage.exportCsv}
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-[var(--radius-card)] border border-line bg-surface-1 p-4">
          <div className="text-xs font-medium text-muted">{t.dash.usage.balance}</div>
          <div className="mt-2 font-display text-2xl font-bold text-accent" data-testid="usage-balance">
            {usage.balance}
          </div>
        </div>
        <div className="rounded-[var(--radius-card)] border border-line bg-surface-1 p-4">
          <div className="text-xs font-medium text-muted">{t.dash.usage.granted}</div>
          <div className="mt-2 font-display text-2xl font-bold text-fg">{usage.granted}</div>
        </div>
        <div className="rounded-[var(--radius-card)] border border-line bg-surface-1 p-4">
          <div className="text-xs font-medium text-muted">{t.dash.usage.debited}</div>
          <div className="mt-2 font-display text-2xl font-bold text-fg">{usage.debited}</div>
        </div>
        <div className="rounded-[var(--radius-card)] border border-line bg-surface-1 p-4">
          <div className="text-xs font-medium text-muted">{t.dash.usage.refunded}</div>
          <div className="mt-2 font-display text-2xl font-bold text-fg">{usage.refunded}</div>
        </div>
        <div className="rounded-[var(--radius-card)] border border-line bg-surface-1 p-4">
          <div className="text-xs font-medium text-muted">{t.dash.usage.active}</div>
          <div className="mt-2 font-display text-xl font-bold text-fg">
            {t.dash.usage.activeOf
              .replace("{n}", String(usage.activeJobs))
              .replace("{max}", String(usage.maxActiveJobs))}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted">{t.dash.usage.capNote}</p>

      {/* Job History Table */}
      <section className="rounded-[var(--radius-card)] border border-line bg-surface-1 p-5">
        <h2 className="font-display text-base font-semibold text-fg">{t.dash.usage.jobsTitle}</h2>
        {models.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{t.dash.usage.noJobs}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line text-muted">
                <tr>
                  <th className="py-2 pr-4">{t.dash.usage.columns.name}</th>
                  <th className="py-2 pr-4">{t.dash.usage.columns.source}</th>
                  <th className="py-2 pr-4">{t.dash.usage.columns.state}</th>
                  <th className="py-2 pr-4">{t.dash.usage.columns.attempts}</th>
                  <th className="py-2">{t.dash.usage.columns.date}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-muted">
                {models.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2.5 pr-4 font-medium text-fg">{m.title}</td>
                    <td className="py-2.5 pr-4">{t.dash.source[m.source]}</td>
                    <td className="py-2.5 pr-4">{t.dash.status[m.status]}</td>
                    <td className="py-2.5 pr-4">
                      {m.attemptsDebited} / {m.attemptsRefunded}
                    </td>
                    <td className="py-2.5">{formatDate(m.createdAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Attempt Ledger Table */}
      <section className="rounded-[var(--radius-card)] border border-line bg-surface-1 p-5">
        <h2 className="font-display text-base font-semibold text-fg">{t.dash.usage.ledgerTitle}</h2>
        {usage.ledger.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{t.dash.usage.noLedger}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line text-muted">
                <tr>
                  <th className="py-2 pr-4">{t.dash.usage.columns.reason}</th>
                  <th className="py-2 pr-4">{t.dash.usage.columns.change}</th>
                  <th className="py-2">{t.dash.usage.columns.date}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-muted">
                {usage.ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-2.5 pr-4 font-medium text-fg">
                      {t.dash.usage.reasons[entry.reason]}
                    </td>
                    <td
                      className={`py-2.5 pr-4 font-mono font-semibold ${
                        entry.delta >= 0 ? "text-accent" : "text-fg"
                      }`}
                    >
                      {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                    </td>
                    <td className="py-2.5">{formatDate(entry.createdAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
