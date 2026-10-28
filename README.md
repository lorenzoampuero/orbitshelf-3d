# OrbitShelf 3D

**OrbitShelf 3D** is an ecommerce-focused 3D product asset workflow MVP built with Next.js App Router, React, TypeScript, Tailwind CSS, `@google/model-viewer`, Zod, and `sharp`.

> **Brand notice**: *OrbitShelf 3D* is a provisional brand name configured in a single file (`src/config/brand.ts`). No trademark clearance or domain purchase has been performed.

---

## Quick Start

### Prerequisites
- **Node.js** 22+
- **npm** 10+

> **Windows TLS Note**: If your machine uses a local root CA or TLS inspection proxy (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`), set `NODE_OPTIONS=--use-system-ca` before running `npm` commands. Never disable TLS verification.

### 1. Install & Configure
```bash
cd orbitshelf-3d
cp .env.example .env
npm install
```

### 2. Run in Development
```bash
npm run dev
```
Open `http://localhost:3000` (English) or `http://localhost:3000/es` (Spanish).

### 3. Build & Run Production Server
```bash
npm run build
npm run start
```

---

## Verification & Test Commands

| Command | Description |
| --- | --- |
| `npm run lint` | Run ESLint across the repository |
| `npm run typecheck` | Run TypeScript (`tsc --noEmit`) |
| `npm run test` | Run Vitest unit tests + PGlite PostgreSQL RLS tests |
| `npm run seed:check` | Validate all demo GLB binaries (`vase.glb`, `lamp.glb`, `chair.glb`) |
| `npm run build` | Compile Next.js production build |
| `npm run test:e2e` | Run Playwright E2E + API + Accessibility + Screenshot suite |
| `npm run test:all` | Run `lint`, `typecheck`, `test`, `build`, and `test:e2e` sequentially |

---

## Environment Variables (`.env.example`)

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `SESSION_SECRET` | Recommended | Dev fallback (non-prod only) | HMAC-SHA256 secret (32+ chars) for signing workspace cookies |
| `ALLOW_LOCAL_AUTH` | No | `true` in dev, `false` in prod | Enables passwordless local workspace sign-in for preview/testing |
| `DATA_DIR` | No | `.data` | Private server directory storing `db.json`, GLB binaries, and stripped source photos |
| `LOCAL_PAID_ATTEMPT_CAP` | No | `3` | Local safety cap of paid AI generation attempts per workspace |
| `MAX_ACTIVE_JOBS_PER_ORG` | No | `2` | Maximum concurrent active Sloyd jobs per workspace (Sloyd enforces 5 per key) |
| `SLOYD_CLIENT_ID` | Optional | — | Server-only Sloyd API client ID (if omitted, app runs in Demo mode) |
| `SLOYD_CLIENT_SECRET` | Optional | — | Server-only Sloyd API client secret (never exposed to client/logs) |
| `SLOYD_API_BASE_URL` | No | `https://api.sloyd.ai/api` | Sloyd REST API base URL |
| `SLOYD_RESULT_BASE_URL` | No | `https://storage.googleapis.com/ai-services-quality/jobs/` | Sloyd result GLB base URL |

---

## Demo vs. Live vs. Planned Matrix

| Capability | Status | Details |
| --- | --- | --- |
| **Demo 3D sample workflow** (`vase`, `lamp`, `chair`) | **Demo (Real GLB files)** | Instant, free, copies verified glTF 2.0 binaries into private org storage. Explicitly labeled `Demo sample` (`demo-sample`), never described as an AI reconstruction. |
| **Interactive 3D viewer (`@google/model-viewer`)** | **Live** | Orbit, zoom, reset view, auto-rotate toggle, `prefers-reduced-motion` support, and binary `glTF` header check before render. |
| **Strict GLB binary validation (`src/lib/glb.ts`)** | **Live** | Validates magic (`glTF`), version (`2`), byte length, 4-byte chunk alignment, JSON structure, external URI rejection (prevents SSRF/path traversal), bufferView/accessor bounds, and SHA-256 checksum. |
| **Strict image validation & EXIF stripping (`src/lib/image.ts`)** | **Live** | Rejects SVG/HTML/scripts, checks magic bytes against MIME, decodes with `sharp`, enforces 256–8192 px bounds and ≤8 MB size, and re-encodes to strip EXIF/GPS metadata before provider upload. |
| **Sloyd Image-to-3D adapter (`src/lib/provider/sloyd.ts`)** | **Live (Code + Mock-tested)** | Implements `POST /jobs/image-to-3d` (`x-client-id`/`x-client-secret`), `GET /jobs/{jobId}` status normalization (`pending`/`running`/`success`/`error`), private GLB copy, 401/402/403/422/429/5xx mapping, and secret redaction. **Live smoke test against `api.sloyd.ai` was not performed** because no real `SLOYD_CLIENT_ID`/`SLOYD_CLIENT_SECRET` with prepaid credits were provided in this environment. |
| **Durable job polling & single-flight refresh (`src/lib/jobs.ts`)** | **Live** | Background poller started via `src/instrumentation.ts` plus manual `POST /api/models/[id]/refresh`. Persists poll state on disk and resumes across server restarts. |
| **Usage ledger, cost guardrails & automatic refunds** | **Live** | Atomic attempt reservation before provider call, idempotency keys, concurrency caps, and automatic refund on verified provider errors (`402`, `401`, `429`, `422`, or job `error`). Ambiguous timeouts are not auto-refunded. |
| **Mandatory 5-point review checklist & metadata** | **Live** | Requires all 5 quality checks before a model can be marked `Approved`. User-supplied dimensions (`widthMm`, `heightMm`, `depthMm`) are stored as metadata and never inferred from photos. |
| **Private authenticated GLB & CSV export** | **Live** | `GET /api/models/[id]/file` and `GET /api/export/jobs.csv` (RFC 4180 + formula-injection neutralization) scoped strictly to the authenticated workspace (`orgId`). |
| **Bilingual UI & SEO (`/` English, `/es` Spanish)** | **Live** | Full EN/ES dictionary parity across marketing and dashboard routes, `hreflang`, canonical URLs, `robots.txt`, and `sitemap.xml`. |
| **Supabase PostgreSQL schema + RLS (`supabase/migrations/0001_init.sql`)** | **Migration Delivered & PGlite-Tested / Runtime Planned** | Complete multi-tenant SQL schema and Row Level Security policies verified with `@electric-sql/pglite` (`tests/db/rls.test.ts`). Runtime uses the local atomic store (`src/lib/store.ts`); connecting a live Supabase project is **Planned**. |
| **Production authentication (Supabase Auth)** | **Planned** | Preview uses signed-cookie local development sign-in (`ALLOW_LOCAL_AUTH`), which is disabled by default in production. |
| **Billing & subscription checkout** | **Planned** | Pricing tiers on `/pricing` are transparent proposals derived from Sloyd's published credit rates (20 credits ≈ US$0.27 per textured attempt). No checkout or payment processor is connected. |
| **Public hosted embeds & CDN delivery** | **Planned** | `/dashboard/embeds` explains what is required before public embeds can be enabled (signed tokens, bandwidth/storage quotas, revocation). Models cannot be published publicly in this build. |
| **Shopify direct catalog push** | **Planned** | Listed as Planned in Settings; merchants export validated `.glb` files manually today. |
