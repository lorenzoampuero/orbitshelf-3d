import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { GlbError, validateGlb } from "@/lib/glb";

const demo = (n: string) => readFileSync(path.join(process.cwd(), "public", "demo", `${n}.glb`));

function build(json: object, bin = Buffer.alloc(0)): Buffer {
  let j = Buffer.from(JSON.stringify(json));
  while (j.length % 4) j = Buffer.concat([j, Buffer.from(" ")]);
  const chunks = [Buffer.alloc(8), j];
  chunks[0].writeUInt32LE(j.length, 0);
  chunks[0].writeUInt32LE(0x4e4f534a, 4);
  if (bin.length) {
    const pad = (4 - (bin.length % 4)) % 4;
    const b = Buffer.concat([bin, Buffer.alloc(pad)]);
    const h = Buffer.alloc(8);
    h.writeUInt32LE(b.length, 0);
    h.writeUInt32LE(0x004e4942, 4);
    chunks.push(h, b);
  }
  const body = Buffer.concat(chunks);
  const head = Buffer.alloc(12);
  head.writeUInt32LE(0x46546c67, 0);
  head.writeUInt32LE(2, 4);
  head.writeUInt32LE(12 + body.length, 8);
  return Buffer.concat([head, body]);
}

const goodJson = {
  asset: { version: "2.0" },
  buffers: [{ byteLength: 36 }],
  bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }],
  accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3" }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
};

describe("validateGlb", () => {
  it.each(["vase", "lamp", "chair"])("accepts the shipped %s demo sample", (n) => {
    const info = validateGlb(demo(n));
    expect(info.meshes).toBeGreaterThan(0);
    expect(info.vertices).toBeGreaterThan(0);
    expect(info.sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("accepts a minimal hand-built GLB", () => {
    expect(validateGlb(build(goodJson, Buffer.alloc(36))).vertices).toBe(3);
  });

  it("rejects bad magic", () => {
    const b = Buffer.from(demo("chair"));
    b.write("XXXX", 0);
    expect(() => validateGlb(b)).toThrow(/magic/);
  });

  it("rejects unsupported container version", () => {
    const b = Buffer.from(demo("chair"));
    b.writeUInt32LE(1, 4);
    expect(() => validateGlb(b)).toThrow(/version/);
  });

  it("rejects truncated files (length header mismatch)", () => {
    const b = demo("vase");
    expect(() => validateGlb(b.subarray(0, b.length - 100))).toThrow(/length header/);
  });

  it("rejects tiny and empty input", () => {
    expect(() => validateGlb(Buffer.alloc(0))).toThrow(GlbError);
    expect(() => validateGlb(Buffer.from("glTF"))).toThrow(GlbError);
  });

  it("rejects oversize files", () => {
    expect(() => validateGlb(demo("vase"), 1000)).toThrow(/limit/);
  });

  it("rejects external buffer / image URIs", () => {
    const ext = { ...goodJson, buffers: [{ byteLength: 36, uri: "http://evil.example/x.bin" }] };
    expect(() => validateGlb(build(ext, Buffer.alloc(36)))).toThrow(/External buffer/);
    const img = { ...goodJson, images: [{ uri: "https://evil.example/t.png" }] };
    expect(() => validateGlb(build(img, Buffer.alloc(36)))).toThrow(/External image/);
  });

  it("rejects GLB without meshes", () => {
    expect(() => validateGlb(build({ asset: { version: "2.0" } }))).toThrow(/no mesh/);
  });

  it("rejects out-of-bounds bufferViews and accessors", () => {
    const oob = { ...goodJson, bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 9999 }] };
    expect(() => validateGlb(build(oob, Buffer.alloc(36)))).toThrow(/past the binary/);
    const acc = { ...goodJson, accessors: [{ bufferView: 0, componentType: 5126, count: 100, type: "VEC3" }] };
    expect(() => validateGlb(build(acc, Buffer.alloc(36)))).toThrow(/exceeds its bufferView/);
  });

  it("rejects invalid JSON chunk", () => {
    const b = Buffer.from(build(goodJson, Buffer.alloc(36)));
    b.write("{{{{", 20);
    expect(() => validateGlb(b)).toThrow(/not valid JSON/);
  });

  it("rejects primitives without POSITION", () => {
    const j = { ...goodJson, meshes: [{ primitives: [{ attributes: {} }] }] };
    expect(() => validateGlb(build(j, Buffer.alloc(36)))).toThrow(/POSITION/);
  });
});
