import { describe, expect, it } from "vitest";
import { activeWorkspace, defaultMode, defaultPreset, GOALS_BY_USE_CASE, resolvePreset, shortcutsFor, SHORTCUTS } from "@/lib/profiles";
import { GOALS, USE_CASES, type EngineDto, type UserProfile } from "@/lib/types";

const engine = (id: string, fromCredits: number, maxPhotos: number, modes: EngineDto["modes"]): EngineDto => ({
  id, label: id, lifecycle: "pilot", modes, maxPhotos, views: ["front"], geometryOnly: true, exports: ["glb"], priceVerifiedAt: "2026-11-05", priceEvidence: "published", fromCredits,
});
const engines = [engine("expensive-4", 60, 4, ["image", "multi-image"]), engine("cheap-4", 40, 4, ["image", "multi-image", "text"]), engine("cheapest-1", 10, 1, ["image"])];

describe("workspaces only change what is highlighted", () => {
  it("every workspace can reach every tool through Explore", () => {
    for (const u of USE_CASES) {
      const list = shortcutsFor(u);
      expect(list).toContain("explore");
    }
    for (const id of shortcutsFor("commerce")) expect(SHORTCUTS[id]).toMatch(/^\/dashboard/);
  });

  it("the goal moves its shortcut first without losing the rest", () => {
    expect(shortcutsFor("game", "assets")[0]).toBe("importGlb");
    expect(shortcutsFor("commerce", "publish")[0]).toBe("embeds");
    expect(new Set(shortcutsFor("commerce", "text")).size).toBe(shortcutsFor("commerce", "text").length);
  });

  it("a switched workspace wins over the original answer, which stays", () => {
    const p: UserProfile = { useCase: "commerce", experience: "beginner", goal: "photos", activeWorkspace: "game", onboardedAt: "x", skippedAt: null };
    expect(activeWorkspace(p)).toBe("game");
    expect(activeWorkspace({ ...p, activeWorkspace: null })).toBe("commerce");
    expect(activeWorkspace(null)).toBeNull();
  });

  it("every goal offered for a use case exists", () => {
    for (const u of USE_CASES) for (const g of GOALS_BY_USE_CASE[u]) expect(GOALS).toContain(g);
    expect(defaultMode("assets")).toBe("import");
    expect(defaultMode("publish")).toBeNull();
  });
});

describe("generation presets", () => {
  it("defaults follow the rules; advanced users start with all controls and beginners never do", () => {
    expect(defaultPreset("commerce", "beginner")).toBe("studio");
    expect(defaultPreset("game", "intermediate")).toBe("game");
    expect(defaultPreset("explore", null)).toBe("fast");
    expect(defaultPreset("pro", "beginner")).toBe("studio");
    expect(defaultPreset("pro", "intermediate")).toBe("advanced");
    expect(defaultPreset("commerce", "advanced")).toBe("advanced");
    expect(defaultPreset(null, null)).toBe("advanced");
  });

  it("chooses only by published price and real capability", () => {
    expect(resolvePreset("fast", engines, "image", 1)).toEqual({ engineId: "cheapest-1", texture: "1k" });
    expect(resolvePreset("studio", engines, "image", 1)).toEqual({ engineId: "cheap-4", texture: "2k" });
    expect(resolvePreset("game", engines, "text", 0)).toEqual({ engineId: "cheap-4", texture: "1k" });
  });

  it("never picks an engine that cannot take the photos", () => {
    expect(resolvePreset("fast", engines, "multi-image", 3)?.engineId).toBe("cheap-4");
    expect(resolvePreset("fast", engines, "multi-image", 9)).toBeNull();
  });

  it("offers nothing when no engine is available, and leaves advanced to the user", () => {
    expect(resolvePreset("studio", [], "image", 1)).toBeNull();
    expect(resolvePreset("advanced", engines, "image", 1)).toBeNull();
  });
});
