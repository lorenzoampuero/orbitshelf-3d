import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/** Encrypts store tokens before they are saved. Without INTEGRATIONS_KEY store connections stay off instead of keeping tokens in the clear. */
function key(): Buffer {
  const raw = process.env.INTEGRATIONS_KEY?.trim();
  if (!raw || raw.length < 32) throw new Error("INTEGRATIONS_KEY (32+ characters) is required to connect a store.");
  return createHash("sha256").update(raw).digest();
}

export const encryptionConfigured = () => (process.env.INTEGRATIONS_KEY?.trim().length ?? 0) >= 32;

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), body.toString("base64url")].join(".");
}

export function decryptSecret(stored: string): string {
  const [version, iv, tag, body] = stored.split(".");
  if (version !== "v1" || !iv || !tag || !body) throw new Error("Unreadable secret.");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString("utf8");
}
