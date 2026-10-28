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
  /** Placeholder only. No domain has been bought or registered. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supportEmail: "hello@orbitshelf.example",
  status: "provisional",
} as const;

/** Design tokens mirrored in `src/app/globals.css` (CSS variables are the runtime source). */
export const theme = {
  marketing: {
    background: "#07080E",
    surface: "#12141E",
    mint: "#9DF6CF",
    violet: "#AA95F2",
    text: "#FFFFFF",
  },
  layout: { maxWidth: 1240, radiusMin: 12, radiusMax: 18, spacingUnit: 8 },
} as const;
