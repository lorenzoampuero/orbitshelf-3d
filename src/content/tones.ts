import type { ModelCategory } from "@/lib/models";

/**
 * Colour pairs for the inner pages (defined in globals.css as [data-tone]). A page sets one on <MarketingShell tone>,
 * and every glow, wash and card hover underneath takes its colours from it.
 */
export type Tone = "violet" | "cyan" | "magenta" | "amber" | "emerald" | "blue";

/** The tone a render's tile takes, by what the model is, so a row of renders is a row of colours. */
export const CATEGORY_TONE: Record<ModelCategory, Tone> = {
  apparel: "blue",
  furniture: "amber",
  product: "cyan",
  character: "magenta",
  creature: "violet",
  prop: "emerald",
  architecture: "cyan",
  vehicle: "blue",
  sculpture: "magenta",
};
