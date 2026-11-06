import type { Dictionary } from "./dictionaries/en";
import type { Locale } from "@/lib/types";

/**
 * The dashboard strings that talk about "attempts" are written for the flat-attempts unit, which only exists for tests and single-engine pilots.
 * With the default unit (credits) the pages use `forBilling`, which swaps in the credit wording below. Same keys in both languages.
 * An entry of `null` inside an array leaves that item as it is.
 */
type Patch<T> = T extends (infer U)[] ? (Patch<U> | null)[] : T extends object ? { [K in keyof T]?: Patch<T[K]> } : T;

const CREDITS: Record<Locale, Patch<Dictionary["dash"]>> = {
  en: {
    profile: { shortcuts: { usage: { text: "Your credits and their history." } } },
    explore: { tools: [null, null, { text: "Upload a model you already have. Uses no credits." }, null, null, { text: "Credits used and history." }] },
    failures: {
      engine_unavailable: "This engine is not available right now. No credits were deducted.",
      engine_unsupported: "This engine does not support these options. No credits were deducted.",
      quote_expired: "The cost shown has expired. Review it and try again. No credits were deducted.",
      quote_mismatch: "The cost changed since you saw it. Review it and try again. No credits were deducted.",
      payment_required: "The generation service could not take the job right now. Nothing was started and your credits were returned.",
      provider_auth: "The server could not sign in to the generation service. Your credits were returned.",
      rate_limited: "The generation service is limiting concurrent jobs. Wait for a running job to finish, then retry. Your credits were returned.",
      provider_rejected: "The generation service rejected the request. Your credits were returned.",
      provider_error: "The generation service reported an error. Your credits were returned automatically.",
      insufficient_attempts: "You do not have enough credits for this job.",
      billing_unsafe: "Generation is paused because of a server billing setting. No credits were deducted.",
    },
    overview: {
      subtitle: "Your models, review queue and credits at a glance.",
      stats: { attempts: "Credits left" },
      attemptsNote: "Starting credits for this workspace. Nothing is purchased or charged.",
    },
    create: {
      sourceImportText: "Upload a model you already have. It uses no credits. It stays marked as imported.",
      attemptsLeft: "Credits left: {n}",
      confirmPaid: "I understand this starts a paid generation job and uses credits from my balance.",
    },
    detail: { attemptsLabel: "Credits used / returned" },
    trash: { note: "Models are kept for 30 days and then deleted for good. The credit record is not erased." },
    usage: {
      subtitle: "Credits, jobs and history. Demo samples cost nothing and are listed separately.",
      balance: "Credits left",
      granted: "Starting credits",
      debited: "Used",
      refunded: "Returned",
      capNote: "Starting credits are for trying the product. They are not a purchased balance.",
      ledgerTitle: "Credit ledger",
      columns: { attempts: "Credits used / returned" },
      reasons: { local_cap_grant: "Starting credits", job_refund: "Provider error, credits returned" },
    },
    help: {
      items: [
        null,
        { a: "Open the model: the job panel shows the message and whether your credits were returned." },
        { q: "What does a model cost?", a: "The cost in credits is shown before you generate. It is reserved when the job starts. Verified provider errors return the credits automatically." },
      ],
    },
  },
  es: {
    profile: { shortcuts: { usage: { text: "Tus créditos y su historial." } } },
    explore: { tools: [null, null, { text: "Sube un modelo que ya tengas. No usa créditos." }, null, null, { text: "Créditos usados e historial." }] },
    failures: {
      engine_unavailable: "Este motor no está disponible ahora. No se descontaron créditos.",
      engine_unsupported: "Este motor no admite estas opciones. No se descontaron créditos.",
      quote_expired: "El costo mostrado venció. Revísalo e inténtalo de nuevo. No se descontaron créditos.",
      quote_mismatch: "El costo cambió desde que lo viste. Revísalo e inténtalo de nuevo. No se descontaron créditos.",
      payment_required: "El servicio de generación no pudo tomar el trabajo ahora. No se inició nada y tus créditos se devolvieron.",
      provider_auth: "El servidor no pudo iniciar sesión en el servicio de generación. Tus créditos se devolvieron.",
      rate_limited: "El servicio de generación limita los trabajos simultáneos. Espera a que termine uno y reintenta. Tus créditos se devolvieron.",
      provider_rejected: "El servicio de generación rechazó la solicitud. Tus créditos se devolvieron.",
      provider_error: "El servicio de generación informó un error. Tus créditos se devolvieron automáticamente.",
      insufficient_attempts: "No tienes créditos suficientes para este trabajo.",
      billing_unsafe: "La generación está en pausa por un ajuste de facturación del servidor. No se descontaron créditos.",
    },
    overview: {
      subtitle: "Tus modelos, la cola de revisión y tus créditos de un vistazo.",
      stats: { attempts: "Créditos restantes" },
      attemptsNote: "Créditos iniciales de este espacio de trabajo. No se compra ni se cobra nada.",
    },
    create: {
      sourceImportText: "Sube un modelo que ya tengas. No usa créditos. Queda marcado como importado.",
      attemptsLeft: "Créditos restantes: {n}",
      confirmPaid: "Entiendo que esto inicia un trabajo de generación de pago y usa créditos de mi saldo.",
    },
    detail: { attemptsLabel: "Créditos usados / devueltos" },
    trash: { note: "Los modelos se guardan 30 días y luego se eliminan para siempre. El registro de créditos no se borra." },
    usage: {
      subtitle: "Créditos, trabajos e historial. Las muestras de demostración no cuestan nada y se listan aparte.",
      balance: "Créditos restantes",
      granted: "Créditos iniciales",
      debited: "Usados",
      refunded: "Devueltos",
      capNote: "Los créditos iniciales sirven para probar el producto. No son un saldo comprado.",
      ledgerTitle: "Registro de créditos",
      columns: { attempts: "Créditos usados / devueltos" },
      reasons: { local_cap_grant: "Créditos iniciales", job_refund: "Error del proveedor, créditos devueltos" },
    },
    help: {
      items: [
        null,
        { a: "Abre el modelo: el panel del trabajo muestra el mensaje y si tus créditos se devolvieron." },
        { q: "¿Cuánto cuesta un modelo?", a: "El costo en créditos se muestra antes de generar. Se reserva cuando el trabajo empieza. Los errores verificados del proveedor devuelven los créditos automáticamente." },
      ],
    },
  },
};

const isPlain = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function merge(base: unknown, patch: unknown): unknown {
  if (Array.isArray(base) && Array.isArray(patch)) return base.map((item, i) => (patch[i] == null ? item : merge(item, patch[i])));
  if (isPlain(base) && isPlain(patch)) {
    const out: Record<string, unknown> = { ...base };
    for (const [k, v] of Object.entries(patch)) out[k] = k in base ? merge(base[k], v) : v;
    return out;
  }
  return patch === undefined ? base : patch;
}

/** The dictionary with the dashboard worded for the active billing unit. Attempts keep the strings as written. */
export function forBilling(dict: Dictionary, locale: Locale, unit: "attempts" | "credits"): Dictionary {
  if (unit === "attempts") return dict;
  return { ...dict, dash: merge(dict.dash, CREDITS[locale]) as Dictionary["dash"] };
}
