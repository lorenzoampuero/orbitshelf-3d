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

/** A placeholder too: it must be replaced with the real payment provider's rates. */
export const ASSUMED_PAYMENT_FEE = { pct: 0.05, fixedUsd: 0.5 };

export const effectiveCost = (providerUsd: number, a: CostAssumptions = ASSUMED_COSTS) => providerUsd * (1 + a.retryRate) + a.postUsd + a.bufferUsd;

/** Rounded before `ceil` so that floating point noise (0.6 / 0.02 = 30.000000000000004) never adds a credit. */
export const creditsFor = (providerUsd: number, a: CostAssumptions = ASSUMED_COSTS) => Math.ceil(Math.round((effectiveCost(providerUsd, a) / CREDIT_USD) * 1e6) / 1e6);

/**
 * The owner's rule: a plan used to the last credit, on any engine, keeps at least this contribution margin.
 * Contribution means price minus provider cost and payment fee. Fixed costs, support, refunds and taxes come out of what is left.
 */
export const MIN_MARGIN = 0.6;

/** What the owner expects from normal use. Unlike the floor, it depends on how much customers really use, so it can only be confirmed with real data. */
export const TARGET_MARGIN = { low: 0.75, high: 0.85 };

/** The most credits a price can include and still keep the floor at full use. */
export const maxCreditsForPrice = (priceUsd: number, fee = ASSUMED_PAYMENT_FEE, floor = MIN_MARGIN) => Math.max(0, Math.floor((priceUsd * (1 - floor - fee.pct) - fee.fixedUsd) / CREDIT_USD));

/** The share of its credits a plan's customers can use, on average, for the plan to earn this margin. */
export const averageUseAtMargin = (priceUsd: number, credits: number, margin: number, fee = ASSUMED_PAYMENT_FEE) => (priceUsd * (1 - margin - fee.pct) - fee.fixedUsd) / (credits * CREDIT_USD);

export type PlanStep = { priceUsd: number; credits: number };
export type PlanTier = { id: string; name: string; steps: PlanStep[] };

/** Credits come straight from the floor, rounded down to a clean number, so a step cannot be set more generous than the rule allows. */
const step = (priceUsd: number): PlanStep => ({ priceUsd, credits: Math.floor(maxCreditsForPrice(priceUsd) / 50) * 50 });

/** Starter is a fixed plan. On the others a slider moves between these steps: more credits for a higher price. The first step is the plan's base price. */
export const PLAN_TIERS: PlanTier[] = [
  { id: "starter", name: "Starter", steps: [19].map(step) },
  { id: "creator", name: "Creator", steps: [49, 59, 69, 79, 89].map(step) },
  { id: "commerce", name: "Commerce", steps: [99, 119, 139, 159, 179].map(step) },
  { id: "studio", name: "Studio", steps: [199, 249, 299, 399, 499].map(step) },
];

export type PlanStructure = { id: string; label: string; unit: "credits" | "attempts"; plans: { name: string; priceUsd: number; units: number; recurring: boolean }[] };

/** What is on offer, still not for sale. The tests and the simulation fail if anything here drops below the floor. */
export const PLAN_STRUCTURES: PlanStructure[] = [
  {
    id: "plans",
    label: "Planes mensuales, cada paso de la barra (mínimo 60 %)",
    unit: "credits",
    plans: PLAN_TIERS.flatMap((t) => t.steps.map((s, i) => ({ name: i === 0 ? t.name : `${t.name} US$${s.priceUsd}`, priceUsd: s.priceUsd, units: s.credits, recurring: true }))),
  },
  {
    id: "packs",
    label: "Recargas sin suscripción (mínimo 60 %)",
    unit: "credits",
    plans: [
      { name: "Recarga S", priceUsd: 15, units: 200, recurring: false },
      { name: "Recarga M", priceUsd: 40, units: 600, recurring: false },
      { name: "Recarga L", priceUsd: 100, units: 1600, recurring: false },
    ],
  },
];

/** Kept only to show why they are not on offer. Flat attempts break the floor; the report's plans keep it but give far fewer models. */
export const COMPARISON_STRUCTURES: PlanStructure[] = [
  {
    id: "spec",
    label: "Hipótesis del informe",
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
    label: "Intentos planos (descartado: no cumple el mínimo)",
    unit: "attempts",
    plans: [
      { name: "Starter", priceUsd: 19, units: 25, recurring: true },
      { name: "Growth", priceUsd: 49, units: 70, recurring: true },
      { name: "Studio", priceUsd: 99, units: 160, recurring: true },
      { name: "Trial pack", priceUsd: 9, units: 8, recurring: false },
    ],
  },
];

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
