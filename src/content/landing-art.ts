import type { Locale } from "@/lib/types";
import data from "./landing-art-data.json";

/**
 * Studio renders for the public site. Built by scripts/render-landing.py and scripts/build-landing-art.ts.
 *
 * These are NOT results made with OrbitShelf 3D, so they never go in `src/config/showcase.ts`.
 * The record of where each one came from is docs/ORIGEN_ARTE_LANDING.md.
 */
export type ArtImage = { src: string; srcSmall: string; thumb: string; width: number; height: number };
export type Turn = { mp4: string; webm: string; poster: string; size: number };
export type FullArt = { beauty: ArtImage; clay: ArtImage; wire: ArtImage; alt: ArtImage; turn: Turn; glb: string };
export type SingleArt = { beauty: ArtImage };

export const art = data as unknown as {
  dragon: FullArt;
  hoodie: FullArt;
  kitchen: FullArt;
  bust: SingleArt;
  camera: SingleArt;
  lounge: SingleArt;
  lantern: SingleArt;
};

export type HeroArtId = "dragon" | "hoodie" | "kitchen";

export const artCopy: Record<
  Locale,
  {
    heroCaption: string;
    shelfLabel: string;
    names: Record<HeroArtId, string>;
    alts: Record<HeroArtId | "bust" | "camera" | "lounge" | "lantern", string>;
    marqueeTitle: string;
    compare: { label: string; textured: string; clay: string; wire: string; viewLabel: string };
    pause: string;
    play: string;
    prompt: string;
  }
> = {
  es: {
    heroCaption: "Arrastra para girarlo.",
    shelfLabel: "Elige un ejemplo",
    names: { dragon: "Dragón", hoodie: "Sudadera", kitchen: "Cocina" },
    alts: {
      dragon: "Dragón naranja de caricatura en 3D, redondo y con alas pequeñas.",
      hoodie: "Sudadera negra con capucha en 3D, con bolsillo frontal y cordones.",
      kitchen: "Muebles de cocina de madera en 3D, con módulos altos, bajos y cajones.",
      bust: "Busto de mármol clásico en 3D.",
      camera: "Cámara de fotos antigua en 3D, con su correa.",
      lounge: "Sillón de cuero y madera en 3D.",
      lantern: "Farol de aceite antiguo en 3D.",
    },
    marqueeTitle: "Archivos listos para",
    compare: {
      label: "Mueve para comparar la textura con la otra vista",
      textured: "Textura",
      clay: "Barro",
      wire: "Malla",
      viewLabel: "Vista para comparar",
    },
    pause: "Pausar el giro",
    play: "Reanudar el giro",
    prompt: "Un dragón bebé naranja, redondo, con alas pequeñas y estilo de juguete",
  },
  en: {
    heroCaption: "Drag to rotate.",
    shelfLabel: "Pick an example",
    names: { dragon: "Dragon", hoodie: "Hoodie", kitchen: "Kitchen" },
    alts: {
      dragon: "Round orange cartoon dragon in 3D with small wings.",
      hoodie: "Black 3D hoodie with a front pocket and drawstrings.",
      kitchen: "Wooden kitchen units in 3D, with wall cabinets, base cabinets and drawers.",
      bust: "Classical marble bust in 3D.",
      camera: "Vintage photo camera in 3D, with its strap.",
      lounge: "Leather and wood lounge chair in 3D.",
      lantern: "Antique oil lantern in 3D.",
    },
    marqueeTitle: "Files ready for",
    compare: {
      label: "Move to compare the texture with the other view",
      textured: "Texture",
      clay: "Clay",
      wire: "Mesh",
      viewLabel: "View to compare",
    },
    pause: "Pause rotation",
    play: "Resume rotation",
    prompt: "A round orange baby dragon with small wings, toy style",
  },
};

/** Formats and tools that read these files as they are. Plain names, never presented as customers. */
export const MARQUEE_ITEMS = ["GLB", "OBJ", "STL", "Blender", "Shopify", "Unreal Engine", "Godot", "Three.js", "model-viewer"];
