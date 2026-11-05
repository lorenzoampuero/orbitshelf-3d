/**
 * What each engine has cost and how often its models were approved, across every workspace. Only for the owner: customers never see provider costs.
 *   npm run report:engines
 * Reads the same store as the app (DATABASE_URL, or the local JSON). Costs are published prices, not invoices.
 */
import { store } from "../src/lib/store";

async function main() {
  const stats = await store.engineStats();
  if (stats.length === 0) {
    console.log("No provider job has been recorded yet.");
    return;
  }
  console.log("motor,trabajos,listos,fallidos,aprobados,rechazados,usd_publicado,usd_por_aprobado");
  for (const s of stats) {
    const perApproved = s.approved ? (s.publishedUsd / s.approved).toFixed(3) : "";
    console.log([s.engineId, s.jobs, s.ready, s.failed, s.approved, s.rejected, s.publishedUsd.toFixed(4), perApproved].join(","));
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  },
);
