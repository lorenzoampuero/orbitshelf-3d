import Link from "next/link";
import { ArrowRight, BadgeCheck, LockKeyhole, RotateCcw, ShieldCheck, X } from "lucide-react";
import { localePath } from "@/i18n/config";
import type { Locale } from "@/lib/types";
import { BLOG_POSTS, blogCopy, blogPost } from "@/content/blog";
import { legalRoute } from "@/content/legal/labels";
import { landingExtra, READING } from "@/content/landing-extra";
import { Card, Checklist, Section, SectionTitle, StatusBadge, Tag } from "./marketing-kit";

/**
 * Shared sections for the public pages. Server components. The content lives in `content/landing-extra.ts`
 * and contains no prices, so it can sit on the home page.
 */

const TRUST_ICONS = { approve: BadgeCheck, privacy: LockKeyhole, isolation: ShieldCheck, refund: RotateCcw } as const;
const LEVEL_TONE = { good: "ok", depends: "muted", hard: "warn" } as const;

/** What to expect by kind of product: a list of cards (no wide table), so it never overflows on a phone. */
export function ProductFit({ locale }: { locale: Locale }) {
  const c = landingExtra[locale].fit;
  return (
    <Section>
      <SectionTitle sub={c.sub}>{c.title}</SectionTitle>
      <ul className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2" data-testid="product-fit">
        {c.rows.map((r) => (
          <li key={r.kind} className="card reveal flex flex-col gap-3 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={LEVEL_TONE[r.level]}>{c.levels[r.level]}</StatusBadge>
            </div>
            <h3 className="text-base font-semibold leading-snug">{r.kind}</h3>
            <p className="text-sm leading-relaxed text-muted">{r.advice}</p>
          </li>
        ))}
      </ul>
      <p className="mx-auto max-w-3xl text-center text-xs leading-relaxed text-muted">{c.note}</p>
    </Section>
  );
}

/** A generator on its own versus the full workflow, as two cards side by side. */
export function WorkflowVersus({ locale }: { locale: Locale }) {
  const c = landingExtra[locale].versus;
  return (
    <Section>
      <SectionTitle sub={c.sub}>{c.title}</SectionTitle>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2" data-testid="workflow-versus">
        <Card tone="outline" className="space-y-5">
          <h3 className="text-lg font-semibold">{c.aloneTitle}</h3>
          <ul className="space-y-3 text-sm text-muted">
            {c.rows.map((r) => (
              <li key={r.alone} className="flex items-start gap-2.5">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                {r.alone}
              </li>
            ))}
          </ul>
        </Card>
        <Card tone="red" className="space-y-5">
          <h3 className="text-lg font-semibold">{c.flowTitle}</h3>
          <Checklist items={c.rows.map((r) => r.flow)} />
        </Card>
      </div>
      <p className="mx-auto max-w-3xl text-center text-xs leading-relaxed text-muted">{c.note}</p>
    </Section>
  );
}

/** Commitments the product keeps today, each linked to the document that states it. */
export function TrustStrip({ locale }: { locale: Locale }) {
  const c = landingExtra[locale].trust;
  return (
    <Section>
      <SectionTitle sub={c.sub}>{c.title}</SectionTitle>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="trust-strip">
        {c.items.map((it) => {
          const Icon = TRUST_ICONS[it.icon];
          return (
            <li key={it.title} className="flex">
              <Link href={localePath(locale, legalRoute(it.slug))} className="card card-lift reveal flex w-full flex-col gap-4 p-6">
                <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl bg-blood text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-base font-semibold leading-snug">{it.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{it.text}</p>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="flex justify-center">
        <Link href={localePath(locale, "/legal")} className="btn-pill btn-outline">
          {c.all}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </Section>
  );
}

/** Three articles chosen for the page, plus a link to the whole blog. */
export function ReadingSuggestions({ locale, page }: { locale: Locale; page: keyof typeof READING }) {
  const c = landingExtra[locale].reading;
  const b = blogCopy[locale];
  const slugs = READING[page] ?? [];
  const posts = slugs.map((s) => BLOG_POSTS.find((p) => p.slug === s)).filter((p): p is (typeof BLOG_POSTS)[number] => Boolean(p));
  if (posts.length === 0) return null;
  return (
    <Section>
      <SectionTitle sub={c.sub}>{c.title}</SectionTitle>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-3" data-testid="reading-suggestions">
        {posts.map((meta) => {
          const post = blogPost(locale, meta.slug);
          return (
            <li key={meta.slug} className="flex">
              <Link href={localePath(locale, `/blog/${meta.slug}`)} className="card card-lift reveal group flex w-full flex-col justify-between gap-6 p-7">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                    <Tag>{b.tags[meta.tag]}</Tag>
                    <span>{c.minutes.replace("{n}", String(meta.minutes))}</span>
                  </div>
                  <h3 className="text-lg font-semibold leading-tight transition-colors group-hover:text-accent group-focus-visible:text-accent">{post.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{post.summary}</p>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-fg">
                  {c.read}
                  <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="flex justify-center">
        <Link href={localePath(locale, "/blog")} className="btn-pill btn-outline">
          {c.all}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </Section>
  );
}
