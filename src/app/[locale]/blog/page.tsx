import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { BLOG_POSTS, blogCopy, blogPost } from "@/content/blog";
import { MarketingShell } from "@/components/marketing-shell";
import { PageHero, Section, Tag } from "@/components/marketing-kit";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const c = blogCopy[locale];
  return buildPageMetadata({ locale, path: "/blog", title: c.metaTitle, description: c.metaDescription });
}

/** Mixed card widths on a six-column grid: the newest article leads. */
const SPANS = ["md:col-span-4", "md:col-span-2", "md:col-span-2", "md:col-span-2", "md:col-span-2", "md:col-span-6"];

export default async function BlogIndexPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();
  const c = blogCopy[locale];
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" });

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <PageHero pill={c.eyebrow} title={c.title} text={c.intro} />
      <Section>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {BLOG_POSTS.map((meta, i) => {
            const post = blogPost(locale, meta.slug);
            return (
              <li key={meta.slug} className={`flex ${SPANS[i] ?? "md:col-span-2"}`}>
                <Link href={localePath(locale, `/blog/${meta.slug}`)} className={`card card-lift reveal group flex w-full flex-col justify-between gap-8 p-7 md:p-8 ${i === 0 ? "md:min-h-[260px]" : ""}`}>
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                      <Tag>{c.tags[meta.tag]}</Tag>
                      <time dateTime={meta.date}>{dateFmt.format(new Date(meta.date))}</time>
                      <span>{c.minutes.replace("{n}", String(meta.minutes))}</span>
                    </div>
                    <h2 className={`font-semibold leading-tight transition-colors group-hover:text-accent group-focus-visible:text-accent ${i === 0 ? "text-2xl md:max-w-md" : "text-xl"}`}>{post.title}</h2>
                    <p className="max-w-xl text-sm leading-relaxed text-muted">{post.summary}</p>
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
      </Section>
    </MarketingShell>
  );
}
