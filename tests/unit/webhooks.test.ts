import { createServer, type Server } from "node:http";
import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { encryptSecret } from "@/lib/secrets";
import { emptyChecklist, emptyDimensions, nowIso, store, toWebhookDeliveryDto, toWebhookEndpointDto, type ModelRow } from "@/lib/store";
import { checkWebhookUrl, deliverDueWebhooks, emitModelEvent, enqueuePing, generateWebhookSecret, isPublicAddress, postWebhook, RETRY_DELAYS_MS, signWebhook, verifyWebhookSignature, type Sender } from "@/lib/webhooks";

const root = mkdtempSync(path.join(os.tmpdir(), "orbitshelf-hooks-"));
let n = 0;

beforeEach(() => {
  process.env.DATA_DIR = path.join(root, "t" + ++n);
  process.env.INTEGRATIONS_KEY = "unit-test-integrations-key-32-characters";
  process.env.LOCAL_PAID_ATTEMPT_CAP = "3";
});
afterEach(() => {
  delete process.env.WEBHOOK_ALLOW_INSECURE;
  delete process.env.ORBITSHELF_TEST;
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

async function setup(url = "https://hooks.example.com/in") {
  const { org } = await store.signIn(`hooks-${n}@example.com`);
  const secret = generateWebhookSecret();
  const id = crypto.randomUUID();
  await store.createWebhookEndpoint({ id, orgId: org.id, url, secretEnc: encryptSecret(secret), createdAt: nowIso(), disabledAt: null });
  return { orgId: org.id, secret, id };
}

const model = (orgId: string, status: ModelRow["status"]): ModelRow => {
  const t = nowIso();
  return {
    id: crypto.randomUUID(), orgId, title: "Chair", sku: "SKU-1", category: "furniture", source: "ai", provenance: "ai-generated", engineId: "sloyd", estimatedCostUsd: 0.27, inputKind: "image", sourceViews: [], prompt: null, demoAsset: null,
    status, jobState: "succeeded", providerJobRef: null, providerJobId: null, providerJobUrls: null, idempotencyKey: null, error: null, failureCode: null, attemptsDebited: 1, attemptsRefunded: 0, providerCreditsEstimate: 0, textureResolution: "1k",
    reviewState: "pending", checklist: emptyChecklist(), reviewNote: null, reviewedAt: null, dimensions: emptyDimensions(), fileSize: null, checksum: null, stalled: false, rightsAffirmed: true, hasSourceImage: false, sourceImageExt: null, extraImages: [],
    currentVersionId: null, projectId: null, tags: [], favorite: false, hasThumbnail: false, deletedAt: null, sourceImageSha256: null, nextPollAt: null, pollCount: 0, lastPolledAt: null, lastPollError: null, createdAt: t, updatedAt: t,
  };
};

describe("signature", () => {
  it("accepts what was signed and nothing else", () => {
    const now = 1_800_000_000;
    const header = signWebhook("s3cret", now, '{"a":1}');
    expect(verifyWebhookSignature("s3cret", header, '{"a":1}', now)).toBe(true);
    expect(verifyWebhookSignature("s3cret", header, '{"a":2}', now)).toBe(false);
    expect(verifyWebhookSignature("other", header, '{"a":1}', now)).toBe(false);
    expect(verifyWebhookSignature("s3cret", null, '{"a":1}', now)).toBe(false);
    expect(verifyWebhookSignature("s3cret", "t=1,v1=abc", '{"a":1}', now)).toBe(false);
  });

  it("rejects an old signature, so a captured delivery cannot be replayed later", () => {
    const now = 1_800_000_000;
    expect(verifyWebhookSignature("s", signWebhook("s", now - 301, "x"), "x", now)).toBe(false);
    expect(verifyWebhookSignature("s", signWebhook("s", now - 299, "x"), "x", now)).toBe(true);
  });
});

describe("where the server will send", () => {
  it.each(["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fe80::1", "fc00::1", "::ffff:127.0.0.1", "::ffff:169.254.169.254", "not-an-ip"])("refuses %s", (ip) => {
    expect(isPublicAddress(ip)).toBe(false);
  });

  it.each(["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])("accepts %s", (ip) => {
    expect(isPublicAddress(ip)).toBe(true);
  });

  it("only takes public https addresses without credentials", async () => {
    expect(await checkWebhookUrl("https://8.8.8.8/hook")).toBeNull();
    expect(await checkWebhookUrl("http://8.8.8.8/hook")).toBe("not_https");
    expect(await checkWebhookUrl("https://127.0.0.1/hook")).toBe("not_public");
    expect(await checkWebhookUrl("https://[::1]/hook")).toBe("not_public");
    expect(await checkWebhookUrl("https://169.254.169.254/latest/meta-data")).toBe("not_public");
    expect(await checkWebhookUrl("https://user:pass@8.8.8.8/hook")).toBe("invalid");
    expect(await checkWebhookUrl("nonsense")).toBe("invalid");
  });

  it("refuses to connect to a private literal address even if one got stored", async () => {
    await expect(postWebhook("https://127.0.0.1:9/x", "{}", {})).rejects.toThrow(/not public/);
    await expect(postWebhook("http://8.8.8.8/x", "{}", {})).rejects.toThrow(/https/);
  });
});

describe("delivery", () => {
  const capture = (status: number | Error) => {
    const calls: { url: string; body: string; headers: Record<string, string> }[] = [];
    const send: Sender = async (url, body, headers) => {
      calls.push({ url, body, headers });
      if (status instanceof Error) throw status;
      return status;
    };
    return { calls, send };
  };

  it("sends a finished job once, signed with the secret of that address", async () => {
    const { orgId, secret } = await setup();
    const row = model(orgId, "ready");
    await emitModelEvent(row);
    await emitModelEvent(row); // the same outcome again
    const { calls, send } = capture(200);
    const now = Date.now();
    await deliverDueWebhooks(send, now);
    await deliverDueWebhooks(send, now);
    expect(calls).toHaveLength(1);
    const body = JSON.parse(calls[0].body);
    expect(body.type).toBe("model.ready");
    expect(body.data).toMatchObject({ modelId: row.id, status: "ready", provenance: "ai-generated" });
    expect(verifyWebhookSignature(secret, calls[0].headers["OrbitShelf-Signature"], calls[0].body, Math.floor(now / 1000))).toBe(true);
    const [d] = await store.listWebhookDeliveries(orgId);
    expect(toWebhookDeliveryDto(d).state).toBe("delivered");
  });

  it("does not queue anything for a job still running or a workspace with no address", async () => {
    const { orgId } = await setup();
    await emitModelEvent(model(orgId, "processing"));
    expect(await store.listWebhookDeliveries(orgId)).toEqual([]);
    const other = await store.signIn(`none-${n}@example.com`);
    await emitModelEvent(model(other.org.id, "failed"));
    expect(await store.listWebhookDeliveries(other.org.id)).toEqual([]);
  });

  it("retries on the published schedule, then stops", async () => {
    const { orgId } = await setup();
    await emitModelEvent(model(orgId, "failed"));
    const { calls, send } = capture(500);
    // Each pass claims against the real clock, so the wait is shortened by hand.
    for (let i = 0; i < RETRY_DELAYS_MS.length + 1; i++) {
      await deliverDueWebhooks(send);
      const [d] = await store.listWebhookDeliveries(orgId);
      expect(d.attempts).toBe(i + 1);
      if (i < RETRY_DELAYS_MS.length) {
        expect(toWebhookDeliveryDto(d).state).toBe("pending");
        expect(Date.parse(d.nextAttemptAt!) - Date.now()).toBeGreaterThan(RETRY_DELAYS_MS[i] - 5_000);
        await store.recordWebhookResult(d.id, { deliveredAt: null, lastStatus: 500, lastError: d.lastError, nextAttemptAt: nowIso() });
      }
    }
    const [last] = await store.listWebhookDeliveries(orgId);
    expect(toWebhookDeliveryDto(last).state).toBe("failed");
    expect(last.lastError).toBe("The address answered HTTP 500.");
    await deliverDueWebhooks(send);
    expect(calls).toHaveLength(RETRY_DELAYS_MS.length + 1);
  });

  it("never exposes what went wrong on the other side", async () => {
    const { orgId } = await setup();
    await emitModelEvent(model(orgId, "ready"));
    await deliverDueWebhooks(capture(new Error("connect ECONNREFUSED 10.0.0.5:5432 internal-db")).send);
    const [d] = await store.listWebhookDeliveries(orgId);
    expect(d.lastError).toBe("The address could not be reached.");
  });

  it("a disabled address gets nothing more, and other workspaces cannot disable it", async () => {
    const { orgId, id } = await setup();
    await emitModelEvent(model(orgId, "ready"));
    expect(await store.disableWebhookEndpoint("org_someone_else", id)).toBe(false);
    expect(await store.disableWebhookEndpoint(orgId, id)).toBe(true);
    const { calls, send } = capture(200);
    await deliverDueWebhooks(send);
    expect(calls).toEqual([]);
    await emitModelEvent(model(orgId, "failed"));
    await deliverDueWebhooks(send);
    expect(calls).toEqual([]);
  });

  it("the data shown to the owner has neither the secret nor the payload", async () => {
    const { orgId, id } = await setup();
    await enqueuePing(orgId, id);
    const [endpoint] = await store.listWebhookEndpoints(orgId);
    const [delivery] = await store.listWebhookDeliveries(orgId);
    expect(Object.keys(toWebhookEndpointDto(endpoint))).not.toContain("secretEnc");
    expect(JSON.stringify(toWebhookDeliveryDto(delivery))).not.toContain("payload");
  });

  it("really posts over the network without following a redirect", async () => {
    process.env.ORBITSHELF_TEST = "1";
    process.env.WEBHOOK_ALLOW_INSECURE = "true";
    const seen: { url?: string; signature?: string; body: string }[] = [];
    const server: Server = createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        seen.push({ url: req.url, signature: req.headers["orbitshelf-signature"] as string, body });
        res.writeHead(302, { Location: "/elsewhere" }).end();
      });
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const { port } = server.address() as AddressInfo;
    try {
      const { orgId, secret, id } = await setup(`http://127.0.0.1:${port}/in`);
      await enqueuePing(orgId, id);
      await deliverDueWebhooks();
      expect(seen).toHaveLength(1);
      expect(seen[0].url).toBe("/in");
      expect(verifyWebhookSignature(secret, seen[0].signature ?? null, seen[0].body)).toBe(true);
      const [d] = await store.listWebhookDeliveries(orgId);
      expect(d.lastError).toBe("The address answered HTTP 302.");
      expect(toWebhookDeliveryDto(d).state).toBe("pending");
    } finally {
      await new Promise((r) => server.close(r));
    }
  });
});
