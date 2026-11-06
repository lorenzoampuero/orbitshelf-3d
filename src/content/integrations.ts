import type { Locale } from "@/lib/types";

/**
 * Copy and facts for the /integrations page. Plain data, no server-only imports.
 * Facts come from integrations/README.md and docs/SHOPIFY.md: do not claim more than they do.
 */

export type IntegrationStatus = "available" | "testing" | "soon" | "planned";
export type IntegrationId = "embed" | "shopify" | "blender" | "api" | "mcp" | "woocommerce";

/** Order and status are the same in every language. */
export const INTEGRATION_ORDER: { id: IntegrationId; status: IntegrationStatus }[] = [
  { id: "embed", status: "available" },
  { id: "shopify", status: "soon" },
  { id: "blender", status: "soon" },
  { id: "api", status: "testing" },
  { id: "mcp", status: "testing" },
  { id: "woocommerce", status: "planned" },
];

export const INTEGRATION_STATUS: Record<IntegrationId, IntegrationStatus> = Object.fromEntries(
  INTEGRATION_ORDER.map((i) => [i.id, i.status]),
) as Record<IntegrationId, IntegrationStatus>;

/** The signature recipe is the same text in both languages: it is code. */
export const SIGNATURE_SNIPPET = `OrbitShelf-Signature: t=<seconds>,v1=<hex>

signed   = t + "." + rawBody
expected = HMAC-SHA256(secret, signed)

accept only if  v1 == expected
            and |now - t| <= 300 s`;

export const EMBED_SNIPPET = `<iframe
  src="<viewer link>"
  title="Product 3D"
  loading="lazy"
  style="width:100%;aspect-ratio:1;border:0"
></iframe>`;

export const API_PATHS = ["GET /api/v1/assets", "GET /api/v1/assets/{id}/file", "GET /api/v1/credits"];

export const MCP_TOOLS = [
  "list_models",
  "quote_generation",
  "create_generation",
  "get_generation",
  "list_assets",
  "export_asset",
  "get_credit_balance",
];

export const WEBHOOK_EVENTS = ["model.ready", "model.failed"];

type Item = {
  name: string;
  title: string;
  text: string;
  steps: string[];
  note?: string;
};

export type IntegrationsCopy = {
  meta: { title: string; description: string };
  hero: {
    pill: string;
    title: string;
    text: string;
    docs: string;
    create: string;
    diagramLabel: string;
    diagram: { model: string; embed: string; shopify: string; blender: string; api: string; mcp: string; woo: string };
  };
  status: Record<IntegrationStatus, string>;
  bento: { title: string; sub: string };
  howLabel: string;
  items: Record<IntegrationId, Item>;
  embedExtra: {
    sample: string;
    viewerAlt: string;
    snippetLabel: string;
    glbLine: string;
  };
  shopifyExtra: { flow: [string, string, string]; docsLink: string };
  apiExtra: { pathsLabel: string };
  mcpExtra: { toolsLabel: string; confirmLabel: string };
  signature: {
    tag: string;
    title: string;
    text: string;
    codeLabel: string;
    eventsLabel: string;
    notes: string[];
  };
  safety: {
    title: string;
    sub: string;
    points: { title: string; text: string }[];
  };
  after: {
    title: string;
    sub: string;
    items: { name: string; text: string }[];
  };
  faqTitle: string;
  faqs: { q: string; a: string }[];
  closing: { titleA: string; titleB: string; cta: string; note: string };
};

const es: IntegrationsCopy = {
  meta: {
    title: "Integraciones: visor embebible, Shopify, Blender, API y MCP",
    description:
      "Lleva tus modelos 3D a tu tienda, a Blender y a tus propias herramientas. Estado real de cada integración: disponible, en pruebas, próximamente o planeada.",
  },
  hero: {
    pill: "Integraciones",
    title: "Tu modelo, donde ya trabajas",
    text: "Un visor para tu web, exportación a GLB y una API para conectar el resto. Cada integración dice en qué estado está de verdad.",
    docs: "Ver la guía de GLB y Shopify",
    create: "Crear un modelo",
    diagramLabel: "Esquema de las seis primeras integraciones",
    diagram: { model: "Modelo", embed: "Visor web", shopify: "Shopify", blender: "Blender", api: "API", mcp: "MCP", woo: "WooCommerce" },
  },
  status: { available: "Disponible", testing: "En pruebas", soon: "Próximamente", planned: "Planeada" },
  bento: { title: "Las seis primeras", sub: "En este orden las vamos a construir y probar." },
  howLabel: "Cómo lo usarías",
  items: {
    embed: {
      name: "Visor web",
      title: "Muestra el modelo en tu página",
      text: "Pega un iframe y tus clientes giran el producto sin salir de tu web. También puedes descargar el GLB y subirlo donde tu plataforma lo acepte.",
      steps: [
        "Aprueba el modelo: sin tu aprobación no hay visor.",
        "Crea el enlace del visor en Embeds, dentro del panel.",
        "Pega el iframe en tu página. Si lo revocas, el visor deja de mostrarse.",
      ],
      note: "El enlace solo vive mientras el modelo esté aprobado y no revocado.",
    },
    shopify: {
      name: "Shopify",
      title: "Del modelo aprobado al producto",
      text: "Shopify acepta GLB como media 3D del producto. Publicar con un clic está construido, pero solo se ha probado contra una tienda simulada.",
      steps: [
        "Conectas tu tienda desde Ajustes.",
        "Eliges un modelo aprobado y el producto.",
        "Confirmas tú. Nada se publica solo y solo se agrega media: no se tocan las imágenes del producto.",
      ],
      note: "Que el visor 3D aparezca depende del tema de tu tienda. Hasta probarlo en una tienda real, no lo damos por disponible.",
    },
    blender: {
      name: "Blender",
      title: "Importa tus modelos a Blender",
      text: "Un complemento que trae tus modelos a la escena con su origen y su estado de revisión. Solo importa: no genera ni sube nada.",
      steps: [
        "Instala el archivo orbitshelf_blender.py desde Preferencias, en Add-ons (Blender 4.2 o superior).",
        "Pon la dirección del sitio y un token con permiso de solo lectura de modelos.",
        "Importa desde la pestaña OrbitShelf y revisa la orientación y la escala.",
      ],
      note: "Nunca se ha ejecutado dentro de Blender. Solo se comprobó que el archivo compila.",
    },
    api: {
      name: "API pública",
      title: "Conecta tus propios sistemas",
      text: "La API /v1 lista tus modelos, descarga el GLB y consulta el saldo. Cada token tiene permisos acotados y los avisos llegan por webhook firmado.",
      steps: [
        "Crea un token en API, dentro del panel, con solo los permisos que necesites.",
        "Llama a la API desde tu servidor o tu script.",
        "Registra una dirección https para recibir model.ready y model.failed.",
      ],
      note: "Iniciar generaciones por API está apagado por ahora.",
    },
    mcp: {
      name: "MCP",
      title: "Deja que tu asistente consulte tus modelos",
      text: "Un servidor MCP con herramientas para listar, cotizar, crear con confirmación explícita y leer modelos. Funciona con la misma API y los mismos permisos de tu token.",
      steps: [
        "Toma el archivo orbitshelf-mcp.mjs de la carpeta integrations/mcp y apúntalo a tu sitio con tu token (requiere Node 22 o superior).",
        "Añádelo a tu cliente MCP.",
        "Para crear algo que gasta saldo, el cliente debe pedirte confirmación antes.",
      ],
      note: "Probado solo con nuestro propio cliente de prueba, todavía no con clientes reales como Claude Desktop.",
    },
    woocommerce: {
      name: "WooCommerce",
      title: "Después de Shopify",
      text: "Está en el plan, pero sin construir. Lo haremos cuando haya tiendas que lo pidan.",
      steps: ["Mientras tanto, el visor embebible es un iframe: pégalo donde tu sitio acepte HTML."],
    },
  },
  embedExtra: {
    sample: "Muestra de demostración. Así se vería el visor en una página; no es un resultado de OrbitShelf.",
    viewerAlt: "Muestra de demostración: un jarrón en 3D que se puede girar",
    snippetLabel: "Ejemplo del iframe",
    glbLine: "También: exporta GLB con materiales y texturas.",
  },
  shopifyExtra: { flow: ["Modelo aprobado", "Tu tienda", "Media 3D del producto"], docsLink: "Cómo exportar GLB y subirlo a Shopify" },
  apiExtra: { pathsLabel: "Algunas rutas de lectura" },
  mcpExtra: { toolsLabel: "Herramientas", confirmLabel: "Pide confirmación" },
  signature: {
    tag: "Webhooks firmados",
    title: "Comprueba que el aviso es nuestro",
    text: "Cada envío trae una firma HMAC-SHA256 del cuerpo sin modificar. Si no coincide, o es de hace más de 5 minutos, recházalo.",
    codeLabel: "Receta de la firma, desplazable en pantallas pequeñas",
    eventsLabel: "Eventos",
    notes: [
      "Responde con un código 2xx. Si no, reintentamos hasta 6 veces durante unas 9 horas, así que el mismo id puede llegar más de una vez.",
      "No seguimos redirecciones ni aceptamos direcciones privadas.",
      "Solo probado contra un receptor local.",
    ],
  },
  safety: {
    title: "Así lo mantenemos seguro",
    sub: "Las integraciones leen tus modelos. Gastar saldo exige tu confirmación y ninguna publica en tiendas por su cuenta.",
    points: [
      { title: "Tokens con permisos", text: "Cada token hace solo lo que sus permisos permiten. El complemento de Blender solo necesita leer modelos." },
      { title: "Secretos que se muestran una vez", text: "El secreto de un token o de un webhook aparece al crearlo. Guárdalo entonces." },
      { title: "Webhooks firmados", text: "HMAC-SHA256, con tolerancia de 5 minutos, para que puedas rechazar envíos falsos o repetidos tarde." },
      { title: "El MCP no compra ni publica", text: "No tiene herramientas para comprar saldo ni para publicar en tiendas." },
      { title: "Crear exige confirmación", text: "Una generación gasta saldo. Solo arranca si el cliente envía confirm: true después de que tú aceptes el costo." },
    ],
  },
  after: {
    title: "Después de validar demanda",
    sub: "No están construidas. Las haremos si hay equipos que las necesiten.",
    items: [
      { name: "Unity", text: "Un complemento propio solo si hay demanda. Hoy puedes exportar GLB y llevarlo a tu motor." },
      { name: "Unreal", text: "Igual que Unity: depende de la demanda. La exportación a GLB ya existe." },
    ],
  },
  faqTitle: "Preguntas sobre integraciones",
  faqs: [
    {
      q: "¿Puedo publicar en Shopify con un clic hoy?",
      a: "Todavía no. El flujo está construido y probado contra una tienda simulada, pero no en una tienda real. Hoy puedes exportar el GLB y subirlo como media 3D del producto, o usar el visor embebible. Que se vea en tu tienda depende del tema.",
    },
    {
      q: "¿La API genera modelos?",
      a: "Por ahora no. Iniciar generaciones por API está apagado. Sí puedes listar tus modelos, descargar el GLB y consultar el saldo.",
    },
    {
      q: "¿Funciona con Claude Desktop u otros clientes MCP?",
      a: "No lo sabemos todavía. Las herramientas y el protocolo se probaron con un cliente de prueba propio, no con clientes reales. Como la creación usa la misma API, sigue el mismo interruptor de generación.",
    },
    {
      q: "¿El complemento de Blender exporta o genera?",
      a: "No. Solo importa tus modelos, y nunca se ha ejecutado dentro de Blender. Revisa la orientación y la escala de lo que importes. Generar desde Blender dependerá de la demanda.",
    },
    {
      q: "¿Qué pasa si revoco el visor?",
      a: "El iframe deja de mostrar el modelo. El enlace solo funciona mientras el modelo esté aprobado y no revocado.",
    },
    {
      q: "¿Cuándo llegan WooCommerce, Unity y Unreal?",
      a: "No hay fecha. Están planeadas y las construiremos según la demanda. Si las necesitas, dínoslo.",
    },
  ],
  closing: {
    titleA: "Crea el modelo.",
    titleB: "Llévalo a tu flujo.",
    cta: "Crear un modelo",
    note: "El estado de cada integración está arriba. Lo que no está probado, no lo prometemos.",
  },
};

const en: IntegrationsCopy = {
  meta: {
    title: "Integrations: embeddable viewer, Shopify, Blender, API and MCP",
    description:
      "Take your 3D models to your store, to Blender and to your own tools. The real status of each integration: available, in testing, coming soon or planned.",
  },
  hero: {
    pill: "Integrations",
    title: "Your model, where you already work",
    text: "A viewer for your site, GLB export and an API to connect the rest. Each integration says what state it is really in.",
    docs: "Read the GLB and Shopify guide",
    create: "Create a model",
    diagramLabel: "Diagram of the first six integrations",
    diagram: { model: "Model", embed: "Web embed", shopify: "Shopify", blender: "Blender", api: "API", mcp: "MCP", woo: "WooCommerce" },
  },
  status: { available: "Available", testing: "In testing", soon: "Coming soon", planned: "Planned" },
  bento: { title: "The first six", sub: "This is the order we build and test them in." },
  howLabel: "How you would use it",
  items: {
    embed: {
      name: "Web embed",
      title: "Show the model on your page",
      text: "Paste an iframe and your customers spin the product without leaving your site. You can also download the GLB and upload it wherever your platform accepts it.",
      steps: [
        "Approve the model: without your approval there is no viewer.",
        "Create the viewer link in Embeds, inside the dashboard.",
        "Paste the iframe into your page. If you revoke it, the viewer stops showing.",
      ],
      note: "The link only lives while the model is approved and not revoked.",
    },
    shopify: {
      name: "Shopify",
      title: "From approved model to product",
      text: "Shopify accepts GLB as 3D product media. One-click publishing is built, but it has only been tested against a mock store.",
      steps: [
        "You connect your store from Settings.",
        "You pick an approved model and the product.",
        "You confirm. Nothing publishes on its own and it only adds media: your product images are not touched.",
      ],
      note: "Whether the 3D viewer shows up depends on your store theme. Until it is tried on a real store, we do not call it available.",
    },
    blender: {
      name: "Blender",
      title: "Import your models into Blender",
      text: "An add-on that brings your models into the scene with their origin and review state. It only imports: it does not generate or upload anything.",
      steps: [
        "Install the orbitshelf_blender.py file from Preferences, under Add-ons (Blender 4.2 or later).",
        "Enter the site address and a token with read-only access to models.",
        "Import from the OrbitShelf tab and check orientation and scale.",
      ],
      note: "It has never been run inside Blender. We only checked that the file compiles.",
    },
    api: {
      name: "Public API",
      title: "Connect your own systems",
      text: "The /v1 API lists your models, downloads the GLB and reads your balance. Each token has narrow scopes and notices arrive as signed webhooks.",
      steps: [
        "Create a token under API in the dashboard, with only the scopes you need.",
        "Call the API from your server or script.",
        "Register an https address to receive model.ready and model.failed.",
      ],
      note: "Starting generations through the API is switched off for now.",
    },
    mcp: {
      name: "MCP",
      title: "Let your assistant look up your models",
      text: "An MCP server with tools to list, quote, create with explicit confirmation and read models. It uses the same API and the same permissions as your token.",
      steps: [
        "Take the orbitshelf-mcp.mjs file from the integrations/mcp folder and point it at your site with your token (needs Node 22 or later).",
        "Add it to your MCP client.",
        "To create something that spends credits, the client has to ask you to confirm first.",
      ],
      note: "Tested only with our own test client, not yet with real clients such as Claude Desktop.",
    },
    woocommerce: {
      name: "WooCommerce",
      title: "After Shopify",
      text: "It is in the plan but not built. We will build it when stores ask for it.",
      steps: ["Meanwhile, the embeddable viewer is an iframe: paste it wherever your site accepts HTML."],
    },
  },
  embedExtra: {
    sample: "Demo sample. This is how the viewer would look on a page; it is not an OrbitShelf result.",
    viewerAlt: "Demo sample: a 3D vase you can rotate",
    snippetLabel: "Iframe example",
    glbLine: "Also: export GLB with materials and textures.",
  },
  shopifyExtra: { flow: ["Approved model", "Your store", "3D product media"], docsLink: "How to export GLB and upload it to Shopify" },
  apiExtra: { pathsLabel: "Some read routes" },
  mcpExtra: { toolsLabel: "Tools", confirmLabel: "Asks for confirmation" },
  signature: {
    tag: "Signed webhooks",
    title: "Check that the notice is ours",
    text: "Every delivery carries an HMAC-SHA256 signature of the unmodified body. If it does not match, or it is older than 5 minutes, reject it.",
    codeLabel: "Signature recipe, scrollable on small screens",
    eventsLabel: "Events",
    notes: [
      "Reply with a 2xx code. If not, we retry up to 6 times over about 9 hours, so the same id can arrive more than once.",
      "We do not follow redirects or accept private addresses.",
      "Only tested against a local receiver.",
    ],
  },
  safety: {
    title: "How we keep it safe",
    sub: "Integrations read your models. Spending credits needs your confirmation and none of them publishes to a store on its own.",
    points: [
      { title: "Scoped tokens", text: "Each token does only what its scopes allow. The Blender add-on only needs to read models." },
      { title: "Secrets shown once", text: "A token or webhook secret appears when you create it. Store it then." },
      { title: "Signed webhooks", text: "HMAC-SHA256 with a 5 minute tolerance, so you can reject forged or very late deliveries." },
      { title: "MCP cannot buy or publish", text: "It has no tools to buy credits or to publish to stores." },
      { title: "Creating needs confirmation", text: "A generation spends credits. It only starts when the client sends confirm: true after you agree to the cost." },
    ],
  },
  after: {
    title: "After we validate demand",
    sub: "They are not built. We will do them if teams need them.",
    items: [
      { name: "Unity", text: "A dedicated plugin only if there is demand. Today you can export GLB and take it to your engine." },
      { name: "Unreal", text: "Same as Unity: it depends on demand. GLB export already exists." },
    ],
  },
  faqTitle: "Questions about integrations",
  faqs: [
    {
      q: "Can I publish to Shopify with one click today?",
      a: "Not yet. The flow is built and tested against a mock store, but not on a real one. Today you can export the GLB and upload it as 3D product media, or use the embeddable viewer. Whether it shows in your store depends on the theme.",
    },
    {
      q: "Does the API generate models?",
      a: "Not for now. Starting generations through the API is switched off. You can list your models, download the GLB and read your balance.",
    },
    {
      q: "Does it work with Claude Desktop or other MCP clients?",
      a: "We do not know yet. The tools and protocol were tested with our own test client, not with real clients. Creation goes through the same API, so it follows the same generation switch.",
    },
    {
      q: "Does the Blender add-on export or generate?",
      a: "No. It only imports your models, and it has never been run inside Blender. Check the orientation and scale of what you import. Generating from Blender will depend on demand.",
    },
    {
      q: "What happens if I revoke the viewer?",
      a: "The iframe stops showing the model. The link only works while the model is approved and not revoked.",
    },
    {
      q: "When do WooCommerce, Unity and Unreal arrive?",
      a: "There is no date. They are planned and we will build them based on demand. If you need one, tell us.",
    },
  ],
  closing: {
    titleA: "Create the model.",
    titleB: "Take it into your workflow.",
    cta: "Create a model",
    note: "Each integration's status is above. What is not tested, we do not promise.",
  },
};

export const integrationsCopy: Record<Locale, IntegrationsCopy> = { es, en };
