import "server-only";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import dns, { type LookupAddress } from "node:dns";
import http from "node:http";
import https from "node:https";
import net, { BlockList, type LookupFunction } from "node:net";
import { decryptSecret } from "@/lib/secrets";
import { nowIso, store, type ModelRow } from "@/lib/store";
import type { WebhookEvent } from "@/lib/types";

/** Waits after each failed try. The first send plus these five is six tries over about nine hours. */
export const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 6 * 60 * 60_000];
const SEND_TIMEOUT_MS = 10_000;
const SIGNATURE_TOLERANCE_SECONDS = 300;

export const generateWebhookSecret = () => "whsec_" + randomBytes(32).toString("base64url");

export function signWebhook(secret: string, timestamp: number, body: string): string {
  return `t=${timestamp},v1=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
}

/** The check a receiver has to make. It is here so the documented scheme stays under test. */
export function verifyWebhookSignature(secret: string, header: string | null, body: string, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  const match = header?.match(/^t=(\d+),v1=([0-9a-f]{64})$/);
  if (!match) return false;
  const timestamp = Number(match[1]);
  if (Math.abs(nowSeconds - timestamp) > SIGNATURE_TOLERANCE_SECONDS) return false;
  const expected = Buffer.from(signWebhook(secret, timestamp, body));
  const received = Buffer.from(header!);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/* ───────── where the server is willing to send ───────── */

const blocked = new BlockList();
for (const [net4, bits] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4]] as const) {
  blocked.addSubnet(net4, bits, "ipv4");
}
for (const [net6, bits] of [["::", 128], ["::1", 128], ["64:ff9b::", 96], ["100::", 64], ["2001:db8::", 32], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8]] as const) {
  blocked.addSubnet(net6, bits, "ipv6");
}

/** Keeps a customer's address from reaching the server's own network or a cloud metadata service. IPv4-mapped IPv6 is checked against the IPv4 rules. */
export function isPublicAddress(address: string): boolean {
  const family = net.isIP(address);
  if (family === 0) return false;
  return !blocked.check(address, family === 6 ? "ipv6" : "ipv4");
}

const insecureAllowed = () => process.env.ORBITSHELF_TEST === "1" && process.env.WEBHOOK_ALLOW_INSECURE === "true";
const bareHost = (u: URL) => u.hostname.replace(/^\[|\]$/g, "");

/** Checks every address at connection time, so a name cannot pass validation and later point somewhere private. */
const safeLookup: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    const done = callback as unknown as (e: NodeJS.ErrnoException | null, a?: string | LookupAddress[], f?: number) => void;
    if (err) return done(err);
    const list = addresses as unknown as LookupAddress[];
    if (list.length === 0 || list.some((a) => !isPublicAddress(a.address))) return done(Object.assign(new Error("This address is not public."), { code: "ENOTPUBLIC" }));
    return options.all ? done(null, list) : done(null, list[0].address, list[0].family);
  });
};

export type UrlProblem = "invalid" | "not_https" | "not_public";

export async function checkWebhookUrl(raw: string): Promise<UrlProblem | null> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return "invalid";
  }
  if (raw.length > 500 || u.username || u.password) return "invalid";
  if (insecureAllowed()) return u.protocol === "https:" || u.protocol === "http:" ? null : "not_https";
  if (u.protocol !== "https:") return "not_https";
  const host = bareHost(u);
  if (net.isIP(host)) return isPublicAddress(host) ? null : "not_public";
  try {
    const list = await dns.promises.lookup(host, { all: true });
    return list.length > 0 && list.every((a) => isPublicAddress(a.address)) ? null : "not_public";
  } catch {
    return "not_public";
  }
}

export type Sender = (url: string, body: string, headers: Record<string, string>) => Promise<number>;

/** Redirects are not followed and the response body is ignored, so nothing from the address comes back into the app. */
export const postWebhook: Sender = (url, body, headers) =>
  new Promise((resolve, reject) => {
    const u = new URL(url);
    const insecure = insecureAllowed();
    if (u.protocol !== "https:" && !(insecure && u.protocol === "http:")) return reject(new Error("This address does not use https."));
    // A literal IP never goes through the lookup, so it is checked here.
    if (!insecure && net.isIP(bareHost(u)) && !isPublicAddress(bareHost(u))) return reject(new Error("This address is not public."));
    const send = u.protocol === "https:" ? https.request : http.request;
    const req = send(u, { method: "POST", headers: { ...headers, "Content-Length": String(Buffer.byteLength(body)) }, timeout: SEND_TIMEOUT_MS, ...(insecure ? {} : { lookup: safeLookup }) }, (res) => {
      res.resume();
      resolve(res.statusCode ?? 0);
    });
    req.on("timeout", () => req.destroy(new Error("The address did not respond in time.")));
    req.on("error", reject);
    req.end(body);
  });

/* ───────── sending ───────── */

function envelope(event: WebhookEvent | "ping", data: Record<string, unknown>) {
  return JSON.stringify({ id: randomUUID(), type: event, createdAt: nowIso(), data });
}

/** Never lets a notification problem affect the job it is about. The key makes a repeat of the same outcome a no-op. */
export async function emitModelEvent(row: ModelRow) {
  if (row.status === "processing") return;
  const event: WebhookEvent = row.status === "ready" ? "model.ready" : "model.failed";
  try {
    const payload = envelope(event, { modelId: row.id, title: row.title, sku: row.sku, status: row.status, provenance: row.provenance, engineId: row.engineId, failureCode: row.failureCode, checksum: row.checksum, reviewState: row.reviewState });
    await store.enqueueWebhook(row.orgId, event, payload, `${event}:${row.id}`);
  } catch (e) {
    console.error("[webhooks] could not queue:", e instanceof Error ? e.message : "unknown");
  }
}

export async function enqueuePing(orgId: string, endpointId: string) {
  await store.enqueueWebhook(orgId, "ping", envelope("ping", { message: "Test from OrbitShelf 3D." }), `ping:${randomUUID()}`, endpointId);
}

/** Sends what is due. A failure only reschedules that one delivery. The reason shown to the customer never includes what the address replied. */
export async function deliverDueWebhooks(send: Sender = postWebhook, now = Date.now()) {
  for (const d of await store.claimWebhookDeliveries(10)) {
    let status: number | null = null;
    let error: string | null = null;
    try {
      const timestamp = Math.floor(now / 1000);
      status = await send(d.url, d.payload, {
        "Content-Type": "application/json",
        "User-Agent": "OrbitShelf-Webhooks/1",
        "OrbitShelf-Delivery": d.id,
        "OrbitShelf-Signature": signWebhook(decryptSecret(d.secretEnc), timestamp, d.payload),
      });
      if (status < 200 || status >= 300) error = `The address answered HTTP ${status}.`;
    } catch (e) {
      error = (e as NodeJS.ErrnoException).code === "ENOTPUBLIC" ? "This address is not public." : "The address could not be reached.";
    }
    const delay = RETRY_DELAYS_MS[d.attempts - 1];
    await store.recordWebhookResult(d.id, {
      deliveredAt: error ? null : new Date(now).toISOString(),
      lastStatus: status,
      lastError: error,
      nextAttemptAt: error && delay !== undefined ? new Date(now + delay).toISOString() : null,
    });
  }
}
