/**
 * Customer and revenue projection by acquisition channel. Every input below is an ASSUMPTION, not data: there are no customers yet.
 * Run: npx tsx --conditions=react-server scripts/project-customers.ts   (writes docs/PROYECCION_CLIENTES.md and .csv)
 * Month 1 is the first month of sales (planned: December 2026). Replace the inputs with measured numbers as soon as they exist.
 */
import { writeFileSync } from "node:fs";
import { ASSUMED_PAYMENT_FEE, CREDIT_USD, PLAN_TIERS } from "../src/lib/credits";

type Paid = { budget: (m: number) => number; cpc: number; visitToSignup: number; signupToPaid: number };
type Scenario = {
  id: string;
  label: string;
  /** Share of customers lost each month. */
  churn: number;
  /** Share of the credits in the plan that customers use on average (unused credits are margin). */
  usage: number;
  /** Share of new customers by plan, at the plan's base price. */
  mix: Record<string, number>;
  /** New paying customers per month from direct outreach, partners and a done-for-you first catalogue. Limited by the founder's time. */
  outreach: (m: number) => number;
  /** From blog, SEO and guides. Nothing for two months, then it ramps linearly. */
  content: (m: number) => number;
  /** From TikTok / Reels / Shorts and communities. */
  social: (m: number) => number;
  paid: Paid;
};

const mix = (starter: number, creator: number, commerce: number, studio: number) => ({ starter, creator, commerce, studio });
const ramp = (start: number, perMonth: number, cap: number) => (m: number) => Math.min(cap, start + perMonth * (m - 1));
const linearFrom = (firstMonth: number, slope: number) => (m: number) => (m < firstMonth ? 0 : slope * (m - firstMonth + 1));
const fromMonth = (firstMonth: number, usd: number) => (m: number) => (m < firstMonth ? 0 : usd);

const SCENARIOS: Scenario[] = [
  {
    id: "low",
    label: "Pesimista",
    churn: 0.1,
    usage: 0.5,
    mix: mix(0.6, 0.3, 0.09, 0.01),
    outreach: ramp(1, 0.25, 3),
    content: linearFrom(3, 0.3),
    social: ramp(0.5, 0.1, 1.5),
    paid: { budget: fromMonth(3, 300), cpc: 2.0, visitToSignup: 0.02, signupToPaid: 0.05 },
  },
  {
    id: "base",
    label: "Realista",
    churn: 0.07,
    usage: 0.4,
    mix: mix(0.5, 0.33, 0.14, 0.03),
    outreach: ramp(1.5, 0.4, 6),
    content: linearFrom(3, 0.6),
    social: ramp(1, 0.25, 3),
    paid: { budget: fromMonth(3, 500), cpc: 1.2, visitToSignup: 0.03, signupToPaid: 0.08 },
  },
  {
    id: "high",
    label: "Optimista",
    churn: 0.05,
    usage: 0.35,
    mix: mix(0.4, 0.35, 0.2, 0.05),
    outreach: ramp(3, 0.8, 12),
    content: linearFrom(3, 1.5),
    social: ramp(2.5, 0.6, 8),
    paid: { budget: fromMonth(3, 1500), cpc: 0.8, visitToSignup: 0.04, signupToPaid: 0.1 },
  },
];

/** Cost to win a customer outside paid ads, without the founder's time: demo credits, editing tools, boosts, small freelance help. */
const CAC_OTHER = { outreach: 30, content: 25, social: 20 };
/** Fixed monthly costs that are not tied to credits: hosting, database, email, domain, tools. A guess to be replaced with invoices. */
const FIXED_BASE_USD = 150;
/** Storage, egress, support and tooling that grow with customers. Unmetered today, so this is a guess too. */
const PER_CUSTOMER_USD = 1.5;
/** One-off cost before the first sale: engine tests and the first renders. */
const LAUNCH_COST_USD = 60;
const MONTHS = 12;
const SHOW = [3, 4, 6, 8, 10, 12];

const base = Object.fromEntries(PLAN_TIERS.map((t) => [t.id, t.steps[0]]));
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const paidCac = (p: Paid) => p.cpc / (p.visitToSignup * p.signupToPaid);

/** Monthly profit left by one customer of the scenario's mix, before the cost of winning it. */
function netPerCustomer(s: Scenario) {
  let net = 0;
  for (const [id, share] of Object.entries(s.mix)) {
    const p = base[id];
    net += share * (p.priceUsd - p.credits * s.usage * CREDIT_USD - (p.priceUsd * ASSUMED_PAYMENT_FEE.pct + ASSUMED_PAYMENT_FEE.fixedUsd) - PER_CUSTOMER_USD);
  }
  return net;
}

type Row = { month: number; added: number; byChannel: Record<string, number>; customers: number; mrr: number; variable: number; fees: number; fixed: number; marketing: number; net: number; cumulative: number };

function run(s: Scenario): Row[] {
  const rows: Row[] = [];
  let customers = 0;
  let cumulative = -LAUNCH_COST_USD;
  for (let m = 1; m <= MONTHS; m++) {
    const spend = s.paid.budget(m);
    const byChannel = { outreach: s.outreach(m), content: s.content(m), social: s.social(m), paid: spend / paidCac(s.paid) };
    const added = Object.values(byChannel).reduce((a, b) => a + b, 0);
    customers = customers * (1 - s.churn) + added;
    let mrr = 0, variable = 0, fees = 0;
    for (const [id, share] of Object.entries(s.mix)) {
      const n = customers * share;
      const plan = base[id];
      mrr += n * plan.priceUsd;
      variable += n * plan.credits * s.usage * CREDIT_USD;
      fees += n * (plan.priceUsd * ASSUMED_PAYMENT_FEE.pct + ASSUMED_PAYMENT_FEE.fixedUsd);
    }
    const fixed = FIXED_BASE_USD + PER_CUSTOMER_USD * customers;
    const marketing = byChannel.outreach * CAC_OTHER.outreach + byChannel.content * CAC_OTHER.content + byChannel.social * CAC_OTHER.social + spend;
    const net = mrr - variable - fees - fixed - marketing;
    cumulative += net;
    rows.push({ month: m, added, byChannel, customers, mrr, variable, fees, fixed, marketing, net, cumulative });
  }
  return rows;
}

const MONTH_NAME = ["dic 2026", "ene 2027", "feb 2027", "mar 2027", "abr 2027", "may 2027", "jun 2027", "jul 2027", "ago 2027", "sep 2027", "oct 2027", "nov 2027"];

const out: string[] = [
  "# Proyección de clientes e ingresos por canal (simulada)",
  "",
  "> **No son datos: son supuestos.** Hoy no hay clientes, ni tráfico, ni conversión medida. Sirve para ver qué tendría que cumplirse para llegar a cada cifra y qué canal pesa más, no para prometer nada. Se regenera con `npx tsx --conditions=react-server scripts/project-customers.ts`. El análisis completo y las fuentes están en `docs/ESTUDIO_MERCADO.md`.",
  "",
  "El mes 1 es el primer mes de ventas (diciembre de 2026, si el producto está listo a tiempo). Marzo de 2027 es el mes 4.",
  "",
  "## Supuestos comunes",
  "",
  `- Cobro: solo el precio base de cada plan (Starter US$${base.starter.priceUsd}, Creator US$${base.creator.priceUsd}, Commerce US$${base.commerce.priceUsd}, Studio US$${base.studio.priceUsd}); nadie sube la barra. Es prudente.`,
  `- Costo variable: cada crédito usado cuesta US$${CREDIT_USD}. Los créditos sin usar no cuestan. Comisión de pago: ${(ASSUMED_PAYMENT_FEE.pct * 100).toFixed(1)} % + US$${ASSUMED_PAYMENT_FEE.fixedUsd} por cobro (supuesto; Whop no está verificado).`,
  `- Costos fijos: US$${FIXED_BASE_USD} al mes más US$${PER_CUSTOMER_USD} por cliente. Costo único antes de la primera venta: US$${LAUNCH_COST_USD} (pruebas de motores y renders). No incluye tu sueldo, impuestos, abogado ni contador.`,
  `- Costo por cliente fuera de publicidad, sin contar tu tiempo: contacto directo US$${CAC_OTHER.outreach}, contenido US$${CAC_OTHER.content}, redes US$${CAC_OTHER.social}.`,
  "- Publicidad pagada: el costo por cliente sale de `CPC ÷ (visita→registro × registro→pago)`. Empieza en el mes 3, después de tener una página que convierta.",
  "- Cada cliente es de pago. No hay prueba gratis de generación (cada intento cuesta dinero), solo las muestras demo.",
  "",
  "## Qué supone cada escenario",
  "",
  "| Escenario | Abandono mensual | Uso de créditos | Contacto directo (nuevos/mes) | Contenido y SEO desde el mes 3 | Redes | Publicidad | Costo por cliente pagado |",
  "|---|---:|---:|---|---|---|---|---:|",
  ...SCENARIOS.map((s) => {
    const p = s.paid;
    return `| ${s.label} | ${Math.round(s.churn * 100)} % | ${Math.round(s.usage * 100)} % | ${s.outreach(1).toFixed(1)} → ${s.outreach(12).toFixed(1)} | +${(s.content(4) - s.content(3)).toFixed(1)} por mes cada mes | ${s.social(1).toFixed(1)} → ${s.social(12).toFixed(1)} | US$${p.budget(12)}/mes, CPC US$${p.cpc}, ${Math.round(p.visitToSignup * 100)} % registra, ${Math.round(p.signupToPaid * 100)} % paga | US$${fmt(paidCac(p))} |`;
  }),
  "",
];

const csv = ["scenario,month,new_customers,outreach,content,social,paid,active_customers,mrr_usd,variable_usd,payment_fees_usd,fixed_usd,marketing_usd,net_usd,cumulative_usd"];
const summary: string[] = [];
const detail: string[] = [];
const ltv: string[] = ["## Cuánto vale un cliente frente a lo que cuesta conseguirlo", "", "Ganancia mensual por cliente (después de créditos, comisión y costo por cliente) × meses que se queda (1 ÷ abandono). Sin descontar al presente.", "", "| Escenario | Ganancia mensual por cliente | Vida media | Valor de un cliente | Costo por cliente pagado | Valor ÷ costo (pagada) | ¿Alcanza para pagar publicidad? |", "|---|---:|---:|---:|---:|---:|---|"];
const at: Record<string, Row[]> = {};
for (const s of SCENARIOS) {
  const rows = run(s);
  at[s.id] = rows;
  for (const r of rows) csv.push([s.id, r.month, r.added.toFixed(2), r.byChannel.outreach.toFixed(2), r.byChannel.content.toFixed(2), r.byChannel.social.toFixed(2), r.byChannel.paid.toFixed(2), r.customers.toFixed(1), r.mrr.toFixed(2), r.variable.toFixed(2), r.fees.toFixed(2), r.fixed.toFixed(2), r.marketing.toFixed(2), r.net.toFixed(2), r.cumulative.toFixed(2)].join(","));
  const per = netPerCustomer(s);
  const value = per / s.churn;
  const cac = paidCac(s.paid);
  ltv.push(`| ${s.label} | US$${per.toFixed(0)} | ${(1 / s.churn).toFixed(0)} meses | US$${fmt(value)} | US$${fmt(cac)} | ${(value / cac).toFixed(1)}× | ${value / cac >= 3 ? "Sí (3× o más)" : value / cac >= 1 ? "Ajustado: pierde margen" : "No: cada cliente pagado pierde dinero"} |`);
}

summary.push("## Cuántos clientes de pago habría (activos, ya descontado el abandono)", "", `| Escenario | ${SHOW.map((m) => `Mes ${m} (${MONTH_NAME[m - 1]})`).join(" | ")} |`, `|---|${SHOW.map(() => "---:").join("|")}|`);
for (const s of SCENARIOS) summary.push(`| ${s.label} | ${SHOW.map((m) => fmt(at[s.id][m - 1].customers)).join(" | ")} |`);
summary.push("", "## Ingreso mensual recurrente (MRR, en US$)", "", `| Escenario | ${SHOW.map((m) => `Mes ${m}`).join(" | ")} |`, `|---|${SHOW.map(() => "---:").join("|")}|`);
for (const s of SCENARIOS) summary.push(`| ${s.label} | ${SHOW.map((m) => `${fmt(at[s.id][m - 1].mrr)}`).join(" | ")} |`);
summary.push("", "## Ganancia del mes, después de costos y marketing, antes de tu sueldo (US$)", "", `| Escenario | ${SHOW.map((m) => `Mes ${m}`).join(" | ")} | Acumulado mes 12 |`, `|---|${SHOW.map(() => "---:").join("|")}|---:|`);
for (const s of SCENARIOS) summary.push(`| ${s.label} | ${SHOW.map((m) => fmt(at[s.id][m - 1].net)).join(" | ")} | ${fmt(at[s.id][11].cumulative)} |`);

detail.push("## De dónde vendrían los clientes nuevos (mes 4 y mes 12)", "", "| Escenario | Mes | Contacto directo | Contenido y SEO | Redes | Publicidad | Total nuevos |", "|---|---:|---:|---:|---:|---:|---:|");
for (const s of SCENARIOS) for (const m of [4, 12]) {
  const r = at[s.id][m - 1];
  detail.push(`| ${s.label} | ${m} | ${r.byChannel.outreach.toFixed(1)} | ${r.byChannel.content.toFixed(1)} | ${r.byChannel.social.toFixed(1)} | ${r.byChannel.paid.toFixed(1)} | ${r.added.toFixed(1)} |`);
}
detail.push("");

const goal = at.base[3].customers;
out.push(
  ...summary,
  "",
  ...detail,
  ...ltv,
  "",
  "## Lectura",
  "",
  `- **Meta de más de 10 clientes en marzo (mes 4):** el escenario realista llega a ${fmt(goal)}, el pesimista a ${fmt(at.low[3].customers)} y el optimista a ${fmt(at.high[3].customers)}. En los tres casos casi todo viene del contacto directo y las redes, porque el contenido y el SEO recién empiezan y la publicidad arranca en el mes 3.`,
  "- **La publicidad pagada solo se justifica si la conversión es mucho mejor que la normal.** Con los supuestos realistas cada cliente pagado cuesta más de lo que deja. Antes de gastar en anuncios hay que medir visita→registro y registro→pago con tráfico real.",
  "- **Lo que más mueve las cifras:** la conversión de la página (visita→pago), el abandono y subir la mezcla hacia Creator y Commerce. Cada punto ahí vale más que duplicar el presupuesto de anuncios.",
  "",
  "## Qué no dice esta proyección",
  "",
  "- No sabemos cuántas visitas llegan, cuántas se registran ni cuántas pagan. Es el primer número que hay que medir.",
  "- Supone que el producto genera modelos reales desde el mes 1, que los motores se pueden revender (pendiente por escrito, ver `docs/INFORME_CODEX.md`) y que Whop cobra desde Chile. Si alguna falla, el mes 1 se corre.",
  "- No incluye tu tiempo, impuestos, abogado, contador, reembolsos ni disputas. El uso de créditos y los costos de los motores no están medidos con facturas.",
  "- Las cifras de CPC y conversión salen de agregadores y blogs de terceros, no de cuentas propias (ver fuentes en el estudio).",
  "",
);
writeFileSync("docs/PROYECCION_CLIENTES.md", out.join("\n"));
writeFileSync("docs/PROYECCION_CLIENTES.csv", csv.join("\n") + "\n");
console.log("Written docs/PROYECCION_CLIENTES.md and docs/PROYECCION_CLIENTES.csv");
