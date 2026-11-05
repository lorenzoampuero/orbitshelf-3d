import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, describe, expect, it } from "vitest";
import { localBlobStore, supabaseBlobStore } from "@/lib/blob";
import { sqlRateLimit } from "@/lib/rate-limit";
import { migrate, pgliteClient } from "./sql-client";

describe("rate limit in the database", () => {
  it("is shared, resets each window and says when to retry", async () => {
    const db = new PGlite();
    await migrate(db);
    const sql = pgliteClient(db);
    const t = 60_000 * 1000 + 15_000;
    expect((await sqlRateLimit(sql, "k", 2, 60_000, t)).ok).toBe(true);
    expect((await sqlRateLimit(sql, "k", 2, 60_000, t)).ok).toBe(true);
    expect(await sqlRateLimit(sql, "k", 2, 60_000, t)).toEqual({ ok: false, retryAfterSeconds: 45 });
    expect((await sqlRateLimit(sql, "other", 2, 60_000, t)).ok).toBe(true);
    expect((await sqlRateLimit(sql, "k", 2, 60_000, t + 60_000)).ok).toBe(true);
  });
});

describe("private file storage", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "orbitshelf-blob-"));
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it("local: stores, reads and deletes, and refuses keys that leave its folder", async () => {
    const blobs = localBlobStore(() => root);
    await blobs.put("files/org_a/m.glb", Buffer.from("x"), "model/gltf-binary");
    expect((await blobs.get("files/org_a/m.glb"))?.toString()).toBe("x");
    await blobs.delete("files/org_a/m.glb");
    expect(await blobs.get("files/org_a/m.glb")).toBeNull();
    for (const key of ["../outside", "files/../../outside", "/etc/passwd", "files\\x", "single"]) {
      await expect(blobs.put(key, Buffer.from("x"), "text/plain")).rejects.toThrow(/Invalid storage key/);
    }
  });

  it("Supabase: authenticates with the secret key in headers only, and treats a missing file as absent", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const responses: Response[] = [new Response("{}", { status: 200 }), new Response(new Uint8Array([1, 2]), { status: 200 }), new Response("{}", { status: 400 }), new Response("{}", { status: 200 })];
    const f = ((u: string, init?: RequestInit) => {
      calls.push({ url: String(u), init });
      return Promise.resolve(responses.shift()!);
    }) as unknown as typeof fetch;
    const blobs = supabaseBlobStore({ url: "https://p.supabase.test", secretKey: "sb_secret_abc", bucket: "orbitshelf-private" }, { fetch: f });

    await blobs.put("files/org_a/m.glb", Buffer.from("x"), "model/gltf-binary");
    expect(calls[0].url).toBe("https://p.supabase.test/storage/v1/object/orbitshelf-private/files/org_a/m.glb");
    expect(calls[0].url).not.toContain("sb_secret");
    expect(new Headers(calls[0].init?.headers).get("authorization")).toBe("Bearer sb_secret_abc");
    expect(new Headers(calls[0].init?.headers).get("x-upsert")).toBe("true");

    expect(await blobs.get("files/org_a/m.glb")).toEqual(Buffer.from([1, 2]));
    expect(await blobs.get("files/org_a/missing.glb")).toBeNull();
    await blobs.delete("files/org_a/m.glb");
    expect(calls[3].init?.method).toBe("DELETE");
  });

  it("Supabase: a real storage failure is an error, not an empty result", async () => {
    const f = (() => Promise.resolve(new Response("{}", { status: 500 }))) as unknown as typeof fetch;
    const blobs = supabaseBlobStore({ url: "https://p.supabase.test", secretKey: "k", bucket: "b" }, { fetch: f });
    await expect(blobs.get("files/a/b.glb")).rejects.toThrow(/HTTP 500/);
    await expect(blobs.put("files/a/b.glb", Buffer.from("x"), "x/y")).rejects.toThrow(/HTTP 500/);
  });
});
