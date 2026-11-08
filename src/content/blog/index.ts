import type { Locale } from "@/lib/types";
import { blogEs } from "./es";
import { blogEn } from "./en";

export type BlogSection = { h: string; p: readonly string[] };
export type BlogPostCopy = { title: string; summary: string; sections: readonly BlogSection[] };

export type BlogTag = "guide" | "analysis" | "howto";

/** Newest first. Dates are ISO and shared by both languages. */
export const BLOG_POSTS = [
  { slug: "first-3d-catalog-in-one-week", date: "2026-11-08", tag: "howto", minutes: 5 },
  { slug: "does-3d-increase-conversion", date: "2026-11-08", tag: "analysis", minutes: 5 },
  { slug: "photo-to-3d-for-online-stores", date: "2026-11-08", tag: "guide", minutes: 4 },
  { slug: "how-to-choose-an-ai-3d-engine", date: "2026-11-08", tag: "guide", minutes: 5 },
  { slug: "glb-obj-stl-which-format", date: "2026-11-08", tag: "guide", minutes: 3 },
  { slug: "how-many-polygons-do-you-need", date: "2026-11-08", tag: "guide", minutes: 4 },
] as const satisfies readonly { slug: string; date: string; tag: BlogTag; minutes: number }[];

export type BlogSlug = (typeof BLOG_POSTS)[number]["slug"];

const POSTS: Record<Locale, Record<BlogSlug, BlogPostCopy>> = { es: blogEs, en: blogEn };

export const isBlogSlug = (value: string): value is BlogSlug => BLOG_POSTS.some((p) => p.slug === value);
export const blogPost = (locale: Locale, slug: BlogSlug): BlogPostCopy => POSTS[locale][slug];
export const blogMeta = (slug: BlogSlug) => BLOG_POSTS.find((p) => p.slug === slug)!;

export const blogCopy: Record<Locale, { eyebrow: string; title: string; intro: string; read: string; back: string; minutes: string; tags: Record<BlogTag, string>; keepReading: string; ctaTitle: string; ctaText: string; ctaButton: string; metaTitle: string; metaDescription: string; navLabel: string; navText: string }> = {
  es: {
    eyebrow: "Blog",
    title: "Notas sobre 3D para tiendas y estudios",
    intro: "Artículos prácticos sobre pasar de foto a 3D, elegir formatos y motores y medir si vale la pena. Sin cifras sin fuente: lo que no hemos medido, lo decimos.",
    read: "Leer",
    back: "Todos los artículos",
    minutes: "{n} min de lectura",
    tags: { guide: "Guía", analysis: "Análisis", howto: "Paso a paso" },
    keepReading: "Sigue leyendo",
    ctaTitle: "¿Quieres probarlo con tus propios productos?",
    ctaText: "Mira cómo funciona el flujo completo, desde la foto hasta el modelo aprobado, o revisa los planes y el costo en créditos antes de empezar.",
    ctaButton: "Ver cómo funciona",
    metaTitle: "Blog — 3D para tiendas online y estudios de juegos",
    metaDescription: "Guías y análisis sobre foto a 3D, formatos GLB, OBJ y STL, polígonos, elección de motores de IA y cómo medir el efecto del 3D en tu tienda.",
    navLabel: "Blog",
    navText: "Guías y análisis sobre 3D para tiendas y estudios",
  },
  en: {
    eyebrow: "Blog",
    title: "Notes on 3D for stores and studios",
    intro: "Practical articles on going from photo to 3D, choosing formats and engines and measuring whether it pays off. No unsourced figures: what we have not measured, we say.",
    read: "Read",
    back: "All articles",
    minutes: "{n} min read",
    tags: { guide: "Guide", analysis: "Analysis", howto: "How-to" },
    keepReading: "Keep reading",
    ctaTitle: "Want to try it with your own products?",
    ctaText: "See how the whole flow works, from the photo to the approved model, or check the plans and the cost in credits before you start.",
    ctaButton: "See how it works",
    metaTitle: "Blog — 3D for online stores and game studios",
    metaDescription: "Guides and analysis on photo to 3D, GLB, OBJ and STL formats, polygons, choosing AI engines and measuring the effect of 3D in your store.",
    navLabel: "Blog",
    navText: "Guides and analysis on 3D for stores and studios",
  },
};
