import type { Locale } from "@/lib/types";

/**
 * Copy for the pricing page and the plan cards that does not live in the dictionaries.
 * Plain data, no server-only imports: the plan cards (a client component) read it too.
 * Plan names, prices and credits come from PLAN_TIERS; plan features and planned items come from dict.pricing.
 */

export type PricingExtra = {
  meta: { title: string; description: string };
  plansHeading: string;
  sliderTitle: string;
  /** Uses {low} and {high}. An estimate, never a promise. */
  modelsLine: string;
  /** One line per plan id. */
  blurbs: Record<string, string>;
  rangeJoin: string;
  from: string;
  credits: {
    title: string;
    sub: string;
    renew: { pill: string; title: string; text: string; steps: [string, string, string] };
    refund: { title: string; text: string };
    quote: { title: string; text: string; steps: [string, string, string] };
    topups: { pill: string; title: string; text: string; credits: string };
  };
  table: {
    title: string;
    sub: string;
    caption: string;
    feature: string;
    included: string;
    notIncluded: string;
    planned: string;
    notPlanned: string;
    groupCredits: string;
    groupNow: string;
    groupPlanned: string;
    price: string;
    monthlyCredits: string;
    note: string;
    now: string[];
  };
  faqTitle: string;
  faq: { q: string; a: string }[];
  closing: { titleA: string; titleB: string; note: string };
};

/** Top-ups are a proposal, not on sale. Each one stays under the plan margin floor (see credits.ts). */
export const TOP_UPS: { usd: number; credits: number }[] = [
  { usd: 15, credits: 200 },
  { usd: 40, credits: 550 },
  { usd: 100, credits: 1500 },
];

const es: PricingExtra = {
  meta: {
    title: "Precios: planes por créditos en pruebas",
    description: "Planes propuestos para pruebas: créditos mensuales y recargas planificadas. El pago no está activo.",
  },
  plansHeading: "Planes",
  sliderTitle: "Créditos al mes",
  modelsLine: "Estimación: entre {low} y {high} modelos al mes, según el motor y las opciones.",
  blurbs: {
    starter: "Para probar el flujo con unos pocos productos.",
    creator: "Para creadores y tiendas pequeñas.",
    commerce: "Para tiendas y agencias que suben productos cada mes.",
    studio: "Para estudios y equipos con mucho volumen.",
  },
  rangeJoin: " a ",
  from: "desde",
  credits: {
    title: "Cómo funcionan los créditos",
    sub: "Pocas reglas, todas a la vista antes de generar.",
    renew: {
      pill: "Cada mes",
      title: "Los créditos se renuevan cada mes",
      text: "Lo que no uses no pasa al mes siguiente. Si necesitas más, mueve la barra de tu plan para tener más créditos mensuales.",
      steps: ["Créditos del plan", "Tus modelos", "Se renuevan"],
    },
    refund: {
      title: "Reembolso si el proveedor rechaza",
      text: "Si el proveedor rechaza el trabajo, los créditos vuelven a tu saldo. Un resultado que no te convence no cuenta como error del proveedor.",
    },
    quote: {
      title: "Ves el costo antes de generar",
      text: "La cotización muestra los créditos antes de que empiece el trabajo.",
      steps: ["Fotos o texto", "Costo en créditos", "Modelo"],
    },
    topups: {
      pill: "Planificado",
      title: "Recargas sin suscripción",
      text: "Si un mes te quedas corto, podrás sumar créditos sueltos sin cambiar de plan. Son montos propuestos y el pago aún no está activo.",
      credits: "créditos",
    },
  },
  table: {
    title: "Qué incluye cada plan",
    sub: "Lo que existe hoy y lo que está planificado, por separado.",
    caption: "Comparación de los planes Starter, Creator, Commerce y Studio",
    feature: "Función",
    included: "Incluido",
    notIncluded: "No incluido",
    planned: "Planificado",
    notPlanned: "Sin definir para este plan",
    groupCredits: "Precio y créditos",
    groupNow: "Incluido hoy",
    groupPlanned: "Planificado, aún no disponible",
    price: "Precio al mes",
    monthlyCredits: "Créditos al mes",
    note: "Los planes y los precios son una propuesta en pruebas. Las funciones planificadas no forman parte de la versión actual. Un guion significa que todavía no está definido para ese plan.",
    now: [
      "Crear desde 1 a 4 fotos del mismo producto, o desde texto",
      "Costo en créditos visible antes de generar",
      "Revisión de cinco puntos y aprobación manual",
      "Vista de malla y diagnósticos del modelo",
      "Optimizar creando una versión nueva, y comparar versiones",
      "Importar un GLB existente para analizarlo",
      "Exportación GLB, OBJ y STL",
      "Biblioteca con etiquetas, proyectos y favoritos",
      "Visor para tu sitio mientras el modelo esté aprobado",
      "Historial de trabajos en CSV",
    ],
  },
  faqTitle: "Preguntas frecuentes",
  faq: [
    {
      q: "¿Puedo pagar un plan ya?",
      a: "No. El pago no está activo y todavía no se puede comprar nada. Los planes son una propuesta en pruebas y los precios pueden cambiar antes de activar los cobros.",
    },
    {
      q: "¿Por qué no hay plan ilimitado?",
      a: "Cada modelo que se genera tiene un costo real con el proveedor del motor. Un plan ilimitado sería una promesa que no podemos sostener, así que trabajamos con créditos mensuales y te mostramos el costo antes de generar.",
    },
    {
      q: "¿Por qué no hay plan anual?",
      a: "Porque los precios todavía son una hipótesis en pruebas. Preferimos que los planes sean mensuales mientras los validamos, en lugar de comprometerte por un año a algo que puede cambiar.",
    },
    {
      q: "¿Qué pasa con los créditos que no uso?",
      a: "Los créditos del plan se renuevan cada mes y no se acumulan. Si un mes necesitas más, mueve la barra de tu plan para tener más créditos mensuales.",
    },
    {
      q: "¿Cuántos modelos puedo hacer con mis créditos?",
      a: "Depende del motor y de las opciones que elijas. El número de cada plan es una estimación; el costo exacto aparece en la cotización antes de generar.",
    },
    {
      q: "¿Qué pasa si el proveedor rechaza un trabajo?",
      a: "Los créditos se reembolsan. Un resultado visual imperfecto no es un error del proveedor, así que no se reembolsa de forma automática, y los reintentos son limitados.",
    },
    {
      q: "¿Con qué motores se gastan los créditos?",
      a: "Hoy hay un solo motor de IA activo en el piloto. Habrá más motores después de probarlos, y el costo de cada uno se verá en la cotización.",
    },
    {
      q: "¿Los precios incluyen impuestos?",
      a: "No. Los precios están en USD, sin impuestos ni comisiones de pago.",
    },
  ],
  closing: {
    titleA: "Prueba con un producto,",
    titleB: "mira el costo antes de generar.",
    note: "El pago no está activo: los planes son una propuesta en pruebas.",
  },
};

const en: PricingExtra = {
  meta: {
    title: "Pricing: credit plans under test",
    description: "Proposed plans under test: monthly credits and planned top-ups. Checkout is not active.",
  },
  plansHeading: "Plans",
  sliderTitle: "Monthly credits",
  modelsLine: "Estimate: about {low} to {high} models a month, depending on the engine and options.",
  blurbs: {
    starter: "To try the flow with a handful of products.",
    creator: "For creators and small stores.",
    commerce: "For stores and agencies adding products every month.",
    studio: "For studios and teams with high volume.",
  },
  rangeJoin: " to ",
  from: "from",
  credits: {
    title: "How credits work",
    sub: "A few rules, all visible before you generate.",
    renew: {
      pill: "Every month",
      title: "Credits renew every month",
      text: "What you do not use does not carry over to the next month. If you need more, move your plan slider to get more credits each month.",
      steps: ["Plan credits", "Your models", "They renew"],
    },
    refund: {
      title: "Refund if the provider refuses",
      text: "If the provider refuses the job, the credits go back to your balance. A result you are not happy with does not count as a provider error.",
    },
    quote: {
      title: "See the cost before you generate",
      text: "The quote shows the credits before the job starts.",
      steps: ["Photos or text", "Cost in credits", "Model"],
    },
    topups: {
      pill: "Planned",
      title: "Top-ups without a subscription",
      text: "If you run short in a month, you will be able to add loose credits without changing plan. These are proposed amounts and checkout is not active yet.",
      credits: "credits",
    },
  },
  table: {
    title: "What each plan includes",
    sub: "What exists today and what is planned, kept apart.",
    caption: "Comparison of the Starter, Creator, Commerce and Studio plans",
    feature: "Feature",
    included: "Included",
    notIncluded: "Not included",
    planned: "Planned",
    notPlanned: "Not defined for this plan",
    groupCredits: "Price and credits",
    groupNow: "Included today",
    groupPlanned: "Planned, not available yet",
    price: "Price per month",
    monthlyCredits: "Credits a month",
    note: "Plans and prices are a proposal under test. Planned features are not part of the current build. A dash means it is not defined for that plan yet.",
    now: [
      "Create from 1 to 4 photos of the same product, or from text",
      "Cost in credits shown before generating",
      "Five-point review and manual approval",
      "Mesh view and model diagnostics",
      "Optimize into a new version, and compare versions",
      "Import an existing GLB to analyze it",
      "GLB, OBJ and STL export",
      "Library with tags, projects and favorites",
      "Viewer for your site while the model is approved",
      "Job history as CSV",
    ],
  },
  faqTitle: "Frequently asked questions",
  faq: [
    {
      q: "Can I pay for a plan yet?",
      a: "No. Checkout is not active and nothing can be purchased yet. The plans are a proposal under test, and prices may change before billing is turned on.",
    },
    {
      q: "Why is there no unlimited plan?",
      a: "Every model that is generated has a real cost with the engine provider. An unlimited plan would be a promise we cannot keep, so we work with monthly credits and show you the cost before you generate.",
    },
    {
      q: "Why is there no annual plan?",
      a: "Because the prices are still a hypothesis under test. We prefer monthly plans while we validate them, rather than tying you to a year of something that may change.",
    },
    {
      q: "What happens to credits I do not use?",
      a: "Plan credits renew each month and do not accumulate. If you need more in a month, move your plan slider to get more credits each month.",
    },
    {
      q: "How many models can I make with my credits?",
      a: "It depends on the engine and the options you pick. The number on each plan is an estimate; the exact cost appears in the quote before you generate.",
    },
    {
      q: "What happens if the provider refuses a job?",
      a: "The credits are refunded. An imperfect visual result is not a provider error, so it is not refunded automatically, and retries are limited.",
    },
    {
      q: "Which engines do credits go to?",
      a: "Today only one AI engine is switched on in the pilot. More engines come after testing, and the cost of each one will show in the quote.",
    },
    {
      q: "Do the prices include taxes?",
      a: "No. Prices are in USD, excluding taxes and payment fees.",
    },
  ],
  closing: {
    titleA: "Try one product,",
    titleB: "see the cost before you generate.",
    note: "Checkout is not active: the plans are a proposal under test.",
  },
};

export const PRICING_EXTRA: Record<Locale, PricingExtra> = { es, en };
