import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { billingUnit, initialGrant, localStartCredits, paidAttemptCap } from "@/lib/env";
import { billingConfigProblem, getEngine, toEngineDto } from "@/lib/provider/registry";
import { checkQuote, createQuote } from "@/lib/quotes";
import { store } from "@/lib/store";

const KEYS = ["BILLING_UNIT", "LOCAL_FREE_CREDITS", "LOCAL_PAID_ATTEMPT_CAP", "ENGINES_ENABLED", "ENGINES_DISABLED", "ORBITSHELF_TEST", "DATA_DIR"] as const;
const saved: Partial<Record<(typeof KEYS)[number], string | undefined>> = {};
const tmpRoot = mkdtempSync(path.join(os.tmpdir(), "orbitshelf-billing-"));
let n = 0;

beforeEach(() => {
  for (const k of KEYS) saved[k] = process.env[k];
  for (const k of ["BILLING_UNIT", "LOCAL_FREE_CREDITS", "LOCAL_PAID_ATTEMPT_CAP", "ENGINES_ENABLED", "ENGINES_DISABLED"] as const) delete process.env[k];
  process.env.DATA_DIR = path.join(tmpRoot, "t" + ++n);
});
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});
afterAll(() => rmSync(tmpRoot, { recursive: true, force: true }));

describe("credits are the default billing unit", () => {
  it("defaults to credits when BILLING_UNIT is unset, and only an explicit attempts turns flat attempts on", () => {
    expect(billingUnit()).toBe("credits");
    process.env.BILLING_UNIT = "attempts";
    expect(billingUnit()).toBe("attempts");
    process.env.BILLING_UNIT = "something-else";
    expect(billingUnit()).toBe("credits");
  });

  it("a new workspace gets starting credits in credits mode and the attempt cap in attempts mode", async () => {
    expect(localStartCredits()).toBe(100);
    expect(initialGrant()).toBe(100);
    process.env.LOCAL_FREE_CREDITS = "250";
    expect(initialGrant()).toBe(250);
    const a = await store.signIn("grant-credits@example.com");
    expect((await store.usage(a.org.id)).balance).toBe(250);

    process.env.BILLING_UNIT = "attempts";
    process.env.LOCAL_PAID_ATTEMPT_CAP = "7";
    expect(paidAttemptCap()).toBe(7);
    expect(initialGrant()).toBe(7);
    const b = await store.signIn("grant-attempts@example.com");
    expect((await store.usage(b.org.id)).balance).toBe(7);
  });

  it("keeps working when only the old variables are set: the attempt cap never becomes a credit balance", () => {
    process.env.LOCAL_PAID_ATTEMPT_CAP = "300";
    expect(initialGrant()).toBe(100);
  });

  it("the default grant covers a few jobs on the dearest engine option too", () => {
    const dear = createQuote("org", "sloyd", { mode: "multi-image", photoCount: 4, texture: "2k" });
    if (!dear.ok) throw new Error("expected a quote");
    expect(Math.floor(localStartCredits() / dear.quote.charge)).toBeGreaterThanOrEqual(2);
  });
});

describe("flat attempts with two engines on are refused", () => {
  const twoEngines = () => {
    process.env.BILLING_UNIT = "attempts";
    process.env.ENGINES_ENABLED = "fal-rodin-2.5";
    delete process.env.ORBITSHELF_TEST;
  };
  const q = { mode: "image" as const, photoCount: 1, texture: "1k" as const };

  it("refuses to quote, and a quote issued earlier no longer passes the check", () => {
    process.env.ORBITSHELF_TEST = "1";
    const earlier = createQuote("org", "sloyd", q);
    if (!earlier.ok) throw new Error("expected a quote");
    twoEngines();
    expect(billingConfigProblem()).toBe("attempts_multiple_engines");
    expect(createQuote("org", "sloyd", q)).toEqual({ ok: false, code: "billing_unsafe" });
    expect(checkQuote(earlier.quote.id, "org", "sloyd", q)).toBe("unsafe");
  });

  it("is fine with one engine, in credits mode, and in a test run that pilots a second engine", () => {
    process.env.BILLING_UNIT = "attempts";
    delete process.env.ORBITSHELF_TEST;
    expect(billingConfigProblem()).toBeNull(); // only Sloyd is on
    twoEngines();
    process.env.ORBITSHELF_TEST = "1";
    expect(billingConfigProblem()).toBeNull(); // the Playwright setup
    delete process.env.ORBITSHELF_TEST;
    delete process.env.BILLING_UNIT;
    expect(billingConfigProblem()).toBeNull(); // credits price every engine, so two are safe
    expect(createQuote("org", "sloyd", q).ok).toBe(true);
  });

  it("switching the extra engine off makes it safe again", () => {
    twoEngines();
    process.env.ENGINES_DISABLED = "fal-rodin-2.5";
    expect(billingConfigProblem()).toBeNull();
  });
});

describe("customers never see provider prices", () => {
  it("a quote carries credits, not US dollars, and its id does not reveal the price", () => {
    const r = createQuote("org", "sloyd", { mode: "text", photoCount: 0, texture: "1k" });
    if (!r.ok) throw new Error("expected a quote");
    const json = JSON.stringify(r.quote);
    expect(r.quote).not.toHaveProperty("usd");
    expect(r.quote).not.toHaveProperty("lines");
    expect(json).not.toMatch(/usd/i);
    expect(r.quote.credits).toBe(r.quote.charge); // credits mode
    const payload = JSON.parse(Buffer.from(r.quote.id.split(".")[0], "base64url").toString("utf8")) as Record<string, unknown>;
    expect(typeof payload.u).toBe("string");
    expect(Buffer.from(r.quote.id.split(".")[0], "base64url").toString("utf8")).not.toContain("0.3333");
  });

  it("an engine as the API lists it has credits, not a dollar price", () => {
    const dto = toEngineDto(getEngine("sloyd")!);
    expect(dto.fromCredits).toBeGreaterThan(0);
    expect(JSON.stringify(dto)).not.toMatch(/usd/i);
  });
});
