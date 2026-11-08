import type { Locale } from "@/lib/types";
import type { BlogSlug } from "@/content/blog";
import type { LegalSlug } from "@/content/legal/labels";

/**
 * Sections shared by the public pages: what to expect by kind of product, a generator on its own versus a full workflow,
 * the commitments we can already back, and reading suggestions. No prices here: the home must not show any.
 * Everything claimed is something the product does today or a rule written in the legal pages.
 */

export type FitLevel = "good" | "depends" | "hard";

export type LandingExtraCopy = {
  fit: {
    title: string;
    sub: string;
    cols: { kind: string; expect: string; advice: string };
    levels: Record<FitLevel, string>;
    rows: { kind: string; level: FitLevel; advice: string }[];
    note: string;
  };
  versus: {
    title: string;
    sub: string;
    aloneTitle: string;
    flowTitle: string;
    rows: { alone: string; flow: string }[];
    note: string;
  };
  trust: {
    title: string;
    sub: string;
    items: { icon: "approve" | "privacy" | "isolation" | "refund"; title: string; text: string; slug: LegalSlug }[];
    all: string;
  };
  reading: { title: string; sub: string; all: string; read: string; minutes: string };
};

/** Which articles each page suggests. */
export const READING: Record<string, BlogSlug[]> = {
  home: ["first-3d-catalog-in-one-week", "photo-to-3d-for-online-stores", "does-3d-increase-conversion"],
  features: ["glb-obj-stl-which-format", "how-many-polygons-do-you-need", "how-to-choose-an-ai-3d-engine"],
  solutions: ["first-3d-catalog-in-one-week", "does-3d-increase-conversion", "photo-to-3d-for-online-stores"],
  howItWorks: ["photo-to-3d-for-online-stores", "how-to-choose-an-ai-3d-engine", "first-3d-catalog-in-one-week"],
  integrations: ["glb-obj-stl-which-format", "how-many-polygons-do-you-need", "first-3d-catalog-in-one-week"],
  pricing: ["how-to-choose-an-ai-3d-engine", "does-3d-increase-conversion", "first-3d-catalog-in-one-week"],
  examples: ["photo-to-3d-for-online-stores", "glb-obj-stl-which-format", "how-many-polygons-do-you-need"],
  resources: ["first-3d-catalog-in-one-week", "does-3d-increase-conversion", "how-to-choose-an-ai-3d-engine"],
};

export const landingExtra: Record<Locale, LandingExtraCopy> = {
  es: {
    fit: {
      title: "Qué esperar según tu tipo de producto",
      sub: "La IA no rinde igual con todo. Esta guía rápida te dice dónde suele ir bien y dónde conviene probar antes de comprometerte.",
      cols: { kind: "Tipo de producto", expect: "Qué esperar", advice: "Qué hacer" },
      levels: { good: "Suele salir bien", depends: "Depende del caso", hard: "Más difícil" },
      rows: [
        { kind: "Objetos sólidos y mates: tazas, sillas, cajas, estuches", level: "good", advice: "Sube de dos a cuatro fotos y revisa los costados antes de aprobar." },
        { kind: "Calzado, bolsos y accesorios con forma definida", level: "depends", advice: "Prueba un modelo antes de armar el catálogo y revisa la parte de atrás." },
        { kind: "Ropa y telas blandas con pliegues", level: "hard", advice: "Genera una prenda, compárala por todos lados y decide con lo que veas." },
        { kind: "Superficies brillantes, metal pulido o vidrio", level: "hard", advice: "Prueba uno o dos antes de prometer 3D; puede que queden fuera del catálogo." },
        { kind: "Piezas muy finas: joyas, cables, rejillas", level: "hard", advice: "Considera modelado manual si el detalle fino es parte de la venta." },
        { kind: "Personajes y assets de juego", level: "depends", advice: "Úsalo como base y termina en Blender; revisa los polígonos antes de exportar." },
      ],
      note: "No hemos medido todavía con qué frecuencia sale bien cada tipo en un catálogo real, por eso no damos porcentajes. Cada modelo pasa por tu revisión antes de publicarse.",
    },
    versus: {
      title: "Un generador suelto o un flujo completo",
      sub: "Generar el modelo es solo el primer paso. Lo que decide si te sirve es todo lo que viene después.",
      aloneTitle: "Con un generador por separado",
      flowTitle: "Con OrbitShelf 3D",
      rows: [
        { alone: "Un solo motor, el que te toque", flow: "Elige el motor en cada trabajo y compara con tus propias fotos" },
        { alone: "El costo lo ves al final o por intento", flow: "El costo en créditos se muestra antes de confirmar" },
        { alone: "Recibes un archivo y lo revisas por tu cuenta", flow: "Lista de revisión y aprobación obligatoria antes de publicar" },
        { alone: "Optimizar y comparar versiones es otra herramienta", flow: "Optimización, versiones y comparación en el mismo lugar" },
        { alone: "Publicar es otro trabajo manual", flow: "Visor embebible, exportación GLB, OBJ y STL, y API" },
        { alone: "Los gastos se siguen en una planilla", flow: "Historial de trabajos y créditos por espacio de trabajo" },
      ],
      note: "Esto describe un uso típico, no a un competidor en particular. Hay generadores excelentes: si solo necesitas un archivo suelto, quizá no necesites más.",
    },
    trust: {
      title: "Compromisos que ya puedes revisar",
      sub: "Nada de sellos que no tenemos. Esto es lo que el producto hace hoy y lo que dicen nuestras políticas.",
      items: [
        { icon: "approve", title: "Tú apruebas cada modelo", text: "Un modelo no se publica ni se comparte en el visor público hasta que lo apruebes tú.", slug: "ai-disclosure" },
        { icon: "privacy", title: "Tus fotos no entrenan IA", text: "No usamos tus fotos ni tus modelos para entrenar modelos de IA. A las fotos se les quitan los metadatos antes de enviarlas.", slug: "privacy" },
        { icon: "isolation", title: "Cada espacio está aislado", text: "Un usuario no puede ver, descargar ni borrar modelos de otro espacio. Las claves de API se pueden revocar.", slug: "security" },
        { icon: "refund", title: "Si un trabajo falla, se devuelve", text: "Los créditos de un trabajo que falla por error del proveedor vuelven solos a tu saldo.", slug: "refunds" },
      ],
      all: "Ver todos los documentos legales",
    },
    reading: { title: "Para leer antes de empezar", sub: "Guías cortas, con lo que sabemos y lo que no hemos medido.", all: "Ver todos los artículos", read: "Leer", minutes: "{n} min" },
  },
  en: {
    fit: {
      title: "What to expect by kind of product",
      sub: "AI does not do equally well on everything. This quick guide shows where it tends to work and where you should test before committing.",
      cols: { kind: "Kind of product", expect: "What to expect", advice: "What to do" },
      levels: { good: "Tends to work", depends: "Depends on the case", hard: "Harder" },
      rows: [
        { kind: "Solid, matte objects: mugs, chairs, boxes, cases", level: "good", advice: "Upload two to four photos and check the sides before you approve." },
        { kind: "Shoes, bags and accessories with a defined shape", level: "depends", advice: "Test one model before building the catalog and check the back." },
        { kind: "Clothing and soft fabric with folds", level: "hard", advice: "Generate one garment, compare it from every side and decide from what you see." },
        { kind: "Shiny surfaces, polished metal or glass", level: "hard", advice: "Test one or two before promising 3D; they may stay out of the catalog." },
        { kind: "Very thin pieces: jewelry, cables, grilles", level: "hard", advice: "Consider manual modeling if fine detail is part of the sale." },
        { kind: "Characters and game assets", level: "depends", advice: "Use it as a base and finish in Blender; check the polygon count before exporting." },
      ],
      note: "We have not yet measured how often each kind comes out well on a real catalog, so we give no percentages. Every model goes through your review before it is published.",
    },
    versus: {
      title: "A standalone generator or a full workflow",
      sub: "Generating the model is only the first step. What decides whether it is useful is everything that comes after.",
      aloneTitle: "With a separate generator",
      flowTitle: "With OrbitShelf 3D",
      rows: [
        { alone: "One engine, the one you get", flow: "Pick the engine on each job and compare with your own photos" },
        { alone: "You see the cost at the end or per attempt", flow: "The cost in credits is shown before you confirm" },
        { alone: "You get a file and review it on your own", flow: "Review checklist and mandatory approval before publishing" },
        { alone: "Optimizing and comparing versions is another tool", flow: "Optimization, versions and comparison in the same place" },
        { alone: "Publishing is another manual job", flow: "Embeddable viewer, GLB, OBJ and STL export, and an API" },
        { alone: "You track spend in a spreadsheet", flow: "Job and credit history per workspace" },
      ],
      note: "This describes a typical setup, not any particular competitor. There are excellent generators: if you only need a loose file, you may not need more.",
    },
    trust: {
      title: "Commitments you can already check",
      sub: "No badges we do not have. This is what the product does today and what our policies say.",
      items: [
        { icon: "approve", title: "You approve every model", text: "A model is not published or shared in the public viewer until you approve it.", slug: "ai-disclosure" },
        { icon: "privacy", title: "Your photos do not train AI", text: "We do not use your photos or models to train AI models. Photo metadata is removed before they are sent.", slug: "privacy" },
        { icon: "isolation", title: "Every workspace is isolated", text: "A user cannot view, download or delete models from another workspace. API keys can be revoked.", slug: "security" },
        { icon: "refund", title: "If a job fails, it is refunded", text: "Credits for a job that fails because of a provider error go back to your balance on their own.", slug: "refunds" },
      ],
      all: "See all legal documents",
    },
    reading: { title: "Worth reading before you start", sub: "Short guides, with what we know and what we have not measured.", all: "See all articles", read: "Read", minutes: "{n} min" },
  },
};
