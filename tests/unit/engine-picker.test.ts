import { describe, expect, it } from "vitest";
import { allEngines, capabilityProblem, getEngine, toEngineDto } from "@/lib/provider/registry";
import { ENGINE_TIERS } from "@/lib/types";

const catalog = allEngines().map(toEngineDto);
const listed = catalog.filter((e) => e.listed);

describe("model picker catalog", () => {
  it("lists eight models, from low cost to super premium, and leaves the rivals' own products out", () => {
    expect(listed.map((e) => e.id).sort()).toEqual(
      ["fal-hunyuan-3.1-pro", "fal-hunyuan-3.1-rapid", "fal-rodin-2.5", "fal-rodin-2.5-fast", "fal-rodin-2.5-highpack", "fal-trellis-1", "fal-trellis-2", "sloyd"].sort(),
    );
    for (const tier of ENGINE_TIERS) expect(listed.some((e) => e.tier === tier)).toBe(true);
    const unlisted = catalog.filter((e) => !e.listed).map((e) => e.id).sort();
    expect(unlisted).toEqual(["fal-tripo-h3.1", "meshy-7.1"]);
  });

  it("orders the tiers by what a model costs in credits at the standard quality", () => {
    const cost = (id: string) => catalog.find((e) => e.id === id)!.creditsByTexture["1k"]!;
    expect(cost("fal-trellis-1")).toBeLessThan(cost("fal-rodin-2.5-fast"));
    expect(cost("fal-rodin-2.5-fast")).toBeLessThan(cost("fal-trellis-2"));
    expect(cost("fal-trellis-2")).toBeLessThan(cost("fal-rodin-2.5-highpack"));
    expect(cost("fal-hunyuan-3.1-pro")).toBeLessThan(cost("fal-rodin-2.5-highpack"));
  });

  it("prices a higher quality only where the vendor really charges for it, and never offers a level the engine cannot make", () => {
    const trellis2 = catalog.find((e) => e.id === "fal-trellis-2")!.creditsByTexture;
    expect(trellis2["512"]!).toBeLessThan(trellis2["1k"]!);
    expect(trellis2["1k"]!).toBeLessThan(trellis2["2k"]!);
    expect(trellis2.none).toBeUndefined(); // TRELLIS.2 always textures
    const rodin = catalog.find((e) => e.id === "fal-rodin-2.5")!.creditsByTexture;
    expect(new Set([rodin["512"], rodin["1k"], rodin["2k"]]).size).toBe(1); // one price for every quality: the picker must not invent a difference
  });

  it("charges HighPack as the vendor lists it: US$0.40 plus US$0.80", () => {
    const e = getEngine("fal-rodin-2.5-highpack")!;
    expect(e.price({ mode: "image", photoCount: 1, texture: "1k" }).reduce((n, l) => n + l.usd, 0)).toBeCloseTo(1.2, 4);
    expect(e.lifecycle).toBe("disabled");
    expect(capabilityProblem(e, { mode: "text", photoCount: 0, texture: "1k" })).toBe("mode");
  });

  it("leaves every engine except Sloyd switched off", () => {
    expect(allEngines().filter((e) => e.lifecycle !== "disabled").map((e) => e.id)).toEqual(["sloyd"]);
  });
});
