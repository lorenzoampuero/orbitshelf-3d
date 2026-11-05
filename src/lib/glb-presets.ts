import type { MeshDiagnostics, OptimizePreset } from "@/lib/types";

/**
 * OrbitShelf's own technical budgets, explicit and checkable. They are not a store's, game engine's or anyone else's certification:
 * passing `game` means "meets these numbers", not "ready for Unity or Unreal".
 */
export type PresetLimits = { maxTriangles: number; maxTextureSize: number; maxBytes: number; requireUv: boolean; requireNormals: boolean };

export const PRESETS: Record<OptimizePreset, PresetLimits> = {
  web: { maxTriangles: 50_000, maxTextureSize: 1024, maxBytes: 5 * 1024 * 1024, requireUv: false, requireNormals: false },
  store: { maxTriangles: 100_000, maxTextureSize: 2048, maxBytes: 15 * 1024 * 1024, requireUv: false, requireNormals: false },
  game: { maxTriangles: 30_000, maxTextureSize: 2048, maxBytes: 15 * 1024 * 1024, requireUv: true, requireNormals: true },
};

export type PresetCheck = { code: "triangles" | "textureSize" | "bytes" | "uv" | "normals"; pass: boolean; actual: number | boolean; limit: number | boolean };

export function checkPreset(d: MeshDiagnostics, preset: OptimizePreset): { pass: boolean; checks: PresetCheck[] } {
  const p = PRESETS[preset];
  const checks: PresetCheck[] = [
    { code: "triangles", pass: d.triangles <= p.maxTriangles, actual: d.triangles, limit: p.maxTriangles },
    { code: "textureSize", pass: d.maxTextureSize <= p.maxTextureSize, actual: d.maxTextureSize, limit: p.maxTextureSize },
    { code: "bytes", pass: d.bytes <= p.maxBytes, actual: d.bytes, limit: p.maxBytes },
  ];
  if (p.requireUv) checks.push({ code: "uv", pass: d.hasUv, actual: d.hasUv, limit: true });
  if (p.requireNormals) checks.push({ code: "normals", pass: d.hasNormals, actual: d.hasNormals, limit: true });
  return { pass: checks.every((c) => c.pass), checks };
}
