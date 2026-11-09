import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, localePath } from "@/i18n/config";
import { forBilling } from "@/i18n/billing-copy";
import { getDictionary } from "@/i18n/get-dictionary";
import { billingUnit } from "@/lib/env";
import { firstModelProgress } from "@/lib/first-model";
import { ExampleGallery, type GalleryModel } from "@/components/example-gallery";
import { ProfileForm } from "@/components/profile-form";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { examplePoster } from "@/content/examples";
import { studioCopy } from "@/content/studio-copy";
import { refreshEngineSwitches } from "@/lib/jobs";
import { activeWorkspace, defaultPreset, SHORTCUTS, shortcutsFor } from "@/lib/profiles";
import { allEngines, availableEngines, toEngineDto } from "@/lib/provider/registry";
import { requireUser } from "@/lib/require-user";
import { buildPageMetadata } from "@/lib/seo";
import { store, toDto } from "@/lib/store";
import { FirstModelCard } from "./first-model-card";
import { StudioComposer } from "./studio-composer";

type Props = { params: Promise<{ locale: string }> };

const GALLERY_SIZE = 8;

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return buildPageMetadata({ locale, path: "/dashboard", title: t.dash.overview.title, description: t.dash.overview.subtitle, noIndex: true });
}

export default async function DashboardOverviewPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = forBilling(getDictionary(locale), locale, billingUnit());
  const copy = studioCopy[locale];
  const user = await requireUser(locale);
  const rows = (await store.listModels(user.orgId)).map(toDto);
  const usage = await store.usage(user.orgId);
  const profile = await store.getProfile(user.userId);
  await refreshEngineSwitches().catch(() => undefined);
  const engines = availableEngines().map(toEngineDto);
  const workspace = activeWorkspace(profile);
  const shortcuts = shortcutsFor(workspace, profile.goal);
  const showOnboarding = !profile.onboardedAt && !profile.skippedAt;
  const liveEmbeds = (await store.listEmbeds(user.orgId)).filter((e) => !e.revokedAt).length;
  const firstModel = firstModelProgress(rows, liveEmbeds);

  const stats = [
    { label: copy.stats.models, value: rows.length, testId: "stat-total-models" },
    { label: copy.stats.toReview, value: rows.filter((m) => m.status === "ready" && m.reviewState === "pending").length },
    { label: copy.stats.approved, value: rows.filter((m) => m.reviewState === "approved").length },
    { label: copy.stats.processing, value: rows.filter((m) => m.status === "processing").length },
  ];

  const models: GalleryModel[] = rows.slice(0, GALLERY_SIZE).map((m) => ({
    id: m.id,
    title: m.title,
    status: dict.dash.status[m.status],
    provenance: dict.dash.provenance[m.provenance],
    poster: m.demoAsset ? examplePoster(m.demoAsset) : m.hasThumbnail ? `/api/models/${m.id}/thumbnail` : null,
  }));

  return (
    <div className="space-y-8">
      <StudioComposer locale={locale} engines={engines} catalog={allEngines().map(toEngineDto)} preset={defaultPreset(workspace, profile.experience)} />

      {!firstModel.complete && <FirstModelCard locale={locale} progress={firstModel} providerReady={engines.length > 0} balance={usage.balance} />}

      <ExampleGallery locale={locale} copy={copy.gallery} models={models} />

      <dl className="flex flex-wrap items-baseline gap-x-8 gap-y-2 border-y border-line py-3">
        {stats.map((s) => (
          <div key={s.label} className="flex items-baseline gap-2">
            <dt className="text-xs text-muted">{s.label}</dt>
            <dd className="font-mono text-base font-semibold tabular-nums" data-testid={s.testId}>
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      {showOnboarding && (
        <section aria-labelledby="onboarding-heading" className="space-y-3 rounded-[24px] border border-line bg-surface p-5" data-testid="onboarding-card">
          <div>
            <h2 id="onboarding-heading" className="font-display text-lg font-semibold">{dict.dash.profile.title}</h2>
            <p className="mt-1 text-xs text-muted">{dict.dash.profile.intro}</p>
          </div>
          <ProfileForm dict={dict} profile={profile} variant="onboarding" />
        </section>
      )}

      <section aria-labelledby="shortcuts-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="shortcuts-heading" className="font-display text-lg font-semibold">
            {workspace ? dict.dash.profile.useCases[workspace] : copy.more}
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <WorkspaceSwitcher dict={dict} active={workspace} />
            <Link href={localePath(locale, "/dashboard/explore")} data-testid="explore-all-link" className="text-xs font-medium text-accent hover:underline">
              {dict.dash.profile.exploreAll} →
            </Link>
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="workspace-shortcuts">
          {shortcuts.map((id) => (
            <li key={id}>
              <Link href={localePath(locale, SHORTCUTS[id])} data-testid={`shortcut-${id}`} className="group block h-full rounded-[20px] border border-line bg-surface p-4 transition-colors hover:border-accent/50">
                <span className="block text-sm font-semibold text-fg group-hover:text-accent">{dict.dash.profile.shortcuts[id].title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">{dict.dash.profile.shortcuts[id].text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs leading-relaxed text-muted">{dict.dash.overview.notice}</p>
    </div>
  );
}
