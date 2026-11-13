import { notFound, redirect } from "next/navigation";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { currentUser } from "@/lib/api";
import { billingUnit, providerConfigured } from "@/lib/env";
import { forBilling } from "@/i18n/billing-copy";
import { store } from "@/lib/store";
import { activeWorkspace } from "@/lib/profiles";
import { DashboardShell } from "@/components/dashboard-shell";
import { whopCheckoutConfig } from "@/lib/whop";
import { isAdminUser } from "@/lib/admin";
import { adminCopy } from "@/content/admin-copy";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await currentUser();
  if (!user) {
    redirect(localePath(locale, "/login"));
  }
  const dict = getDictionary(locale);
  const { balance } = await store.usage(user.orgId);
  const workspace = activeWorkspace(await store.getProfile(user.userId));
  const balanceLabel = forBilling(dict, locale, billingUnit()).dash.overview.stats.attempts;

  return (
    <DashboardShell
      locale={locale}
      dict={dict}
      user={user}
      providerReady={providerConfigured()}
      billingLive={whopCheckoutConfig() !== null}
      adminLabel={isAdminUser(user) ? adminCopy[locale].nav.label : undefined}
      balance={balance}
      balanceLabel={balanceLabel}
      workspace={workspace}
    >
      {children}
    </DashboardShell>
  );
}
