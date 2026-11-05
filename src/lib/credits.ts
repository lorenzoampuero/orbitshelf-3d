/**
 * Internal credits. A hypothesis to test the numbers, not a price: 1 credit stands for US$0.02 of variable cost covered.
 * Provider credits and internal credits are different things and are never converted into each other directly.
 */
export const CREDIT_USD = 0.02;

export type CostAssumptions = {
  /** Extra provider cost from billed retries, as a share of the provider's price. */
  retryRate: number;
  /** Conversion, storage and delivery per job. */
  postUsd: number;
  bufferUsd: number;
};

/** Placeholders from the specification's worked example. Replace with measured data: none of these has been measured. */
export const ASSUMED_COSTS: CostAssumptions = { retryRate: 0.2, postUsd: 0.07, bufferUsd: 0.05 };

export const effectiveCost = (providerUsd: number, a: CostAssumptions = ASSUMED_COSTS) => providerUsd * (1 + a.retryRate) + a.postUsd + a.bufferUsd;

/** Rounded before `ceil` so that floating point noise (0.6 / 0.02 = 30.000000000000004) never adds a credit. */
export const creditsFor = (providerUsd: number, a: CostAssumptions = ASSUMED_COSTS) => Math.ceil(Math.round((effectiveCost(providerUsd, a) / CREDIT_USD) * 1e6) / 1e6);

export type PlanStructure = { id: string; label: string; unit: "credits" | "attempts"; plans: { name: string; priceUsd: number; units: number; recurring: boolean }[] };

/** Ideas to compare, not offers. Nothing is sold until a real test and an explicit decision. */
export const PLAN_STRUCTURES: PlanStructure[] = [
  {
    id: "spec",
    label: "Spec hypothesis (credits)",
    unit: "credits",
    plans: [
      { name: "Starter", priceUsd: 19, units: 150, recurring: true },
      { name: "Creator", priceUsd: 49, units: 500, recurring: true },
      { name: "Commerce", priceUsd: 99, units: 1100, recurring: true },
      { name: "Studio", priceUsd: 199, units: 2400, recurring: true },
    ],
  },
  {
    id: "attempts",
    label: "Current proposal (flat attempts)",
    unit: "attempts",
    plans: [
      { name: "Starter", priceUsd: 19, units: 25, recurring: true },
      { name: "Growth", priceUsd: 49, units: 70, recurring: true },
      { name: "Studio", priceUsd: 99, units: 160, recurring: true },
      { name: "Trial pack", priceUsd: 9, units: 8, recurring: false },
    ],
  },
  {
    id: "packs",
    label: "Prepaid packs only (credits, no subscription)",
    unit: "credits",
    plans: [
      { name: "Pack S", priceUsd: 15, units: 250, recurring: false },
      { name: "Pack M", priceUsd: 40, units: 750, recurring: false },
      { name: "Pack L", priceUsd: 100, units: 2000, recurring: false },
    ],
  },
];

/** A placeholder too: it must be replaced with the real payment provider's rates. */
export const ASSUMED_PAYMENT_FEE = { pct: 0.05, fixedUsd: 0.5 };

export type PlanResult = { plan: string; priceUsd: number; units: number; jobsAtFullUse: number; utilization: number; jobs: number; revenueUsd: number; variableCostUsd: number; paymentFeeUsd: number; contributionUsd: number; marginPct: number };

/**
 * One plan, one engine, one level of use. Contribution margin before fixed costs, support, refunds and taxes.
 * In a credits plan a job costs what the engine costs; in an attempts plan every job counts the same, so an expensive engine eats the margin.
 */
export function simulate(structure: PlanStructure, plan: PlanStructure["plans"][number], providerUsd: number, utilization: number, a: CostAssumptions = ASSUMED_COSTS, fee = ASSUMED_PAYMENT_FEE): PlanResult {
  const perJob = structure.unit === "credits" ? creditsFor(providerUsd, a) : 1;
  const jobsAtFullUse = Math.floor(plan.units / perJob);
  const jobs = Math.floor(jobsAtFullUse * utilization);
  const variableCostUsd = round(jobs * effectiveCost(providerUsd, a));
  const paymentFeeUsd = round(plan.priceUsd * fee.pct + fee.fixedUsd);
  const contributionUsd = round(plan.priceUsd - variableCostUsd - paymentFeeUsd);
  return { plan: plan.name, priceUsd: plan.priceUsd, units: plan.units, jobsAtFullUse, utilization, jobs, revenueUsd: plan.priceUsd, variableCostUsd, paymentFeeUsd, contributionUsd, marginPct: Math.round((contributionUsd / plan.priceUsd) * 1000) / 10 };
}

const round = (n: number) => Math.round(n * 100) / 100;
