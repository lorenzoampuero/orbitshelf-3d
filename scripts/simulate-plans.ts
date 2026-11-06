/**
 * Writes docs/SIMULACION_PLANES.md and docs/PLANES_MARGEN_SIMULADO.csv from the engine registry.
 *   NODE_OPTIONS=--conditions=react-server npx tsx scripts/simulate-plans.ts
 * Every cost here is a published price or a stated assumption. None comes from an invoice.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { ASSUMED_COSTS, ASSUMED_PAYMENT_FEE, COMPARISON_STRUCTURES, creditsFor, effectiveCost, MIN_MARGIN, PLAN_STRUCTURES, PLAN_TIERS, simulate, TARGET_MARGIN, averageUseAtMargin } from "../src/lib/credits";
import { allEngines, priceOf } from "../src/lib/provider/registry";

const scenarios = [0.25, 0.5, 0.75, 1];
const cases = allEngines().map((e) => {
  const mode = e.modes.includes("multi-image") ? ("multi-image" as const) : e.modes[0];
  const photoCount = mode === "multi-image" ? 3 : mode === "text" ? 0 : 1;
  return { id: e.id, label: e.label, mode, usd: priceOf(e, { mode, photoCount, texture: "1k" }).usd };
});
const cheapest = cases.reduce((a, b) => (a.usd <= b.usd ? a : b));
const priciest = cases.reduce((a, b) => (a.usd >= b.usd ? a : b));

const ALL_STRUCTURES = [...PLAN_STRUCTURES, ...COMPARISON_STRUCTURES];

// The floor is the owner's rule, so a plan below it stops the script instead of landing in a document.
for (const s of PLAN_STRUCTURES) {
  for (const p of s.plans) {
    for (const c of cases) {
      const r = simulate(s, p, c.usd, 1);
      if (r.contributionUsd / p.priceUsd < MIN_MARGIN) throw new Error(`${p.name} with ${c.label} falls to ${r.marginPct} %, under the ${MIN_MARGIN * 100} % floor.`);
    }
  }
}

const csv: string[] = ["estructura,plan,precio_usd,unidades,motor,costo_publicado_usd,costo_efectivo_supuesto_usd,uso_pct,trabajos,costo_variable_usd,comision_supuesta_usd,contribucion_usd,margen_pct,evidencia"];
for (const s of ALL_STRUCTURES) {
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
const pct = (n: number) => `${Math.round(n * 100)} %`;
lines.push(
  "## Del piso de 60 % al objetivo de 75–85 %",
  "",
  `El piso de ${pct(MIN_MARGIN)} es el peor caso: el cliente gasta todos sus créditos. El objetivo de ${pct(TARGET_MARGIN.low)}–${pct(TARGET_MARGIN.high)} depende de cuánto usen en promedio. Esta tabla dice qué uso promedio da ese objetivo en cada paso de la barra.`,
  "",
  `| Plan | Precio | Créditos | Modelos, Rodin Fast | Modelos, Rodin 2.5 | Margen al 100 % | Uso para ${pct(TARGET_MARGIN.high)} | Uso para ${pct(TARGET_MARGIN.low)} |`,
  "|---|---:|---:|---:|---:|---:|---:|---:|",
);
const structurePlans = PLAN_STRUCTURES.find((s) => s.id === "plans")!;
for (const t of PLAN_TIERS) {
  for (const st of t.steps) {
    const plan = { name: t.name, priceUsd: st.priceUsd, units: st.credits, recurring: true };
    const worst = Math.min(...cases.map((c) => simulate(structurePlans, plan, c.usd, 1).marginPct));
    lines.push(`| ${t.name} | ${usdf(st.priceUsd)} | ${st.credits} | ${Math.floor(st.credits / creditsFor(0.1))} | ${Math.floor(st.credits / creditsFor(0.4))} | ${worst} % | ${pct(averageUseAtMargin(st.priceUsd, st.credits, TARGET_MARGIN.high))} | ${pct(averageUseAtMargin(st.priceUsd, st.credits, TARGET_MARGIN.low))} |`);
  }
}
lines.push("");
for (const s of ALL_STRUCTURES.filter((x) => x.id !== "plans")) {
  lines.push(`## ${s.label}`, "", "Margen de contribución con el plan usado al 100 %, el peor caso.", "", "| Plan | Precio | Unidades | Modelos, motor barato | Margen | Modelos, motor caro | Margen |", "|---|---:|---:|---:|---:|---:|---:|");
  for (const p of s.plans) {
    const a = simulate(s, p, cheapest.usd, 1);
    const b = simulate(s, p, priciest.usd, 1);
    lines.push(`| ${p.name}${p.recurring ? "" : " (único)"} | ${usdf(p.priceUsd)} | ${p.units} | ${a.jobs} | ${a.marginPct} % | ${b.jobs} | ${b.marginPct} % |`);
  }
  lines.push("");
}
lines.push(
  "## Si el costo real sube 50 % y no se actualizan los créditos",
  "",
  "El mínimo se mantiene solo si los créditos por modelo se recalculan cuando cambia un costo. Esta tabla muestra lo que pasa si nadie lo hace.",
  "",
  "| Estructura | Plan | Margen hoy, motor caro | Margen con +50 %, sin ajustar |",
  "|---|---|---:|---:|",
);
for (const s of ALL_STRUCTURES) {
  const p = s.plans[0];
  const today = simulate(s, p, priciest.usd, 1);
  const worse = { ...today, ...simulate({ ...s, unit: "attempts" }, { ...p, units: today.jobs }, priciest.usd * 1.5, 1) };
  lines.push(`| ${s.label} | ${p.name} | ${today.marginPct} % | ${worse.marginPct} % |`);
}
lines.push(
  "",
  "## Lectura",
  "",
  "- **Objetivo:** 75–85 % de margen si los clientes usan, en promedio, entre un cuarto y un poco más de la mitad de sus créditos. Cuánto usarán de verdad solo se sabrá con clientes reales.",
  "- **Sin acumulación:** el piso exige que los créditos del plan no pasen al mes siguiente. Si se acumularan, un cliente podría gastar más de lo que pagó ese mes.",
  `- **Regla del dueño:** ningún plan puede bajar de ${MIN_MARGIN * 100} % de margen de contribución, aunque se use completo y con cualquier motor. Este script y las pruebas fallan si un plan la incumple.`,
  "- **Qué incluye ese margen:** es el precio menos el costo del proveedor y la comisión de pago. Con lo que queda se pagan hosting, soporte, devoluciones e impuestos, así que no es la ganancia final.",
  "- **Intentos planos:** descartado. Un intento cuesta lo mismo con cualquier motor, así que un motor caro deja el plan con pérdida.",
  "- **Créditos del informe:** cumple el mínimo, pero entrega menos modelos de los necesarios para llegar a 60 %.",
  "- **Hasta medir costos reales** (Fase 10), estos márgenes son una estimación. Con facturas hay que actualizar los supuestos y repetir este cálculo.",
);
writeFileSync(path.join(process.cwd(), "docs", "SIMULACION_PLANES.md"), lines.join("\n") + "\n");
console.log("Written docs/SIMULACION_PLANES.md and docs/PLANES_MARGEN_SIMULADO.csv");
