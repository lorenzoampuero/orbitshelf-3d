import type { ModelCategory } from "@/lib/models";
import type { Locale } from "@/lib/types";

/**
 * Copy for the new home sections (composer, shelf, build sequence, audiences, connections).
 * The older sections keep their text in the dictionaries. Nothing here claims the sample models were made with the product.
 */
export type HomeCopy = {
  composer: {
    label: string;
    placeholder: string;
    addPhoto: string;
    removePhoto: string;
    generate: string;
    hint: string;
    tooShort: string;
    photoReady: string;
    examples: string;
  };
  shelf: {
    title: string;
    sub: string;
    label: string;
    all: string;
    open: string;
    close: string;
    categories: Record<ModelCategory, string>;
    create: string;
    quickHint: string;
  };
  sequence: {
    title: string;
    sub: string;
    stageLabel: string;
    steps: { title: string; text: string }[];
    input: string[];
    sample: string;
    triangles: string;
    webFile: string;
    exportLabel: string;
  };
  audiences: {
    title: string;
    sub: string;
    tabs: { stores: string; games: string; design: string };
    pick: string;
  };
  connections: {
    title: string;
    sub: string;
    reads: string;
    next: string;
    nextSub: string;
    roblox: { name: string; text: string };
    print: { name: string; text: string };
    soon: string;
  };
  /** The text-to-3D card on the home shows its own prompt, matching the render beside it. */
  textPrompt: string;
  uses: {
    title: string;
    sub: string;
    items: { key: "stores" | "games" | "film" | "design"; tag: string; title: string; text: string; cta: string }[];
  };
  expect: { title: string };
  closing: { stageLabel: string };
};

export const homeCopy: Record<Locale, HomeCopy> = {
  en: {
    composer: {
      label: "Describe the model or add a photo",
      placeholder: "Describe an object, or add a photo of your product",
      addPhoto: "Add a photo",
      removePhoto: "Remove photo",
      generate: "Start",
      hint: "You see the cost in credits before anything is generated, and you review every model.",
      tooShort: "Write at least 10 characters, or add a photo.",
      photoReady: "Photo ready:",
      examples: "Try",
    },
    shelf: {
      title: "A shelf of 3D models",
      sub: "Pick one and drag to spin it. Every model here is a GLB, the format your store, your engine or your printer reads.",
      label: "Filter the shelf by type",
      all: "All",
      open: "Open",
      close: "Close",
      categories: {
        apparel: "Apparel",
        furniture: "Furniture",
        product: "Products",
        character: "Characters",
        creature: "Creatures",
        vehicle: "Vehicles",
        prop: "Props",
        architecture: "Buildings",
        sculpture: "Sculpture",
      },
      create: "Create your own",
      quickHint: "Drag, or use the arrow keys, to turn it.",
    },
    sequence: {
      title: "From the original to a file that is ready",
      sub: "Three steps, from the first photo to a file your store or engine can load.",
      stageLabel: "One model shown as mesh, clay, texture and web file",
      steps: [
        { title: "Start from photos or a sentence", text: "One photo, up to four views of the same product, or a text description. You can also import a GLB you already have." },
        { title: "A mesh first", text: "The geometry comes first. It is what a game engine, Blender or a printer reads, so it is worth looking at." },
        { title: "Then the form, without colour", text: "The clay view lets you judge shape and proportion before the surface gets in the way." },
        { title: "Then the surface", text: "Colour, material and fine detail. This is what your customer sees when they turn the product." },
        { title: "Sized for the web", text: "A heavy model becomes a file a product page can load. Every optimisation is a new version, and the original stays." },
        { title: "Export what you need", text: "GLB carries materials and textures. OBJ and STL carry the geometry only." },
      ],
      input: ["Photo", "Several views", "Text"],
      sample: "Sample file, figures measured on the file.",
      triangles: "triangles",
      webFile: "web GLB",
      exportLabel: "Export formats",
    },
    audiences: {
      title: "Built for the people who ship 3D",
      sub: "Online stores, game studios and 3D designers each get a flow of their own.",
      tabs: { stores: "Stores", games: "Games", design: "3D design" },
      pick: "Show",
    },
    connections: {
      title: "Connects to your workflow",
      sub: "The files work where you already work. Each connection shows the status it really has today.",
      reads: "Tools that read your files",
      next: "On the list",
      nextSub: "Not available yet. They are here so you know where this is going.",
      roblox: { name: "Roblox Studio", text: "Bring your models into your experiences." },
      print: { name: "Direct 3D printing", text: "Send a model to a printer without exporting by hand." },
      soon: "Coming soon",
    },
    textPrompt: "A lizard creature with armour plates and a long tail, game style",
    uses: {
      title: "From one idea to the tool you already use",
      sub: "The same GLB goes to a store page, a game engine, a film scene or a printer.",
      items: [
        { key: "stores", tag: "Online stores", title: "Ready for your product page", text: "Turn a product photo into a GLB your store can load: apparel, furniture and decor included.", cta: "Solutions for stores" },
        { key: "games", tag: "Games", title: "Ready for your game", text: "Blocky characters, creatures and low-poly buildings as GLB files for your engine.", cta: "Solutions for games" },
        { key: "film", tag: "Film and animation", title: "Ready for your scenes", text: "Giant robots and creatures you can bring into Blender or your engine, then pose and animate there.", cta: "Solutions for 3D design" },
        { key: "design", tag: "3D design and printing", title: "Keep your own software", text: "A GLB with the geometry in plain sight: fix it in your tool, or check it before you print.", cta: "Solutions for 3D design" },
      ],
    },
    expect: { title: "What to expect" },
    closing: { stageLabel: "A model turning on its stage" },
  },
  es: {
    composer: {
      label: "Describe el modelo o añade una foto",
      placeholder: "Describe un objeto, o añade una foto de tu producto",
      addPhoto: "Añadir una foto",
      removePhoto: "Quitar la foto",
      generate: "Empezar",
      hint: "Ves el costo en créditos antes de generar nada, y revisas cada modelo.",
      tooShort: "Escribe al menos 10 caracteres, o añade una foto.",
      photoReady: "Foto lista:",
      examples: "Prueba",
    },
    shelf: {
      title: "Un estante de modelos 3D",
      sub: "Elige uno y arrástralo para girarlo. Todos son GLB, el formato que lee tu tienda, tu motor o tu impresora.",
      label: "Filtrar el estante por tipo",
      all: "Todos",
      open: "Abrir",
      close: "Cerrar",
      categories: {
        apparel: "Ropa",
        furniture: "Muebles",
        product: "Productos",
        character: "Personajes",
        creature: "Criaturas",
        vehicle: "Vehículos",
        prop: "Objetos",
        architecture: "Edificios",
        sculpture: "Escultura",
      },
      create: "Crea el tuyo",
      quickHint: "Arrastra, o usa las flechas del teclado, para girarlo.",
    },
    sequence: {
      title: "Del original a un archivo listo",
      sub: "Tres pasos, de la primera foto a un archivo que tu tienda o tu motor pueden cargar.",
      stageLabel: "Un modelo mostrado como malla, barro, textura y archivo web",
      steps: [
        { title: "Empieza con fotos o una frase", text: "Una foto, hasta cuatro vistas del mismo producto, o una descripción. También puedes importar un GLB que ya tengas." },
        { title: "Primero, la malla", text: "La geometría va primero. Es lo que lee un motor de juegos, Blender o una impresora, así que conviene mirarla." },
        { title: "Después, la forma sin color", text: "La vista de barro te deja juzgar la forma y las proporciones antes de que la superficie estorbe." },
        { title: "Después, la superficie", text: "Color, material y detalle fino. Es lo que ve tu cliente cuando gira el producto." },
        { title: "Del tamaño que pide la web", text: "Un modelo pesado pasa a ser un archivo que una ficha de producto puede cargar. Cada optimización es una versión nueva y el original se conserva." },
        { title: "Exporta lo que necesites", text: "GLB lleva materiales y texturas. OBJ y STL llevan solo la geometría." },
      ],
      input: ["Foto", "Varias vistas", "Texto"],
      sample: "Archivo de muestra, cifras medidas sobre el archivo.",
      triangles: "triángulos",
      webFile: "GLB web",
      exportLabel: "Formatos de exportación",
    },
    audiences: {
      title: "Hecho para quienes entregan 3D",
      sub: "Tiendas online, estudios de juegos y diseñadores 3D tienen cada uno su propio flujo.",
      tabs: { stores: "Tiendas", games: "Juegos", design: "Diseño 3D" },
      pick: "Mostrar",
    },
    connections: {
      title: "Se conecta con tu flujo de trabajo",
      sub: "Los archivos funcionan donde ya trabajas. Cada conexión muestra el estado que tiene de verdad hoy.",
      reads: "Herramientas que leen tus archivos",
      next: "En la lista",
      nextSub: "Todavía no están disponibles. Están aquí para que sepas hacia dónde va esto.",
      roblox: { name: "Roblox Studio", text: "Lleva tus modelos a tus experiencias." },
      print: { name: "Impresión 3D directa", text: "Manda un modelo a la impresora sin exportar a mano." },
      soon: "Próximamente",
    },
    textPrompt: "Una criatura lagarto con placas de armadura y una cola larga, estilo de videojuego",
    uses: {
      title: "De una idea a la herramienta que ya usas",
      sub: "El mismo GLB sirve para una ficha de tienda, un motor de juegos, una escena de cine o una impresora.",
      items: [
        { key: "stores", tag: "Tiendas online", title: "Listo para tu ficha de producto", text: "Convierte la foto de un producto en un GLB que tu tienda pueda cargar: ropa, muebles y decoración.", cta: "Soluciones para tiendas" },
        { key: "games", tag: "Videojuegos", title: "Listo para tu videojuego", text: "Personajes de bloques, criaturas y edificios low-poly como archivos GLB para tu motor.", cta: "Soluciones para juegos" },
        { key: "film", tag: "Cine y animación", title: "Listo para tus escenas", text: "Robots gigantes y criaturas que llevas a Blender o a tu motor, y allí los posas y los animas.", cta: "Soluciones de diseño 3D" },
        { key: "design", tag: "Diseño 3D e impresión", title: "Sigue con tu software", text: "Un GLB con la geometría a la vista: corrígelo en tu herramienta o revísalo antes de imprimir.", cta: "Soluciones de diseño 3D" },
      ],
    },
    expect: { title: "Qué esperar" },
    closing: { stageLabel: "Un modelo girando sobre su escenario" },
  },
};
