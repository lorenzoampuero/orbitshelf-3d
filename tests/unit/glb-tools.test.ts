import { Document, NodeIO } from "@gltf-transform/core";
import { readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { validateGlb } from "@/lib/glb";
import { checkPreset, PRESETS } from "@/lib/glb-presets";
import { diagnoseGlb, exportGeometry, optimizeGlb } from "@/lib/glb-tools";

/** A real textured grid with as many triangles as asked, so the numbers below can be known exactly. */
async function grid(opts: { cells: number; textureSize?: number; scale?: number; alpha?: boolean; noUv?: boolean }) {
  const { cells } = opts;
  const doc = new Document();
  const buffer = doc.createBuffer();
  const positions: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (let y = 0; y <= cells; y++) {
    for (let x = 0; x <= cells; x++) {
      // A gentle wave, so simplification has to work: a flat grid collapses to two triangles.
      positions.push(x / cells, y / cells, Math.sin((x / cells) * Math.PI * 4) * Math.cos((y / cells) * Math.PI * 4) * 0.05);
      uvs.push(x / cells, y / cells);
      normals.push(0, 0, 1);
    }
  }
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const a = y * (cells + 1) + x;
      indices.push(a, a + 1, a + cells + 1, a + 1, a + cells + 2, a + cells + 1);
    }
  }
  const prim = doc
    .createPrimitive()
    .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(new Float32Array(positions)).setBuffer(buffer))
    .setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(new Float32Array(normals)).setBuffer(buffer))
    .setIndices(doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(indices)).setBuffer(buffer));
  if (!opts.noUv) prim.setAttribute("TEXCOORD_0", doc.createAccessor().setType("VEC2").setArray(new Float32Array(uvs)).setBuffer(buffer));
  if (opts.textureSize) {
    const png = await sharp({ create: { width: opts.textureSize, height: opts.textureSize, channels: opts.alpha ? 4 : 3, background: opts.alpha ? { r: 200, g: 90, b: 40, alpha: 0.5 } : { r: 200, g: 90, b: 40 } } }).png().toBuffer();
    prim.setMaterial(doc.createMaterial("m").setBaseColorTexture(doc.createTexture("t").setImage(new Uint8Array(png)).setMimeType("image/png")));
  } else {
    prim.setMaterial(doc.createMaterial("m"));
  }
  const node = doc.createNode("n").setMesh(doc.createMesh("mesh").addPrimitive(prim));
  if (opts.scale) node.setScale([opts.scale, opts.scale, opts.scale]);
  doc.createScene("s").addChild(node);
  return Buffer.from(await new NodeIO().writeBinary(doc));
}

describe("diagnostics", () => {
  it("reports exactly what is in the file", async () => {
    const d = await diagnoseGlb(await grid({ cells: 10, textureSize: 64 }));
    expect(d.triangles).toBe(200);
    expect(d.vertices).toBe(121);
    expect(d.meshes).toBe(1);
    expect(d.materials).toBe(1);
    expect(d.textures).toHaveLength(1);
    expect(d.maxTextureSize).toBe(64);
    expect(d.textures[0].mime).toBe("image/png");
    expect(d.hasUv).toBe(true);
    expect(d.hasNormals).toBe(true);
    expect(d.sizeMeters[0]).toBeCloseTo(1, 3);
    expect(d.sizeMeters[1]).toBeCloseTo(1, 3);
    expect(d.warnings).toEqual([]);
  });

  it("warns about what would really cause a problem", async () => {
    const d = await diagnoseGlb(await grid({ cells: 4, noUv: true, scale: 500 }));
    expect(d.warnings).toContain("no_uv");
    expect(d.warnings).toContain("unusual_scale");
    expect(d.sizeMeters[0]).toBeCloseTo(500, 1);
  });

  it("reads the demo files", async () => {
    for (const f of ["vase", "lamp", "chair"]) {
      const d = await diagnoseGlb(readFileSync(path.join(process.cwd(), "public", "demo", `${f}.glb`)));
      expect(d.triangles).toBeGreaterThan(0);
    }
  });
});

describe("preset checks", () => {
  const base = { bytes: 1000, vertices: 10, triangles: 10, meshes: 1, primitives: 1, materials: 1, textures: [], textureBytes: 0, maxTextureSize: 0, hasUv: true, hasNormals: true, sizeMeters: [1, 1, 1] as [number, number, number], warnings: [] };

  it("passes only when every limit is met", () => {
    expect(checkPreset(base, "game").pass).toBe(true);
    expect(checkPreset({ ...base, triangles: PRESETS.game.maxTriangles + 1 }, "game").pass).toBe(false);
    expect(checkPreset({ ...base, hasUv: false }, "game").checks.find((c) => c.code === "uv")?.pass).toBe(false);
    expect(checkPreset({ ...base, hasUv: false }, "store").pass).toBe(true); // UV is only a requirement of the game preset
  });
});

describe("optimization", () => {
  it("brings a heavy model within the preset, produces a valid GLB and leaves the input untouched", async () => {
    const input = await grid({ cells: 200, textureSize: 2048 }); // 80,000 triangles
    const before = await diagnoseGlb(input);
    const copy = Buffer.from(input);
    const out = await optimizeGlb(input, "web");
    expect(input.equals(copy)).toBe(true);
    expect(before.triangles).toBe(80_000);
    expect(out.diagnostics.triangles).toBeLessThanOrEqual(PRESETS.web.maxTriangles);
    expect(out.diagnostics.triangles).toBeGreaterThan(0);
    expect(out.diagnostics.maxTextureSize).toBeLessThanOrEqual(1024);
    expect(checkPreset(out.diagnostics, "web").pass).toBe(true);
    expect(validateGlb(out.glb).sha256).toBe(out.sha256);
    expect((await diagnoseGlb(out.glb)).triangles).toBe(out.diagnostics.triangles);
    // The shape must survive: same outline, within 1%.
    expect(out.diagnostics.sizeMeters[0]).toBeCloseTo(before.sizeMeters[0], 2);
    expect(out.diagnostics.sizeMeters[1]).toBeCloseTo(before.sizeMeters[1], 2);
  }, 60_000);

  it("does not reduce what is already within the budget", async () => {
    const out = await optimizeGlb(await grid({ cells: 10, textureSize: 64 }), "web");
    expect(out.diagnostics.triangles).toBe(200);
    expect(out.diagnostics.maxTextureSize).toBe(64);
  });

  it("turns opaque textures into JPEG and keeps transparency in PNG", async () => {
    const opaque = await optimizeGlb(await grid({ cells: 4, textureSize: 64 }), "store");
    expect(opaque.diagnostics.textures[0].mime).toBe("image/jpeg");
    const alpha = await optimizeGlb(await grid({ cells: 4, textureSize: 64, alpha: true }), "store");
    expect(alpha.diagnostics.textures[0].mime).toBe("image/png");
  });
});

describe("geometry export keeps scale and shape", () => {
  const box = (values: number[]) => [0, 1, 2].map((axis) => {
    const on = values.filter((_, i) => i % 3 === axis);
    return Math.max(...on) - Math.min(...on);
  });

  it("OBJ: same triangles and the same size in meters, with the node's scale applied", async () => {
    const glb = await grid({ cells: 10, scale: 2 });
    const before = await diagnoseGlb(glb);
    const text = (await exportGeometry(glb, "obj")).toString("utf8");
    const lines = text.split("\n");
    expect(lines.filter((l) => l.startsWith("f ")).length).toBe(before.triangles);
    const vs = lines.filter((l) => l.startsWith("v ")).flatMap((l) => l.slice(2).split(" ").map(Number));
    const size = box(vs);
    expect(size[0]).toBeCloseTo(before.sizeMeters[0], 3);
    expect(size[1]).toBeCloseTo(before.sizeMeters[1], 3);
    expect(size[0]).toBeCloseTo(2, 3);
  });

  it("STL: a valid binary file with the same triangles, in millimeters", async () => {
    const glb = await grid({ cells: 10, scale: 2 });
    const before = await diagnoseGlb(glb);
    const stl = await exportGeometry(glb, "stl");
    const count = stl.readUInt32LE(80);
    expect(count).toBe(before.triangles);
    expect(stl.length).toBe(84 + count * 50);
    const vs: number[] = [];
    for (let t = 0; t < count; t++) for (let i = 0; i < 9; i++) vs.push(stl.readFloatLE(84 + t * 50 + 12 + i * 4));
    expect(box(vs)[0]).toBeCloseTo(2000, 0);
  });
});
