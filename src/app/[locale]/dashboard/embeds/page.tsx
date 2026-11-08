import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireUser } from "@/lib/require-user";
import { buildPageMetadata } from "@/lib/seo";
import { store, toDto, toEmbedDto } from "@/lib/store";
import { EmbedsClient } from "./embeds-client";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/dashboard/embeds",
    title: t.dash.embeds.title,
    description: t.dash.embeds.subtitle,
    noIndex: true,
  });
}

export default async function EmbedsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const user = await requireUser(locale);
  const approved = (await store.listModels(user.orgId)).filter((m) => m.reviewState === "approved" && m.status === "ready").map(toDto);
  const embeds = (await store.listEmbeds(user.orgId)).map(toEmbedDto);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") || `${h.get("x-forwarded-proto") ?? "http"}://${host}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">{t.dash.embeds.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.dash.embeds.subtitle}</p>
      </div>
      <EmbedsClient locale={locale} dict={t} approved={approved} initialEmbeds={embeds} origin={origin} />
    </div>
  );
}
