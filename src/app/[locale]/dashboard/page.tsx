import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { currentUser } from "@/lib/api";
import { ProfileForm } from "@/components/profile-form";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { activeWorkspace, SHORTCUTS, shortcutsFor } from "@/lib/profiles";
import { store, toDto } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { buildPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return buildPageMetadata({ locale, path: "/dashboard", title: t.dash.overview.title, description: t.dash.overview.subtitle, noIndex: true });
}

export default async function DashboardOverviewPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = (await currentUser())!;
  const rows = (await store.listModels(user.orgId)).map(toDto);
  const usage = await store.usage(user.orgId);
  const profile = await store.getProfile(user.userId);
  const workspace = activeWorkspace(profile);
  const shortcuts = shortcutsFor(workspace, profile.goal);
  const showOnboarding = !profile.onboardedAt && !profile.skippedAt;

  const readyToReview = rows.filter((m) => m.status === "ready" && m.reviewState === "pending").length;
  const approved = rows.filter((m) => m.reviewState === "approved").length;
  const processing = rows.filter((m) => m.status === "processing").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">{dict.dash.overview.title}</h1>
          <p className="text-sm text-muted">{dict.dash.overview.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <WorkspaceSwitcher dict={dict} active={workspace} />
          <Link
            href={localePath(locale, "/dashboard/create")}
            data-testid="overview-create-cta"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-bg shrink-0"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{dict.dash.overview.cta}</span>
          </Link>
        </div>
      </div>

      {showOnboarding && (
        <section aria-labelledby="onboarding-heading" className="rounded-[16px] border border-accent/40 bg-surface p-5 space-y-3" data-testid="onboarding-card">
          <div>
            <h2 id="onboarding-heading" className="font-display text-lg font-semibold">{dict.dash.profile.title}</h2>
            <p className="mt-1 text-xs text-muted">{dict.dash.profile.intro}</p>
          </div>
          <ProfileForm dict={dict} profile={profile} variant="onboarding" />
        </section>
      )}

      <section aria-labelledby="shortcuts-heading" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="shortcuts-heading" className="font-display text-lg font-semibold">
            {workspace ? dict.dash.profile.useCases[workspace] : dict.dash.profile.shortcutsTitle}
          </h2>
          <Link href={localePath(locale, "/dashboard/explore")} data-testid="explore-all-link" className="text-xs font-medium text-accent hover:underline">
            {dict.dash.profile.exploreAll} →
          </Link>
        </div>
        <ul className="divide-y divide-line border-y border-line" data-testid="workspace-shortcuts">
          {shortcuts.map((id) => (
            <li key={id}>
              <Link href={localePath(locale, SHORTCUTS[id])} data-testid={`shortcut-${id}`} className="group grid gap-1 py-3 text-sm md:grid-cols-12 md:gap-6">
                <span className="font-semibold text-fg group-hover:text-accent md:col-span-4">{dict.dash.profile.shortcuts[id].title}</span>
                <span className="text-xs leading-relaxed text-muted md:col-span-8">{dict.dash.profile.shortcuts[id].text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="rounded-[14px] border border-line bg-surface p-4">
          <div className="text-xs text-muted">{dict.dash.overview.stats.models}</div>
          <div className="mt-1 font-display text-2xl font-bold" data-testid="stat-total-models">
            {rows.length}
          </div>
        </div>
        <div className="rounded-[14px] border border-line bg-surface p-4">
          <div className="text-xs text-muted">{dict.dash.overview.stats.toReview}</div>
          <div className="mt-1 font-display text-2xl font-bold text-accent">{readyToReview}</div>
        </div>
        <div className="rounded-[14px] border border-line bg-surface p-4">
          <div className="text-xs text-muted">{dict.dash.overview.stats.approved}</div>
          <div className="mt-1 font-display text-2xl font-bold">{approved}</div>
        </div>
        <div className="rounded-[14px] border border-line bg-surface p-4">
          <div className="text-xs text-muted">{dict.dash.overview.stats.processing}</div>
          <div className="mt-1 font-display text-2xl font-bold">{processing}</div>
        </div>
        <div className="rounded-[14px] border border-line bg-surface p-4 col-span-2 lg:col-span-1">
          <div className="text-xs text-muted">{dict.dash.overview.stats.attempts}</div>
          <div className="mt-1 font-display text-2xl font-bold">{usage.balance}</div>
          <div className="mt-1 text-[11px] text-muted">{dict.dash.overview.attemptsNote}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-8 rounded-[16px] border border-line bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">{dict.dash.overview.recent}</h2>
            <Link href={localePath(locale, "/dashboard/models")} className="text-xs font-medium text-accent hover:underline">
              {dict.dash.overview.viewAll} →
            </Link>
          </div>

          {rows.length === 0 ? (
            <div className="rounded-xl border border-line bg-bg p-6 text-center space-y-3">
              <h3 className="font-display text-base font-semibold">{dict.dash.overview.emptyTitle}</h3>
              <p className="text-xs text-muted max-w-md mx-auto">{dict.dash.overview.emptyText}</p>
              <Link
                href={localePath(locale, "/dashboard/create")}
                className="inline-flex items-center rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-bg"
              >
                {dict.dash.overview.cta}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {rows.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium text-fg truncate">{m.title}</div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span>{dict.dash.provenance[m.provenance]}</span>
                      <span>•</span>
                      <span>{dict.dash.categories[m.category]}</span>
                      <span>•</span>
                      <span>{formatDate(m.createdAt, locale)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs">
                      {dict.dash.status[m.status]}
                    </span>
                    <Link
                      href={localePath(locale, `/dashboard/models/${m.id}`)}
                      className="rounded-lg border border-line px-3 py-1 text-xs font-medium hover:border-accent"
                    >
                      {dict.common.open}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-[16px] border border-line bg-surface p-5 space-y-3">
            <h2 className="font-display text-base font-semibold">{dict.dash.overview.flowTitle}</h2>
            <ol className="space-y-2 text-xs text-muted">
              {dict.dash.overview.flow.map((step, i) => (
                <li key={step} className="flex items-center gap-2.5">
                  <span className="font-mono font-semibold text-accent">0{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[16px] border border-line bg-surface-2 p-5 space-y-2">
            <h2 className="font-display text-sm font-semibold">{dict.dash.overview.noticeTitle}</h2>
            <p className="text-xs leading-relaxed text-muted">{dict.dash.overview.notice}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
