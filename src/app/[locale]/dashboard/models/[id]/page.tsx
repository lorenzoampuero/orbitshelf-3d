import { notFound, redirect } from "next/navigation";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { currentUser } from "@/lib/api";
import { store, toDto } from "@/lib/store";
import { buildPageMetadata } from "@/lib/seo";
import { StudioClient } from "./studio-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  const user = await currentUser();
  const model = user ? await store.getModel(user.orgId, id) : null;
  return buildPageMetadata({
    locale,
    path: `/dashboard/models/${id}`,
    title: model ? `${model.title} · ${t.dash.detail.viewerTitle}` : t.dash.detail.viewerTitle,
    description: t.dash.detail.reviewIntro,
    noIndex: true,
  });
}

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const session = await currentUser();
  if (!session) redirect(localePath(locale, "/login"));

  const row = await store.getModel(session.orgId, id);
  if (!row) notFound();

  return <StudioClient locale={locale} t={t} initialModel={toDto(row)} />;
}
