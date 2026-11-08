import type { Locale } from "@/lib/types";
import { legalEs } from "./es";
import { legalEn } from "./en";
import type { LegalSlug } from "./labels";

export { LEGAL_SLUGS, isLegalSlug, legalRoute, legalFooter, type LegalSlug } from "./labels";

export type LegalSection = { h: string; p: readonly string[] };
export type LegalDocCopy = { title: string; summary: string; sections: readonly LegalSection[] };

const DOCS: Record<Locale, Record<LegalSlug, LegalDocCopy>> = { es: legalEs, en: legalEn };

export const legalDoc = (locale: Locale, slug: LegalSlug): LegalDocCopy => DOCS[locale][slug];

/** Copy of the index page and the document header. */
export const legalIndexCopy: Record<Locale, { eyebrow: string; title: string; intro: string; read: string; draftNote: string; metaTitle: string; metaDescription: string; related: string }> = {
  es: {
    eyebrow: "Legal",
    title: "Políticas y condiciones",
    intro: "Aquí está todo lo que rige el servicio: cómo tratamos tus datos, qué puedes hacer y qué no, cómo funcionan los pagos y los reembolsos, quién puede tocar tus archivos y qué dice la ley de lo que generamos con IA.",
    read: "Leer",
    draftNote: "Estos textos son un borrador preparado para revisión legal. No son asesoría jurídica. Antes del lanzamiento público los revisa un abogado del país donde opera el servicio.",
    metaTitle: "Legal — políticas, términos y condiciones",
    metaDescription: "Privacidad, términos de uso, cookies, reembolsos, uso aceptable, propiedad de los resultados, uso de IA, seguridad, encargados de tratamiento, DPA, derechos de autor y accesibilidad.",
    related: "Otros documentos",
  },
  en: {
    eyebrow: "Legal",
    title: "Policies and terms",
    intro: "Everything that governs the service: how we handle your data, what you can and cannot do, how payments and refunds work, who owns what we generate and what the law says about AI output.",
    read: "Read",
    draftNote: "These texts are a draft prepared for legal review. They are not legal advice. A lawyer in the country where the service operates reviews them before the public launch.",
    metaTitle: "Legal — policies, terms and conditions",
    metaDescription: "Privacy, terms of use, cookies, refunds, acceptable use, ownership of results, AI use, security, subprocessors, DPA, copyright and accessibility.",
    related: "Other documents",
  },
};
