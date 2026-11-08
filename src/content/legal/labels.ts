import type { Locale } from "@/lib/types";

/**
 * Light part of the legal content (slugs, routes and short labels). Client components such as the footer import only this file,
 * so the full texts in es.ts and en.ts never reach the browser bundle.
 */
export const LEGAL_SLUGS = [
  "privacy",
  "terms",
  "cookies",
  "refunds",
  "acceptable-use",
  "ip-and-outputs",
  "ai-disclosure",
  "security",
  "subprocessors",
  "dpa",
  "dmca",
  "accessibility",
  "legal-notice",
] as const;

export type LegalSlug = (typeof LEGAL_SLUGS)[number];

/** Privacy and terms keep their original short addresses; the rest live under /legal. */
export const legalRoute = (slug: LegalSlug): string => (slug === "privacy" ? "/privacy" : slug === "terms" ? "/terms" : `/legal/${slug}`);

export const isLegalSlug = (value: string): value is LegalSlug => (LEGAL_SLUGS as readonly string[]).includes(value);

/** Short labels for the footer: the documents people look for most, then a link to all of them. */
export const legalFooter: Record<Locale, { links: { slug: LegalSlug; label: string }[]; all: string }> = {
  es: {
    links: [
      { slug: "privacy", label: "Privacidad" },
      { slug: "terms", label: "Términos de uso" },
      { slug: "cookies", label: "Cookies" },
      { slug: "refunds", label: "Reembolsos" },
      { slug: "acceptable-use", label: "Uso aceptable" },
      { slug: "security", label: "Seguridad" },
    ],
    all: "Todos los documentos legales",
  },
  en: {
    links: [
      { slug: "privacy", label: "Privacy" },
      { slug: "terms", label: "Terms of use" },
      { slug: "cookies", label: "Cookies" },
      { slug: "refunds", label: "Refunds" },
      { slug: "acceptable-use", label: "Acceptable use" },
      { slug: "security", label: "Security" },
    ],
    all: "All legal documents",
  },
};
