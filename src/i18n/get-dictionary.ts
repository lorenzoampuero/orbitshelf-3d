import "server-only";
import { en, type Dictionary } from "./dictionaries/en";
import { es } from "./dictionaries/es";
import type { Locale } from "@/lib/types";

const dictionaries: Record<Locale, Dictionary> = { en, es };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
