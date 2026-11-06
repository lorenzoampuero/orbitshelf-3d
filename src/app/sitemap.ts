import type { MetadataRoute } from "next";
import { brand, siteUrlConfigured } from "@/config/brand";
import { en } from "@/i18n/dictionaries/en";
import { localePath } from "@/i18n/config";

export default function sitemap(): MetadataRoute.Sitemap {
  // Absolute URLs are required; with no site URL configured in production, list nothing rather than a wrong host.
  if (!siteUrlConfigured) return [];
  const base = brand.siteUrl.replace(/\/+$/, "");
  const marketingPaths = [
    "/",
    "/features",
    "/features/text-to-3d",
    "/features/image-to-3d",
    "/features/multi-image-to-3d",
    "/solutions",
    "/solutions/stores",
    "/solutions/games",
    "/solutions/design",
    "/integrations",
    "/how-it-works",
    "/examples",
    "/pricing",
    "/resources",
    ...en.resources.articles.map((a) => `/resources/${a.slug}`),
    "/compare/ai-3d-vs-manual",
    "/privacy",
    "/terms",
  ];
  // /login is noindex, so it is not listed. The build time stands in for the last change of the pages.
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [];
  for (const p of marketingPaths) {
    for (const locale of ["en", "es"] as const) {
      entries.push({
        url: `${base}${localePath(locale, p)}`,
        lastModified,
        alternates: {
          languages: {
            en: `${base}${localePath("en", p)}`,
            es: `${base}${localePath("es", p)}`,
          },
        },
      });
    }
  }
  return entries;
}
