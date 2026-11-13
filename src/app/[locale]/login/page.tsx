import { notFound, redirect } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { authMode } from "@/lib/env";
import { MarketingShell } from "@/components/marketing-shell";
import { LoginForm } from "./login-form";
import { ArtImage } from "@/components/home/art-image";
import { PAGE_MODELS } from "@/content/page-models";

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
  const magicLink = authMode() === "supabase";

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={false}>
      <section className="relative overflow-hidden pb-20 pt-32 md:pb-28 md:pt-40">
        <div aria-hidden="true" className="glow left-1/2 top-24 h-[420px] w-[420px] -translate-x-1/2 md:h-[560px] md:w-[560px] lg:left-[72%]" />
        <div className="container-page relative grid max-w-5xl items-center gap-10 lg:grid-cols-[28rem_1fr] lg:gap-16">
          <div className="card mx-auto w-full max-w-md space-y-6 p-6 md:p-9 lg:mx-0">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold leading-tight">{dict.login.title}</h1>
              <p className="text-sm leading-relaxed text-muted">{magicLink ? dict.login.introMagic : dict.login.intro}</p>
            </div>

            {!magicLink && (
              <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface-2 p-4 text-sm">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
                <div className="space-y-1">
                  <div className="font-semibold text-warn">{dict.login.warningTitle}</div>
                  <p className="leading-relaxed text-muted">{dict.login.warning}</p>
                </div>
              </div>
            )}

            <LoginForm locale={locale} dict={dict.login} nextPath={sp.next} magicLink={magicLink} />
          </div>
          <div aria-hidden="true" className="relative hidden lg:block">
            <div className="hero-pool" />
            <ArtImage image={PAGE_MODELS.login.beauty} alt="" priority sizes="520px" className="float-slow relative mx-auto h-auto w-full max-w-[460px]" />
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
