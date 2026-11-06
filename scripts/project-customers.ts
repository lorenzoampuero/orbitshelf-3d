/**
 * Customer and revenue projection. Every input below is an ASSUMPTION, not data: there are no customers yet.
 * Run: npx tsx --conditions=react-server scripts/project-customers.ts   (writes docs/PROYECCION_CLIENTES.md and .csv)
 * Replace the inputs with real numbers (visits, sign-up rate, churn, usage) as soon as the first customers exist.
 */
import { writeFileSync } from "node:fs";
import { ASSUMED_PAYMENT_FEE, CREDIT_USD, PLAN_TIERS } from "../src/lib/credits";

type Scenario = {
  id: string;
  label: string;
  /** New paying customers in month 1, and the monthly growth of that number. */
  newMonth1: number;
  newGrowth: number;
  /** Share of customers lost each month. */
  churn: number;
  /** Share of the credits in the plan that customers use on average (unused credits are margin). */
  usage: number;
  /** Share of new customers by plan, at the plan's base price. */
  mix: Record<string, number>;
};

const mix = (starter: number, creator: number, commerce: number, studio: number) => ({ starter, creator, commerce, studio });

const SCENARIOS: Scenario[] = [
  { id: "low", label: "Prudente", newMonth1: 3, newGrowth: 0.08, churn: 0.1, usage: 0.5, mix: mix(0.6, 0.3, 0.09, 0.01) },
  { id: "base", label: "Base", newMonth1: 6, newGrowth: 0.12, churn: 0.07, usage: 0.4, mix: mix(0.5, 0.33, 0.14, 0.03) },
  { id: "high", label: "Optimista", newMonth1: 12, newGrowth: 0.15, churn: 0.05, usage: 0.35, mix: mix(0.4, 0.35, 0.2, 0.05) },
];

/** Fixed monthly costs that are not tied to credits: hosting, database, email, domain, tools. A guess to be replaced with invoices. */
const FIXED_BASE_USD = 150;
/** Storage, egress, support and tooling that grow with customers. Unmetered today, so this is a guess too. */
const PER_CUSTOMER_USD = 1.5;
/** Marketing spend to win one paying customer (ads, content, tools). The biggest unknown of all; US$40 is a guess. */
const CAC_USD = 40;
const MONTHS = 24;

const base = Object.fromEntries(PLAN_TIERS.map((t) => [t.id, t.steps[0]]));
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

type Row = { month: number; customers: number; mrr: number; variable: number; fees: number; contribution: number; fixed: number; net: number; cumulative: number };

function run(s: Scenario): Row[] {
  const rows: Row[] = [];
  let customers = 0;
  let cumulative = 0;
  for (let m = 1; m <= MONTHS; m++) {
    const added = s.newMonth1 * Math.pow(1 + s.newGrowth, Math.min(m - 1, 11)); // growth stops after year 1: no endless compounding
    customers = customers * (1 - s.churn) + added;
    let mrr = 0, variable = 0, fees = 0;
    for (const [id, share] of Object.entries(s.mix)) {
      const n = customers * share;
      const plan = base[id];
      mrr += n * plan.priceUsd;
      variable += n * plan.credits * s.usage * CREDIT_USD;
      fees += n * (plan.priceUsd * ASSUMED_PAYMENT_FEE.pct + ASSUMED_PAYMENT_FEE.fixedUsd);
    }
    const contribution = mrr - variable - fees;
    const fixed = FIXED_BASE_USD + PER_CUSTOMER_USD * customers;
    const net = contribution - fixed - added * CAC_USD;
    cumulative += net;
    rows.push({ month: m, customers, mrr, variable, fees, contribution, fixed, net, cumulative });
  }
  return rows;
}

const out: string[] = [
  "# Proyección de clientes e ingresos (simulada)",
  "",
  "> **No son datos: son supuestos.** Hoy no hay clientes, ni tráfico, ni conversión medida. Sirve para ver qué números tendrían que darse para que el negocio se sostenga, no para prometer nada. Se regenera con `npx tsx --conditions=react-server scripts/project-customers.ts`.",
  "",
  "## Supuestos",
  "",
  `- Cobro: solo el precio base de cada plan (Starter US$${base.starter.priceUsd}, Creator US$${base.creator.priceUsd}, Commerce US$${base.commerce.priceUsd}, Studio US$${base.studio.priceUsd}); nadie sube la barra. Es prudente.`,
  `- Costo variable: cada crédito usado cuesta US$${CREDIT_USD}. Los créditos sin usar no cuestan.`,
  `- Comisión de pago: ${ASSUMED_PAYMENT_FEE.pct * 100} % + US$${ASSUMED_PAYMENT_FEE.fixedUsd} por cobro (supuesto, sin proveedor de pago real).`,
  `- Costos fijos: US$${FIXED_BASE_USD} al mes (hosting, base de datos, correo, dominio, herramientas) más US$${PER_CUSTOMER_USD} por cliente (almacenamiento, descargas y soporte, hoy sin medir). No incluye tu sueldo ni impuestos.`,
  `- Costo de conseguir cada cliente nuevo: US$${CAC_USD} (publicidad, contenido, herramientas). Es el supuesto más incierto de todos y ya está descontado de la ganancia.`,
  "- Los nuevos clientes crecen cada mes durante el primer año y luego se mantienen. Los que se van se descuentan cada mes (abandono).",
  "- No incluye clientes gratis ni prueba: cada cliente es de pago.",
  "",
  "| Escenario | Nuevos en el mes 1 | Crecimiento mensual (año 1) | Abandono mensual | Uso de créditos | Mezcla Starter / Creator / Commerce / Studio |",
  "|---|---:|---:|---:|---:|---|",
  ...SCENARIOS.map((s) => `| ${s.label} | ${s.newMonth1} | ${s.newGrowth * 100} % | ${s.churn * 100} % | ${s.usage * 100} % | ${Object.values(s.mix).map((v) => `${v * 100} %`).join(" / ")} |`),
  "",
];
const csv = ["scenario,month,customers,mrr_usd,variable_usd,payment_fees_usd,contribution_usd,fixed_usd,net_usd,cumulative_usd"];
const summary: string[] = ["## Resumen", "", "| Escenario | Clientes mes 6 | Clientes mes 12 | Clientes mes 24 | Ingreso mensual mes 12 | Margen de contribución mes 12 | Ganancia mensual mes 12 | Primer mes con ganancia | Acumulado mes 12 | Acumulado mes 24 |", "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|"];
const detail: string[] = [];
for (const s of SCENARIOS) {
  const rows = run(s);
  const at = (m: number) => rows[m - 1];
  const be = rows.find((r) => r.net > 0)?.month;
  summary.push(`| ${s.label} | ${fmt(at(6).customers)} | ${fmt(at(12).customers)} | ${fmt(at(24).customers)} | US$${fmt(at(12).mrr)} | ${Math.round((at(12).contribution / at(12).mrr) * 100)} % | US$${fmt(at(12).net)} | ${be ? `mes ${be}` : "no llega"} | US$${fmt(at(12).cumulative)} | US$${fmt(at(24).cumulative)} |`);
  detail.push(`### ${s.label}`, "", "| Mes | Clientes | Ingreso | Costo de créditos | Comisiones | Costos fijos | Ganancia del mes (con captación) | Acumulado |", "|---:|---:|---:|---:|---:|---:|---:|---:|");
  for (const r of rows.filter((r) => [1, 3, 6, 9, 12, 18, 24].includes(r.month))) {
    detail.push(`| ${r.month} | ${fmt(r.customers)} | US$${fmt(r.mrr)} | US$${fmt(r.variable)} | US$${fmt(r.fees)} | US$${fmt(r.fixed)} | US$${fmt(r.net)} | US$${fmt(r.cumulative)} |`);
  }
  detail.push("");
  for (const r of rows) csv.push([s.id, r.month, r.customers.toFixed(1), r.mrr.toFixed(2), r.variable.toFixed(2), r.fees.toFixed(2), r.contribution.toFixed(2), r.fixed.toFixed(2), r.net.toFixed(2), r.cumulative.toFixed(2)].join(","));
}

// What it takes to reach a target: customers needed for US$1,000 / 3,000 / 5,000 a month of profit in the base mix.
const b = SCENARIOS[1];
let perCustomerNet = 0;
for (const [id, share] of Object.entries(b.mix)) {
  const p = base[id];
  perCustomerNet += share * (p.priceUsd - p.credits * b.usage * CREDIT_USD - (p.priceUsd * ASSUMED_PAYMENT_FEE.pct + ASSUMED_PAYMENT_FEE.fixedUsd) - PER_CUSTOMER_USD);
}
const need = (target: number) => Math.ceil((target + FIXED_BASE_USD) / perCustomerNet);

out.push(
  ...summary,
  "",
  ...detail,
  "## Cuántos clientes hacen falta (mezcla del escenario base)",
  "",
  `Cada cliente deja unos US$${perCustomerNet.toFixed(0)} al mes después de créditos, comisión y costos por cliente, sin contar lo que costó conseguirlo.`,
  "",
  "| Ganancia mensual deseada | Clientes de pago necesarios |",
  "|---:|---:|",
  ...[500, 1000, 3000, 5000].map((t) => `| US$${fmt(t)} | ${fmt(need(t))} |`),
  "",
  "## Qué no dice esta proyección",
  "",
  "- No sabemos cuántas visitas llegan, cuántas se registran ni cuántas pagan. Todo parte de un número inventado de clientes nuevos. Lo primero que hay que medir es esa conversión.",
  "- El uso de créditos (35-50 %) es una suposición. Si los clientes usan todo, el margen baja hacia el 70 % de dimensionado; si usan poco, sube.",
  "- Una pasada de prueba de motores cuesta unos US$62 y no está incluida. Tampoco los reembolsos, los impuestos ni el trabajo propio.",
  "- Los costos reales de los motores y la comisión del cobro no se han confirmado con facturas.",
  "",
);
writeFileSync("docs/PROYECCION_CLIENTES.md", out.join("\n"));
writeFileSync("docs/PROYECCION_CLIENTES.csv", csv.join("\n") + "\n");
console.log("Written docs/PROYECCION_CLIENTES.md and docs/PROYECCION_CLIENTES.csv");
