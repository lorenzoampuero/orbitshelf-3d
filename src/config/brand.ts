function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (explicit) return explicit;
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelHost) return `https://${vercelHost}`;
  return process.env.NODE_ENV === "production" ? "" : "http://localhost:3000";
}

/**
 * Single source of truth for the provisional brand.
 * "OrbitShelf 3D" is a working name: domain availability and trademark clearance are NOT verified.
 * Rename the product by editing this file (plus the `brand` strings in the i18n dictionaries, which read from here).
 */
export const brand = {
  name: "OrbitShelf",
  suffix: "3D",
  fullName: "OrbitShelf 3D",
  /** Wordmark split used by the logo component. */
  wordmark: { lead: "orbit", tail: "shelf" },
  /**
   * Public origin used for canonical, hreflang, Open Graph and the sitemap. No domain has been bought or registered.
   * Order: NEXT_PUBLIC_SITE_URL, then the Vercel production host, then localhost in development only.
   * In production with none of them set this is an empty string: callers must not print it as a URL (see `siteUrlConfigured`).
   */
  siteUrl: resolveSiteUrl(),
  /** Real contact address shown in the footer and legal pages. Null until configured. */
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || null,
  status: "provisional",
} as const;

/** False only in a production build that has no site URL configured. SEO URLs are then left relative and the sitemap is empty. */
export const siteUrlConfigured = brand.siteUrl !== "";

/**
 * The legal entity operating the service (data controller / contracting party). Every value comes from the
 * environment so it can differ per deployment; the legal pages show a "not configured" notice while any is missing.
 */
export const legalOperator = {
  name: process.env.NEXT_PUBLIC_LEGAL_NAME?.trim() || null,
  taxId: process.env.NEXT_PUBLIC_LEGAL_TAX_ID?.trim() || null,
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS?.trim() || null,
  country: process.env.NEXT_PUBLIC_LEGAL_COUNTRY?.trim() || null,
  /** Law governing the terms, e.g. "Chile" or "the State of Delaware, USA". */
  jurisdiction: process.env.NEXT_PUBLIC_LEGAL_JURISDICTION?.trim() || null,
  /** ISO date of the last substantive change to the legal texts. */
  lastUpdated: "2026-11-08",
} as const;

export const legalConfigured = () => Boolean(legalOperator.name && legalOperator.address && legalOperator.country && legalOperator.jurisdiction && brand.supportEmail);

/** Design tokens mirrored in `src/app/globals.css` (CSS variables are the runtime source). */
export const theme = {
  marketing: {
    background: "#0B0B0C",
    surface: "#161617",
    accent: "#FF5A1F",
    text: "#F5F2EC",
  },
  layout: { maxWidth: 1240, radiusMin: 12, radiusMax: 18, spacingUnit: 8 },
} as const;
