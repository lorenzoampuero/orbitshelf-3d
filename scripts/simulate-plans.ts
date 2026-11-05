/**
 * Writes docs/SIMULACION_PLANES.md and docs/PLANES_MARGEN_SIMULADO.csv from the engine registry.
 *   NODE_OPTIONS=--conditions=react-server npx tsx scripts/simulate-plans.ts
 * Every cost here is a published price or a stated assumption. None comes from an invoice.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { ASSUMED_COSTS, ASSUMED_PAYMENT_FEE, creditsFor, effectiveCost, PLAN_STRUCTURES, simulate } from "../src/lib/credits";
import { allEngines, priceOf } from "../src/lib/provider/registry";

const scenarios = [0.25, 0.5, 0.75, 1];
const cases = allEngines().map((e) => {
  const mode = e.modes.includes("multi-image") ? ("multi-image" as const) : e.modes[0];
  const photoCount = mode === "multi-image" ? 3 : mode === "text" ? 0 : 1;
  return { id: e.id, label: e.label, mode, usd: priceOf(e, { mode, photoCount, texture: "1k" }).usd };
});
const cheapest = cases.reduce((a, b) => (a.usd <= b.usd ? a : b));
const priciest = cases.reduce((a, b) => (a.usd >= b.usd ? a : b));

const csv: string[] = ["estructura,plan,precio_usd,unidades,motor,costo_publicado_usd,costo_efectivo_supuesto_usd,uso_pct,trabajos,costo_variable_usd,comision_supuesta_usd,contribucion_usd,margen_pct,evidencia"];
for (const s of PLAN_STRUCTURES) {
  for (const p of s.plans) {
    for (const c of [cheapest, priciest]) {
      for (const u of scenarios) {
        const r = simulate(s, p, c.usd, u);
        csv.push([s.id, p.name, p.priceUsd, p.units, c.id, c.usd, effectiveCost(c.usd).toFixed(3), u * 100, r.jobs, r.variableCostUsd, r.paymentFeeUsd, r.contributionUsd, r.marginPct, "precio publicado + supuestos, sin factura"].join(","));
      }
    }
  }
}
writeFileSync(path.join(process.cwd(), "docs", "PLANES_MARGEN_SIMULADO.csv"), csv.join("\n") + "\n");

const usdf = (n: number) => `US$${n.toFixed(2)}`;
const lines: string[] = [
  "# Simulación de planes",
  "",
  "**Esto no es una oferta ni una decisión de precios.** Ningún motor se ha probado con dinero: los costos son precios publicados más supuestos sin medir. Sirve para comparar estructuras y detectar las que no funcionan. Hay que repetirla con facturas reales (Fase 10).",
  "",
  "Generado con `scripts/simulate-plans.ts`. El detalle está en `PLANES_MARGEN_SIMULADO.csv`.",
  "",
  "## Supuestos sin medir",
  "",
  `- Reintentos facturados: ${ASSUMED_COSTS.retryRate * 100} % del precio del proveedor.`,
  `- Conversión, almacenamiento y entrega: ${usdf(ASSUMED_COSTS.postUsd)} por trabajo.`,
  `- Margen de seguridad: ${usdf(ASSUMED_COSTS.bufferUsd)} por trabajo.`,
  `- Comisión de pago: ${ASSUMED_PAYMENT_FEE.pct * 100} % + ${usdf(ASSUMED_PAYMENT_FEE.fixedUsd)} por cobro.`,
  "- Fuera del cálculo: costos fijos, soporte, devoluciones, impuestos y adquisición de clientes.",
  "",
  "## Costo por motor",
  "",
  "| Motor | Modo | Precio publicado | Costo efectivo supuesto | Créditos |",
  "|---|---|---:|---:|---:|",
  ...cases.map((c) => `| ${c.label} | ${c.mode} | ${usdf(c.usd)} | ${usdf(effectiveCost(c.usd))} | ${creditsFor(c.usd)} |`),
  "",
  `Casos extremos usados abajo: el más barato es ${cheapest.label} (${usdf(cheapest.usd)}) y el más caro ${priciest.label} (${usdf(priciest.usd)}).`,
  "",
];
for (const s of PLAN_STRUCTURES) {
  lines.push(`## ${s.label}`, "", "Margen de contribución con el plan usado al 100 %, el peor caso.", "", "| Plan | Precio | Unidades | Modelos, motor barato | Margen | Modelos, motor caro | Margen |", "|---|---:|---:|---:|---:|---:|---:|");
  for (const p of s.plans) {
    const a = simulate(s, p, cheapest.usd, 1);
    const b = simulate(s, p, priciest.usd, 1);
    lines.push(`| ${p.name}${p.recurring ? "" : " (único)"} | ${usdf(p.priceUsd)} | ${p.units} | ${a.jobs} | ${a.marginPct} % | ${b.jobs} | ${b.marginPct} % |`);
  }
  lines.push("");
}
lines.push(
  "## Si los proveedores suben 50 %",
  "",
  "| Estructura | Plan | Margen hoy, motor caro | Margen con +50 %, si no se ajusta nada |",
  "|---|---|---:|---:|",
);
for (const s of PLAN_STRUCTURES) {
  const p = s.plans[0];
  const today = simulate(s, p, priciest.usd, 1);
  const worse = { ...today, ...simulate({ ...s, unit: "attempts" }, { ...p, units: today.jobs }, priciest.usd * 1.5, 1) };
  lines.push(`| ${s.label} | ${p.name} | ${today.marginPct} % | ${worse.marginPct} % |`);
}
lines.push(
  "",
  "## Lectura",
  "",
  "- **Intentos planos:** un intento cuesta lo mismo con cualquier motor, así que un motor caro se come el margen. Con más de un motor habilitado esta estructura es riesgosa. Por eso el libro ya admite créditos.",
  "- **Créditos del informe:** el margen es alto en todos los casos, pero entrega pocos modelos por el precio. Conviene comparar con lo que ofrecen los competidores antes de decidir.",
  "- **Paquetes sin suscripción:** no hay ingreso recurrente, pero tampoco hay que entregar créditos que no se usan. Puede servir para empezar a cobrar.",
  "",
  "La decisión es del dueño, con datos de la Fase 10.",
);
writeFileSync(path.join(process.cwd(), "docs", "SIMULACION_PLANES.md"), lines.join("\n") + "\n");
console.log("Written docs/SIMULACION_PLANES.md and docs/PLANES_MARGEN_SIMULADO.csv");
