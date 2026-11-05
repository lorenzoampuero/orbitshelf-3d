#!/usr/bin/env node
/**
 * OrbitShelf 3D MCP server (stdio, newline-delimited JSON-RPC). No dependencies: Node 22+.
 *
 *   ORBITSHELF_URL=https://your-site ORBITSHELF_API_TOKEN=os_... node orbitshelf-mcp.mjs
 *
 * Every tool goes through the public API, so it has the same limits, balance and permissions as the token.
 * It has no tool to buy anything or to publish to a store. Starting a paid job needs confirm: true, which the client must ask the person for.
 */
import { createInterface } from "node:readline";

const BASE = (process.env.ORBITSHELF_URL ?? "").replace(/\/+$/, "");
const TOKEN = process.env.ORBITSHELF_API_TOKEN ?? "";
const PROTOCOL_VERSION = "2025-06-18";

async function api(path, init = {}) {
  if (!BASE || !TOKEN) throw new Error("Set ORBITSHELF_URL and ORBITSHELF_API_TOKEN.");
  const res = await fetch(`${BASE}/api/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", ...init.headers },
    signal: AbortSignal.timeout(120_000),
    redirect: "error",
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error?.message ?? `The API returned HTTP ${res.status}.`);
  return body;
}

const obj = (properties, required = []) => ({ type: "object", properties, required, additionalProperties: false });
const id = { asset_id: { type: "string", description: "The asset's id, from list_assets or create_generation." } };

const TOOLS = [
  {
    name: "list_models",
    description: "List the 3D engines available right now, with what each can really do. Prices are published ones, not invoices.",
    inputSchema: obj({ mode: { type: "string", enum: ["image", "multi-image", "text"] } }),
    run: (a) => api(`/models${a.mode ? `?mode=${encodeURIComponent(a.mode)}` : ""}`),
  },
  {
    name: "quote_generation",
    description: "Get the cost of a generation before starting it. Returns a quote id, valid for 15 minutes, that create_generation needs.",
    inputSchema: obj({ engineId: { type: "string" }, mode: { type: "string", enum: ["image", "multi-image", "text"] }, photoCount: { type: "integer", minimum: 0 }, texture: { type: "string", enum: ["none", "512", "1k", "2k"] } }, ["engineId", "mode", "photoCount", "texture"]),
    run: (a) => api("/quotes", { method: "POST", body: JSON.stringify(a) }),
  },
  {
    name: "create_generation",
    description: "Start a generation from text. It spends balance: show the quote to the person and pass confirm: true only after they agree.",
    inputSchema: obj(
      {
        quoteId: { type: "string" },
        engineId: { type: "string" },
        title: { type: "string" },
        category: { type: "string", enum: ["apparel", "footwear", "furniture", "home-decor", "lighting", "accessories", "other"] },
        texture: { type: "string", enum: ["none", "512", "1k", "2k"] },
        prompt: { type: "string" },
        idempotencyKey: { type: "string", description: "8 to 80 characters. Reuse it when retrying, so a retry cannot pay twice." },
        rightsAffirmed: { type: "boolean" },
        confirm: { type: "boolean", description: "Must be true, after the person agreed to the cost." },
      },
      ["quoteId", "engineId", "title", "category", "texture", "prompt", "idempotencyKey", "rightsAffirmed", "confirm"],
    ),
    run: (a) => {
      if (a.confirm !== true) throw new Error("Not started: this spends balance, so the person must confirm first (confirm: true).");
      const { confirm: _c, idempotencyKey, ...body } = a;
      return api("/jobs", { method: "POST", headers: { "Idempotency-Key": String(idempotencyKey) }, body: JSON.stringify(body) });
    },
  },
  { name: "get_generation", description: "Check a generation's state and history.", inputSchema: obj(id, ["asset_id"]), run: (a) => api(`/assets/${encodeURIComponent(a.asset_id)}`) },
  { name: "list_assets", description: "List the workspace's models.", inputSchema: obj({}), run: () => api("/assets") },
  {
    name: "export_asset",
    description: "Get the address to download a model's GLB. Downloading it needs the same token.",
    inputSchema: obj(id, ["asset_id"]),
    run: async (a) => {
      const { asset } = await api(`/assets/${encodeURIComponent(a.asset_id)}`);
      if (asset.status !== "ready") throw new Error("This model is not ready yet.");
      return { url: `${BASE}/api/v1/assets/${encodeURIComponent(a.asset_id)}/file`, format: "glb", bytes: asset.fileSize, provenance: asset.provenance, reviewState: asset.reviewState };
    },
  },
  { name: "get_credit_balance", description: "Read the workspace's balance and active jobs.", inputSchema: obj({}), run: () => api("/credits") },
];

const send = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");

async function handle(msg) {
  const { id: rpcId, method, params } = msg;
  if (rpcId === undefined) return; // notifications need no reply
  const reply = (result) => send({ jsonrpc: "2.0", id: rpcId, result });
  const fail = (code, message) => send({ jsonrpc: "2.0", id: rpcId, error: { code, message } });

  if (method === "initialize") return reply({ protocolVersion: params?.protocolVersion ?? PROTOCOL_VERSION, capabilities: { tools: {} }, serverInfo: { name: "orbitshelf-3d", version: "0.1.0" } });
  if (method === "ping") return reply({});
  if (method === "tools/list") return reply({ tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) });
  if (method === "tools/call") {
    const tool = TOOLS.find((t) => t.name === params?.name);
    if (!tool) return fail(-32602, `Unknown tool: ${params?.name}`);
    try {
      const result = await tool.run(params?.arguments ?? {});
      return reply({ content: [{ type: "text", text: JSON.stringify(result, null, 2) }] });
    } catch (e) {
      return reply({ content: [{ type: "text", text: e instanceof Error ? e.message : "Unexpected error." }], isError: true });
    }
  }
  return fail(-32601, `Unknown method: ${method}`);
}

const pending = new Set();
const rl = createInterface({ input: process.stdin });
rl.on("line", (line) => {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
    return;
  }
  const p = handle(msg).finally(() => pending.delete(p));
  pending.add(p);
});
rl.on("close", async () => {
  await Promise.allSettled([...pending]);
  process.exit(0);
});
