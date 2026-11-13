import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { NAV_ART, NAV_ART_SLUGS } from "@/content/nav-art";
import { galleryModels, getModel, integrationModels, models, pickGlb } from "@/lib/models";

const pub = (url: string) => path.join(process.cwd(), "public", url.replace(/^\//, ""));
const KB = 1024;

describe("models manifest", () => {
  it("lists every delivered model except the excluded warrior", () => {
    expect(models.length).toBe(32);
    expect(models.some((m) => m.id.startsWith("d99155df"))).toBe(false);
  });

  it("keeps the three connection models out of the gallery", () => {
    expect(integrationModels.map((m) => m.id).sort()).toEqual(["64c5bdd7", "d3e53c56", "fb365098"]);
    expect(galleryModels.length).toBe(models.length - 3);
  });

  it("has unique slugs and bilingual names and alts", () => {
    expect(new Set(models.map((m) => m.slug)).size).toBe(models.length);
    for (const m of models) {
      expect(m.name.en && m.name.es && m.alt.en && m.alt.es, m.slug).toBeTruthy();
      expect(getModel(m.slug)).toBe(m);
    }
  });

  it("points to files that exist and stay within the size budget", () => {
    for (const m of models) {
      for (const f of [m.beauty.src, m.beauty.srcSmall, m.beauty.thumb, m.spin.src, m.poster, m.glb.web, m.glb.card]) {
        expect(existsSync(pub(f)), `${m.slug}: ${f}`).toBe(true);
      }
      expect(statSync(pub(m.beauty.src)).size, `${m.slug} beauty`).toBeLessThanOrEqual(250 * KB);
      expect(statSync(pub(m.spin.src)).size, `${m.slug} spin`).toBeLessThanOrEqual(1.2 * 1024 * KB);
      expect(statSync(pub(m.glb.card)).size, `${m.slug} card`).toBeLessThanOrEqual(350 * KB);
      const heavy = m.tags.includes("untextured") ? 3 : 1.5;
      expect(statSync(pub(m.glb.web)).size, `${m.slug} web`).toBeLessThanOrEqual(heavy * 1024 * KB);
    }
  });

  it("serves real GLB files with a valid header", () => {
    for (const m of models) {
      for (const f of [m.glb.web, m.glb.card]) {
        expect(readFileSync(pub(f)).subarray(0, 4).toString("ascii"), `${m.slug} ${f}`).toBe("glTF");
      }
    }
  });

  it("describes a spin sheet that holds all its frames", () => {
    for (const m of models) {
      const { frames, cols } = m.spin;
      expect(frames).toBeGreaterThan(0);
      expect(cols * Math.ceil(frames / cols)).toBeGreaterThanOrEqual(frames);
    }
  });

  it("serves the light GLB to visitors who save data or have little memory", () => {
    const m = models[0];
    expect(pickGlb(m)).toBe(m.glb.web);
    expect(pickGlb(m, { saveData: true })).toBe(m.glb.card);
    expect(pickGlb(m, { deviceMemory: 2 })).toBe(m.glb.card);
    expect(pickGlb(m, { width: 390 })).toBe(m.glb.card);
    expect(pickGlb(m, { width: 1440, deviceMemory: 8 })).toBe(m.glb.web);
  });

  it("keeps the navbar pictures in step with the manifest", () => {
    for (const [key, slug] of Object.entries(NAV_ART_SLUGS)) {
      expect(NAV_ART[key as keyof typeof NAV_ART], key).toEqual(getModel(slug)?.beauty);
    }
  });
});
