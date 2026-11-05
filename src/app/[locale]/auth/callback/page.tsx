import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { MarketingShell } from "@/components/marketing-shell";
import { CallbackClient } from "./callback-client";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return buildPageMetadata({ locale, path: "/auth/callback", title: dict.login.callbackTitle, description: dict.login.callbackLoading, noIndex: true });
}

export default async function AuthCallbackPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={false}>
      <section className="py-16 md:py-24">
        <div className="container-page max-w-md">
          <div className="rounded-[16px] border border-line bg-surface p-6 space-y-4">
            <h1 className="font-display text-2xl font-bold">{dict.login.callbackTitle}</h1>
            <CallbackClient locale={locale} dict={dict.login} />
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
