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
