import "server-only";
import { Document, NodeIO, Primitive, type Node } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, getBounds, prune, simplify, weld } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import { MeshoptDecoder, MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";
import { PRESETS } from "@/lib/glb-presets";
import { validateGlb } from "@/lib/glb";
import type { DiagnosticWarning, MeshDiagnostics, OptimizePreset } from "@/lib/types";

let ioReady: Promise<NodeIO> | null = null;

function io(): Promise<NodeIO> {
  ioReady ??= (async () => {
    await MeshoptDecoder.ready;
    await MeshoptSimplifier.ready;
    return new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
      "draco3d.decoder": await draco3d.createDecoderModule(),
      "meshopt.decoder": MeshoptDecoder,
    });
  })();
  return ioReady;
}

function primitiveTriangles(p: Primitive): number {
  const count = p.getIndices()?.getCount() ?? p.getAttribute("POSITION")?.getCount() ?? 0;
  switch (p.getMode()) {
    case Primitive.Mode.TRIANGLES:
      return Math.floor(count / 3);
    case Primitive.Mode.TRIANGLE_STRIP:
    case Primitive.Mode.TRIANGLE_FAN:
      return Math.max(0, count - 2);
    default:
      return 0;
  }
}

const meshNodes = (doc: Document): Node[] => doc.getRoot().listNodes().filter((n) => n.getMesh());
const countTriangles = (doc: Document) => meshNodes(doc).reduce((n, node) => n + node.getMesh()!.listPrimitives().reduce((k, p) => k + primitiveTriangles(p), 0), 0);

function metrics(doc: Document, bytes: number): MeshDiagnostics {
  const root = doc.getRoot();
  const prims = meshNodes(doc).flatMap((n) => n.getMesh()!.listPrimitives());
  const textures = root.listTextures().map((t) => {
    const size = t.getSize();
    return { mime: t.getMimeType(), width: size?.[0] ?? 0, height: size?.[1] ?? 0, bytes: t.getImage()?.byteLength ?? 0 };
  });
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  const bounds = scene ? getBounds(scene) : { min: [0, 0, 0], max: [0, 0, 0] };
  const size = bounds.max.map((v, i) => round(v - bounds.min[i])) as [number, number, number];
  const center = bounds.max.map((v, i) => (v + bounds.min[i]) / 2);
  const longest = Math.max(...size);
  const triangles = countTriangles(doc);
  const vertices = meshNodes(doc).reduce((n, node) => n + node.getMesh()!.listPrimitives().reduce((k, p) => k + (p.getAttribute("POSITION")?.getCount() ?? 0), 0), 0);
  const hasUv = prims.length > 0 && prims.every((p) => p.getAttribute("TEXCOORD_0"));
  const hasNormals = prims.length > 0 && prims.every((p) => p.getAttribute("NORMAL"));
  const maxTextureSize = textures.reduce((n, t) => Math.max(n, t.width, t.height), 0);
  const textureBytes = textures.reduce((n, t) => n + t.bytes, 0);
  const materials = root.listMaterials().length;

  const warnings: DiagnosticWarning[] = [];
  if (!hasUv) warnings.push("no_uv");
  if (!hasNormals) warnings.push("no_normals");
  if (materials === 0) warnings.push("no_materials");
  if (maxTextureSize > 2048) warnings.push("large_textures");
  if (triangles > 200_000) warnings.push("many_triangles");
  if (bytes > 15 * 1024 * 1024) warnings.push("heavy_file");
  if (longest > 100 || (longest > 0 && longest < 0.01)) warnings.push("unusual_scale");
  if (longest > 0 && Math.hypot(...center) > longest) warnings.push("off_center");

  return { bytes, vertices, triangles, meshes: root.listMeshes().length, primitives: prims.length, materials, textures, textureBytes, maxTextureSize, hasUv, hasNormals, sizeMeters: size, warnings };
}

const round = (n: number) => Math.round(n * 10_000) / 10_000;

export async function diagnoseGlb(glb: Buffer): Promise<MeshDiagnostics> {
  const doc = await (await io()).readBinary(new Uint8Array(glb));
  return metrics(doc, glb.byteLength);
}

/** Textures larger than the budget are reduced; opaque ones become JPEG. Geometry compression is avoided so the file keeps working in every viewer. */
async function reduceTextures(doc: Document, maxSize: number) {
  for (const t of doc.getRoot().listTextures()) {
    const image = t.getImage();
    if (!image) continue;
    let pipeline = sharp(Buffer.from(image));
    const meta = await pipeline.metadata();
    if ((meta.width ?? 0) > maxSize || (meta.height ?? 0) > maxSize) pipeline = pipeline.resize(maxSize, maxSize, { fit: "inside", withoutEnlargement: true });
    const opaque = (await sharp(Buffer.from(image)).stats()).isOpaque;
    const out = opaque ? await pipeline.jpeg({ quality: 88, mozjpeg: true }).toBuffer() : await pipeline.png({ compressionLevel: 9 }).toBuffer();
    t.setImage(new Uint8Array(out));
    t.setMimeType(opaque ? "image/jpeg" : "image/png");
    t.setURI("");
  }
}

export class OptimizeError extends Error {}

export type OptimizeResult = { glb: Buffer; sha256: string; bytes: number; diagnostics: MeshDiagnostics };

/** Produces a new file. The input is never modified and the original stays stored. */
export async function optimizeGlb(glb: Buffer, preset: OptimizePreset): Promise<OptimizeResult> {
  const limits = PRESETS[preset];
  const reader = await io();
  const doc = await reader.readBinary(new Uint8Array(glb));

  // Decoded on read. They are not re-encoded, so the extensions must go.
  for (const ext of doc.getRoot().listExtensionsUsed()) {
    if (ext.extensionName === "KHR_draco_mesh_compression" || ext.extensionName === "EXT_meshopt_compression") ext.dispose();
  }

  await doc.transform(dedup(), weld());
  // Simplification stops when the allowed error is reached, so a model that resists gets a wider margin, up to 5%.
  for (const error of [0.001, 0.01, 0.05]) {
    const triangles = countTriangles(doc);
    if (triangles <= limits.maxTriangles) break;
    await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: (limits.maxTriangles / triangles) * 0.95, error }));
  }
  await doc.transform(prune({ keepSolidTextures: true, keepAttributes: true }));
  await reduceTextures(doc, limits.maxTextureSize);

  if (meshNodes(doc).length === 0) throw new OptimizeError("The model has no mesh left after optimization.");
  const out = Buffer.from(await reader.writeBinary(doc));
  const info = validateGlb(out);
  return { glb: out, sha256: info.sha256, bytes: info.bytes, diagnostics: metrics(doc, out.byteLength) };
}

/* ───────── geometry export ───────── */

type Triangle = [number, number, number, number, number, number, number, number, number];

/** Every triangle in world coordinates, so node transforms and instances keep their real position and scale. */
function worldTriangles(doc: Document): Triangle[] {
  const out: Triangle[] = [];
  for (const node of meshNodes(doc)) {
    const m = node.getWorldMatrix();
    const at = (v: readonly number[]): [number, number, number] => [
      m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12],
      m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13],
      m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14],
    ];
    for (const p of node.getMesh()!.listPrimitives()) {
      if (p.getMode() !== Primitive.Mode.TRIANGLES) continue;
      const pos = p.getAttribute("POSITION");
      if (!pos) continue;
      const indices = p.getIndices();
      const count = indices?.getCount() ?? pos.getCount();
      const tmp: number[] = [];
      const vertex = (i: number) => at(pos.getElement(indices ? indices.getScalar(i) : i, tmp));
      for (let i = 0; i + 2 < count; i += 3) out.push([...vertex(i), ...vertex(i + 1), ...vertex(i + 2)] as Triangle);
    }
  }
  return out;
}

export type GeometryFormat = "obj" | "stl";

/** Geometry only: no materials or textures, which is what the label promises. glTF uses meters. STL has no unit and is written in millimeters, the usual convention for printing. */
export async function exportGeometry(glb: Buffer, format: GeometryFormat): Promise<Buffer> {
  const doc = await (await io()).readBinary(new Uint8Array(glb));
  const triangles = worldTriangles(doc);
  if (triangles.length === 0) throw new OptimizeError("The model has no triangles to export.");

  if (format === "obj") {
    const lines = ["# OrbitShelf 3D: geometry only, in meters"];
    for (const t of triangles) for (let i = 0; i < 9; i += 3) lines.push(`v ${t[i]} ${t[i + 1]} ${t[i + 2]}`);
    for (let i = 0; i < triangles.length; i++) lines.push(`f ${i * 3 + 1} ${i * 3 + 2} ${i * 3 + 3}`);
    return Buffer.from(lines.join("\n") + "\n", "utf8");
  }

  const buf = Buffer.alloc(84 + triangles.length * 50);
  buf.write("OrbitShelf 3D binary STL, millimeters", 0, "ascii");
  buf.writeUInt32LE(triangles.length, 80);
  let o = 84;
  for (const t of triangles) {
    const ux = t[3] - t[0], uy = t[4] - t[1], uz = t[5] - t[2];
    const vx = t[6] - t[0], vy = t[7] - t[1], vz = t[8] - t[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    for (const v of [nx / len, ny / len, nz / len]) {
      buf.writeFloatLE(v, o);
      o += 4;
    }
    for (const v of t) {
      buf.writeFloatLE(v * 1000, o);
      o += 4;
    }
    o += 2; // attribute byte count, unused
  }
  return buf;
}
