import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";
import { en } from "@/i18n/dictionaries/en";
import { localePath } from "@/i18n/config";

export default function sitemap(): MetadataRoute.Sitemap {
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
    "/login",
  ];

  const entries: MetadataRoute.Sitemap = [];
  for (const p of marketingPaths) {
    for (const locale of ["en", "es"] as const) {
      entries.push({
        url: `${base}${localePath(locale, p)}`,
        lastModified: new Date("2026-10-27"),
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
