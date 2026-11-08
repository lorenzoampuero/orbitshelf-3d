import Link from "next/link";
import { notFound } from "next/navigation";
import { adminCopy } from "@/content/admin-copy";
import { isLocale, localePath } from "@/i18n/config";
import { requireAdmin } from "@/lib/admin";
import { buildPageMetadata } from "@/lib/seo";
import { store, billingNeedsAttention } from "@/lib/store";
import { cn, formatDate } from "@/lib/utils";
import { AdjustCreditsForm } from "../adjust-credits-form";
import { AdminTabs } from "../admin-tabs";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ pending?: string }> };

export async function generateMetadata({ params }: Pick<Props, "params">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const c = adminCopy[locale].payments;
  return buildPageMetadata({ locale, path: "/dashboard/admin/payments", title: c.title, description: c.subtitle, noIndex: true });
}

export default async function AdminPaymentsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin();
  const onlyPending = (await searchParams).pending === "1";
  const copy = adminCopy[locale];
  const c = copy.payments;
  const events = await store.listBillingEvents(200, onlyPending);
  const base = localePath(locale, "/dashboard/admin/payments");

  const chip = (active: boolean) => cn("rounded-full border px-3 py-1 text-xs font-medium", active ? "border-accent bg-accent/10 text-accent" : "border-line text-muted hover:text-fg");

  return (
    <div className="space-y-6" data-testid="admin-payments">
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{c.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{c.subtitle}</p>
        </div>
        <AdminTabs locale={locale} copy={copy.nav} current="payments" />
      </div>

      <section aria-labelledby="tool-h" className="space-y-4 rounded-[24px] border border-line bg-surface p-5">
        <div>
          <h2 id="tool-h" className="font-display text-lg font-semibold">{c.toolTitle}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">{c.toolText}</p>
        </div>
        <AdjustCreditsForm copy={copy.form} withOrgField />
      </section>

      <div className="flex flex-wrap gap-2" role="group" aria-label={c.title}>
        <Link href={base} aria-current={!onlyPending ? "page" : undefined} className={chip(!onlyPending)}>{c.filterAll}</Link>
        <Link href={`${base}?pending=1`} aria-current={onlyPending ? "page" : undefined} className={chip(onlyPending)}>{c.filterPending}</Link>
      </div>

      <div className="relative overflow-x-auto rounded-[24px] border border-line bg-surface" role="region" tabIndex={0} aria-label={c.title}>
        {events.length === 0 ? (
          <p className="p-6 text-sm text-muted">{c.empty}</p>
        ) : (
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">{c.cols.date}</th>
                <th scope="col" className="px-4 py-3 font-medium">{c.cols.kind}</th>
                <th scope="col" className="px-4 py-3 font-medium">{c.cols.payment}</th>
                <th scope="col" className="px-4 py-3 font-medium">{c.cols.workspace}</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">{c.cols.credits}</th>
                <th scope="col" className="px-4 py-3 font-medium">{c.cols.outcome}</th>
                <th scope="col" className="px-4 py-3 font-medium">{c.cols.detail}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {events.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(e.createdAt, locale)}</td>
                  <td className="px-4 py-3">{c.kinds[e.kind] ?? e.kind}</td>
                  <td className="px-4 py-3 font-mono text-xs">{e.paymentId ?? "—"}</td>
                  <td className="px-4 py-3">
                    {e.orgId ? (
                      <Link href={localePath(locale, `/dashboard/admin/workspaces/${e.orgId}`)} className="font-mono text-xs text-accent hover:underline">{e.orgId}</Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{e.credits === 0 ? "—" : e.credits > 0 ? `+${e.credits}` : e.credits}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", billingNeedsAttention(e) ? "bg-warn/15 text-warn" : "bg-ok/15 text-ok")}>{c.outcomes[e.outcome] ?? e.outcome}</span>
                  </td>
                  <td className="max-w-[280px] px-4 py-3 text-xs text-muted"><span className="line-clamp-2">{e.detail ?? "—"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
