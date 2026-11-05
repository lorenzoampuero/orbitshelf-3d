import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { currentUser } from "@/lib/api";
import { refreshEngineSwitches } from "@/lib/jobs";
import { availableEngines, toEngineDto } from "@/lib/provider/registry";
import { activeWorkspace, defaultMode, defaultPreset } from "@/lib/profiles";
import { store } from "@/lib/store";
import { buildPageMetadata } from "@/lib/seo";
import { CreateWizard } from "./create-wizard";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ mode?: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return buildPageMetadata({ locale, path: "/dashboard/create", title: t.dash.create.title, description: t.dash.create.subtitle, noIndex: true });
}

export default async function CreateModelPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = (await currentUser())!;
  const usage = await store.usage(user.orgId);
  const profile = await store.getProfile(user.userId);
  const asked = (await searchParams).mode;
  const requestedMode = asked === "photos" || asked === "text" || asked === "import" ? asked : defaultMode(profile.goal);
  await refreshEngineSwitches().catch(() => undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">{dict.dash.create.title}</h1>
        <p className="text-sm text-muted">{dict.dash.create.subtitle}</p>
      </div>
      <CreateWizard
        locale={locale}
        dict={dict}
        engines={availableEngines().map(toEngineDto)}
        attemptsLeft={usage.balance}
        initialMode={requestedMode}
        initialPreset={defaultPreset(activeWorkspace(profile), profile.experience)}
      />
    </div>
  );
}
