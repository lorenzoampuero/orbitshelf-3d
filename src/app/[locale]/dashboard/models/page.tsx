import { notFound, redirect } from "next/navigation";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { currentUser } from "@/lib/api";
import { store, toDto } from "@/lib/store";
import { buildPageMetadata } from "@/lib/seo";
import { LibraryClient } from "./library-client";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/dashboard/models",
    title: t.dash.library.title,
    description: t.dash.library.subtitle,
    noIndex: true,
  });
}

export default async function ModelsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> }) {
  const { locale } = await params;
  const q = ((await searchParams).q ?? "").slice(0, 120);
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const session = await currentUser();
  if (!session) redirect(localePath(locale, "/login"));

  const rows = await store.listModels(session.orgId);
  const models = rows.map(toDto);

  return <LibraryClient initialProjects={(await store.listProjects(session.orgId)).map(({ id, name, createdAt }) => ({ id, name, createdAt }))} locale={locale} t={t} initialModels={models} initialQuery={q} />;
}
