import { ProfileForm } from "@/components/profile-form";
import { ShopifyConnect } from "@/components/shopify-connect";
import { encryptionConfigured } from "@/lib/secrets";
import { shopifyConfig } from "@/lib/shopify";
import { store } from "@/lib/store";
import { notFound, redirect } from "next/navigation";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { currentUser } from "@/lib/api";
import { providerConfigured } from "@/lib/env";
import { buildPageMetadata } from "@/lib/seo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SignOutButton } from "./sign-out-button";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/dashboard/settings",
    title: t.dash.settings.title,
    description: t.dash.settings.subtitle,
    noIndex: true,
  });
}

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const session = await currentUser();
  if (!session) redirect(localePath(locale, "/login"));

  const configured = providerConfigured();
  const shopConnection = await store.getIntegration(session.orgId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">{t.dash.settings.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.dash.settings.subtitle}</p>
      </div>

      <section className="rounded-[16px] border border-line bg-surface p-5">
        <h2 className="font-display text-base font-semibold text-fg">{t.dash.settings.profile}</h2>
        <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
          <div className="rounded-xl bg-bg p-3">
            <dt className="text-muted">{t.dash.settings.email}</dt>
            <dd className="mt-1 font-medium text-fg">{session.email}</dd>
          </div>
          <div className="rounded-xl bg-bg p-3">
            <dt className="text-muted">{t.dash.settings.workspaceId}</dt>
            <dd className="mt-1 font-mono text-fg">{session.orgId}</dd>
          </div>
        </dl>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <span className="text-xs font-medium text-muted">{t.dash.settings.language}</span>
          <LocaleSwitcher locale={locale} label={t.common.language} />
        </div>
      </section>

      <section className="rounded-[16px] border border-line bg-surface p-5 space-y-4">
        <div>
          <h2 className="font-display text-base font-semibold text-fg">{t.dash.profile.settingsTitle}</h2>
          <p className="mt-1 text-xs text-muted">{t.dash.profile.settingsIntro}</p>
        </div>
        <ProfileForm dict={t} profile={await store.getProfile(session.userId)} variant="settings" />
      </section>

      <section className="rounded-[16px] border border-line bg-surface p-5">
        <h2 className="font-display text-base font-semibold text-fg">{t.dash.settings.integrations}</h2>
        <div className="mt-4 space-y-3 text-xs">
          <div className="rounded-xl border border-line bg-bg p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-fg">{t.dash.settings.provider}</span>
              <span className="rounded-full border border-line bg-surface px-2.5 py-0.5 font-medium text-accent">
                {configured ? "Configured" : "Demo only"}
              </span>
            </div>
            <p className="mt-1 text-muted">
              {configured ? t.dash.settings.providerOn : t.dash.settings.providerOff}
            </p>
            <p className="mt-1 text-muted">{t.dash.settings.providerNote}</p>
          </div>

          <div className="space-y-3 rounded-xl border border-line bg-bg p-4">
            <span className="font-semibold text-fg">{t.dash.settings.shopify}</span>
            <ShopifyConnect dict={t} available={Boolean(shopifyConfig()) && encryptionConfigured()} initialShop={shopConnection && !shopConnection.revokedAt ? shopConnection.shop : null} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line bg-bg p-4">
            <span className="font-semibold text-fg">{t.dash.settings.supabase}</span>
            <span className="rounded-full border border-line bg-surface px-2.5 py-0.5 font-medium text-amber">
              {t.dash.settings.planned}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-[16px] border border-line bg-surface p-5">
        <h2 className="font-display text-base font-semibold text-fg">{t.dash.settings.session}</h2>
        <div className="mt-3">
          <SignOutButton locale={locale} label={t.dash.settings.signOut} />
        </div>
      </section>
    </div>
  );
}
