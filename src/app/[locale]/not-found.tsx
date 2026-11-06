import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getDictionary } from "@/i18n/get-dictionary";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `${getDictionary("en").notFound.title} | ${brand.fullName}`,
  robots: { index: false, follow: false },
};

/**
 * Next gives not-found no params, so the language of the visitor is unknown here.
 * English leads (as before) and the Spanish text and link sit under it.
 */
export default function NotFoundPage() {
  const en = getDictionary("en");
  const es = getDictionary("es");
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      <div aria-hidden="true" className="glow left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 md:h-[620px] md:w-[620px]" />
      <div className="card relative w-full max-w-lg space-y-7 p-7 text-center md:p-10">
        <div
          aria-hidden="true"
          className="select-none text-[clamp(5rem,22vw,8rem)] font-bold leading-none text-transparent"
          style={{ WebkitTextStroke: "1.5px rgb(239 43 45 / 0.5)" }}
        >
          404
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
  );
}
