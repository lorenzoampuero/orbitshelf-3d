import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { currentUser } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";
import { store, toDto } from "@/lib/store";
import { TrashClient } from "./trash-client";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return buildPageMetadata({ locale, path: "/dashboard/models/trash", title: t.dash.trash.title, description: t.dash.trash.note, noIndex: true });
}

export default async function TrashPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = (await currentUser())!;
  const models = (await store.listTrash(user.orgId)).map(toDto);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl sm:text-3xl font-bold">{dict.dash.trash.title}</h1>
      <TrashClient locale={locale} dict={dict} initial={models} />
    </div>
  );
}
