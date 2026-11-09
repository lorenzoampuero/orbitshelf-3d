import type { EngineTier, Locale, TextureResolution } from "@/lib/types";
import type { ExampleGroup } from "./examples";

export type StudioCopy = {
  nav: { create: string; explore: string; connections: string; agents: string; account: string; menu: string };
  title: string;
  subtitle: string;
  tabs: { photo: string; multi: string; text: string; import: string };
  exampleBadge: string;
  dropPhoto: string;
  dropPhotos: string;
  dropGlb: string;
  chooseFile: string;
  clear: string;
  photosChosen: (n: number) => string;
  promptLabel: string;
  promptPlaceholder: string;
  engineDemo: string;
  engineAuto: string;
  free: string;
  cost: (n: number, unit: "credits" | "attempts") => string;
  create: string;
  createSample: string;
  needsEngine: string;
  picker: {
    auto: string;
    autoText: string;
    modelTitle: string;
    qualityTitle: string;
    tiers: Record<EngineTier, string>;
    qualities: Record<TextureResolution, string>;
    credits: (n: number) => string;
    unavailable: string;
    photosUpTo: (n: number) => string;
    onePhoto: string;
    textOnly: string;
    needsMore: string;
    note: string;
    close: string;
  };
  stats: { models: string; toReview: string; approved: string; processing: string };
  gallery: {
    label: string;
    examples: string;
    mine: string;
    groups: Record<"all" | ExampleGroup, string>;
    mesh: string;
    surface: string;
    filterLabel: string;
    exampleNote: string;
    triangles: string;
    weight: string;
    texture: string;
    tryIt: string;
    trying: string;
    close: string;
    tryError: string;
    mineEmptyTitle: string;
    mineEmptyText: string;
    viewAll: string;
    open: string;
    viewer: { reset: string; spin: string; stop: string; loading: string; error: string; hint: string; mesh: string; surface: string };
  };
  more: string;
};

export const studioCopy: Record<Locale, StudioCopy> = {
  es: {
    nav: { create: "Crear", explore: "Explorar", connections: "Conexiones", agents: "Agentes y API", account: "Tu cuenta", menu: "Menú de la cuenta" },
    title: "Crea en 3D",
    subtitle: "De una foto o una frase a un modelo revisado y listo para usar.",
    tabs: { photo: "Foto", multi: "Varias fotos", text: "Texto", import: "Importar GLB" },
    exampleBadge: "Ejemplo",
    dropPhoto: "Suelta aquí la foto de tu producto",
    dropPhotos: "Suelta hasta 4 fotos: frente, izquierda, atrás y derecha",
    dropGlb: "Suelta aquí tu archivo GLB",
    chooseFile: "Elegir archivo",
    clear: "Quitar",
    photosChosen: (n) => (n === 1 ? "1 foto lista" : `${n} fotos listas`),
    promptLabel: "Describe el objeto",
    promptPlaceholder: "Una silla de madera con patas torneadas y respaldo curvo",
    engineDemo: "Motor: muestra de demostración",
    engineAuto: "Motor",
    free: "Sin costo",
    cost: (n, unit) => (unit === "attempts" ? `Costo: ${n} ${n === 1 ? "intento" : "intentos"}` : `Costo: ${n} ${n === 1 ? "crédito" : "créditos"}`),
    create: "Crear",
    createSample: "Crear muestra",
    needsEngine: "La generación con IA se activa al conectar un motor. Mientras tanto puedes crear una muestra o importar un GLB.",
    picker: {
      auto: "Automático",
      autoText: "Elegimos el modelo según tu foto y tu calidad.",
      modelTitle: "Modelo",
      qualityTitle: "Calidad de textura",
      tiers: { low: "Bajo costo", normal: "Normal", premium: "Premium", super: "Súper premium" },
      qualities: { none: "Sin textura", "512": "Borrador · 512", "1k": "Estándar · 1K", "2k": "Alta · 2K" },
      credits: (n) => `${n} ${n === 1 ? "crédito" : "créditos"}`,
      unavailable: "Aún no disponible",
      photosUpTo: (n) => `Hasta ${n} fotos`,
      onePhoto: "1 foto",
      textOnly: "Texto",
      needsMore: "No admite esta entrada",
      note: "Los precios son los publicados por cada motor, aún sin probar con dinero real. 4K y el control de detalle llegan cuando un motor los admita y los verifiquemos.",
      close: "Cerrar",
    },
    stats: { models: "Modelos", toReview: "Por revisar", approved: "Aprobados", processing: "En proceso" },
    gallery: {
      label: "Galería de modelos",
      examples: "Ejemplos",
      mine: "Mis modelos",
      groups: { all: "Todos", stores: "Tiendas", games: "Juegos", design: "Diseño" },
      mesh: "Ver malla",
      surface: "Ver superficie",
      filterLabel: "Filtrar ejemplos",
      exampleNote: "Ejemplo · modelo de uso libre (CC0, Poly Haven). No lo generó OrbitShelf.",
      triangles: "Triángulos",
      weight: "Peso",
      texture: "Textura",
      tryIt: "Probar este modelo",
      trying: "Copiando…",
      close: "Cerrar",
      tryError: "No se pudo copiar el modelo. Intenta de nuevo.",
      mineEmptyTitle: "Empieza con tu primer modelo",
      mineEmptyText: "Copia un ejemplo gratis para recorrer revisión, aprobación y publicación.",
      viewAll: "Ver todos",
      open: "Abrir",
      viewer: { reset: "Reiniciar vista", spin: "Girar", stop: "Detener", loading: "Cargando modelo…", error: "No se pudo mostrar el modelo", hint: "Arrastra para girar. Rueda para acercar.", mesh: "Ver malla", surface: "Ver superficie" },
    },
    more: "Más herramientas",
  },
  en: {
    nav: { create: "Create", explore: "Explore", connections: "Connections", agents: "Agents and API", account: "Your account", menu: "Account menu" },
    title: "Create in 3D",
    subtitle: "From a photo or a sentence to a reviewed model that is ready to use.",
    tabs: { photo: "Photo", multi: "Several photos", text: "Text", import: "Import GLB" },
    exampleBadge: "Example",
    dropPhoto: "Drop a photo of your product here",
    dropPhotos: "Drop up to 4 photos: front, left, back and right",
    dropGlb: "Drop your GLB file here",
    chooseFile: "Choose file",
    clear: "Remove",
    photosChosen: (n) => (n === 1 ? "1 photo ready" : `${n} photos ready`),
    promptLabel: "Describe the object",
    promptPlaceholder: "A wooden chair with turned legs and a curved back",
    engineDemo: "Engine: demo sample",
    engineAuto: "Engine",
    free: "No cost",
    cost: (n, unit) => (unit === "attempts" ? `Cost: ${n} ${n === 1 ? "attempt" : "attempts"}` : `Cost: ${n} ${n === 1 ? "credit" : "credits"}`),
    create: "Create",
    createSample: "Create sample",
    needsEngine: "AI generation switches on when an engine is connected. Until then you can create a sample or import a GLB.",
    picker: {
      auto: "Automatic",
      autoText: "We pick the model from your photo and your quality.",
      modelTitle: "Model",
      qualityTitle: "Texture quality",
      tiers: { low: "Low cost", normal: "Normal", premium: "Premium", super: "Super premium" },
      qualities: { none: "No texture", "512": "Draft · 512", "1k": "Standard · 1K", "2k": "High · 2K" },
      credits: (n) => `${n} ${n === 1 ? "credit" : "credits"}`,
      unavailable: "Not available yet",
      photosUpTo: (n) => `Up to ${n} photos`,
      onePhoto: "1 photo",
      textOnly: "Text",
      needsMore: "Does not take this input",
      note: "Prices are the ones each engine publishes, not yet tested with real money. 4K and detail control arrive when an engine supports them and we have verified it.",
      close: "Close",
    },
    stats: { models: "Models", toReview: "To review", approved: "Approved", processing: "Processing" },
    gallery: {
      label: "Model gallery",
      examples: "Examples",
      mine: "My models",
      groups: { all: "All", stores: "Stores", games: "Games", design: "Design" },
      mesh: "Show mesh",
      surface: "Show surface",
      filterLabel: "Filter examples",
      exampleNote: "Example · free-to-use model (CC0, Poly Haven). Not generated by OrbitShelf.",
      triangles: "Triangles",
      weight: "Size",
      texture: "Texture",
      tryIt: "Try this model",
      trying: "Copying…",
      close: "Close",
      tryError: "The model could not be copied. Try again.",
      mineEmptyTitle: "Start with your first model",
      mineEmptyText: "Copy an example for free and walk through review, approval and publishing.",
      viewAll: "View all",
      open: "Open",
      viewer: { reset: "Reset view", spin: "Spin", stop: "Stop", loading: "Loading model…", error: "The model could not be shown", hint: "Drag to rotate. Scroll to zoom.", mesh: "Show mesh", surface: "Show surface" },
    },
    more: "More tools",
  },
};
