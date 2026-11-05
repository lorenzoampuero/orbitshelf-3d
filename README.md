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
| `npm run test` | Run Vitest unit tests + PGlite PostgreSQL store and RLS tests |
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

## What is real today

| Capability | Status |
| --- | --- |
| Photo and GLB validation, private storage, review checklist | **Live** |
| Sloyd adapter: 1 photo, 2-4 photos, text | **Mock-tested only.** Never called with real credentials |
| fal adapter: Hunyuan 3.1 Pro, Rodin 2.5, Tripo H3.1, TRELLIS.2 | **Mock-tested only and disabled.** Enable one with `ENGINES_ENABLED` |
| Server quotes, job history, cost records at published prices | **Live.** Costs are published prices, never invoices |
| GLB import, mesh diagnostics, optimization versions, OBJ and STL export | **Live** |
| Onboarding, workspaces, Explore, generation presets | **Live.** Presets choose by published price and capability: no quality benchmark exists |
| Projects, tags, favorites, 30-day trash, real thumbnails | **Live** |
| Public viewer with revocable links and allowed sites | **Live** |
| Ledger by attempts or credits, plan simulation | **Live, no charges.** Attempts is the default (`BILLING_UNIT`) |
| Postgres store, private bucket, job leases, shared rate limit | **Tested on PGlite only.** Not yet run on a real Supabase project. See `docs/PUESTA_EN_MARCHA.md` |
| Magic-link sign-in | **Code ready, unconfirmed** with a real email |
| Shopify publishing | **Mock-tested only.** See `docs/SHOPIFY.md` |
| Public API `/api/v1`, tokens | **Live.** Starting jobs through it is off (`API_GENERATION_ENABLED`) |
| MCP server | **Tested with our own test client only** |
| Blender add-on | **Never run inside Blender** |
| Payments | **Not built.** Needs a provider, company details and an explicit decision |

More: `docs/AUDITORIA_ESTADO_ACTUAL.md`, `docs/DECISIONES_MOTORES.csv`, `docs/SIMULACION_PLANES.md`, `integrations/README.md`.
