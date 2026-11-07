/**
 * Worst contribution margin of every plan step at full use and +10 % real cost, under different payment-fee assumptions.
 * Run: npx tsx --conditions=react-server scripts/check-fee-scenarios.ts
 */
import { ASSUMED_COSTS, COST_STRESS, MIN_MARGIN, PLAN_STRUCTURES, simulate } from "../src/lib/credits";

const structure = PLAN_STRUCTURES[0];
const scenarios: [string, { pct: number; fixedUsd: number }][] = [
  ["Current assumption 6.5% + 0.30", { pct: 0.065, fixedUsd: 0.3 }],
  ["Whop direct, intl card, FX, billing, fraud 5.7% + 0.40", { pct: 0.057, fixedUsd: 0.4 }],
  ["Whop with the extra 3% platform fee 8.7% + 0.40", { pct: 0.087, fixedUsd: 0.4 }],
];
for (const [label, fee] of scenarios) {
  let min = 100;
  let where = "";
  for (const plan of structure.plans) {
    for (const usd of [0.02, 0.1, 0.3, 0.6, 1.35, 2.5, 7]) {
      const r = simulate(structure, plan, usd, 1, ASSUMED_COSTS, fee, COST_STRESS);
      if (r.marginPct < min) {
        min = r.marginPct;
        where = `${plan.name} at provider US$${usd}`;
      }
    }
  }
  console.log(`${label.padEnd(58)} worst margin ${min} % (${where}) ${min >= MIN_MARGIN * 100 ? "OK" : "BELOW FLOOR"}`);
}
