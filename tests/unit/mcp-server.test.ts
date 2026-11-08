import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { handleMcpMessage, MCP_TOOLS, type McpCall } from "@/lib/mcp-server";

const ctx = (call: McpCall = vi.fn(async () => ({ ok: true }))) => ({ call, baseUrl: "https://orbit.test" });
const rpc = (method: string, params?: unknown, id: number | null = 1) => ({ jsonrpc: "2.0", id: id ?? undefined, method, params });

describe("MCP server logic", () => {
  it("initializes with the protocol the client asked for, or the newest one it knows", async () => {
    const asked = await handleMcpMessage(rpc("initialize", { protocolVersion: "2025-03-26" }), ctx());
    expect((asked?.result as { protocolVersion: string }).protocolVersion).toBe("2025-03-26");
    const unknown = await handleMcpMessage(rpc("initialize", { protocolVersion: "1999-01-01" }), ctx());
    expect((unknown?.result as { protocolVersion: string }).protocolVersion).toBe("2025-06-18");
    expect((unknown?.result as { serverInfo: { name: string } }).serverInfo.name).toBe("orbitshelf-3d");
  });

  it("does not answer a notification, and rejects what is not JSON-RPC", async () => {
    expect(await handleMcpMessage(rpc("notifications/initialized", undefined, null), ctx())).toBeNull();
    const bad = await handleMcpMessage({ jsonrpc: "1.0", id: 3, method: "ping" }, ctx());
    expect(bad?.error?.code).toBe(-32600);
    expect((await handleMcpMessage(rpc("nope"), ctx()))?.error?.code).toBe(-32601);
  });

  it("lists every tool with a schema that refuses unknown fields, and none that buys or publishes", async () => {
    const res = await handleMcpMessage(rpc("tools/list"), ctx());
    const tools = (res?.result as { tools: { name: string; inputSchema: { additionalProperties: boolean } }[] }).tools;
    expect(tools.map((t) => t.name)).toEqual(["list_models", "quote_generation", "create_generation", "get_generation", "list_assets", "export_asset", "get_credit_balance"]);
    for (const t of tools) expect(t.inputSchema.additionalProperties).toBe(false);
    expect(tools.map((t) => t.name).join(" ")).not.toMatch(/buy|purchase|publish|checkout|delete/);
    expect(MCP_TOOLS.filter((t) => t.spends).map((t) => t.name)).toEqual(["create_generation"]);
  });

  it("never starts a paid generation without confirm: true, and does not even call the API", async () => {
    const call = vi.fn(async () => ({}));
    const args = { quoteId: "q", engineId: "sloyd", title: "x", category: "other", texture: "1k", prompt: "a wooden chair", idempotencyKey: "key-12345678", rightsAffirmed: true };
    for (const confirm of [undefined, false, "true", 1]) {
      const res = await handleMcpMessage(rpc("tools/call", { name: "create_generation", arguments: { ...args, confirm } }), ctx(call));
      expect((res?.result as { isError: boolean }).isError).toBe(true);
    }
    expect(call).not.toHaveBeenCalled();
    await handleMcpMessage(rpc("tools/call", { name: "create_generation", arguments: { ...args, confirm: true } }), ctx(call));
    // The key travels as a header, and the body keeps only what the API's strict schema accepts.
    const { idempotencyKey: _key, ...body } = args;
    expect(call).toHaveBeenCalledWith({ method: "POST", path: "/jobs", headers: { "Idempotency-Key": "key-12345678" }, body });
  });

  it("turns a refusal from the API into a tool error, not a protocol error", async () => {
    const call: McpCall = async () => {
      throw new Error("This token does not have the credits:read permission.");
    };
    const res = await handleMcpMessage(rpc("tools/call", { name: "get_credit_balance", arguments: {} }), ctx(call));
    expect(res?.error).toBeUndefined();
    expect(res?.result).toMatchObject({ isError: true, content: [{ type: "text", text: expect.stringContaining("credits:read") }] });
    expect((await handleMcpMessage(rpc("tools/call", { name: "no_such_tool" }), ctx()))?.error?.code).toBe(-32602);
  });

  it("encodes ids so a crafted id cannot reach another API path", async () => {
    const call = vi.fn(async () => ({ asset: { status: "ready", fileSize: 10, provenance: "demo-sample", reviewState: "pending" } }));
    await handleMcpMessage(rpc("tools/call", { name: "get_generation", arguments: { asset_id: "../credits?x=1" } }), ctx(call));
    expect(call).toHaveBeenCalledWith({ method: "GET", path: "/assets/..%2Fcredits%3Fx%3D1" });
    const missing = await handleMcpMessage(rpc("tools/call", { name: "get_generation", arguments: {} }), ctx(call));
    expect((missing?.result as { isError: boolean }).isError).toBe(true);
  });

  it("gives the download address under the server's own origin, and only for a model that is ready", async () => {
    const ready = vi.fn(async () => ({ asset: { status: "ready", fileSize: 1234, provenance: "demo-sample", reviewState: "pending" } }));
    const res = await handleMcpMessage(rpc("tools/call", { name: "export_asset", arguments: { asset_id: "abc" } }), ctx(ready));
    expect(JSON.parse((res?.result as { content: { text: string }[] }).content[0].text)).toMatchObject({ url: "https://orbit.test/api/v1/assets/abc/file", format: "glb", bytes: 1234 });
    const working = vi.fn(async () => ({ asset: { status: "processing" } }));
    const notReady = await handleMcpMessage(rpc("tools/call", { name: "export_asset", arguments: { asset_id: "abc" } }), ctx(working));
    expect((notReady?.result as { isError: boolean }).isError).toBe(true);
  });

  it("offers the same tools as the stdio script, so the two cannot drift apart", () => {
    const script = readFileSync(path.join(process.cwd(), "integrations", "mcp", "orbitshelf-mcp.mjs"), "utf8");
    const inScript = [...script.matchAll(/name:\s*"([a-z_]+)",\s*description:/g)].map((m) => m[1]);
    expect(inScript).toEqual(MCP_TOOLS.map((t) => t.name));
  });
});
