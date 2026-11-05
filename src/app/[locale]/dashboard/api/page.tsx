import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { currentUser } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";
import { store, toApiTokenDto } from "@/lib/store";
import { ApiClient } from "./api-client";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return buildPageMetadata({ locale, path: "/dashboard/api", title: t.dash.apiAccess.title, description: t.dash.apiAccess.subtitle, noIndex: true });
}

export default async function ApiPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = (await currentUser())!;
  const tokens = (await store.listApiTokens(user.orgId)).map(toApiTokenDto);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">{dict.dash.apiAccess.title}</h1>
        <p className="mt-1 text-sm text-muted">{dict.dash.apiAccess.subtitle}</p>
      </div>
      <ApiClient dict={dict} initial={tokens} locale={locale} />
    </div>
  );
}
