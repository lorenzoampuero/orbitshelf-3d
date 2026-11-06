import type { Locale } from "@/lib/types";

/**
 * Copy for the "Product" pages: /features and /features/[slug].
 * Plain data, no server-only import. Every visible string exists in Spanish and English.
 * Only what works today is described as working. Engines, Shopify publishing and everything else
 * that is not proven stays labelled "coming soon", "planned" or "in testing".
 */

export const FEATURE_SLUGS = ["text-to-3d", "image-to-3d", "multi-image-to-3d"] as const;
export type FeatureSlug = (typeof FEATURE_SLUGS)[number];

export function isFeatureSlug(value: string): value is FeatureSlug {
  return (FEATURE_SLUGS as readonly string[]).includes(value);
}

/** Keys of the lucide icons the feature pages draw with. Resolved in src/components/features/feature-parts.tsx. */
export type IconKey =
  | "image"
  | "type"
  | "box"
  | "focus"
  | "square"
  | "sun"
  | "shirt"
  | "camera"
  | "armchair"
  | "footprints"
  | "lamp"
  | "package"
  | "sparkles"
  | "eye"
  | "ruler"
  | "palette"
  | "layers"
  | "gamepad"
  | "ban"
  | "rotate"
  | "store";

type Item = { icon: IconKey; label: string };
type Tip = { icon: IconKey; title: string; text: string };
type Fact = { tag: string; title: string; text: string };
type Faq = { q: string; a: string };

export type Aside =
  | {
      kind: "prompts";
      tag: string;
      title: string;
      text: string;
      weakLabel: string;
      betterLabel: string;
      pairs: { weak: string; better: string }[];
    }
  | {
      kind: "subjects";
      tag: string;
      title: string;
      text: string;
      easierLabel: string;
      harderLabel: string;
      easier: Item[];
      harder: Item[];
    }
  | { kind: "constants"; tag: string; title: string; text: string; items: Item[]; note: string };

export type FeatureCopy = {
  meta: { title: string; description: string };
  hero: { pill: string; title: string; text: string };
  /** Card on the index page. */
  card: { tag: string; title: string; line: string; pickWhen: string[]; needs: string };
  inOut: { tag: string; title: string; text: string; inputs: Item[]; gets: string[]; facts: [Fact, Fact] };
  tips: Tip[];
  aside: Aside;
  reviewText: string;
  viewer: { src: string; alt: string };
  limits: { title: string; text: string }[];
  faqs: Faq[];
  closing: { titleA: string; titleB: string };
};

export type CommonCopy = {
  heroSecondary: string;
  closingCta: string;
  closingNote: string;
  seeMode: string;
  needsLabel: string;
  flowPutIn: string;
  flowGet: string;
  flowOutput: string;
  inOutTitle: string;
  tipsTitle: string;
  tipsSub: string;
  afterTitle: string;
  afterSub: string;
  limitsTitle: string;
  limitsSub: string;
  faqTitle: string;
  othersTitle: string;
  solutionsTitle: string;
  solutionsSub: string;
  solutions: { label: string; desc: string; path: string; icon: IconKey }[];
  mesh: { tag: string; title: string; text: string; badge: string; sample: string; diagnosticsLabel: string; diagnostics: string[] };
  review: { tag: string; title: string; text: string };
  optimize: { tag: string; title: string; text: string };
  exportCard: { tag: string; title: string; text: string };
  embed: { tag: string; title: string; text: string; badge: string; link: string };
  engine: { tag: string; title: string; text: string; badge: string };
  importCard: { tag: string; title: string; text: string; cta: string };
};

export type IndexCopy = {
  meta: { title: string; description: string };
  hero: { pill: string; title: string; text: string };
  compareTitle: string;
  compareSub: string;
  afterTitle: string;
  afterSub: string;
  limitsTitle: string;
  apparel: { tag: string; title: string; text: string };
  faqTitle: string;
  faqs: Faq[];
  closing: { titleA: string; titleB: string };
};

/* ------------------------------------------------------------------ */
/* Shared copy                                                          */
/* ------------------------------------------------------------------ */

export const FEATURES_COMMON: Record<Locale, CommonCopy> = {
  en: {
    heroSecondary: "See demo samples",
    closingCta: "Create a model",
    closingNote: "The cost in credits is shown before you generate.",
    seeMode: "See {title}",
    needsLabel: "You need",
    flowPutIn: "You put in",
    flowGet: "You get",
    flowOutput: "3D model",
    inOutTitle: "What goes in, what comes out",
    tipsTitle: "How to get a good result",
    tipsSub: "A few habits at the start save credits later.",
    afterTitle: "What you can do after generating",
    afterSub: "Every model goes through the same steps, whatever you started from.",
    limitsTitle: "Honest limits",
    limitsSub: "Better to know them before you spend credits.",
    faqTitle: "Questions",
    othersTitle: "Other ways to create",
    solutionsTitle: "For stores, games and design",
    solutionsSub: "See how each kind of work uses these modes.",
    solutions: [
      { label: "For stores", desc: "Apparel, furniture, footwear and decor", path: "/solutions/stores", icon: "store" },
      { label: "For games", desc: "GLB with triangle and UV numbers", path: "/solutions/games", icon: "gamepad" },
      { label: "For design", desc: "Import, optimize, compare and export", path: "/solutions/design", icon: "palette" },
    ],
    mesh: {
      tag: "Mesh view",
      title: "Check the geometry before you approve",
      text: "Switch between surface and wireframe, and read the numbers behind the model.",
      badge: "Demo sample",
      sample: "Demo sample model, not a result from your input.",
      diagnosticsLabel: "Diagnostics",
      diagnostics: ["Triangles", "Vertices", "Meshes", "Materials", "Textures", "UV", "Normals"],
    },
    review: {
      tag: "Review",
      title: "A five-point checklist",
      text: "Compare the model with your input on five points: shape, surfaces, hidden sides, material and labels. Nothing is approved without you.",
    },
    optimize: {
      tag: "Optimize",
      title: "Optimize and keep the original",
      text: "Optimizing creates a new version and keeps the original. Compare versions and switch between them. Switching sets the review back to pending.",
    },
    exportCard: {
      tag: "Export",
      title: "GLB, OBJ and STL",
      text: "GLB carries materials and textures. OBJ and STL carry geometry only: OBJ in meters, STL in millimeters.",
    },
    embed: {
      tag: "Embed",
      title: "A viewer link for your site",
      text: "An approved model gets a hosted viewer you can place in an iframe. The link works only while the model is approved and not revoked.",
      badge: "Shopify publishing: coming soon",
      link: "See the full process",
    },
    engine: {
      tag: "Engines",
      title: "An AI engine is planned for the pilot",
      text: "No AI engine is switched on yet: one is planned for the pilot. Today demo samples and GLB import work. Quality is not promised before engines are tested.",
      badge: "Planned",
    },
    importCard: {
      tag: "Already have a GLB?",
      title: "Import it to analyze and optimize",
      text: "Bring an existing GLB, read its diagnostics, optimize it into a new version and export again. The original is kept.",
      cta: "Open the creator",
    },
  },
  es: {
    heroSecondary: "Ver muestras de demostración",
    closingCta: "Crear un modelo",
    closingNote: "El costo en créditos se muestra antes de generar.",
    seeMode: "Ver {title}",
    needsLabel: "Necesitas",
    flowPutIn: "Lo que subes",
    flowGet: "Lo que obtienes",
    flowOutput: "Modelo 3D",
    inOutTitle: "Qué entra y qué sale",
    tipsTitle: "Cómo lograr un buen resultado",
    tipsSub: "Unos hábitos al empezar ahorran créditos después.",
    afterTitle: "Qué puedes hacer después de generar",
    afterSub: "Todos los modelos pasan por los mismos pasos, sin importar con qué empezaste.",
    limitsTitle: "Límites, sin rodeos",
    limitsSub: "Mejor saberlos antes de gastar créditos.",
    faqTitle: "Preguntas",
    othersTitle: "Otras formas de crear",
    solutionsTitle: "Para tiendas, juegos y diseño",
    solutionsSub: "Mira cómo cada tipo de trabajo usa estos modos.",
    solutions: [
      { label: "Para tiendas", desc: "Ropa, muebles, calzado y decoración", path: "/solutions/stores", icon: "store" },
      { label: "Para juegos", desc: "GLB con cifras de triángulos y UV", path: "/solutions/games", icon: "gamepad" },
      { label: "Para diseño", desc: "Importa, optimiza, compara y exporta", path: "/solutions/design", icon: "palette" },
    ],
    mesh: {
      tag: "Vista de malla",
      title: "Revisa la geometría antes de aprobar",
      text: "Cambia entre superficie y malla, y lee las cifras detrás del modelo.",
      badge: "Muestra de demostración",
      sample: "Modelo de muestra, no es un resultado de lo que subas.",
      diagnosticsLabel: "Diagnóstico",
      diagnostics: ["Triángulos", "Vértices", "Mallas", "Materiales", "Texturas", "UV", "Normales"],
    },
    review: {
      tag: "Revisión",
      title: "Una lista de cinco puntos",
      text: "Compara el modelo con lo que subiste en cinco puntos: forma, superficies, lados ocultos, material y etiquetas. Nada se aprueba sin ti.",
    },
    optimize: {
      tag: "Optimizar",
      title: "Optimiza y conserva el original",
      text: "Optimizar crea una versión nueva y conserva el original. Compara versiones y cambia entre ellas. Al cambiar, la revisión vuelve a pendiente.",
    },
    exportCard: {
      tag: "Exportar",
      title: "GLB, OBJ y STL",
      text: "El GLB lleva materiales y texturas. OBJ y STL llevan solo la geometría: OBJ en metros, STL en milímetros.",
    },
    embed: {
      tag: "Incrustar",
      title: "Un enlace de visor para tu sitio",
      text: "Un modelo aprobado tiene un visor alojado que puedes poner en un iframe. El enlace funciona solo mientras el modelo esté aprobado y no se revoque.",
      badge: "Publicar en Shopify: próximamente",
      link: "Ver el proceso completo",
    },
    engine: {
      tag: "Motores",
      title: "Un motor de IA está previsto para el piloto",
      text: "Todavía no hay un motor de IA conectado: hay uno previsto para el piloto. Hoy funcionan las muestras de demostración y la importación de GLB. No prometemos calidad antes de probar los motores.",
      badge: "Previsto",
    },
    importCard: {
      tag: "¿Ya tienes un GLB?",
      title: "Impórtalo para analizarlo y optimizarlo",
      text: "Trae un GLB que ya tengas, lee su diagnóstico, optimízalo en una versión nueva y vuelve a exportar. El original se conserva.",
      cta: "Abrir el creador",
    },
  },
};

/* ------------------------------------------------------------------ */
/* The three input modes                                                */
/* ------------------------------------------------------------------ */

const textToModel: Record<Locale, FeatureCopy> = {
  en: {
    meta: {
      title: "Text to 3D model: describe an object, review it, export GLB",
      description:
        "Write what you need, from a game prop to a decor piece. See the cost in credits first, then review the 3D model and export GLB, OBJ or STL.",
    },
    hero: {
      pill: "Text to 3D",
      title: "Text to 3D model",
      text: "Describe an object or a game prop. Check the cost, generate, then review the model before you use it.",
    },
    card: {
      tag: "Text",
      title: "You only have an idea",
      line: "Write a description of at least 10 characters. Good for objects and game props.",
      pickWhen: [
        "You are building a prop, a prototype or a decor piece",
        "There is no product to photograph yet",
        "You want a starting point to refine in your own software",
      ],
      needs: "A description of 10 characters or more.",
    },
    inOut: {
      tag: "From words",
      title: "A description in, a GLB out",
      text: "Write what the object is, its shape, material and color. There is nothing to upload.",
      inputs: [{ icon: "type", label: "Description" }],
      gets: [
        "A 3D model you can rotate in the browser",
        "A five-point review before anything is approved",
        "GLB with materials and textures, plus OBJ and STL for geometry",
      ],
      facts: [
        {
          tag: "Description",
          title: "At least 10 characters",
          text: "Up to 1000 characters. Describe the shape, the material and the color of one object. Do not ask for brands, logos or real people.",
        },
        {
          tag: "Cost",
          title: "You see the cost first",
          text: "The cost in credits is shown before you generate. If the provider refuses the job, the credits come back. Status comes from the provider, with no made-up progress bars.",
        },
      ],
    },
    tips: [
      { icon: "box", title: "Name the object first", text: "Start with what it is: a wooden bar stool, a sci-fi crate, a ceramic mug. One clear noun beats a long story." },
      { icon: "ruler", title: "Give the shape", text: "Round or square, tall or flat, how many legs, handles or doors. Proportions guide the result." },
      { icon: "layers", title: "Name the material", text: "Matte metal, worn leather, glossy ceramic, brushed brass. The material changes how the surface reads." },
      { icon: "palette", title: "Pick the colors", text: "Say the main color and the accent. If you leave it out, the generator chooses for you." },
      { icon: "gamepad", title: "Set the style", text: "Realistic, stylized or low-poly. A game prop and a decor piece ask for different things." },
      { icon: "ban", title: "One object per description", text: "No scenes, no people, no brands, no logos. Write a separate description for each object." },
    ],
    aside: {
      kind: "prompts",
      tag: "Examples",
      title: "Short versus specific",
      text: "The same idea written two ways. These are example descriptions, not results.",
      weakLabel: "Too short",
      betterLabel: "Specific",
      pairs: [
        { weak: "a chair", better: "A mid-century wooden dining chair with a curved plywood back, four splayed legs and an oak finish" },
        { weak: "sword", better: "A stylized fantasy short sword with a worn steel blade, a leather-wrapped grip and a brass guard" },
        { weak: "lamp", better: "A desk lamp with an articulated arm, a round matte white shade and a brushed brass base" },
      ],
    },
    reviewText:
      "Compare the model with your description on five points: shape, surfaces, hidden sides, material and unwanted text. Nothing is approved without you.",
    viewer: { src: "/demo/lamp.glb", alt: "Demo sample: a lamp model in the 3D viewer" },
    limits: [
      { title: "Results vary", text: "The same description can give different models. Reword it and compare, keeping in mind that each attempt uses credits." },
      { title: "Not your exact product", text: "Text builds a plausible object, not a copy of a real item. For a specific product, start from photos." },
      { title: "Sizes are not guaranteed", text: "Proportions follow your words, but exact measurements do not. Check the scale in your own software." },
      { title: "Letters and logos", text: "Text on the object, logos and fine print may not come out right. The review checklist asks you to look for unwanted ones." },
      { title: "Hard materials", text: "Glass, mirrors and very thin parts are hard cases for any generator." },
    ],
    faqs: [
      {
        q: "How long should my description be?",
        a: "At least 10 characters. One or two sentences with the object, its shape, material and color usually give the generator more to work with than a single word.",
      },
      {
        q: "Can I ask for a brand, a logo or a real person?",
        a: "Do not. Describe the object in your own words. If you need your own product, use photos instead.",
      },
      {
        q: "Will it match my real product?",
        a: "No. Text makes a plausible object from your words. To match a real product, use the image or multi-image mode.",
      },
      {
        q: "What can I export?",
        a: "GLB with materials and textures, and OBJ or STL with geometry only. OBJ is in meters and STL in millimeters.",
      },
      {
        q: "Does it use credits?",
        a: "Yes. The cost is shown before you generate, and the credits come back if the provider refuses the job. Plans are a proposal under test, and payment is not active yet.",
      },
    ],
    closing: { titleA: "Describe it.", titleB: "Review it. Use it." },
  },
  es: {
    meta: {
      title: "Texto a modelo 3D: describe un objeto, revísalo, exporta GLB",
      description:
        "Escribe lo que necesitas, desde un prop de juego hasta una pieza de decoración. Ve el costo en créditos primero, revisa el modelo 3D y exporta GLB, OBJ o STL.",
    },
    hero: {
      pill: "Texto a 3D",
      title: "Texto a modelo 3D",
      text: "Describe un objeto o un prop de juego. Mira el costo, genera y revisa el modelo antes de usarlo.",
    },
    card: {
      tag: "Texto",
      title: "Solo tienes una idea",
      line: "Escribe una descripción de al menos 10 caracteres. Sirve para objetos y props de juego.",
      pickWhen: [
        "Estás armando un prop, un prototipo o una pieza de decoración",
        "Todavía no hay un producto que fotografiar",
        "Quieres un punto de partida para afinar en tu propio software",
      ],
      needs: "Una descripción de 10 caracteres o más.",
    },
    inOut: {
      tag: "Desde palabras",
      title: "Una descripción entra, un GLB sale",
      text: "Escribe qué es el objeto, su forma, material y color. No hay nada que subir.",
      inputs: [{ icon: "type", label: "Descripción" }],
      gets: [
        "Un modelo 3D que puedes girar en el navegador",
        "Una revisión de cinco puntos antes de aprobar nada",
        "GLB con materiales y texturas, más OBJ y STL con la geometría",
      ],
      facts: [
        {
          tag: "Descripción",
          title: "Al menos 10 caracteres",
          text: "Hasta 1000 caracteres. Describe la forma, el material y el color de un solo objeto. No pidas marcas, logotipos ni personas reales.",
        },
        {
          tag: "Costo",
          title: "Ves el costo primero",
          text: "El costo en créditos se muestra antes de generar. Si el proveedor rechaza el trabajo, los créditos se devuelven. El estado viene del proveedor, sin barras de progreso inventadas.",
        },
      ],
    },
    tips: [
      { icon: "box", title: "Nombra primero el objeto", text: "Empieza por lo que es: un taburete de madera, una caja de ciencia ficción, una taza de cerámica. Un sustantivo claro vale más que una historia larga." },
      { icon: "ruler", title: "Da la forma", text: "Redondo o cuadrado, alto o plano, cuántas patas, asas o puertas. Las proporciones guían el resultado." },
      { icon: "layers", title: "Nombra el material", text: "Metal mate, cuero gastado, cerámica brillante, latón cepillado. El material cambia cómo se lee la superficie." },
      { icon: "palette", title: "Elige los colores", text: "Di el color principal y el de acento. Si lo omites, el generador decide por ti." },
      { icon: "gamepad", title: "Define el estilo", text: "Realista, estilizado o low-poly. Un prop de juego y una pieza de decoración piden cosas distintas." },
      { icon: "ban", title: "Un objeto por descripción", text: "Sin escenas, sin personas, sin marcas, sin logotipos. Escribe una descripción aparte para cada objeto." },
    ],
    aside: {
      kind: "prompts",
      tag: "Ejemplos",
      title: "Corto frente a específico",
      text: "La misma idea escrita de dos formas. Son descripciones de ejemplo, no resultados.",
      weakLabel: "Muy corto",
      betterLabel: "Específico",
      pairs: [
        { weak: "una silla", better: "Una silla de comedor de madera de mediados de siglo, con respaldo curvo de contrachapado, cuatro patas abiertas y acabado en roble" },
        { weak: "espada", better: "Una espada corta de fantasía estilizada, con hoja de acero desgastada, empuñadura forrada de cuero y guarda de latón" },
        { weak: "lámpara", better: "Una lámpara de escritorio con brazo articulado, pantalla redonda blanca mate y base de latón cepillado" },
      ],
    },
    reviewText:
      "Compara el modelo con tu descripción en cinco puntos: forma, superficies, lados ocultos, material y textos no deseados. Nada se aprueba sin ti.",
    viewer: { src: "/demo/lamp.glb", alt: "Muestra de demostración: un modelo de lámpara en el visor 3D" },
    limits: [
      { title: "Los resultados varían", text: "La misma descripción puede dar modelos distintos. Reescríbela y compara, recordando que cada intento usa créditos." },
      { title: "No es tu producto exacto", text: "El texto crea un objeto plausible, no una copia de uno real. Para un producto específico, parte de fotos." },
      { title: "Las medidas no están garantizadas", text: "Las proporciones siguen tus palabras, pero las medidas exactas no. Revisa la escala en tu propio software." },
      { title: "Letras y logotipos", text: "Los textos sobre el objeto, los logotipos y la letra pequeña pueden no salir bien. La lista de revisión te pide buscar los no deseados." },
      { title: "Materiales difíciles", text: "El vidrio, los espejos y las partes muy delgadas son casos difíciles para cualquier generador." },
    ],
    faqs: [
      {
        q: "¿Qué tan larga debe ser mi descripción?",
        a: "Al menos 10 caracteres. Una o dos frases con el objeto, su forma, material y color suelen darle al generador más de dónde partir que una sola palabra.",
      },
      {
        q: "¿Puedo pedir una marca, un logotipo o una persona real?",
        a: "No lo hagas. Describe el objeto con tus palabras. Si necesitas tu propio producto, usa fotos.",
      },
      {
        q: "¿Coincidirá con mi producto real?",
        a: "No. El texto crea un objeto plausible a partir de tus palabras. Para coincidir con un producto real, usa el modo de imagen o de varias imágenes.",
      },
      {
        q: "¿Qué puedo exportar?",
        a: "GLB con materiales y texturas, y OBJ o STL solo con la geometría. El OBJ va en metros y el STL en milímetros.",
      },
      {
        q: "¿Usa créditos?",
        a: "Sí. El costo se muestra antes de generar, y los créditos se devuelven si el proveedor rechaza el trabajo. Los planes son una propuesta en prueba y el pago aún no está activo.",
      },
    ],
    closing: { titleA: "Descríbelo.", titleB: "Revísalo. Úsalo." },
  },
};

const imageToModel: Record<Locale, FeatureCopy> = {
  en: {
    meta: {
      title: "Image to 3D model: one photo of your product, reviewed and exportable",
      description:
        "Upload one product photo, see the cost in credits, then review the 3D model, optimize it and export GLB, OBJ or STL. Apparel, furniture, footwear and decor.",
    },
    hero: {
      pill: "Image to 3D",
      title: "Image to 3D model",
      text: "Upload one photo of your product. Check the cost, generate, then review and export.",
    },
    card: {
      tag: "One photo",
      title: "You have one good photo",
      line: "One front photo of a product. The simplest start when the item is already photographed.",
      pickWhen: [
        "You have one clean photo of the front",
        "You want to test a product before shooting more angles",
        "Your catalog already has front shots",
      ],
      needs: "One photo: PNG, JPEG or WebP.",
    },
    inOut: {
      tag: "From a photo",
      title: "One photo in, a GLB out",
      text: "Upload the front of the product. The back and the sides are not in the photo, so the generator fills them in.",
      inputs: [{ icon: "image", label: "Front photo" }],
      gets: [
        "A 3D model of your product you can rotate in the browser",
        "A checklist to compare it with your photo before approving",
        "GLB with materials and textures, plus OBJ and STL for geometry",
      ],
      facts: [
        {
          tag: "Your photo",
          title: "Cleaned on upload",
          text: "PNG, JPEG or WebP, up to 8 MB and at least 256 px on the short side. Location data (EXIF) is stripped from every photo. SVG files are rejected. You confirm you have the right to use the photo.",
        },
        {
          tag: "Cost",
          title: "You see the cost first",
          text: "The cost in credits is shown before you generate. If the provider refuses the job, the credits come back. Status comes from the provider, with no made-up progress bars.",
        },
      ],
    },
    tips: [
      { icon: "focus", title: "One product, nothing else", text: "Only the item in frame. Remove props, hangers and other products around it." },
      { icon: "square", title: "Plain background", text: "A flat white or gray wall or sheet. Clutter behind the product bleeds into the shape." },
      { icon: "sun", title: "Even, soft light", text: "Daylight near a window or a softbox. Avoid hard shadows, flash glare and colored light." },
      { icon: "shirt", title: "Straight on, whole item", text: "Shoot the front at eye level with the full item in frame and some space around it. For a hoodie, lay it flat or use a mannequin." },
      { icon: "camera", title: "Sharp and large enough", text: "In focus, at least 256 px on the short side and up to 8 MB. Blur and heavy compression hide detail." },
      { icon: "armchair", title: "Start with solid shapes", text: "Furniture, footwear and decor have clear outlines. Soft cloth and shiny surfaces are harder." },
    ],
    aside: {
      kind: "subjects",
      tag: "What to photograph",
      title: "Pick the subject with care",
      text: "Solid, matte shapes with a clear outline are the easiest to read. These are guidelines, not a guarantee.",
      easierLabel: "Easier to read",
      harderLabel: "Needs extra care",
      easier: [
        { icon: "armchair", label: "Furniture" },
        { icon: "footprints", label: "Footwear" },
        { icon: "lamp", label: "Decor" },
      ],
      harder: [
        { icon: "shirt", label: "Soft cloth and prints" },
        { icon: "sparkles", label: "Reflective" },
        { icon: "eye", label: "Transparent" },
        { icon: "ruler", label: "Very thin parts" },
      ],
    },
    reviewText:
      "Compare the model with your photo on five points: shape, surfaces, hidden angles, material and labels. Nothing is approved without you.",
    viewer: { src: "/demo/chair.glb", alt: "Demo sample: a chair model in the 3D viewer" },
    limits: [
      { title: "The back and sides are guessed", text: "One photo shows one side. The rest is inferred, so check it in the review or add more angles with the multi-image mode." },
      { title: "Apparel is hard", text: "Soft cloth, folds and prints are hard for any generator. Hoodies, jackets and tees can come out with simplified folds or prints. Review them closely." },
      { title: "Reflective, transparent, very thin", text: "Glass, chrome, clear plastic and thin straps are hard cases. Expect to retry or to fix them in your own software." },
      { title: "Logos and small print", text: "Labels and fine print may not carry over. The review checklist asks you to check them." },
    ],
    faqs: [
      {
        q: "What should the photo look like?",
        a: "The front of the product at eye level, in focus, with the whole item in frame, a plain background and soft, even light.",
      },
      {
        q: "What happens to the back and the sides?",
        a: "They are not in your photo, so the generator infers them. Check them in the review, or use several photos of the same product to give it more to go on.",
      },
      {
        q: "Does it work for hoodies, jackets and tees?",
        a: "You can try. Soft cloth, folds and prints are hard for any generator, so lay the garment flat or put it on a mannequin and review the result closely before approving.",
      },
      {
        q: "Is my location data kept?",
        a: "No. Location data (EXIF) is stripped from every photo you upload, and SVG files are rejected.",
      },
      {
        q: "What if the provider refuses my job?",
        a: "The credits are refunded. The job status you see comes from the provider.",
      },
    ],
    closing: { titleA: "One photo in.", titleB: "A model you can check." },
  },
  es: {
    meta: {
      title: "Imagen a modelo 3D: una foto de tu producto, revisada y exportable",
      description:
        "Sube una foto de producto, ve el costo en créditos, revisa el modelo 3D, optimízalo y exporta GLB, OBJ o STL. Ropa, muebles, calzado y decoración.",
    },
    hero: {
      pill: "Imagen a 3D",
      title: "Imagen a modelo 3D",
      text: "Sube una foto de tu producto. Mira el costo, genera y luego revisa y exporta.",
    },
    card: {
      tag: "Una foto",
      title: "Tienes una buena foto",
      line: "Una foto frontal de un producto. El inicio más simple cuando el artículo ya está fotografiado.",
      pickWhen: [
        "Tienes una foto limpia del frente",
        "Quieres probar un producto antes de tomar más ángulos",
        "Tu catálogo ya tiene fotos frontales",
      ],
      needs: "Una foto: PNG, JPEG o WebP.",
    },
    inOut: {
      tag: "Desde una foto",
      title: "Una foto entra, un GLB sale",
      text: "Sube el frente del producto. La espalda y los costados no están en la foto, así que el generador los completa.",
      inputs: [{ icon: "image", label: "Foto frontal" }],
      gets: [
        "Un modelo 3D de tu producto que puedes girar en el navegador",
        "Una lista para compararlo con tu foto antes de aprobar",
        "GLB con materiales y texturas, más OBJ y STL con la geometría",
      ],
      facts: [
        {
          tag: "Tu foto",
          title: "Se limpia al subirla",
          text: "PNG, JPEG o WebP, hasta 8 MB y al menos 256 px en el lado corto. Se eliminan los datos de ubicación (EXIF) de cada foto. Los archivos SVG se rechazan. Confirmas que tienes derecho a usar la foto.",
        },
        {
          tag: "Costo",
          title: "Ves el costo primero",
          text: "El costo en créditos se muestra antes de generar. Si el proveedor rechaza el trabajo, los créditos se devuelven. El estado viene del proveedor, sin barras de progreso inventadas.",
        },
      ],
    },
    tips: [
      { icon: "focus", title: "Un producto, nada más", text: "Solo el artículo en el encuadre. Quita accesorios, ganchos y otros productos alrededor." },
      { icon: "square", title: "Fondo liso", text: "Una pared o una tela lisa, blanca o gris. El desorden detrás del producto se mezcla con la forma." },
      { icon: "sun", title: "Luz suave y pareja", text: "Luz de día junto a una ventana o una caja de luz. Evita sombras duras, reflejos de flash y luz de color." },
      { icon: "shirt", title: "De frente, el artículo completo", text: "Toma el frente a la altura de los ojos, con todo el artículo en el encuadre y algo de espacio alrededor. Si es un hoodie, extiéndelo plano o ponlo en un maniquí." },
      { icon: "camera", title: "Nítida y de buen tamaño", text: "Enfocada, con al menos 256 px en el lado corto y hasta 8 MB. El desenfoque y la compresión fuerte ocultan detalle." },
      { icon: "armchair", title: "Empieza con formas sólidas", text: "Muebles, calzado y decoración tienen siluetas claras. La tela blanda y las superficies brillantes son más difíciles." },
    ],
    aside: {
      kind: "subjects",
      tag: "Qué fotografiar",
      title: "Elige bien el sujeto",
      text: "Las formas sólidas y mates con silueta clara son las más fáciles de leer. Son pautas, no una garantía.",
      easierLabel: "Más fáciles de leer",
      harderLabel: "Piden más cuidado",
      easier: [
        { icon: "armchair", label: "Muebles" },
        { icon: "footprints", label: "Calzado" },
        { icon: "lamp", label: "Decoración" },
      ],
      harder: [
        { icon: "shirt", label: "Tela blanda y estampados" },
        { icon: "sparkles", label: "Reflectantes" },
        { icon: "eye", label: "Transparentes" },
        { icon: "ruler", label: "Partes muy delgadas" },
      ],
    },
    reviewText:
      "Compara el modelo con tu foto en cinco puntos: forma, superficies, ángulos ocultos, material y etiquetas. Nada se aprueba sin ti.",
    viewer: { src: "/demo/chair.glb", alt: "Muestra de demostración: un modelo de silla en el visor 3D" },
    limits: [
      { title: "La espalda y los costados se adivinan", text: "Una foto muestra un lado. El resto se infiere, así que revísalo en la revisión o agrega más ángulos con el modo de varias imágenes." },
      { title: "La ropa es difícil", text: "La tela blanda, los pliegues y los estampados son difíciles para cualquier generador. Hoodies, chaquetas y camisetas pueden salir con pliegues o estampados simplificados. Revísalos con cuidado." },
      { title: "Reflectante, transparente, muy delgado", text: "El vidrio, el cromo, el plástico transparente y las correas delgadas son casos difíciles. Cuenta con reintentar o corregirlos en tu propio software." },
      { title: "Logotipos y letra pequeña", text: "Las etiquetas y la letra pequeña pueden no pasar al modelo. La lista de revisión te pide comprobarlas." },
    ],
    faqs: [
      {
        q: "¿Cómo debe ser la foto?",
        a: "El frente del producto a la altura de los ojos, enfocado, con el artículo completo en el encuadre, fondo liso y luz suave y pareja.",
      },
      {
        q: "¿Qué pasa con la espalda y los costados?",
        a: "No están en tu foto, así que el generador los infiere. Revísalos en la revisión, o usa varias fotos del mismo producto para darle más información.",
      },
      {
        q: "¿Sirve para hoodies, chaquetas y camisetas?",
        a: "Puedes probar. La tela blanda, los pliegues y los estampados son difíciles para cualquier generador, así que extiende la prenda o ponla en un maniquí y revisa bien el resultado antes de aprobar.",
      },
      {
        q: "¿Se guardan mis datos de ubicación?",
        a: "No. Los datos de ubicación (EXIF) se eliminan de cada foto que subes, y los archivos SVG se rechazan.",
      },
      {
        q: "¿Qué pasa si el proveedor rechaza mi trabajo?",
        a: "Los créditos se devuelven. El estado del trabajo que ves viene del proveedor.",
      },
    ],
    closing: { titleA: "Una foto.", titleB: "Un modelo que puedes revisar." },
  },
};

const multiImageToModel: Record<Locale, FeatureCopy> = {
  en: {
    meta: {
      title: "Multi-image to 3D model: up to four views of the same product",
      description:
        "Upload up to four photos of one product: front, left, back and right. Less guessing than one photo. Review, optimize and export GLB, OBJ or STL.",
    },
    hero: {
      pill: "Multi-image to 3D",
      title: "Multi-image to 3D model",
      text: "Up to four photos of the same product: front, sides and back, so there is less to guess.",
    },
    card: {
      tag: "Several photos",
      title: "You can shoot every side",
      line: "Up to four views of one product. The generator has less to guess about the sides and the back.",
      pickWhen: [
        "You can shoot front, left, back and right",
        "The back matters, as on a jacket or a chair",
        "You sell apparel, furniture or footwear online",
      ],
      needs: "One to four photos of the same product.",
    },
    inOut: {
      tag: "From several photos",
      title: "Four views in, a GLB out",
      text: "Put each photo in its slot: front, left, back, right. Front is the base. The other views are optional.",
      inputs: [
        { icon: "image", label: "Front" },
        { icon: "image", label: "Left" },
        { icon: "image", label: "Back" },
        { icon: "image", label: "Right" },
      ],
      gets: [
        "A 3D model of your product you can rotate in the browser",
        "A checklist to compare it with your photos before approving",
        "GLB with materials and textures, plus OBJ and STL for geometry",
      ],
      facts: [
        {
          tag: "Your photos",
          title: "Cleaned on upload",
          text: "PNG, JPEG or WebP, up to 8 MB each and at least 256 px on the short side. Location data (EXIF) is stripped from every photo. SVG files are rejected. You confirm you have the right to use the photos.",
        },
        {
          tag: "Cost",
          title: "You see the cost first",
          text: "The cost in credits is shown before you generate. If the provider refuses the job, the credits come back. Status comes from the provider, with no made-up progress bars.",
        },
      ],
    },
    tips: [
      { icon: "box", title: "Same product in every photo", text: "The same item, color and size. Do not mix variants or swap in a similar piece." },
      { icon: "sun", title: "Same light", text: "Light the product the same way in every shot, soft and even. Shadows that change read as a shape that changes." },
      { icon: "square", title: "Plain background", text: "The same flat background in every photo, so nothing behind the product changes between views." },
      { icon: "rotate", title: "Fill the slots in order", text: "Front first, then left, back and right. Each photo goes in the slot that matches its angle." },
      { icon: "camera", title: "Same height, same distance", text: "Keep the camera where it is and turn the product about 90 degrees between shots, or walk around it." },
      { icon: "shirt", title: "Dress apparel the same way", text: "On a mannequin or a hanger, with the same folds in every view. Wrinkles that change between shots confuse the result." },
    ],
    aside: {
      kind: "constants",
      tag: "The shot list",
      title: "Change the angle, nothing else",
      text: "Between shots, keep these five the same.",
      items: [
        { icon: "box", label: "Product" },
        { icon: "sun", label: "Light" },
        { icon: "square", label: "Background" },
        { icon: "camera", label: "Camera height" },
        { icon: "ruler", label: "Distance" },
      ],
      note: "Front is required as the base. Left, back and right are optional extra views.",
    },
    reviewText:
      "Compare the model with your photos on five points: shape, surfaces, hidden angles, material and labels. Nothing is approved without you.",
    viewer: { src: "/demo/vase.glb", alt: "Demo sample: a vase model in the 3D viewer" },
    limits: [
      { title: "More photos are not a promise", text: "Extra views give the generator more to work with, but quality is not guaranteed. Always review before approving." },
      { title: "Photos that disagree", text: "Different light, a product that moved or colors that shift between shots can distort the result." },
      { title: "Apparel is hard", text: "Soft cloth, folds and prints are hard for any generator. Hoodies, jackets and tees can come out with simplified folds or prints. Review them closely." },
      { title: "Reflective, transparent, very thin", text: "Glass, chrome, clear plastic and thin straps are hard cases, even with four views." },
      { title: "Up to four photos", text: "The slots are front, left, back and right. There is no fifth view." },
    ],
    faqs: [
      {
        q: "How many photos can I use?",
        a: "One to four photos of the same product, in the slots front, left, back and right. Extra views are optional.",
      },
      {
        q: "Is it better than a single photo?",
        a: "More angles mean less has to be invented, especially the back and the sides. It is not a guarantee of quality, so you still review every model.",
      },
      {
        q: "Do the photos need the same light?",
        a: "Yes, as far as you can. Keep the light, the background, the camera height and the distance the same, and change only the angle.",
      },
      {
        q: "What if I only have a description?",
        a: "Use the text mode. Write at least 10 characters about one object.",
      },
      {
        q: "Can I bring a model I already have?",
        a: "Yes. Import a GLB to read its diagnostics, optimize it into a new version and export again. The original is kept.",
      },
    ],
    closing: { titleA: "Four angles.", titleB: "Less guessing." },
  },
  es: {
    meta: {
      title: "Varias imágenes a modelo 3D: hasta cuatro vistas del mismo producto",
      description:
        "Sube hasta cuatro fotos de un producto: frente, izquierda, espalda y derecha. Menos adivinanza que con una foto. Revisa, optimiza y exporta GLB, OBJ o STL.",
    },
    hero: {
      pill: "Varias imágenes a 3D",
      title: "Varias imágenes a modelo 3D",
      text: "Hasta cuatro fotos del mismo producto: frente, costados y espalda, para que haya menos que adivinar.",
    },
    card: {
      tag: "Varias fotos",
      title: "Puedes fotografiar todos los lados",
      line: "Hasta cuatro vistas de un producto. El generador tiene menos que adivinar en los costados y la espalda.",
      pickWhen: [
        "Puedes tomar frente, izquierda, espalda y derecha",
        "La espalda importa, como en una chaqueta o una silla",
        "Vendes ropa, muebles o calzado en línea",
      ],
      needs: "De una a cuatro fotos del mismo producto.",
    },
    inOut: {
      tag: "Desde varias fotos",
      title: "Cuatro vistas entran, un GLB sale",
      text: "Pon cada foto en su casilla: frente, izquierda, espalda, derecha. El frente es la base. Las otras vistas son opcionales.",
      inputs: [
        { icon: "image", label: "Frente" },
        { icon: "image", label: "Izquierda" },
        { icon: "image", label: "Espalda" },
        { icon: "image", label: "Derecha" },
      ],
      gets: [
        "Un modelo 3D de tu producto que puedes girar en el navegador",
        "Una lista para compararlo con tus fotos antes de aprobar",
        "GLB con materiales y texturas, más OBJ y STL con la geometría",
      ],
      facts: [
        {
          tag: "Tus fotos",
          title: "Se limpian al subirlas",
          text: "PNG, JPEG o WebP, hasta 8 MB cada una y al menos 256 px en el lado corto. Se eliminan los datos de ubicación (EXIF) de cada foto. Los archivos SVG se rechazan. Confirmas que tienes derecho a usar las fotos.",
        },
        {
          tag: "Costo",
          title: "Ves el costo primero",
          text: "El costo en créditos se muestra antes de generar. Si el proveedor rechaza el trabajo, los créditos se devuelven. El estado viene del proveedor, sin barras de progreso inventadas.",
        },
      ],
    },
    tips: [
      { icon: "box", title: "El mismo producto en cada foto", text: "El mismo artículo, color y tamaño. No mezcles variantes ni cambies por una pieza parecida." },
      { icon: "sun", title: "La misma luz", text: "Ilumina el producto igual en cada toma, suave y pareja. Las sombras que cambian se leen como una forma que cambia." },
      { icon: "square", title: "Fondo liso", text: "El mismo fondo liso en todas las fotos, para que nada detrás del producto cambie entre vistas." },
      { icon: "rotate", title: "Llena las casillas en orden", text: "Primero el frente, luego izquierda, espalda y derecha. Cada foto va en la casilla que corresponde a su ángulo." },
      { icon: "camera", title: "Misma altura, misma distancia", text: "Deja la cámara donde está y gira el producto unos 90 grados entre tomas, o camina alrededor de él." },
      { icon: "shirt", title: "Viste la ropa igual en todas", text: "En un maniquí o un gancho, con los mismos pliegues en cada vista. Las arrugas que cambian entre tomas confunden el resultado." },
    ],
    aside: {
      kind: "constants",
      tag: "La lista de tomas",
      title: "Cambia el ángulo, nada más",
      text: "Entre toma y toma, mantén estas cinco cosas iguales.",
      items: [
        { icon: "box", label: "Producto" },
        { icon: "sun", label: "Luz" },
        { icon: "square", label: "Fondo" },
        { icon: "camera", label: "Altura de cámara" },
        { icon: "ruler", label: "Distancia" },
      ],
      note: "El frente es obligatorio como base. Izquierda, espalda y derecha son vistas extra opcionales.",
    },
    reviewText:
      "Compara el modelo con tus fotos en cinco puntos: forma, superficies, ángulos ocultos, material y etiquetas. Nada se aprueba sin ti.",
    viewer: { src: "/demo/vase.glb", alt: "Muestra de demostración: un modelo de jarrón en el visor 3D" },
    limits: [
      { title: "Más fotos no son una promesa", text: "Las vistas extra le dan más al generador, pero la calidad no está garantizada. Revisa siempre antes de aprobar." },
      { title: "Fotos que se contradicen", text: "Luz distinta, un producto que se movió o colores que cambian entre tomas pueden deformar el resultado." },
      { title: "La ropa es difícil", text: "La tela blanda, los pliegues y los estampados son difíciles para cualquier generador. Hoodies, chaquetas y camisetas pueden salir con pliegues o estampados simplificados. Revísalos con cuidado." },
      { title: "Reflectante, transparente, muy delgado", text: "El vidrio, el cromo, el plástico transparente y las correas delgadas son casos difíciles, incluso con cuatro vistas." },
      { title: "Hasta cuatro fotos", text: "Las casillas son frente, izquierda, espalda y derecha. No hay una quinta vista." },
    ],
    faqs: [
      {
        q: "¿Cuántas fotos puedo usar?",
        a: "De una a cuatro fotos del mismo producto, en las casillas frente, izquierda, espalda y derecha. Las vistas extra son opcionales.",
      },
      {
        q: "¿Es mejor que una sola foto?",
        a: "Con más ángulos hay menos que inventar, sobre todo en la espalda y los costados. No garantiza la calidad, así que sigues revisando cada modelo.",
      },
      {
        q: "¿Las fotos necesitan la misma luz?",
        a: "Sí, en lo posible. Mantén igual la luz, el fondo, la altura de la cámara y la distancia, y cambia solo el ángulo.",
      },
      {
        q: "¿Y si solo tengo una descripción?",
        a: "Usa el modo de texto. Escribe al menos 10 caracteres sobre un objeto.",
      },
      {
        q: "¿Puedo traer un modelo que ya tengo?",
        a: "Sí. Importa un GLB para leer su diagnóstico, optimízalo en una versión nueva y vuelve a exportar. El original se conserva.",
      },
    ],
    closing: { titleA: "Cuatro ángulos.", titleB: "Menos adivinanza." },
  },
};

export const FEATURES: Record<FeatureSlug, Record<Locale, FeatureCopy>> = {
  "text-to-3d": textToModel,
  "image-to-3d": imageToModel,
  "multi-image-to-3d": multiImageToModel,
};

export function featureCopy(locale: Locale, slug: FeatureSlug): FeatureCopy {
  return FEATURES[slug][locale];
}

/* ------------------------------------------------------------------ */
/* Index page                                                           */
/* ------------------------------------------------------------------ */

export const FEATURES_INDEX: Record<Locale, IndexCopy> = {
  en: {
    meta: {
      title: "Product: text, image and multi-image to 3D model",
      description:
        "Three ways to start a 3D model: a text description, one photo or up to four photos of the same product. Review, optimize and export GLB, OBJ or STL.",
    },
    hero: {
      pill: "Product",
      title: "Three ways to start a 3D model",
      text: "Pick the input you have: a description, one photo or several photos of the same product.",
    },
    compareTitle: "When to pick which",
    compareSub: "Start from what you already have.",
    afterTitle: "The same steps after generating",
    afterSub: "Whatever you start from, the model goes through the same review.",
    limitsTitle: "Know the limits before you start",
    apparel: {
      tag: "Apparel",
      title: "Hoodies, jackets and tees are hard",
      text: "Soft cloth, folds and prints are hard for any generator. Reflective, transparent and very thin products are hard too. Review every model before you approve it.",
    },
    faqTitle: "Questions",
    faqs: [
      {
        q: "Which mode should I start with?",
        a: "Use the input you already have. One photo is the simplest start, several photos of the same product leave less to guess, and a description works when there is nothing to photograph.",
      },
      {
        q: "What do I get from each mode?",
        a: "The same thing: a 3D model you review, optimize and export as GLB, OBJ or STL.",
      },
      {
        q: "Can I bring a model I already have?",
        a: "Yes. Import a GLB to read its diagnostics, optimize it into a new version and export again. The original is kept.",
      },
      {
        q: "Is payment active?",
        a: "No. Plans are a proposal under test, billed in monthly credits that do not roll over. The cost of each generation is shown before you start.",
      },
    ],
    closing: { titleA: "Pick your input.", titleB: "Check the model." },
  },
  es: {
    meta: {
      title: "Producto: texto, imagen y varias imágenes a modelo 3D",
      description:
        "Tres formas de empezar un modelo 3D: una descripción, una foto o hasta cuatro fotos del mismo producto. Revisa, optimiza y exporta GLB, OBJ o STL.",
    },
    hero: {
      pill: "Producto",
      title: "Tres formas de empezar un modelo 3D",
      text: "Elige lo que tienes: una descripción, una foto o varias fotos del mismo producto.",
    },
    compareTitle: "Cuándo elegir cada uno",
    compareSub: "Empieza con lo que ya tienes.",
    afterTitle: "Los mismos pasos después de generar",
    afterSub: "Sin importar con qué empieces, el modelo pasa por la misma revisión.",
    limitsTitle: "Conoce los límites antes de empezar",
    apparel: {
      tag: "Ropa",
      title: "Hoodies, chaquetas y camisetas son difíciles",
      text: "La tela blanda, los pliegues y los estampados son difíciles para cualquier generador. Los productos reflectantes, transparentes y muy delgados también. Revisa cada modelo antes de aprobarlo.",
    },
    faqTitle: "Preguntas",
    faqs: [
      {
        q: "¿Con qué modo empiezo?",
        a: "Usa lo que ya tienes. Una foto es el inicio más simple, varias fotos del mismo producto dejan menos que adivinar, y una descripción sirve cuando no hay nada que fotografiar.",
      },
      {
        q: "¿Qué obtengo de cada modo?",
        a: "Lo mismo: un modelo 3D que revisas, optimizas y exportas como GLB, OBJ o STL.",
      },
      {
        q: "¿Puedo traer un modelo que ya tengo?",
        a: "Sí. Importa un GLB para leer su diagnóstico, optimízalo en una versión nueva y vuelve a exportar. El original se conserva.",
      },
      {
        q: "¿El pago está activo?",
        a: "No. Los planes son una propuesta en prueba, con créditos mensuales que no se acumulan. El costo de cada generación se muestra antes de empezar.",
      },
    ],
    closing: { titleA: "Elige tu punto de partida.", titleB: "Revisa el modelo." },
  },
};
