import { notFound, redirect } from "next/navigation";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { MarketingShell } from "@/components/marketing-shell";
import { LoginForm } from "./login-form";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/login",
    title: dict.meta.login.title,
    description: dict.meta.login.description,
    noIndex: true,
  });
}

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();
  const sp = await searchParams;
  if (user) {
    redirect(localePath(locale, "/dashboard"));
  }

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={false}>
      <section className="py-16 md:py-24">
        <div className="container-page max-w-md">
          <div className="rounded-[16px] border border-line bg-surface p-6 space-y-5">
            <div className="space-y-1.5">
              <h1 className="font-display text-2xl font-bold">{dict.login.title}</h1>
              <p className="text-xs text-muted">{dict.login.intro}</p>
            </div>

            <div className="rounded-xl border border-line bg-surface-2 p-3.5 space-y-1 text-xs">
              <div className="font-semibold text-warn">{dict.login.warningTitle}</div>
              <p className="text-muted leading-relaxed">{dict.login.warning}</p>
            </div>

            <LoginForm locale={locale} dict={dict.login} nextPath={sp.next} />
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
