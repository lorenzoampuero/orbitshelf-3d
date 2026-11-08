import type { ApiScope } from "@/lib/types";

/**
 * The OrbitShelf MCP server, as plain logic with no network of its own. A request from an agent is turned into a call to the public API (/api/v1) through `call`,
 * so every tool has the same permissions, limits and balance as the token behind it. integrations/mcp/orbitshelf-mcp.mjs is the same set of tools for clients that
 * only speak stdio; tests/unit/mcp-server.test.ts fails if the two drift apart.
 *
 * There is no tool to buy anything, to publish to a store or to change settings. Starting a paid job needs confirm: true, which the client must ask the person for.
 */

export const MCP_PROTOCOLS = ["2025-06-18", "2025-03-26", "2024-11-05"] as const;
export const MCP_SERVER_INFO = { name: "orbitshelf-3d", version: "0.1.0" } as const;

export type McpCall = (req: { method: "GET" | "POST"; path: string; body?: unknown; headers?: Record<string, string> }) => Promise<unknown>;
export type McpContext = { call: McpCall; baseUrl: string };

type Schema = Record<string, unknown>;
export type McpTool = {
  name: string;
  title: string;
  description: string;
  /** The API permission the token needs for this tool. */
  scope: ApiScope;
  /** True only for a tool that can spend balance. */
  spends: boolean;
  inputSchema: Schema;
  run: (args: Record<string, unknown>, ctx: McpContext) => Promise<unknown>;
};

const obj = (properties: Schema, required: string[] = []): Schema => ({ type: "object", properties, required, additionalProperties: false });
const assetId = { asset_id: { type: "string", description: "The asset's id, from list_assets or create_generation." } };
const MODES = ["image", "multi-image", "text"];
const TEXTURES = ["none", "512", "1k", "2k"];

function str(args: Record<string, unknown>, key: string): string {
  const v = args[key];
  if (typeof v !== "string" || !v) throw new Error(`${key} is required.`);
  return v;
}

export const MCP_TOOLS: McpTool[] = [
  {
    name: "list_models",
    title: "List engines",
    description: "List the 3D engines available right now, with what each can really do. Prices are published ones, not invoices.",
    scope: "models:read",
    spends: false,
    inputSchema: obj({ mode: { type: "string", enum: MODES } }),
    run: (a, { call }) => call({ method: "GET", path: `/models${typeof a.mode === "string" ? `?mode=${encodeURIComponent(a.mode)}` : ""}` }),
  },
  {
    name: "quote_generation",
    title: "Quote a generation",
    description: "Get the cost of a generation before starting it. Returns a quote id, valid for 15 minutes, that create_generation needs.",
    scope: "jobs:write",
    spends: false,
    inputSchema: obj(
      { engineId: { type: "string" }, mode: { type: "string", enum: MODES }, photoCount: { type: "integer", minimum: 0 }, texture: { type: "string", enum: TEXTURES } },
      ["engineId", "mode", "photoCount", "texture"],
    ),
    run: (a, { call }) => call({ method: "POST", path: "/quotes", body: a }),
  },
  {
    name: "create_generation",
    title: "Start a generation",
    description: "Start a generation from text. It spends balance: show the quote to the person and pass confirm: true only after they agree.",
    scope: "jobs:write",
    spends: true,
    inputSchema: obj(
      {
        quoteId: { type: "string" },
        engineId: { type: "string" },
        title: { type: "string" },
        category: { type: "string", enum: ["apparel", "footwear", "furniture", "home-decor", "lighting", "accessories", "other"] },
        texture: { type: "string", enum: TEXTURES },
        prompt: { type: "string" },
        idempotencyKey: { type: "string", description: "8 to 80 characters. Reuse it when retrying, so a retry cannot pay twice." },
        rightsAffirmed: { type: "boolean" },
        confirm: { type: "boolean", description: "Must be true, after the person agreed to the cost." },
      },
      ["quoteId", "engineId", "title", "category", "texture", "prompt", "idempotencyKey", "rightsAffirmed", "confirm"],
    ),
    run: (a, { call }) => {
      if (a.confirm !== true) throw new Error("Not started: this spends balance, so the person must confirm first (confirm: true).");
      const { confirm: _confirm, idempotencyKey, ...body } = a;
      return call({ method: "POST", path: "/jobs", headers: { "Idempotency-Key": String(idempotencyKey ?? "") }, body });
    },
  },
  {
    name: "get_generation",
    title: "Check a generation",
    description: "Check a generation's state and history.",
    scope: "assets:read",
    spends: false,
    inputSchema: obj(assetId, ["asset_id"]),
    run: (a, { call }) => call({ method: "GET", path: `/assets/${encodeURIComponent(str(a, "asset_id"))}` }),
  },
  { name: "list_assets", title: "List models", description: "List the workspace's models.", scope: "assets:read", spends: false, inputSchema: obj({}), run: (_a, { call }) => call({ method: "GET", path: "/assets" }) },
  {
    name: "export_asset",
    title: "Get a model's download address",
    description: "Get the address to download a model's GLB. Downloading it needs the same token.",
    scope: "assets:read",
    spends: false,
    inputSchema: obj(assetId, ["asset_id"]),
    run: async (a, { call, baseUrl }) => {
      const id = encodeURIComponent(str(a, "asset_id"));
      const { asset } = (await call({ method: "GET", path: `/assets/${id}` })) as { asset: { status: string; fileSize?: number; provenance?: string; reviewState?: string } };
      if (asset.status !== "ready") throw new Error("This model is not ready yet.");
      return { url: `${baseUrl}/api/v1/assets/${id}/file`, format: "glb", bytes: asset.fileSize, provenance: asset.provenance, reviewState: asset.reviewState };
    },
  },
  { name: "get_credit_balance", title: "Read the balance", description: "Read the workspace's balance and active jobs.", scope: "credits:read", spends: false, inputSchema: obj({}), run: (_a, { call }) => call({ method: "GET", path: "/credits" }) },
];

export type JsonRpcMessage = { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown };
export type JsonRpcResponse = { jsonrpc: "2.0"; id: string | number | null; result?: unknown; error?: { code: number; message: string } };

const isId = (v: unknown): v is string | number => typeof v === "string" || typeof v === "number";

/** Answers one JSON-RPC message. A notification (no id) gets no reply, so it returns null. */
export async function handleMcpMessage(msg: JsonRpcMessage, ctx: McpContext): Promise<JsonRpcResponse | null> {
  if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return { jsonrpc: "2.0", id: isId(msg?.id) ? msg.id : null, error: { code: -32600, message: "Invalid request" } };
  }
  if (msg.id === undefined) return null;
  if (!isId(msg.id)) return { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid request" } };
  const id = msg.id;
  const ok = (result: unknown): JsonRpcResponse => ({ jsonrpc: "2.0", id, result });
  const fail = (code: number, message: string): JsonRpcResponse => ({ jsonrpc: "2.0", id, error: { code, message } });
  const params = (msg.params && typeof msg.params === "object" ? msg.params : {}) as Record<string, unknown>;

  switch (msg.method) {
    case "initialize": {
      const asked = typeof params.protocolVersion === "string" ? params.protocolVersion : "";
      const protocolVersion = (MCP_PROTOCOLS as readonly string[]).includes(asked) ? asked : MCP_PROTOCOLS[0];
      return ok({
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: MCP_SERVER_INFO,
        instructions: "Tools for an OrbitShelf 3D workspace. Quote before generating, and never start a generation that spends balance without the person's confirmation.",
      });
    }
    case "ping":
      return ok({});
    case "tools/list":
      return ok({
        tools: MCP_TOOLS.map((t) => ({
          name: t.name,
          title: t.title,
          description: t.description,
          inputSchema: t.inputSchema,
          annotations: { title: t.title, readOnlyHint: t.scope !== "jobs:write", destructiveHint: false, openWorldHint: false },
        })),
      });
    case "tools/call": {
      const tool = MCP_TOOLS.find((t) => t.name === params.name);
      if (!tool) return fail(-32602, `Unknown tool: ${String(params.name)}`);
      const args = (params.arguments && typeof params.arguments === "object" && !Array.isArray(params.arguments) ? params.arguments : {}) as Record<string, unknown>;
      try {
        const result = await tool.run(args, ctx);
        return ok({ content: [{ type: "text", text: JSON.stringify(result, null, 2) }] });
      } catch (e) {
        return ok({ content: [{ type: "text", text: e instanceof Error ? e.message : "Unexpected error." }], isError: true });
      }
    }
    default:
      return fail(-32601, `Unknown method: ${msg.method}`);
  }
}
