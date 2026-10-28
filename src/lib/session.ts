import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { SessionUser } from "./types";
import { dataDir } from "./env";

export const SESSION_COOKIE = "os_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type Payload = SessionUser & { exp: number };

let cachedSecret: string | null = null;
export function sessionSecret(): string {
  if (cachedSecret) return cachedSecret;
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 32) return (cachedSecret = fromEnv);
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET (32+ chars) is required in production.");
  const file = path.join(dataDir(), "session-secret");
  mkdirSync(path.dirname(file), { recursive: true });
  if (existsSync(file)) return (cachedSecret = readFileSync(file, "utf8").trim());
  const generated = randomBytes(32).toString("hex");
  writeFileSync(file, generated, { mode: 0o600 });
  return (cachedSecret = generated);
}

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export function signSession(user: SessionUser, now = Date.now(), secret = sessionSecret()): string {
  const payload: Payload = { ...user, exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS };
  const body = b64(JSON.stringify(payload));
  const sig = b64(createHmac("sha256", secret).update(body).digest());
  return `${body}.${sig}`;
}

export function verifySession(token: string | undefined | null, now = Date.now(), secret = sessionSecret()): SessionUser | null {
  if (!token || token.length > 2048) return null;
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined) return null;
  const expected = createHmac("sha256", secret).update(body).digest();
  let given: Buffer;
  try {
    given = Buffer.from(sig, "base64url");
  } catch {
    return null;
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Payload;
    if (typeof p.exp !== "number" || p.exp * 1000 < now) return null;
    if (!p.userId || !p.orgId || !p.email) return null;
    return { userId: p.userId, orgId: p.orgId, email: p.email };
  } catch {
    return null;
  }
}
