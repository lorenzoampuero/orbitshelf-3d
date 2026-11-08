import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { isLocale, localePath, LOCALES } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { brand } from "@/config/brand";
import { BLOG_POSTS, blogCopy, blogMeta, blogPost, isBlogSlug } from "@/content/blog";
import { MarketingShell } from "@/components/marketing-shell";
import { Pill, Section, SectionTitle, Tag } from "@/components/marketing-kit";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => BLOG_POSTS.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isBlogSlug(slug)) return {};
  const post = blogPost(locale, slug);
  return buildPageMetadata({ locale, path: `/blog/${slug}`, title: `${post.title} | ${brand.fullName}`, description: post.summary });
}

const RELATED_SPANS = ["md:col-span-4", "md:col-span-2", "md:col-span-6"];

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isBlogSlug(slug)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();
  const c = blogCopy[locale];
  const post = blogPost(locale, slug);
  const meta = blogMeta(slug);
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" });
  const related = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 3);

  // Article structured data. The publisher is the brand; there is no personal byline to invent.
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    datePublished: meta.date,
    inLanguage: locale,
    publisher: { "@type": "Organization", name: brand.fullName },
  }).replace(/</g, "\\u003c");

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <article>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <header className="relative pb-10 pt-32 md:pt-40">
          <div className="container-page max-w-3xl space-y-5">
            <Link href={localePath(locale, "/blog")} className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-fg">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {c.back}
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Pill>{c.tags[meta.tag]}</Pill>
              <Pill>
                <time dateTime={meta.date}>{dateFmt.format(new Date(meta.date))}</time>
              </Pill>
              <Pill>{c.minutes.replace("{n}", String(meta.minutes))}</Pill>
            </div>
            <h1 className="hero-title text-[clamp(2rem,4.6vw,3.25rem)]">{post.title}</h1>
            <p className="text-lg leading-relaxed text-muted">{post.summary}</p>
          </div>
        </header>

        <div className="container-page max-w-3xl pb-6">
          <div className="card reveal space-y-9 p-7 md:p-10">
            {post.sections.map((s, i) => (
              <section key={s.h} className={`space-y-3.5 ${i > 0 ? "border-t border-line pt-9" : ""}`}>
                <h2 className="text-xl font-semibold leading-snug">{s.h}</h2>
                {s.p.map((para) => (
                  <p key={para} className="text-base leading-[1.8] text-fg/80">
                    {para}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <aside className="card mt-6 space-y-3 p-7 md:p-8">
            <h2 className="text-lg font-semibold">{c.ctaTitle}</h2>
            <p className="text-sm leading-relaxed text-muted">{c.ctaText}</p>
            <Link href={localePath(locale, "/how-it-works")} className="inline-flex items-center gap-2 text-sm font-semibold text-fg hover:text-accent">
              {c.ctaButton}
              <ArrowRight className="h-4 w-4 text-accent" aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </article>

      <Section>
        <SectionTitle>{c.keepReading}</SectionTitle>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {related.map((p, i) => {
            const rp = blogPost(locale, p.slug);
            return (
              <li key={p.slug} className={`flex ${RELATED_SPANS[i] ?? "md:col-span-2"}`}>
                <Link href={localePath(locale, `/blog/${p.slug}`)} className="card card-lift reveal group flex w-full flex-col justify-between gap-6 p-7 md:p-8">
                  <div className="space-y-4">
                    <Tag>{c.tags[p.tag]}</Tag>
                    <h3 className="text-lg font-semibold leading-tight transition-colors group-hover:text-accent group-focus-visible:text-accent">{rp.title}</h3>
                    <p className="text-sm leading-relaxed text-muted">{rp.summary}</p>
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
