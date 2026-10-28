import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { ImageError, MAX_IMAGE_BYTES, sniffImage, validateAndNormalizeImage } from "@/lib/image";

const raw = (w: number, h: number) => sharp({ create: { width: w, height: h, channels: 3, background: { r: 200, g: 120, b: 60 } } });
const png = (w = 400, h = 400) => raw(w, h).png().toBuffer();
const jpeg = (w = 400, h = 400) => raw(w, h).jpeg().toBuffer();
const webp = (w = 400, h = 400) => raw(w, h).webp().toBuffer();

async function code(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return "ok";
  } catch (e) {
    return e instanceof ImageError ? e.code : "other:" + String(e);
  }
}

describe("validateAndNormalizeImage", () => {
  it("accepts PNG, JPEG and WebP and re-encodes to PNG/JPEG", async () => {
    const a = await validateAndNormalizeImage({ buffer: await png(), declaredMime: "image/png" });
    expect(a.mime).toBe("image/png");
    const b = await validateAndNormalizeImage({ buffer: await jpeg(), declaredMime: "image/jpeg" });
    expect(b.mime).toBe("image/jpeg");
    expect(sniffImage(b.buffer)).toBe("jpeg");
    const c = await validateAndNormalizeImage({ buffer: await webp(), declaredMime: "image/webp" });
    expect(c.mime).toBe("image/png");
    expect(c.originalKind).toBe("webp");
    expect(c.width).toBe(400);
  });

  it("rejects SVG by content and by declared type", async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><script>alert(1)</script></svg>');
    expect(await code(validateAndNormalizeImage({ buffer: svg, declaredMime: "image/png" }))).toBe("svg_not_allowed");
    expect(await code(validateAndNormalizeImage({ buffer: svg, declaredMime: "image/svg+xml" }))).toBe("svg_not_allowed");
    expect(await code(validateAndNormalizeImage({ buffer: await png(), declaredMime: "image/svg+xml" }))).toBe("svg_not_allowed");
  });

  it("rejects HTML, text and executables posing as images", async () => {
    expect(await code(validateAndNormalizeImage({ buffer: Buffer.from("<html><body>x</body></html>"), declaredMime: "image/jpeg" }))).toBe("svg_not_allowed");
    expect(await code(validateAndNormalizeImage({ buffer: Buffer.from("hello world, not an image at all"), declaredMime: "image/png" }))).toBe("unsupported_type");
    const exe = Buffer.concat([Buffer.from("MZ"), Buffer.alloc(600, 1)]);
    expect(await code(validateAndNormalizeImage({ buffer: exe, declaredMime: "image/png" }))).toBe("unsupported_type");
  });

  it("rejects when declared MIME disagrees with content", async () => {
    expect(await code(validateAndNormalizeImage({ buffer: await png(), declaredMime: "image/jpeg" }))).toBe("type_mismatch");
  });

  it("rejects empty, oversize, truncated and tiny images", async () => {
    expect(await code(validateAndNormalizeImage({ buffer: Buffer.alloc(0) }))).toBe("empty");
    expect(await code(validateAndNormalizeImage({ buffer: Buffer.alloc(MAX_IMAGE_BYTES + 1, 1), declaredMime: "image/png" }))).toBe("too_large");
    const full = await png(1200, 1200);
    expect(await code(validateAndNormalizeImage({ buffer: full.subarray(0, 120), declaredMime: "image/png" }))).toBe("corrupt");
    expect(await code(validateAndNormalizeImage({ buffer: await png(64, 64), declaredMime: "image/png" }))).toBe("too_small");
  });

  it("rejects PNG signature followed by garbage", async () => {
    const fake = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from("not really png data".repeat(30))]);
    expect(await code(validateAndNormalizeImage({ buffer: fake, declaredMime: "image/png" }))).toBe("corrupt");
  });

  it("strips EXIF metadata and applies orientation", async () => {
    const withExif = await raw(500, 300).jpeg().withExif({ IFD0: { Copyright: "SECRET-OWNER", ImageDescription: "gps-and-things" } }).toBuffer();
    expect((await sharp(withExif).metadata()).exif).toBeDefined();
    const out = await validateAndNormalizeImage({ buffer: withExif, declaredMime: "image/jpeg" });
    expect((await sharp(out.buffer).metadata()).exif).toBeUndefined();
    expect(out.buffer.includes(Buffer.from("SECRET-OWNER"))).toBe(false);
  });
});
