import { createHmac } from "node:crypto";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const PORT = Number(process.env.MOCK_SLOYD_PORT || 3999);
const EXPECTED_ID = "test-client-id-secret-check";
const EXPECTED_SECRET = "test-client-secret-never-leak";

type JobMeta = {
  id: string;
  polls: number;
  outcome: "success" | "error";
};

const CREATE_ENDPOINTS = new Set(["/api/jobs/image-to-3d", "/api/jobs/multi-image-to-3d", "/api/jobs/text-to-3d"]);
const created: { endpoint: string; parts: string[]; prompt?: string }[] = [];
function safePrompt(body: string): string | undefined {
  try {
    const p = (JSON.parse(body) as { prompt?: unknown }).prompt;
    return typeof p === "string" ? p : undefined;
  } catch {
    return undefined;
  }
}

const shopifyState = { uploads: 0, statusChecks: 0, attached: [] as string[] };
const jobs = new Map<string, JobMeta>();
let nextCreateStatus: number | null = null;
let nextJobOutcome: "success" | "error" = "success";
let counter = 1001;

function hasValidAuth(headers: Record<string, string | string[] | undefined>): boolean {
  return (
    headers["x-client-id"] === EXPECTED_ID &&
    headers["x-client-secret"] === EXPECTED_SECRET
  );
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/__control") {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    if ("nextCreateStatus" in body) nextCreateStatus = body.nextCreateStatus;
    if ("nextJobOutcome" in body) nextJobOutcome = body.nextJobOutcome;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, nextCreateStatus, nextJobOutcome }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/__created") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ created }));
    return;
  }

  // fal's queue: the submit path has the whole model id, status and result use only owner/app, and the client must use the URLs it is given.
  if (url.pathname.startsWith("/fal/")) {
    if (req.headers.authorization !== "Key test-fal-key-never-leak") {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ detail: "Unauthorized" }));
      return;
    }
    const send = (status: number, body: unknown) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };
    const reqMatch = url.pathname.match(/^\/fal\/fal-ai\/hyper3d\/requests\/([^/]+)(\/status)?$/);
    if (req.method === "POST" && url.pathname === "/fal/fal-ai/hyper3d/rodin/v2.5") {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      const input = JSON.parse(Buffer.concat(chunks).toString("utf8")) as { image_urls?: string[]; geometry_file_format?: string };
      created.push({ endpoint: "fal/rodin-2.5", parts: [`images:${input.image_urls?.length ?? 0}`, `format:${input.geometry_file_format}`] });
      const id = `mock-fal-${counter++}`;
      jobs.set(id, { id, polls: 0, outcome: nextJobOutcome });
      nextJobOutcome = "success";
      const base = `http://127.0.0.1:${PORT}/fal/fal-ai/hyper3d/requests/${id}`;
      send(200, { request_id: id, status_url: `${base}/status`, response_url: base, cancel_url: `${base}/cancel` });
      return;
    }
    if (req.method === "GET" && reqMatch) {
      const job = jobs.get(reqMatch[1]);
      if (!job) return send(404, { detail: "Not found" });
      if (reqMatch[2]) {
        job.polls += 1;
        if (job.polls === 1) return send(200, { status: "IN_PROGRESS" });
        return send(200, job.outcome === "error" ? { status: "COMPLETED", error: "Mesh reconstruction failed." } : { status: "COMPLETED" });
      }
      return send(200, { model_mesh: { url: `http://127.0.0.1:${PORT}/results/${job.id}.glb` }, textures: [], seed: 1 });
    }
    return send(404, { detail: "Not found" });
  }

  // Shopify: OAuth, the Admin GraphQL calls this app makes, and the staged upload target.
  const shopifyMatch = url.pathname.match(/^\/shopify\/([^/]+\.myshopify\.com)(\/.*)$/);
  if (shopifyMatch) {
    const [, shop, rest] = shopifyMatch;
    const send = (status: number, body: unknown) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const raw = Buffer.concat(chunks);
    if (rest === "/admin/oauth/authorize") {
      // Stands in for the merchant approving: signs the redirect exactly as Shopify documents it.
      const params = new URLSearchParams({ code: "test-oauth-code", shop, state: url.searchParams.get("state") ?? "", timestamp: "1800000000" });
      const message = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("&");
      params.set("hmac", createHmac("sha256", "test-shopify-secret-never-leak").update(message).digest("hex"));
      res.writeHead(302, { Location: `${url.searchParams.get("redirect_uri")}?${params}` });
      res.end();
      return;
    }
    if (rest === "/admin/oauth/access_token") {
      const form = new URLSearchParams(raw.toString("utf8"));
      if (form.get("client_secret") !== "test-shopify-secret-never-leak" || form.get("code") !== "test-oauth-code" || form.get("expiring") !== "1") return send(400, { error: "bad" });
      return send(200, { access_token: "test-shopify-token-never-leak", refresh_token: "test-refresh", expires_in: 3600, scope: "read_products,write_products,write_files" });
    }
    if (rest === "/upload") {
      shopifyState.uploads += 1;
      res.writeHead(204);
      res.end();
      return;
    }
    if (rest.endsWith("/graphql.json")) {
      if (req.headers["x-shopify-access-token"] !== "test-shopify-token-never-leak") return send(401, { errors: "unauthorized" });
      const { query, variables } = JSON.parse(raw.toString("utf8")) as { query: string; variables: Record<string, unknown> };
      if (query.includes("productCreateMedia") || query.includes("productSet")) return send(200, { errors: [{ message: "Must not use replacing or deprecated mutations" }] });
      if (query.includes("products(")) return send(200, { data: { products: { nodes: [{ id: "gid://shopify/Product/111", title: "Oak Chair", status: "ACTIVE", featuredMedia: null }, { id: "gid://shopify/Product/222", title: "Grey Hoodie", status: "DRAFT", featuredMedia: null }] } } });
      if (query.includes("stagedUploadsCreate")) {
        const input = (variables.input as { resource: string; mimeType: string; fileSize: string }[])[0];
        if (input.resource !== "MODEL_3D" || !input.fileSize || input.mimeType !== "model/gltf-binary") return send(200, { data: { stagedUploadsCreate: { stagedTargets: [], userErrors: [{ message: "bad input" }] } } });
        return send(200, { data: { stagedUploadsCreate: { stagedTargets: [{ url: `http://127.0.0.1:${PORT}/shopify/${shop}/upload`, resourceUrl: "https://staged.test/x.glb", parameters: [{ name: "key", value: "x" }] }], userErrors: [] } } });
      }
      if (query.includes("fileCreate")) return send(200, { data: { fileCreate: { files: [{ id: "gid://shopify/Model3d/999" }], userErrors: [] } } });
      if (query.includes("fileStatus")) {
        shopifyState.statusChecks += 1;
        return send(200, { data: { node: { fileStatus: shopifyState.statusChecks < 2 ? "PROCESSING" : "READY", fileErrors: [] } } });
      }
      if (query.includes("fileUpdate")) {
        shopifyState.attached.push(((variables.files as { referencesToAdd: string[] }[])[0].referencesToAdd ?? [])[0]);
        return send(200, { data: { fileUpdate: { files: [{ id: "gid://shopify/Model3d/999" }], userErrors: [] } } });
      }
      return send(200, { errors: [{ message: "Unexpected query" }] });
    }
    return send(404, {});
  }
  if (req.method === "GET" && url.pathname === "/__shopify") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(shopifyState));
    return;
  }

  if (req.method === "POST" && CREATE_ENDPOINTS.has(url.pathname)) {
    if (!hasValidAuth(req.headers)) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Unauthorized credentials" }));
      return;
    }
    // Drain request body
    const bodyChunks: Buffer[] = [];
    for await (const chunk of req) {
      bodyChunks.push(chunk as Buffer);
    }
    const bodyText = Buffer.concat(bodyChunks).toString("latin1");
    // Which multipart parts (or JSON prompt) the app really sent, so E2E can assert the right endpoint and fields were used.
    const parts = [...bodyText.matchAll(/name="([A-Za-z]+)"/g)].map((m) => m[1]);
    created.push({ endpoint: url.pathname.replace("/api/jobs/", ""), parts, ...(url.pathname.endsWith("text-to-3d") ? { prompt: safePrompt(bodyText) } : {}) });
    if (nextCreateStatus !== null) {
      const code = nextCreateStatus;
      nextCreateStatus = null;
      res.writeHead(code, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message:
            code === 402
              ? "Insufficient prepaid credits on provider account"
              : code === 429
                ? "Maximum 5 concurrent jobs reached"
                : "Provider error",
        }),
      );
      return;
    }

    const jobId = `mock-job-${counter++}`;
    jobs.set(jobId, { id: jobId, polls: 0, outcome: nextJobOutcome });
    nextJobOutcome = "success";
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ jobId }));
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/jobs/")) {
    if (!hasValidAuth(req.headers)) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Unauthorized credentials" }));
      return;
    }
    const jobId = decodeURIComponent(url.pathname.replace("/api/jobs/", ""));
    const job = jobs.get(jobId);
    if (!job) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Job not found" }));
      return;
    }
    job.polls += 1;
    if (job.polls === 1) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ id: job.id, status: "running" }));
      return;
    }
    if (job.outcome === "error") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          id: job.id,
          status: "error",
          errorMessage: "Mesh reconstruction failed on transparent geometry.",
        }),
      );
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        id: job.id,
        status: "success",
      }),
    );
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/results/") && url.pathname.endsWith(".glb")) {
    const glbPath = path.join(process.cwd(), "public", "demo", "lamp.glb");
    const glb = await readFile(glbPath);
    res.writeHead(200, {
      "Content-Type": "model/gltf-binary",
      "Content-Length": String(glb.byteLength),
    });
    res.end(glb);
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Not found" }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[mock-sloyd] listening on http://127.0.0.1:${PORT}`);
});
