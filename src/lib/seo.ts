import type { Metadata } from "next";
import { brand, siteUrlConfigured } from "@/config/brand";
import { localeLabels, localePath } from "@/i18n/config";
import type { Locale } from "@/lib/types";

let warnedSiteUrl = false;

export function buildPageMetadata(input: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  noIndex?: boolean;
}): Metadata {
  const base = brand.siteUrl.replace(/\/+$/, "");
  if (!siteUrlConfigured && !warnedSiteUrl) {
    warnedSiteUrl = true;
    console.warn("[seo] NEXT_PUBLIC_SITE_URL is not set in production: canonical and hreflang are relative and will not name the real host.");
  }
  const enUrl = `${base}${localePath("en", input.path)}`;
  const esUrl = `${base}${localePath("es", input.path)}`;
  const canonical = input.locale === "es" ? esUrl : enUrl;

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
      languages: {
        en: enUrl,
        es: esUrl,
        "x-default": enUrl,
      },
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: brand.fullName,
      locale: localeLabels[input.locale].ogLocale,
      type: "website",
    },
    robots: input.noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}
