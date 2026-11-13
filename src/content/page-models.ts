import { getModel, type GalleryModel } from "@/lib/models";

/**
 * Which models each inner page shows, so no page repeats the same object and the same model never fills a whole page.
 * Slugs come from src/content/models-manifest.json; a missing slug fails at build time.
 */
export function pick(slug: string): GalleryModel {
  const m = getModel(slug);
  if (!m) throw new Error(`page-models: unknown model "${slug}"`);
  return m;
}
type Trio = [GalleryModel, GalleryModel, GalleryModel];
const trio = (a: string, b: string, c: string): Trio => [pick(a), pick(b), pick(c)];
const many = (...s: string[]) => s.map(pick);

export const FEATURE_MODELS = {
  index: {
    pile: trio("black-hoodie", "baby-dragon", "kitchen-units"),
    flows: { "image-to-3d": pick("orange-puffer-vest"), "text-to-3d": pick("lizard-creature"), "multi-image-to-3d": pick("fabric-loveseat") } as Record<string, GalleryModel>,
  },
  "image-to-3d": { pile: trio("orange-puffer-vest", "black-hoodie", "white-loveseat"), flow: pick("blue-puffer-jacket"), rail: many("zip-hoodie", "tufted-sofa", "money-bag", "crystal-golem") },
  "text-to-3d": { pile: trio("purple-dragon", "monster-head", "wooden-toy-figure"), flow: pick("lizard-creature"), rail: many("fantasy-tower", "gothic-chapel", "sci-fi-blaster", "robot-dog") },
  "multi-image-to-3d": { pile: trio("fabric-loveseat", "kitchen-units", "sci-fi-device-230-parts"), flow: pick("grey-sofa"), rail: many("blue-puffer-jacket", "stone-cottage", "t-rex", "geometry-only-gadget") },
} as const;

export const SOLUTION_MODELS = {
  index: { pile: trio("white-battle-mech", "zip-hoodie", "stone-cottage") },
  stores: { pile: trio("black-hoodie", "grey-sofa", "orange-puffer-vest"), flow: pick("white-loveseat"), rail: many("zip-hoodie", "tufted-sofa", "money-bag", "kitchen-units"), card: trio("zip-hoodie", "tufted-sofa", "money-bag") },
  games: { pile: trio("blocky-voxel-character", "stone-cottage", "orange-assault-mech"), flow: pick("sci-fi-blaster"), rail: many("purple-dragon", "crystal-golem", "fantasy-tower", "white-battle-mech"), card: trio("blocky-voxel-character", "purple-dragon", "gothic-chapel") },
  design: { pile: trio("geometry-only-gadget", "sci-fi-device-230-parts", "robot-dog"), flow: pick("wooden-toy-figure"), rail: many("orange-walker-mech", "t-rex", "red-dragon", "monster-head"), card: trio("geometry-only-gadget", "robot-dog", "sci-fi-device-230-parts") },
} as const;

export const PAGE_MODELS = {
  howItWorks: trio("white-battle-mech", "tufted-sofa", "baby-dragon"),
  examples: trio("t-rex", "blue-puffer-jacket", "orange-walker-mech"),
  compare: trio("kitchen-units", "red-dragon", "zip-hoodie"),
  pricing: trio("crystal-golem", "orange-assault-mech", "purple-dragon"),
  integrations: trio("blocky-voxel-character", "white-loveseat", "robot-dog"),
  resources: trio("grey-sofa", "monster-head", "black-hoodie"),
  blog: trio("orange-puffer-vest", "gothic-chapel", "sci-fi-device-230-parts"),
  login: pick("crystal-golem"),
  notFound: pick("lizard-creature"),
};

/** Heading of the row of renders (ModelRail) on the inner pages. */
export const RAIL_COPY: Record<"en" | "es", { title: string; sub: string; label: string }> = {
  en: { title: "Models like these", sub: "Studio renders, with each model's original and web-ready triangle counts.", label: "Model examples" },
  es: { title: "Modelos como estos", sub: "Renders de estudio, con los triángulos originales y para web de cada modelo.", label: "Ejemplos de modelos" },
};

const COVERS = ["blue-puffer-jacket", "robot-dog", "grey-sofa", "t-rex", "stone-cottage", "orange-walker-mech", "tufted-sofa", "crystal-golem", "zip-hoodie", "monster-head"];
/** A stable cover for an article, picked from its slug so it never changes between builds. */
export function coverFor(slug: string): GalleryModel {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return pick(COVERS[h % COVERS.length]);
}

const CLOSING_PAIRS: [string, string][] = [
  ["red-dragon", "crystal-golem"],
  ["white-battle-mech", "orange-walker-mech"],
  ["t-rex", "baby-dragon"],
  ["blocky-voxel-character", "stone-cottage"],
  ["robot-dog", "sci-fi-blaster"],
  ["kitchen-units", "grey-sofa"],
  ["blue-puffer-jacket", "money-bag"],
  ["purple-dragon", "fantasy-tower"],
];
/** Two renders for the corners of a closing banner. */
export function closingArt(i: number): [GalleryModel, GalleryModel] {
  const [a, b] = CLOSING_PAIRS[i % CLOSING_PAIRS.length];
  return [pick(a), pick(b)];
}

/** The one model shown big on each page (ModelSpotlight), never one of the models already in that page's pile or rail. */
export const SPOTLIGHT: Record<string, GalleryModel> = {
  "image-to-3d": pick("grey-sofa"),
  "text-to-3d": pick("red-dragon"),
  "multi-image-to-3d": pick("white-battle-mech"),
  features: pick("orange-assault-mech"),
  solutions: pick("t-rex"),
  stores: pick("blue-puffer-jacket"),
  games: pick("orange-walker-mech"),
  design: pick("baby-dragon"),
  howItWorks: pick("gothic-chapel"),
  examples: pick("purple-dragon"),
  compare: pick("crystal-golem"),
  integrations: pick("orange-puffer-vest"),
  resources: pick("fantasy-tower"),
  pricing: pick("sci-fi-blaster"),
};
