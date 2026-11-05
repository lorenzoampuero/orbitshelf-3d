/**
 * Compares engines on your own photos. See docs/benchmark/README.md.
 *
 *   npm run benchmark -- plan  --manifest <csv> [--engines a,b] [--texture 1k]     # costs nothing
 *   npm run benchmark -- run   --manifest <csv> --budget 17 --confirm-spend [...]  # spends real money
 *   npm run benchmark -- score --dir .benchmark/<run>                              # after the blind review
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildPlan, parseCsv, parseManifest, runPlan, scoreRun, writeRunFiles } from "../src/lib/benchmark";
import { allEngines, getEngine } from "../src/lib/provider/registry";
import type { TextureResolution } from "../src/lib/types";

const [command, ...rest] = process.argv.slice(2);
const arg = (name: string) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};
const flag = (name: string) => rest.includes(`--${name}`);
const usd = (n: number) => `US$${n.toFixed(2)}`;

function loadPlan() {
  const manifest = arg("manifest");
  if (!manifest || !existsSync(manifest)) throw new Error("Pass --manifest with the path to your manifest.");
  const { products, refused } = parseManifest(readFileSync(manifest, "utf8"));
  const dir = path.dirname(path.resolve(manifest));
  for (const p of products) for (const [view, file] of Object.entries(p.photos)) p.photos[view as keyof typeof p.photos] = path.resolve(dir, file as string);
  const missing = products.flatMap((p) => Object.values(p.photos)).filter((f) => !existsSync(f as string));
  if (missing.length) throw new Error(`These photos do not exist:\n${missing.join("\n")}`);
  const ids = arg("engines")?.split(",").map((s) => s.trim());
  const engines = ids
    ? ids.map((id) => {
        const e = getEngine(id);
        if (!e) throw new Error(`Unknown engine: ${id}. Known: ${allEngines().map((x) => x.id).join(", ")}`);
        return e;
      })
    : allEngines();
  const texture = (arg("texture") ?? "1k") as TextureResolution;
  return { plan: buildPlan(products, engines, texture), texture, refused, products: products.length, engines: engines.length };
}

function printPlan({ plan, refused, products, engines }: ReturnType<typeof loadPlan>) {
  console.log(`${products} products × ${engines} engines = ${plan.items.length} generations.`);
  if (refused.length) console.log(`Left out because the rights are not confirmed: ${refused.join(", ")}`);
  const byEngine = new Map<string, { n: number; usd: number }>();
  for (const i of plan.items) {
    const s = byEngine.get(i.engine.id) ?? { n: 0, usd: 0 };
    byEngine.set(i.engine.id, { n: s.n + 1, usd: s.usd + i.usd });
  }
  for (const [id, s] of byEngine) console.log(`  ${id.padEnd(24)} ${String(s.n).padStart(4)}  ${usd(s.usd)}`);
  for (const s of plan.skipped) console.log(`  skipped: ${s.productId} on ${s.engineId} (${s.reason})`);
  console.log(`Total at published prices: ${usd(plan.totalUsd)}. Minimum purchases, retries and taxes are not included.`);
}

async function main() {
  if (command === "plan") return printPlan(loadPlan());

  if (command === "run") {
    const loaded = loadPlan();
    printPlan(loaded);
    const budget = Number(arg("budget"));
    if (!Number.isFinite(budget) || budget <= 0) throw new Error("Pass --budget with the most you authorize to spend, in US dollars.");
    if (!flag("confirm-spend")) throw new Error("This spends real money. Add --confirm-spend once you have read the plan above.");
    const outDir = path.resolve(".benchmark", new Date().toISOString().replace(/[:.]/g, "-"));
    const { results, spentUsd } = await runPlan(loaded.plan, { budgetUsd: budget, texture: loaded.texture, outDir, log: console.log });
    writeRunFiles(outDir, results);
    console.log(`Spent at published prices: ${usd(spentUsd)} of ${usd(budget)}. Check the invoice: this is not it.`);
    console.log(`Results in ${outDir}. Review revision-ciega.csv before opening the key.`);
    return;
  }

  if (command === "score") {
    const dir = arg("dir");
    if (!dir) throw new Error("Pass --dir with the folder of the run.");
    const read = (f: string) => parseCsv(readFileSync(path.join(dir, f), "utf8"));
    const scores = scoreRun(read("resultados.csv"), read("revision-ciega.csv"), read("clave-no-abrir-antes-de-revisar.csv"));
    const lines = [
      "motor,trabajos,ok,fallidos,revisados,utilizables,tasa_utilizable,usd_publicado,usd_por_utilizable,forma_promedio,textura_promedio,segundos_promedio",
      ...scores.map((s) => [s.engineId, s.jobs, s.ok, s.failed, s.reviewed, s.usable, s.usableRate ?? "", s.publishedUsd, s.usdPerUsable ?? "", s.avgForm ?? "", s.avgTexture ?? "", s.avgSeconds ?? ""].join(",")),
    ];
    writeFileSync(path.join(dir, "puntaje.csv"), lines.join("\n") + "\n");
    console.log(lines.join("\n"));
    return;
  }

  throw new Error("Use: plan, run or score. See docs/benchmark/README.md.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
