import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { ASSUMED_PAYMENT_FEE, COMPARISON_STRUCTURES, CREDIT_USD, creditsFor, effectiveCost, maxCreditsForPrice, MIN_MARGIN, minPriceForCredits, PLAN_STRUCTURES, simulate } from "@/lib/credits";
import { getDictionary } from "@/i18n/get-dictionary";
import { allEngines, priceOf } from "@/lib/provider/registry";
import { validateAndNormalizeImage } from "@/lib/image";
import { createProviderModel, refreshJob } from "@/lib/jobs";
import { createQuote } from "@/lib/quotes";
import { store } from "@/lib/store";
import type { ProviderConfig } from "@/lib/env";
import { readFileSync } from "node:fs";

describe("credit formula", () => {
  it("matches the worked example in the specification: US$0.40 → US$0.60 → 30 credits", () => {
    expect(effectiveCost(0.4)).toBeCloseTo(0.6, 6);
    expect(creditsFor(0.4)).toBe(30);
  });

  it("always rounds up, and floating point noise never adds a credit", () => {
    expect(creditsFor(0.4001)).toBe(31);
    expect(creditsFor(0.1)).toBe(12);
  });
});

describe("plan simulation", () => {
  const credits = COMPARISON_STRUCTURES.find((s) => s.id === "spec")!;
  const attempts = COMPARISON_STRUCTURES.find((s) => s.id === "attempts")!;

  it("computes the specification's example: Creator with 500 credits gives 16 models of US$0.40", () => {
    const creator = credits.plans.find((p) => p.name === "Creator")!;
    const r = simulate(credits, creator, 0.4, 1);
    expect(r.jobs).toBe(16);
    expect(r.variableCostUsd).toBeCloseTo(9.6, 2);
    expect(r.paymentFeeUsd).toBeCloseTo(2.95, 2);
    expect(r.contributionUsd).toBeCloseTo(36.45, 2);
  });

  it("scales with use, and an unused plan is nearly all margin", () => {
    const p = credits.plans[0];
    expect(simulate(credits, p, 0.4, 0.5).jobs).toBe(2);
    expect(simulate(credits, p, 0.4, 0.25).marginPct).toBeGreaterThan(simulate(credits, p, 0.4, 1).marginPct);
  });

  it("shows why flat attempts are risky: the same plan loses margin with an expensive engine, and credits do not", () => {
    const flat = attempts.plans[0];
    const flatCheap = simulate(attempts, flat, 0.27, 1).marginPct;
    const flatDear = simulate(attempts, flat, 0.675, 1).marginPct;
    expect(flatCheap - flatDear).toBeGreaterThan(30);
    const c = credits.plans[1];
    expect(Math.abs(simulate(credits, c, 0.27, 1).marginPct - simulate(credits, c, 0.675, 1).marginPct)).toBeLessThan(3);
  });
});

describe("the 60% margin floor", () => {
  const raw = (s: Parameters<typeof simulate>[0], p: Parameters<typeof simulate>[1], usd: number, use: number) => {
    const r = simulate(s, p, usd, use);
    return r.contributionUsd / p.priceUsd;
  };
  /** Every price any engine can reach, not just its default options. */
  const everyPrice = () => {
    const prices = new Set<number>();
    for (const e of allEngines()) {
      for (const mode of e.modes) {
        for (const texture of ["none", "512", "1k", "2k"] as const) {
          for (const photoCount of mode === "text" ? [0] : mode === "image" ? [1] : [2, 3, 4]) {
            prices.add(priceOf(e, { mode, photoCount, texture }).usd);
          }
        }
      }
    }
    return [...prices];
  };

  it("is 60%", () => {
    expect(MIN_MARGIN).toBe(0.6);
  });

  it("every plan on offer keeps it, with every engine and option, at any level of use", () => {
    for (const s of PLAN_STRUCTURES) {
      expect(s.unit).toBe("credits");
      for (const p of s.plans) {
        expect(p.units, p.name).toBeLessThanOrEqual(maxCreditsForPrice(p.priceUsd));
        for (const usd of everyPrice()) {
          for (const use of [0.25, 0.5, 0.75, 1]) expect(raw(s, p, usd, use), `${p.name} at US$${usd}, ${use * 100}% used`).toBeGreaterThanOrEqual(MIN_MARGIN);
        }
      }
    }
  });

  it("a future engine at any price keeps it too, because it costs more credits", () => {
    for (const s of PLAN_STRUCTURES) {
      for (const p of s.plans) {
        for (const usd of [0.001, 0.05, 0.9, 1.35, 2.5, 7, 19.99]) expect(raw(s, p, usd, 1), `${p.name} at US$${usd}`).toBeGreaterThanOrEqual(MIN_MARGIN);
      }
    }
  });

  it("any amount of credits a customer chooses keeps it at the price shown, and one cent less would not", () => {
    for (let credits = 100; credits <= 20_000; credits += 100) {
      const price = minPriceForCredits(credits);
      const margin = (p: number) => (p - credits * CREDIT_USD - p * ASSUMED_PAYMENT_FEE.pct - ASSUMED_PAYMENT_FEE.fixedUsd) / p;
      expect(margin(price), `${credits} credits at US$${price}`).toBeGreaterThanOrEqual(MIN_MARGIN - 1e-9);
      expect(margin(Math.round((price - 0.01) * 100) / 100), `${credits} credits`).toBeLessThan(MIN_MARGIN);
    }
    expect(minPriceForCredits(1000)).toBe(58.58);
  });

  it("works out the most credits a price can include", () => {
    expect(maxCreditsForPrice(19)).toBe(307);
    expect(maxCreditsForPrice(199)).toBe(3457);
    expect(maxCreditsForPrice(1)).toBe(0);
  });

  it("flat attempts are not on offer: they break the floor", () => {
    const flat = COMPARISON_STRUCTURES.find((s) => s.id === "attempts")!;
    expect(PLAN_STRUCTURES.some((s) => s.unit === "attempts")).toBe(false);
    expect(raw(flat, flat.plans[0], 0.675, 1)).toBeLessThan(MIN_MARGIN);
  });

  it("the public pricing page shows exactly these plans, in both languages", () => {
    const plans = PLAN_STRUCTURES.find((s) => s.id === "plans")!.plans;
    for (const locale of ["en", "es"] as const) {
      const shown = getDictionary(locale).pricing.plans;
      expect(shown.map((p) => [p.name, Number(p.price), p.credits])).toEqual(plans.map((p) => [p.name, p.priceUsd, p.units]));
    }
  });
});

describe("charging in credits", () => {
  const config: ProviderConfig = { clientId: "cid-0000", clientSecret: "sec-0000-xxxx", apiBase: "https://p.test/api", resultBase: "https://r.test/jobs/" };
  const JOB = "01JZQY4YJ7KV1GQZ9G6H6H2X25";
  const glb = readFileSync(path.join(process.cwd(), "public", "demo", "lamp.glb"));
  const tmpRoot = mkdtempSync(path.join(os.tmpdir(), "orbitshelf-credits-"));
  let n = 0;
  const image = async () => validateAndNormalizeImage({ buffer: await sharp({ create: { width: 512, height: 512, channels: 3, background: "#cc8844" } }).jpeg().toBuffer(), declaredMime: "image/jpeg" });
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
  const deps = (outcome: "success" | "error" | "refuse" = "success") => ({
    config,
    fetch: ((u: string | URL | Request) => {
      const url = String(u);
      if (url.endsWith("/jobs/image-to-3d")) return Promise.resolve(outcome === "refuse" ? json(402, { message: "no" }) : json(200, { jobId: JOB }));
      if (url.endsWith(`/jobs/${JOB}`)) return Promise.resolve(json(200, { status: outcome, errorMessage: "boom" }));
      if (url.endsWith(".glb")) return Promise.resolve(new Response(new Uint8Array(glb), { status: 200 }));
      return Promise.resolve(json(404, {}));
    }) as unknown as typeof fetch,
  });
  const input = async () => ({ title: "X", sku: null, category: "other" as const, textureResolution: "1k" as const, idempotencyKey: null, source: { kind: "image" as const, image: await image() } });

  beforeEach(() => {
    process.env.DATA_DIR = path.join(tmpRoot, "t" + ++n);
    process.env.LOCAL_PAID_ATTEMPT_CAP = "100";
    process.env.MAX_ACTIVE_JOBS_PER_ORG = "5";
    process.env.BILLING_UNIT = "credits";
    process.env.SESSION_SECRET = "unit-test-session-secret-32-characters-long";
  });
  afterEach(() => {
    delete process.env.BILLING_UNIT;
  });
  afterAll(() => rmSync(tmpRoot, { recursive: true, force: true }));

  const SLOYD_IMAGE_CREDITS = creditsFor(0.2667); // the published price as the registry rounds it

  it("reserves what the engine costs, captures on success and quotes the same amount", async () => {
    const { org } = await store.signIn("c1@example.com");
    const q = createQuote(org.id, "sloyd", { mode: "image", photoCount: 1, texture: "1k" });
    expect(q).toMatchObject({ ok: true, quote: { unit: "credits", charge: SLOYD_IMAGE_CREDITS } });
    const r = await createProviderModel(org.id, await input(), deps());
    if (!r.ok) throw new Error(r.message);
    expect(r.model.attemptsDebited).toBe(SLOYD_IMAGE_CREDITS);
    expect((await store.usage(org.id)).balance).toBe(100 - SLOYD_IMAGE_CREDITS);
    await refreshJob(org.id, r.model.id, deps());
    expect((await store.usage(org.id)).balance).toBe(100 - SLOYD_IMAGE_CREDITS); // capture moves no balance
  });

  it("gives back exactly what was reserved when the provider fails", async () => {
    const { org } = await store.signIn("c2@example.com");
    const r = await createProviderModel(org.id, await input(), deps("error"));
    if (!r.ok) throw new Error(r.message);
    const failed = await refreshJob(org.id, r.model.id, deps("error"));
    expect(failed?.attemptsRefunded).toBe(SLOYD_IMAGE_CREDITS);
    expect((await store.usage(org.id)).balance).toBe(100);
  });

  it("refuses a job the balance cannot cover, without going negative or calling the provider", async () => {
    process.env.LOCAL_PAID_ATTEMPT_CAP = String(SLOYD_IMAGE_CREDITS - 1);
    const { org } = await store.signIn("c3@example.com");
    let called = false;
    const d = deps();
    const f = d.fetch;
    d.fetch = ((u: string) => {
      called = true;
      return f(u);
    }) as unknown as typeof fetch;
    const r = await createProviderModel(org.id, await input(), d);
    expect(r).toMatchObject({ ok: false, code: "insufficient_attempts" });
    expect(called).toBe(false);
    expect((await store.usage(org.id)).balance).toBe(SLOYD_IMAGE_CREDITS - 1);
  });

  it("an adjustment is applied once and can never take the balance below zero", async () => {
    const { org } = await store.signIn("c4@example.com");
    expect(await store.adjustBalance(org.id, 50, "adjustment", "support-1")).toBe("applied");
    expect(await store.adjustBalance(org.id, 50, "adjustment", "support-1")).toBe("duplicate");
    expect((await store.usage(org.id)).balance).toBe(150);
    expect(await store.adjustBalance(org.id, -500, "expiry", "expire-1")).toBe("insufficient");
    expect((await store.usage(org.id)).balance).toBe(150);
  });
});
