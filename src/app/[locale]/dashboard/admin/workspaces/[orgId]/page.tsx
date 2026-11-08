import Link from "next/link";
import { notFound } from "next/navigation";
import { adminCopy } from "@/content/admin-copy";
import { isLocale, localePath } from "@/i18n/config";
import { requireAdmin } from "@/lib/admin";
import { buildPageMetadata } from "@/lib/seo";
import { store } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { AdjustCreditsForm } from "../../adjust-credits-form";
import { AdminTabs } from "../../admin-tabs";

type Props = { params: Promise<{ locale: string; orgId: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const c = adminCopy[locale].detail;
  return buildPageMetadata({ locale, path: "/dashboard/admin/workspaces", title: c.title, description: c.ledgerTitle, noIndex: true });
}

export default async function AdminWorkspacePage({ params }: Props) {
  const { locale, orgId } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin();
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(orgId)) notFound();
  const org = await store.getOrg(orgId);
  if (!org) notFound();
  const copy = adminCopy[locale];
  const c = copy.detail;
  const [usage, all] = await Promise.all([store.usage(orgId), store.adminWorkspaces(500)]);
  const row = all.find((w) => w.orgId === orgId);

  return (
    <div className="space-y-6" data-testid="admin-workspace-detail">
      <div className="space-y-4">
        <Link href={localePath(locale, "/dashboard/admin/workspaces")} className="text-xs font-medium text-accent hover:underline">← {copy.workspaces.back}</Link>
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{org.name}</h1>
          <p className="mt-1 font-mono text-xs text-muted">{org.id}</p>
        </div>
        <AdminTabs locale={locale} copy={copy.nav} current="workspaces" />
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[20px] border border-line bg-surface p-4">
          <dt className="text-xs text-muted">{c.balance}</dt>
          <dd className="mt-1 font-display text-2xl font-bold text-accent" data-testid="admin-detail-balance">{usage.balance}</dd>
        </div>
        <div className="rounded-[20px] border border-line bg-surface p-4">
          <dt className="text-xs text-muted">{c.models}</dt>
          <dd className="mt-1 font-display text-2xl font-bold">{row?.models ?? 0}</dd>
        </div>
        <div className="col-span-2 min-w-0 rounded-[20px] border border-line bg-surface p-4">
          <dt className="text-xs text-muted">{c.email}</dt>
          <dd className="mt-1 truncate text-sm font-medium">{row?.email ?? "—"}</dd>
          <dd className="mt-1 text-xs text-muted">{c.created}: {formatDate(org.createdAt, locale)}</dd>
        </div>
      </dl>

      <section aria-labelledby="adjust-h" className="space-y-4 rounded-[24px] border border-line bg-surface p-5">
        <h2 id="adjust-h" className="font-display text-lg font-semibold">{c.adjustTitle}</h2>
        <AdjustCreditsForm copy={copy.form} orgId={orgId} />
      </section>

      <section aria-labelledby="ledger-h" className="space-y-3 rounded-[24px] border border-line bg-surface p-5">
        <h2 id="ledger-h" className="font-display text-lg font-semibold">{c.ledgerTitle}</h2>
        {usage.ledger.length === 0 ? (
          <p className="text-sm text-muted">{c.ledgerEmpty}</p>
        ) : (
          <div className="relative overflow-x-auto" role="region" tabIndex={0} aria-labelledby="ledger-h">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-medium">{c.cols.date}</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">{c.cols.change}</th>
                  <th scope="col" className="py-2 pl-3 font-medium">{c.cols.reason}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {usage.ledger.slice(0, 40).map((l) => (
                  <tr key={l.id}>
                    <td className="py-2 pr-3 text-muted">{formatDate(l.createdAt, locale)}</td>
                    <td className={l.delta > 0 ? "px-3 py-2 text-right tabular-nums text-ok" : "px-3 py-2 text-right tabular-nums"}>{l.delta > 0 ? `+${l.delta}` : l.delta}</td>
                    <td className="py-2 pl-3">{c.reasons[l.reason] ?? l.reason}</td>
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
