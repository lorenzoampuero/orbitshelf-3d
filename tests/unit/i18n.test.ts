import { describe, expect, it } from "vitest";
import { en } from "@/i18n/dictionaries/en";
import { es } from "@/i18n/dictionaries/es";
import { isLocale, localePath, stripLocale, switchLocalePath } from "@/i18n/config";

function collectKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  if (Array.isArray(obj)) {
    return obj.flatMap((v, idx) => collectKeys(v, `${prefix}[${idx}]`));
  }
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    collectKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("i18n parity and routing helpers", () => {
  it("keeps full key and array-length parity between en and es dictionaries", () => {
    const enKeys = collectKeys(en).sort();
    const esKeys = collectKeys(es).sort();
    expect(esKeys).toEqual(enKeys);
  });

  it("keeps identical resource article slugs across en and es", () => {
    expect(es.resources.articles.map((a) => a.slug)).toEqual(
      en.resources.articles.map((a) => a.slug),
    );
  });

  it("formats locale paths and switches cleanly", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("es")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("en", "/pricing")).toBe("/pricing");
    expect(localePath("es", "/")).toBe("/es");
    expect(localePath("es", "/pricing")).toBe("/es/pricing");
    expect(stripLocale("/es/pricing")).toBe("/pricing");
    expect(stripLocale("/es")).toBe("/");
    expect(switchLocalePath("/pricing", "es")).toBe("/es/pricing");
    expect(switchLocalePath("/es/pricing", "en")).toBe("/pricing");
  });

  it("switches language from an explicit /en address without doubling the prefix", () => {
    expect(switchLocalePath("/en/features", "es")).toBe("/es/features");
    expect(switchLocalePath("/en", "es")).toBe("/es");
    expect(switchLocalePath("/en/features", "en")).toBe("/features");
    expect(stripLocale("/english")).toBe("/english");
    expect(stripLocale("/essay")).toBe("/essay");
  });
});
