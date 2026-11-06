import type { Locale } from "@/lib/types";

/**
 * Copy that only the inner public pages need (how it works, examples, resources, compare, legal).
 * Everything else on those pages still reads from the dictionaries. Plain data, no server-only imports.
 */
type ClosingCopy = { titleA: string; titleB: string };

export type InnerPagesCopy = {
  how: { closing: ClosingCopy };
  examples: {
    emptyTitle: string;
    emptyText: string;
    emptyCta: string;
    closing: ClosingCopy;
  };
  resources: { related: string };
  compare: { closing: ClosingCopy };
  legal: { toc: string };
};

export const innerPagesCopy: Record<Locale, InnerPagesCopy> = {
  en: {
    how: { closing: { titleA: "Review every model", titleB: "before you use it." } },
    examples: {
      emptyTitle: "No generated results published yet",
      emptyText: "A result is published here only after a person approves it, next to the photos or text it came from.",
      emptyCta: "Try it with your photos",
      closing: { titleA: "Judge the result", titleB: "with your own product." },
    },
    resources: { related: "Keep reading" },
    compare: { closing: { titleA: "Test it on one", titleB: "of your own products." } },
    legal: { toc: "On this page" },
  },
  es: {
    how: { closing: { titleA: "Revisa cada modelo", titleB: "antes de usarlo." } },
    examples: {
      emptyTitle: "Aún no hay resultados generados publicados",
      emptyText: "Un resultado se publica aquí solo después de que una persona lo aprueba, junto a las fotos o el texto de los que salió.",
      emptyCta: "Pruébalo con tus fotos",
      closing: { titleA: "Juzga el resultado", titleB: "con tu propio producto." },
    },
    resources: { related: "Sigue leyendo" },
    compare: { closing: { titleA: "Pruébalo con uno", titleB: "de tus propios productos." } },
    legal: { toc: "En esta página" },
  },
};

/**
 * Page titles come from the shared dictionaries, some of which still use a long dash as separator.
 * The site avoids those dashes in anything a visitor reads (tab titles included), so the inner pages
 * pass their titles through here. Idempotent: once the dictionaries are cleaned this changes nothing.
 */
export function plainTitle(title: string): string {
  return title.replace(/\s*[—–]\s*/g, " | ");
}
