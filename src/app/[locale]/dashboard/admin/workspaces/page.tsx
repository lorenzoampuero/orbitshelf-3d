import Link from "next/link";
import { notFound } from "next/navigation";
import { adminCopy } from "@/content/admin-copy";
import { isLocale, localePath } from "@/i18n/config";
import { requireAdmin } from "@/lib/admin";
import { buildPageMetadata } from "@/lib/seo";
import { store } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { AdminTabs } from "../admin-tabs";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const c = adminCopy[locale].workspaces;
  return buildPageMetadata({ locale, path: "/dashboard/admin/workspaces", title: c.title, description: c.subtitle, noIndex: true });
}

export default async function AdminWorkspacesPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin();
  const copy = adminCopy[locale];
  const c = copy.workspaces;
  const rows = await store.adminWorkspaces(200);

  return (
    <div className="space-y-6" data-testid="admin-workspaces">
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{c.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{c.subtitle}</p>
        </div>
        <AdminTabs locale={locale} copy={copy.nav} current="workspaces" />
      </div>

      <div className="relative overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface-1" role="region" tabIndex={0} aria-label={c.title}>
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-muted">{c.empty}</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">{c.cols.workspace}</th>
                <th scope="col" className="px-4 py-3 font-medium">{c.cols.email}</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">{c.cols.balance}</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">{c.cols.models}</th>
                <th scope="col" className="px-4 py-3 font-medium">{c.cols.created}</th>
                <th scope="col" className="px-4 py-3 font-medium">{c.cols.activity}</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">{c.open}</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((w) => (
                <tr key={w.orgId}>
                  <th scope="row" className="px-4 py-3 font-medium">{w.name}</th>
                  <td className="px-4 py-3 text-muted">{w.email ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{w.balance}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{w.models}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(w.createdAt, locale)}</td>
                  <td className="px-4 py-3 text-muted">{w.lastActivityAt ? formatDate(w.lastActivityAt, locale) : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={localePath(locale, `/dashboard/admin/workspaces/${w.orgId}`)} className="rounded-full border border-line px-3 py-1 text-xs font-medium hover:border-accent">
                      {c.open}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
