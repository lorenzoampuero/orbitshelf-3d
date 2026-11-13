import type { ImageView, TextureResolution } from "./types";

/**
 * What the home composer hands to the create wizard. It lives in memory only: files cannot travel in a URL, and a
 * description should not. A full page reload simply starts the wizard empty.
 */
export type ComposerHandoff = {
  files?: Partial<Record<ImageView, File>>;
  glb?: File;
  prompt?: string;
  title?: string;
  /** A model and quality picked by hand in the composer. Without them the wizard's own preset chooses. */
  engineId?: string;
  texture?: TextureResolution;
};

let pending: ComposerHandoff | null = null;

/**
 * The text parts (description, title, model, quality) also go to sessionStorage, so a visitor who has to sign in
 * before the wizard opens does not lose what they typed. Files cannot be stored, so a photo is picked again.
 */
const KEY = "orbitshelf:composer-handoff";

function store(next: ComposerHandoff | null) {
  try {
    if (next && next.prompt) {
      const { prompt, title, engineId, texture } = next;
      sessionStorage.setItem(KEY, JSON.stringify({ prompt, title, engineId, texture }));
    } else {
      sessionStorage.removeItem(KEY);
    }
  } catch {
    /* storage can be blocked; the in-memory copy still works */
  }
}

function stored(): ComposerHandoff | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ComposerHandoff) : null;
  } catch {
    return null;
  }
}

export function setComposerHandoff(next: ComposerHandoff) {
  pending = next;
  store(next);
}

export const peekComposerHandoff = () => pending ?? (typeof window === "undefined" ? null : stored());

export function clearComposerHandoff() {
  pending = null;
  store(null);
}

/** "summer-hoodie_front.jpg" → "summer hoodie front". */
export const titleFromFile = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim()
    .slice(0, 80);
