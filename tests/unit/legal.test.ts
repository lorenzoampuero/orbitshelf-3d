import { describe, expect, it } from "vitest";
import { LEGAL_SLUGS, legalDoc, legalRoute } from "@/content/legal";

const ALLOWED_PLACEHOLDERS = new Set(["{brand}", "{operator}", "{email}", "{jurisdiction}"]);
const texts = (locale: "es" | "en", slug: (typeof LEGAL_SLUGS)[number]) => {
  const d = legalDoc(locale, slug);
  return [d.title, d.summary, ...d.sections.flatMap((s) => [s.h, ...s.p])];
};

describe("legal pack", () => {
  it("has every document in both languages with the same structure", () => {
    for (const slug of LEGAL_SLUGS) {
      const es = legalDoc("es", slug);
      const en = legalDoc("en", slug);
      expect(es.sections.length, slug).toBeGreaterThanOrEqual(4);
      expect(es.sections.length, slug).toBe(en.sections.length);
      es.sections.forEach((s, i) => expect(s.p.length, `${slug} #${i + 1}`).toBe(en.sections[i].p.length));
    }
  });

  it("uses only placeholders the document component fills", () => {
    for (const slug of LEGAL_SLUGS) {
      for (const locale of ["es", "en"] as const) {
        for (const text of texts(locale, slug)) {
          for (const m of text.match(/\{[a-z]+\}/g) ?? []) expect(ALLOWED_PLACEHOLDERS.has(m), `${locale}/${slug}: ${m}`).toBe(true);
        }
      }
    }
  });

  it("keeps the short routes for privacy and terms and puts the rest under /legal", () => {
    expect(legalRoute("privacy")).toBe("/privacy");
    expect(legalRoute("terms")).toBe("/terms");
    expect(legalRoute("refunds")).toBe("/legal/refunds");
    expect(new Set(LEGAL_SLUGS).size).toBe(LEGAL_SLUGS.length);
  });

  it("does not claim certifications, live payments or analytics it does not have", () => {
    const all = LEGAL_SLUGS.flatMap((s) => [...texts("es", s), ...texts("en", s)]).join("\n");
    expect(all).not.toMatch(/ISO 27001 (certified|certificad)/i);
    expect(all).not.toMatch(/SOC 2 (Type|compliant|certified|certificad)/i);
    expect(all).not.toMatch(/Google Analytics|Meta Pixel|TikTok Pixel/i);
  });
});
