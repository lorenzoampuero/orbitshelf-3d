import { notFound, redirect } from "next/navigation";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { currentUser } from "@/lib/api";
import { providerConfigured } from "@/lib/env";
import { DashboardShell } from "@/components/dashboard-shell";
import { whopCheckoutConfig } from "@/lib/whop";

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

  return (
    <DashboardShell locale={locale} dict={dict} user={user} providerReady={providerConfigured()} billingLive={whopCheckoutConfig() !== null}>
      {children}
    </DashboardShell>
  );
}
