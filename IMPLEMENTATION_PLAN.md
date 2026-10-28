# OrbitShelf 3D — Implementation plan

Status: written before implementation (2026-10-27). Updated at the end of the build with what was
actually delivered — see "Outcome" at the bottom and `README.md` for the demo / live / planned table.

## 1. Current working state of the supplied prototype (`../server.py` + `../public`)

Audited by running `python server.py` and `python tests/smoke.py` on Windows 10, Python 3.11.9.

| Check | Result |
| --- | --- |
| `GET /api/health` | 200, `provider: not-configured`, no secrets |
| Demo create → GLB download → list → delete (`tests/smoke.py`) | **PASS** |
| SPA routes `/`, `/pricing`, `/resources`, `/studio`, `/create`, `/library`, `/usage`, `/guide`, `/embed` | 200 (all serve `index.html`) |
| Demo GLB integrity (`vase`, `lamp`, `chair`) | Valid glTF 2.0 binary, header length = file length. **Only `POSITION` + `COLOR_0`, no normals, no materials, no textures** → they are procedural vertex-coloured samples, not photoreal products. Must be labelled as samples. |
| `start.bat` on this machine | **Fails**: it calls `py -3`, the `py` launcher is not installed here (only `python`). Also its `.env` parser sets a bogus variable for the `# comment` line. |
| Sloyd adapter | Structurally matches the documented contract (re-checked against the live docs on 2026-10-27, see §4). **Never exercised** (no credentials). |

Defects / risks found in the prototype that the rebuild must fix (not just copy):

1. **No authentication; `/models/{id}.glb` is public** with `Cache-Control: public`. No tenant isolation.
2. **Image validation trusts the data-URL MIME** (a text file or SVG labelled `image/png` passes); no decode check; EXIF/GPS is forwarded to the provider.
3. Provider errors (402/401/429/422) are all flattened to HTTP 502 with raw provider text; no payment-required UX.
4. `GET /api/models/{id}/refresh` mutates state and downloads a file (GET with side effects).
5. Polling only happens when the user clicks *Check status* — no durable worker; a closed tab means a stuck job.
6. No cost control: no confirmation of a paid job, no quota/ledger, no refund, no idempotency, no concurrency cap (Sloyd documents a 5-concurrent-job cap per key → 429).
7. GLB validated only by `glTF` magic; no length/chunk/JSON/bounds checks, no external-URI rejection.
8. `/api/models/{id}/publish` flips a `public` flag that does nothing (misleading) — removed; hosted embeds are **planned**, not shipped.
9. Hand-rolled WebGL viewer ignores materials/textures; only vertex colours. Replace with `<model-viewer>`.
10. English only, no SEO metadata per route, no a11y semantics for the dashboard, mixed hard-coded copy.
11. JSON file DB read-modify-write is guarded by a thread lock but non-atomic across processes; fine for dev only.

Flows that **must be preserved** (they work today): create demo asset → ready GLB → rotate/zoom → download →
persist across reload → delete; optional Sloyd image job with server-held secrets.

## 2. Target

New independent repository `orbitshelf-3d/` (own `.git`, nothing in common with `lorenzoampuero/fencia`).
Fencia was **not** consulted or modified: it was optional inspiration only and the work did not require it.

* Next.js App Router + React + TypeScript, Tailwind CSS, shadcn-style components on Radix, Lucide.
* `@google/model-viewer` for GLB preview (lazy loaded, loading / error / reduced-motion states).
* Zod request validation, server-side MIME + magic-byte + `sharp` decode checks, size limits.
* Locale dictionaries (`en`, `es`), `/es/...` routes for every page incl. dashboard, per-route SEO metadata, hreflang, sitemap.
* Provider adapter (Sloyd) server-only; secrets never reach the browser, responses or logs.
* Storage / data layer behind a `Store` interface. **Local adapter** (JSON + private files under `.data/`) is what
  actually runs. Supabase Postgres schema + RLS migration is delivered **and tested with PGlite** (real Postgres engine
  compiled to WASM) for cross-tenant isolation; the Supabase runtime adapter / Auth wiring is **planned** because no
  Supabase project or Docker is available in this environment, and an untested adapter would be a false claim.
* Auth: signed-cookie *local development sign-in* (no password, refuses to run in production). Supabase Auth: planned.
* Usage ledger with atomic debit, refund on verified provider failure, idempotency keys, concurrency + rate limits.
* In-process durable poller (state in the store; resumes after restart) + explicit refresh action.

### Vertical slices (priority image → AI job → review → GLB export)

1. Scaffold, tooling (lint, typecheck, vitest, playwright), design tokens, brand config.
2. Core libs with unit tests: GLB validator, image validator, Sloyd client + status normaliser, store, ledger, CSV, session.
3. API: health, auth, models (create demo / create Sloyd), job refresh, review, file download, CSV export.
4. Viewer + dashboard: create wizard → job status → 3D studio / review → library → usage.
5. Marketing site + i18n + SEO + resources.
6. Mock-provider integration tests, Playwright E2E + screenshots + axe, RLS tests, build.
7. README, env template, demo / live / planned matrix, test evidence.

## 3. Dependencies

`next`, `react`, `react-dom`, `zod`, `@google/model-viewer`, `sharp`, `lucide-react`, `class-variance-authority`, `clsx`,
`tailwind-merge`, `@radix-ui/react-slot|dialog|dropdown-menu`, `server-only`. Dev: `typescript`, `tailwindcss` +
`@tailwindcss/postcss`, `eslint` + `eslint-config-next`, `vitest`, `@playwright/test`, `@axe-core/playwright`, `@electric-sql/pglite`.

Environment note: this machine's npm fails TLS verification (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`, an interception proxy);
installs were done with `NODE_OPTIONS=--use-system-ca` (system trust store). TLS verification was **not** disabled.

## 4. Provider contract (verified against live docs 2026-10-27)

* Base `https://api.sloyd.ai/api`, headers `x-client-id`, `x-client-secret` (backend only).
* `POST /jobs/image-to-3d`, `multipart/form-data`, field `file` (≤ 20 MB at provider; local cap 8 MB),
  optional `targetFaceCount` (int, 0 = auto, max 500000), `textureResolution` (`128|256|512|1k|2k|4k|auto|none`),
  `topology` (`auto|quads|triangles`). Returns `{ jobId }`.
* `GET /jobs/{jobId}` → `status` ∈ `pending|running|success|error` (legacy `created|completed|failed`), `errorMessage` on error.
* Result GLB: public URL `https://storage.googleapis.com/ai-services-quality/jobs/{jobId}.glb` (404/incomplete = not ready).
* Errors: 401 bad keys, **402** `{available,error,message,required}` insufficient credits, 403, 404, 422, **429** (> 5 concurrent jobs per key while in test), 500.
* Charged when a job starts, refunded automatically by the provider if the job fails. Cost for image→3D: 10 base + 10 texture
  = 20 credits; 75 credits = US$1 → ≈ US$0.267 per attempt.

## 5. Risks

| Risk | Mitigation |
| --- | --- |
| No live Sloyd credentials | Mock provider implementing the documented contract; live smoke test **not** performed unless keys + prepaid credits exist; tracked in README |
| No Supabase / Docker | Schema + RLS tested in PGlite; adapter marked planned |
| AI fidelity / hallucinated surfaces | Mandatory manual review checklist before approval; disclaimers; no auto-publish |
| Provider GLB URL is public | Copy to private store, serve only through authenticated owner route |
| Cost runaway | Explicit paid-job confirmation, local attempt cap, concurrency cap, rate limit, idempotency |
| Brand / domain not cleared | Single `src/config/brand.ts`; no domain purchase; no trademark claims |
| WebGL in headless CI | Chromium with SwiftShader flags; verify actual camera orbit change |

## 6. Test list

Unit (Vitest): GLB validator (valid ×3 demo, truncated, bad magic/version/length, external URI, oversize, OOB accessor);
image validator (png/jpeg/webp ok; svg, html-as-png, truncated, tiny, huge, spoofed MIME rejected; EXIF stripped);
Sloyd client (multipart fields, headers, 402/401/422/429/5xx mapping, legacy status synonyms, secret redaction);
store + ledger (atomic debit, idempotent debit/refund, balance never negative, concurrent debits);
CSV escaping + formula-injection; session sign/verify/tamper/expiry; i18n key parity en/es; slug + filename sanitiser.

Integration (Playwright API tests vs. mock provider): create/job status/failure, 402, 429, error→refund, GLB downloaded &
validated & owner-only, upload rejection (svg, text, spoofed, oversize), unauthorized (401), cross-tenant (404), secret never
in any response or page, locale routes (`/es`), CSRF origin check.

E2E (Playwright, Chromium): home + mobile home, hero viewer loads and **camera orbit changes after a drag**, all nav links
resolve (EN + ES), login → create demo → library → reload persistence → detail → download → review/approve → delete,
invalid upload message, loading/empty/error states, keyboard-only sidebar navigation, axe checks, screenshots.

DB: PGlite applies `supabase/migrations/*.sql`; two orgs cannot read or write each other's rows; ledger idempotency unique.

## Outcome

Delivered in `orbitshelf-3d/` as an independent Git repository:

1. **Architecture & Stack**: Next.js 16.4.3 (App Router, TypeScript), React 19, Tailwind CSS v4, `@google/model-viewer`, Zod v4, `sharp`, and Lucide icons.
2. **Core Security & Validation**:
   - Strict binary glTF 2.0 validator (`src/lib/glb.ts`) checking magic header, version, byte length, 4-byte chunk alignment, JSON schema, external URI rejection, bufferView/accessor bounds, and SHA-256 hash.
   - Strict image validator (`src/lib/image.ts`) checking magic bytes against declared MIME, rejecting SVG/HTML/scripts, decoding via `sharp`, enforcing 256–8192 px and ≤8 MB limits, and stripping EXIF/GPS metadata.
   - Server-only Sloyd adapter (`src/lib/provider/sloyd.ts`) with status normalization (`pending`/`running`/`success`/`error`), HTTP 401/402/403/422/429/5xx mapping, private GLB copy, and secret redaction.
   - Atomic local store (`src/lib/store.ts`) + durable background poller (`src/lib/jobs.ts`, `src/instrumentation.ts`) + usage ledger with idempotency keys and automatic refunds on verified provider failures.
   - Multi-tenant PostgreSQL schema + Row Level Security migration (`supabase/migrations/0001_init.sql`) verified with `@electric-sql/pglite` (`tests/db/rls.test.ts`).
3. **Bilingual UI (`en` & `es`)**: Complete marketing site (`/`, `/how-it-works`, `/examples`, `/pricing`, `/resources`, `/resources/[slug]`, `/compare/ai-3d-vs-manual`, `/privacy`, `/terms`, `/login`) and workspace dashboard (`/dashboard`, `/dashboard/create`, `/dashboard/models`, `/dashboard/models/[id]`, `/dashboard/embeds`, `/dashboard/usage`, `/dashboard/billing`, `/dashboard/settings`, `/dashboard/help`) with full EN/ES dictionary parity, `hreflang`, canonical URLs, `robots.txt`, and `sitemap.xml`.
4. **Legacy Prototype Fixes**: Fixed `../start.bat` to ignore `#` comment lines in `.env` and fall back to `python` when the `py` launcher is not installed.
5. **Verification**:
   - `npm run lint` (ESLint): PASS (0 errors, 0 warnings)
   - `npm run typecheck` (`tsc --noEmit`): PASS
   - `npm run test` (Vitest unit + PGlite RLS tests): PASS (7 test files, 73 tests)
   - `npm run seed:check`: PASS (`vase.glb`, `lamp.glb`, `chair.glb`)
   - `npm run build` (Next.js production build): PASS
   - `npm run test:e2e` (Playwright E2E + API + Accessibility + Screenshots): PASS
   - Live Sloyd smoke test: **Not performed** (no real `SLOYD_CLIENT_ID` / `SLOYD_CLIENT_SECRET` with prepaid credits exist in this environment; documented in `README.md`).
