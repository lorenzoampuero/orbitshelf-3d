import "@fontsource-variable/instrument-sans";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { brand } from "@/config/brand";
import { getDictionary } from "@/i18n/get-dictionary";
import { ArtImage } from "@/components/home/art-image";
import { PAGE_MODELS } from "@/content/page-models";

/**
 * 404 for URLs that match no route at all. It renders its own html and body because it bypasses every layout.
 * Next only uses this file when `experimental.globalNotFound` is on in next.config.ts; until then it is ignored.
 * In practice proxy.ts already rewrites unknown paths under /en, so src/app/[locale]/not-found.tsx answers them.
 */
export const metadata: Metadata = {
  title: `${getDictionary("en").notFound.title} | ${brand.fullName}`,
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  const en = getDictionary("en");
  const es = getDictionary("es");
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-fg antialiased">
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
          <div aria-hidden="true" className="glow left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 md:h-[620px] md:w-[620px]" />
          <div className="card relative w-full max-w-lg space-y-7 p-7 text-center md:p-10">
            <div aria-hidden="true" className="relative mx-auto flex w-full max-w-[17rem] items-center justify-center">
              <ArtImage image={PAGE_MODELS.notFound.beauty} alt="" small sizes="272px" className="art-float h-auto w-full" />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 select-none font-mono text-sm tracking-[0.3em] text-muted">404</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold leading-tight md:text-3xl">{en.notFound.title}</h1>
              <p className="text-sm leading-relaxed text-muted">{en.notFound.text}</p>
            </div>
            <Link href="/" className="btn-pill btn-solid">
              {en.notFound.home}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <div className="space-y-3 border-t border-line pt-6" lang="es">
              <p className="text-sm leading-relaxed text-muted">
                {es.notFound.title}. {es.notFound.text}
              </p>
              <Link href="/es" className="btn-pill btn-outline">
                {es.notFound.home}
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
