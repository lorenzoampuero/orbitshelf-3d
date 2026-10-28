import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/types";

export { DEFAULT_LOCALE, LOCALES };
export type { Locale };

export const isLocale = (v: string | undefined | null): v is Locale => !!v && (LOCALES as readonly string[]).includes(v);

/** English lives at `/`, Spanish at `/es`. */
export function localePath(locale: Locale, path = "/"): string {
  const clean = path.startsWith("/") ? path : "/" + path;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? "/es" : "/es" + clean;
}

/** Strips a leading `/es` so a public pathname becomes locale-neutral. */
export function stripLocale(pathname: string): string {
  if (pathname === "/es") return "/";
  return pathname.startsWith("/es/") ? pathname.slice(3) : pathname;
}

export function switchLocalePath(pathname: string, target: Locale): string {
  return localePath(target, stripLocale(pathname));
}

export const localeLabels: Record<Locale, { native: string; htmlLang: string; ogLocale: string }> = {
  en: { native: "English", htmlLang: "en", ogLocale: "en_US" },
  es: { native: "Español", htmlLang: "es", ogLocale: "es_ES" },
};
