import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { createInterface } from "node:readline";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/** Drives the real MCP server process over stdio against a stand-in for the API. */
describe("MCP server", () => {
  let api: Server;
  let child: ChildProcessWithoutNullStreams;
  const calls: { method?: string; url?: string; auth?: string; idem?: string; body: string }[] = [];
  const waiting = new Map<number, (m: Record<string, never>) => void>();
  let next = 1;

  const rpc = (method: string, params?: unknown) =>
    new Promise<Record<string, never>>((resolve) => {
      const id = next++;
      waiting.set(id, resolve);
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
  const call = async (name: string, args: unknown = {}) => {
    const r = (await rpc("tools/call", { name, arguments: args })) as unknown as { result: { content: { text: string }[]; isError?: boolean } };
    return r.result;
  };

  beforeAll(async () => {
    api = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        calls.push({ method: req.method, url: req.url, auth: req.headers.authorization, idem: req.headers["idempotency-key"] as string | undefined, body: Buffer.concat(chunks).toString() });
        res.setHeader("Content-Type", "application/json");
        if (req.url?.startsWith("/api/v1/assets/missing")) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: { code: "not_found", message: "Asset not found." } }));
        } else if (req.url?.startsWith("/api/v1/assets/a1")) res.end(JSON.stringify({ asset: { status: "ready", fileSize: 10, provenance: "ai-generated", reviewState: "pending" }, events: [] }));
        else if (req.url === "/api/v1/credits") res.end(JSON.stringify({ balance: 3 }));
        else res.end(JSON.stringify({ ok: true }));
      });
    });
    await new Promise<void>((r) => api.listen(0, "127.0.0.1", r));
    child = spawn(process.execPath, [path.join(process.cwd(), "integrations", "mcp", "orbitshelf-mcp.mjs")], {
      env: { ...process.env, ORBITSHELF_URL: `http://127.0.0.1:${(api.address() as AddressInfo).port}`, ORBITSHELF_API_TOKEN: "os_test_token" },
    });
    createInterface({ input: child.stdout }).on("line", (line) => {
      const msg = JSON.parse(line);
      waiting.get(msg.id)?.(msg);
      waiting.delete(msg.id);
    });
  });
  afterAll(async () => {
    child.kill();
    await new Promise((r) => api.close(r));
  });

  it("completes the handshake and offers only the agreed tools", async () => {
    const init = (await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } })) as unknown as { result: { protocolVersion: string; serverInfo: { name: string } } };
    expect(init.result.serverInfo.name).toBe("orbitshelf-3d");
    expect(init.result.protocolVersion).toBe("2025-06-18");
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"); // no reply expected
    const list = (await rpc("tools/list")) as unknown as { result: { tools: { name: string; inputSchema: unknown }[] } };
    expect(list.result.tools.map((t) => t.name).sort()).toEqual(["create_generation", "export_asset", "get_credit_balance", "get_generation", "list_assets", "list_models", "quote_generation"]);
    for (const t of list.result.tools) expect(t.inputSchema).toBeTruthy();
  });

  it("sends the token to the API and returns its answer", async () => {
    const r = await call("get_credit_balance");
    expect(JSON.parse(r.content[0].text)).toEqual({ balance: 3 });
    expect(calls.at(-1)).toMatchObject({ url: "/api/v1/credits", auth: "Bearer os_test_token" });
  });

  it("will not start a paid job without confirmation", async () => {
    const before = calls.length;
    const args = { quoteId: "q", engineId: "sloyd", title: "T", category: "other", texture: "1k", prompt: "a wooden chair", idempotencyKey: "key-12345", rightsAffirmed: true, confirm: false };
    const r = await call("create_generation", args);
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toMatch(/confirm/);
    expect(calls.length).toBe(before);

    await call("create_generation", { ...args, confirm: true });
    const sent = calls.at(-1)!;
    expect(sent).toMatchObject({ method: "POST", url: "/api/v1/jobs", idem: "key-12345" });
    expect(JSON.parse(sent.body)).not.toHaveProperty("confirm");
  });

  it("reports API errors as tool errors, and unknown tools as protocol errors", async () => {
    const r = await call("get_generation", { asset_id: "missing" });
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toBe("Asset not found.");
    const unknown = (await rpc("tools/call", { name: "buy_credits", arguments: {} })) as unknown as { error: { code: number } };
    expect(unknown.error.code).toBe(-32602);
  });

  it("exports a download address that says where the file came from", async () => {
    const r = await call("export_asset", { asset_id: "a1" });
    expect(JSON.parse(r.content[0].text)).toMatchObject({ format: "glb", provenance: "ai-generated", reviewState: "pending" });
  });
});
