import type { Category, ImageView, InputKind, Locale } from "@/lib/types";

/**
 * Real results generated with this product, shown on the public site.
 *
 * Rules (they are the anti-slop contract of the site):
 *  - Every entry is a model that came out of OrbitShelf 3D, approved by a person, with the exact photos or text it was made from.
 *  - Nothing is retouched. The poster is a plain render of the GLB.
 *  - Sections that need entries (before/after, store categories, text-to-3D) render only when there is a matching entry, so the
 *    site never shows a placeholder or an invented result.
 *
 * Files live in `public/showcase/<id>/` (see `scripts/check-showcase.ts`). The list is empty until the first real models are approved.
 */
export type ShowcaseItem = {
  id: string;
  kind: InputKind;
  category: Category;
  /** Shown as the hero model. At most one entry should set it. */
  hero?: boolean;
  /** GLB (optimised, under 5 MB for the hero). */
  glb: string;
  /** WebP render of the model, with its size so the layout never jumps. */
  poster: { src: string; width: number; height: number };
  /** The source photos, in view order (photo-based entries only). */
  photos: { view: ImageView; src: string; width: number; height: number }[];
  /** The description the model was generated from (text entries only). */
  prompt?: string;
  title: Record<Locale, string>;
  alt: Record<Locale, string>;
};

export const showcase: ShowcaseItem[] = [];

export const showcaseHero = () => showcase.find((s) => s.hero) ?? null;
export const showcaseBeforeAfter = () => showcase.find((s) => s.kind === "multi-image" && s.photos.length >= 2) ?? null;
export const showcaseFor = (category: Category) => showcase.find((s) => s.category === category) ?? null;
export const showcaseText = () => showcase.find((s) => s.kind === "text") ?? null;
