import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Next.js injects inline bootstrap scripts, so 'unsafe-inline' is needed until nonce-based CSP is adopted.
// model-viewer decodes GLBs through blob: URLs and may fetch its Draco/Meshopt decoders from gstatic.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isProd ? "" : " 'unsafe-eval'"} https://www.gstatic.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' blob: data: https://www.gstatic.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["sharp", "pg", "draco3dgltf", "meshoptimizer", "@gltf-transform/core", "@gltf-transform/functions", "@gltf-transform/extensions"],
  turbopack: {
    root: __dirname,
  },
  async headers() {
    // The public viewer sets its own headers, because it is the one page other sites may frame.
    return [{ source: "/((?!embed/).*)", headers: securityHeaders }];
  },
};

export default nextConfig;
