import type { ImageView } from "./types";

/**
 * What the home composer hands to the create wizard. It lives in memory only: files cannot travel in a URL, and a
 * description should not. A full page reload simply starts the wizard empty.
 */
export type ComposerHandoff = {
  files?: Partial<Record<ImageView, File>>;
  glb?: File;
  prompt?: string;
  title?: string;
};

let pending: ComposerHandoff | null = null;

export function setComposerHandoff(next: ComposerHandoff) {
  pending = next;
}

export const peekComposerHandoff = () => pending;

export function clearComposerHandoff() {
  pending = null;
}

/** "summer-hoodie_front.jpg" → "summer hoodie front". */
export const titleFromFile = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim()
    .slice(0, 80);
