import { createHash } from "node:crypto";

export const MAX_GLB_BYTES = 60 * 1024 * 1024;

const MAGIC = 0x46546c67; // "glTF"
const CHUNK_JSON = 0x4e4f534a; // "JSON"
const CHUNK_BIN = 0x004e4942; // "BIN\0"

const COMPONENT_BYTES: Record<number, number> = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const TYPE_COUNT: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };

export class GlbError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GlbError";
  }
}

export type GlbInfo = {
  bytes: number;
  sha256: string;
  meshes: number;
  primitives: number;
  vertices: number;
  materials: number;
  textures: number;
  images: number;
  generator: string | null;
};

type Json = {
  asset?: { version?: string; generator?: string };
  buffers?: { byteLength?: number; uri?: string }[];
  bufferViews?: { buffer?: number; byteOffset?: number; byteLength?: number; byteStride?: number }[];
  accessors?: {
    bufferView?: number;
    byteOffset?: number;
    componentType?: number;
    count?: number;
    type?: string;
    sparse?: unknown;
  }[];
  meshes?: { primitives?: { attributes?: Record<string, number>; indices?: number }[] }[];
  materials?: unknown[];
  textures?: unknown[];
  images?: { uri?: string; bufferView?: number }[];
};

/**
 * Strict structural validation of a binary glTF 2.0 file. Throws `GlbError` with a user-presentable message.
 * Checks: magic, version, declared length, chunk framing/alignment, JSON validity, external URI rejection,
 * mesh presence and accessor / bufferView bounds against the BIN chunk.
 */
export function validateGlb(input: Uint8Array, maxBytes = MAX_GLB_BYTES): GlbInfo {
  const buf = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  if (buf.length < 20) throw new GlbError("File is too small to be a GLB.");
  if (buf.length > maxBytes) throw new GlbError(`GLB exceeds the ${Math.round(maxBytes / 1048576)} MB limit.`);
  if (buf.readUInt32LE(0) !== MAGIC) throw new GlbError("Not a GLB file (bad magic header).");
  const version = buf.readUInt32LE(4);
  if (version !== 2) throw new GlbError(`Unsupported GLB container version ${version}.`);
  const declared = buf.readUInt32LE(8);
  if (declared !== buf.length) throw new GlbError("GLB length header does not match the file size (truncated or padded).");

  let offset = 12;
  let json: Json | null = null;
  let bin: Buffer | null = null;
  let index = 0;
  while (offset < buf.length) {
    if (offset + 8 > buf.length) throw new GlbError("Truncated GLB chunk header.");
    const length = buf.readUInt32LE(offset);
    const type = buf.readUInt32LE(offset + 4);
    offset += 8;
    if (length % 4 !== 0) throw new GlbError("GLB chunk is not 4-byte aligned.");
    if (offset + length > buf.length) throw new GlbError("GLB chunk extends past the end of the file.");
    const data = buf.subarray(offset, offset + length);
    if (index === 0) {
      if (type !== CHUNK_JSON) throw new GlbError("First GLB chunk must be JSON.");
      try {
        json = JSON.parse(data.toString("utf8").replace(/[\0\s]+$/g, "")) as Json;
      } catch {
        throw new GlbError("GLB JSON chunk is not valid JSON.");
      }
    } else if (type === CHUNK_BIN && !bin) {
      bin = data;
    }
    offset += length;
    index += 1;
  }
  if (!json || typeof json !== "object") throw new GlbError("GLB has no JSON chunk.");
  if (!json.asset?.version?.startsWith("2")) throw new GlbError("glTF asset version must be 2.x.");

  for (const b of json.buffers ?? []) {
    if (b.uri !== undefined && !String(b.uri).startsWith("data:")) throw new GlbError("External buffer URIs are not allowed.");
  }
  for (const img of json.images ?? []) {
    if (img.uri !== undefined && !String(img.uri).startsWith("data:")) throw new GlbError("External image URIs are not allowed.");
  }

  const meshes = json.meshes ?? [];
  const primitives = meshes.reduce((n, m) => n + (m.primitives?.length ?? 0), 0);
  if (meshes.length === 0 || primitives === 0) throw new GlbError("GLB contains no mesh geometry.");

  const binLength = bin?.length ?? 0;
  const views = json.bufferViews ?? [];
  for (const [i, v] of views.entries()) {
    const start = v.byteOffset ?? 0;
    const len = v.byteLength ?? -1;
    if (len < 0 || start < 0) throw new GlbError(`bufferView ${i} is malformed.`);
    if ((v.buffer ?? 0) === 0 && start + len > binLength) throw new GlbError(`bufferView ${i} reads past the binary chunk.`);
  }
  const accessors = json.accessors ?? [];
  for (const [i, a] of accessors.entries()) {
    if (a.sparse) continue;
    if (a.bufferView === undefined) continue;
    const view = views[a.bufferView];
    const size = COMPONENT_BYTES[a.componentType ?? 0];
    const comps = TYPE_COUNT[a.type ?? ""];
    if (!view || !size || !comps || !Number.isInteger(a.count) || (a.count as number) < 0) {
      throw new GlbError(`accessor ${i} is malformed.`);
    }
    const stride = view.byteStride ?? size * comps;
    const needed = (a.byteOffset ?? 0) + (a.count === 0 ? 0 : stride * ((a.count as number) - 1) + size * comps);
    if (needed > (view.byteLength ?? 0)) throw new GlbError(`accessor ${i} exceeds its bufferView.`);
  }
  for (const m of meshes) {
    for (const p of m.primitives ?? []) {
      const pos = p.attributes?.POSITION;
      if (pos === undefined || !accessors[pos]) throw new GlbError("A mesh primitive has no valid POSITION attribute.");
    }
  }
  const vertices = meshes.reduce(
    (n, m) => n + (m.primitives ?? []).reduce((k, p) => k + (accessors[p.attributes?.POSITION ?? -1]?.count ?? 0), 0),
    0,
  );

  return {
    bytes: buf.length,
    sha256: createHash("sha256").update(buf).digest("hex"),
    meshes: meshes.length,
    primitives,
    vertices,
    materials: json.materials?.length ?? 0,
    textures: json.textures?.length ?? 0,
    images: json.images?.length ?? 0,
    generator: json.asset?.generator ?? null,
  };
}
