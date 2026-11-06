import type { Locale } from "@/lib/types";

/**
 * Labels and destinations for the public navbar and footer: the new Product, Solutions and Integrations tabs.
 * Kept out of the dictionaries so the menu can grow without touching page copy.
 * Every href is a path without locale prefix; the shell adds it with localePath.
 */
export type NavIcon = "text" | "image" | "images" | "review" | "store" | "game" | "design";
export type NavItem = { href: string; icon: NavIcon; title: string; text: string };

export type NavCopy = {
  product: string;
  solutions: string;
  integrations: string;
  allFeatures: string;
  allSolutions: string;
  productItems: NavItem[];
  solutionItems: NavItem[];
  footerSolutions: string;
};

export const navCopy: Record<Locale, NavCopy> = {
  es: {
    product: "Producto",
    solutions: "Soluciones",
    integrations: "Integraciones",
    allFeatures: "Ver todas las funciones",
    allSolutions: "Ver todas las soluciones",
    footerSolutions: "Soluciones",
    productItems: [
      { href: "/features/text-to-3d", icon: "text", title: "Texto a 3D", text: "Describe un objeto y obtén un GLB con textura" },
      { href: "/features/image-to-3d", icon: "image", title: "Imagen a 3D", text: "De una foto de tu producto a un modelo que se gira" },
      { href: "/features/multi-image-to-3d", icon: "images", title: "Varias imágenes a 3D", text: "De 2 a 4 vistas para que la espalda no se adivine" },
      { href: "/how-it-works", icon: "review", title: "Revisar y exportar", text: "Malla, versiones y descarga en GLB, OBJ o STL" },
    ],
    solutionItems: [
      { href: "/solutions/stores", icon: "store", title: "Tiendas", text: "Tu producto en 3D sin contratar a un modelador" },
      { href: "/solutions/games", icon: "game", title: "Juegos", text: "Del concepto al asset, con la geometría a la vista" },
      { href: "/solutions/design", icon: "design", title: "Diseño 3D", text: "Parte de un boceto o un GLB y sigue en tu programa" },
    ],
  },
  en: {
    product: "Product",
    solutions: "Solutions",
    integrations: "Integrations",
    allFeatures: "See all features",
    allSolutions: "See all solutions",
    footerSolutions: "Solutions",
    productItems: [
      { href: "/features/text-to-3d", icon: "text", title: "Text to 3D", text: "Describe an object and get a textured GLB" },
      { href: "/features/image-to-3d", icon: "image", title: "Image to 3D", text: "From one product photo to a model you can spin" },
      { href: "/features/multi-image-to-3d", icon: "images", title: "Multi-image to 3D", text: "2 to 4 views so the back is not guessed" },
      { href: "/how-it-works", icon: "review", title: "Review and export", text: "Mesh, versions and download as GLB, OBJ or STL" },
    ],
    solutionItems: [
      { href: "/solutions/stores", icon: "store", title: "Stores", text: "Your product in 3D without hiring a modeler" },
      { href: "/solutions/games", icon: "game", title: "Games", text: "From concept to asset, with the geometry in plain sight" },
      { href: "/solutions/design", icon: "design", title: "3D design", text: "Start from a sketch or a GLB and carry on in your software" },
    ],
  },
};
