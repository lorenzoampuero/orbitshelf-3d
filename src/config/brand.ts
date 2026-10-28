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
    background: "#04070D",
    surface: "#0B111E",
    mint: "#38BDF8",
    violet: "#7DD3FC",
    text: "#FFFFFF",
  },
  layout: { maxWidth: 1240, radiusMin: 12, radiusMax: 18, spacingUnit: 8 },
} as const;
