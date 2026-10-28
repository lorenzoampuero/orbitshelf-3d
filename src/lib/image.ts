import "server-only";
import sharp from "sharp";
import { createHash } from "node:crypto";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // local cap, tighter than the provider's 20 MB
export const PROVIDER_MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MIN_SIDE = 256;
export const MAX_SIDE = 8192;
const MAX_PIXELS = 48_000_000;

export type ImageErrorCode =
  | "empty"
  | "too_large"
  | "unsupported_type"
  | "svg_not_allowed"
  | "type_mismatch"
  | "corrupt"
  | "animated"
  | "too_small"
  | "too_many_pixels";

export class ImageError extends Error {
  constructor(
    public code: ImageErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ImageError";
  }
}

export type ImageKind = "png" | "jpeg" | "webp";
const MIME_BY_KIND: Record<ImageKind, string> = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" };

/** Magic-byte sniffing. Never trust the declared MIME or the file extension. */
export function sniffImage(b: Uint8Array): ImageKind | null {
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b.length >= 12 && String.fromCharCode(...b.subarray(0, 4)) === "RIFF" && String.fromCharCode(...b.subarray(8, 12)) === "WEBP") return "webp";
  return null;
}

function looksLikeMarkup(b: Uint8Array): boolean {
  const head = Buffer.from(b.subarray(0, 512)).toString("utf8").replace(/^\uFEFF/, "").trimStart().toLowerCase();
  return head.startsWith("<") || head.includes("<svg") || head.includes("<!doctype") || head.startsWith("<?xml");
}

export type NormalizedImage = {
  buffer: Buffer;
  mime: "image/png" | "image/jpeg";
  ext: "png" | "jpg";
  width: number;
  height: number;
  originalKind: ImageKind;
  originalBytes: number;
  sha256: string;
};

/**
 * Validates an uploaded product photo and returns a normalized copy:
 *  - sniffed type must be PNG/JPEG/WebP and agree with the declared MIME
 *  - SVG / markup / executables are rejected
 *  - fully decoded (corrupt or truncated files fail), size/pixel limits enforced
 *  - re-encoded as PNG or JPEG, auto-oriented, with all metadata (EXIF/GPS/ICC comments) stripped
 */
export async function validateAndNormalizeImage(input: { buffer: Buffer; declaredMime?: string | null }): Promise<NormalizedImage> {
  const { buffer, declaredMime } = input;
  if (buffer.length === 0) throw new ImageError("empty", "The file is empty.");
  if (buffer.length > MAX_IMAGE_BYTES) throw new ImageError("too_large", `Image must be ${MAX_IMAGE_BYTES / 1048576} MB or smaller.`);
  const kind = sniffImage(buffer);
  if (!kind) {
    if (looksLikeMarkup(buffer)) throw new ImageError("svg_not_allowed", "SVG, HTML and other markup files are not allowed. Upload a PNG, JPEG or WebP photo.");
    throw new ImageError("unsupported_type", "Unsupported file type. Upload a PNG, JPEG or WebP photo.");
  }
  if (declaredMime) {
    const declared = declaredMime.toLowerCase().split(";")[0].trim();
    if (declared === "image/svg+xml") throw new ImageError("svg_not_allowed", "SVG files are not allowed.");
    if (declared !== MIME_BY_KIND[kind] && !(kind === "jpeg" && declared === "image/jpg")) {
      throw new ImageError("type_mismatch", "The file content does not match its declared type.");
    }
  }
  let width = 0;
  let height = 0;
  let output: Buffer;
  try {
    const base = sharp(buffer, { limitInputPixels: MAX_PIXELS, failOn: "error", animated: true });
    const meta = await base.metadata();
    if ((meta.pages ?? 1) > 1) throw new ImageError("animated", "Animated images are not supported. Upload a single still photo.");
    width = meta.width ?? 0;
    height = meta.height ?? 0;
    if (Math.min(width, height) < MIN_SIDE) throw new ImageError("too_small", `Image is too small. Minimum ${MIN_SIDE}px on the shorter side.`);
    if (Math.max(width, height) > MAX_SIDE) throw new ImageError("too_many_pixels", `Image is too large. Maximum ${MAX_SIDE}px per side.`);
    const pipeline = sharp(buffer, { limitInputPixels: MAX_PIXELS, failOn: "error" }).rotate();
    output = kind === "jpeg" ? await pipeline.jpeg({ quality: 95 }).toBuffer() : await pipeline.png({ compressionLevel: 9 }).toBuffer();
    const rotated = await sharp(output).metadata();
    width = rotated.width ?? width;
    height = rotated.height ?? height;
  } catch (e) {
    if (e instanceof ImageError) throw e;
    const msg = e instanceof Error ? e.message : "";
    if (/pixel limit|too large/i.test(msg)) throw new ImageError("too_many_pixels", "Image has too many pixels.");
    throw new ImageError("corrupt", "The image could not be decoded. It may be corrupt or truncated.");
  }
  if (output.length > PROVIDER_MAX_IMAGE_BYTES) {
    output = await sharp(output).jpeg({ quality: 88 }).toBuffer();
  }
  const isJpeg = sniffImage(output) === "jpeg";
  return {
    buffer: output,
    mime: isJpeg ? "image/jpeg" : "image/png",
    ext: isJpeg ? "jpg" : "png",
    width,
    height,
    originalKind: kind,
    originalBytes: buffer.length,
    sha256: createHash("sha256").update(output).digest("hex"),
  };
}
