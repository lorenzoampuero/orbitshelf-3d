-- ===== 0001_init.sql =====
-- OrbitShelf 3D: schema and Row Level Security.
-- Compatible with PostgreSQL 15+, Supabase and PGlite.
--
-- The server writes everything, connecting as the table owner, which RLS does not apply to.
-- Clients that reach these tables through Supabase's API can only read their own organization's rows and can never write.
-- That keeps balances, job states and the origin of a model out of a customer's reach.

CREATE SCHEMA IF NOT EXISTS app;

-- The authenticated user: from the Supabase JWT, or app.current_user_id in tests.
CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    NULLIF(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', '')::uuid,
    NULLIF(current_setting('app.current_user_id', true), '')::uuid
  );
$$;

CREATE TABLE public.organizations (
  id text PRIMARY KEY,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.app_users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Links a Supabase Auth user to an organization. RLS decides access from this table.
CREATE TABLE public.memberships (
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  auth_user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, auth_user_id)
);
CREATE INDEX memberships_user_idx ON public.memberships (auth_user_id);

CREATE OR REPLACE FUNCTION app.is_org_member(target_org_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.org_id = target_org_id AND m.auth_user_id = app.current_user_id()
  );
$$;

CREATE TABLE public.models (
  id uuid PRIMARY KEY,
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 75),
  sku text CHECK (char_length(sku) <= 64),
  category text NOT NULL CHECK (category IN ('apparel', 'footwear', 'furniture', 'home-decor', 'lighting', 'accessories', 'other')),
  source text NOT NULL CHECK (source IN ('demo', 'ai', 'import')),
  provenance text NOT NULL CHECK (provenance IN ('demo-sample', 'ai-generated', 'imported')),
  engine_id text,
  estimated_cost_usd double precision CHECK (estimated_cost_usd IS NULL OR estimated_cost_usd >= 0),
  input_kind text CHECK (input_kind IN ('image', 'multi-image', 'text')),
  source_views text[] NOT NULL DEFAULT '{}',
  prompt text CHECK (char_length(prompt) <= 1000),
  demo_asset text,
  status text NOT NULL CHECK (status IN ('processing', 'ready', 'failed')),
  job_state text NOT NULL CHECK (job_state IN ('reserved', 'queued', 'running', 'processing', 'succeeded', 'failed', 'cancelled', 'timed_out', 'needs_review')),
  provider_job_ref text,
  provider_job_id text,
  provider_job_urls jsonb,
  idempotency_key text,
  error text,
  failure_code text,
  attempts_debited integer NOT NULL DEFAULT 0 CHECK (attempts_debited >= 0),
  attempts_refunded integer NOT NULL DEFAULT 0 CHECK (attempts_refunded >= 0),
  provider_credits_estimate integer NOT NULL DEFAULT 0 CHECK (provider_credits_estimate >= 0),
  texture_resolution text CHECK (texture_resolution IN ('none', '512', '1k', '2k')),
  review_state text NOT NULL DEFAULT 'pending' CHECK (review_state IN ('pending', 'approved', 'rejected')),
  checklist jsonb NOT NULL,
  review_note text CHECK (char_length(review_note) <= 500),
  reviewed_at timestamptz,
  width_mm double precision,
  height_mm double precision,
  depth_mm double precision,
  file_size integer CHECK (file_size IS NULL OR file_size >= 0),
  checksum text CHECK (checksum IS NULL OR char_length(checksum) = 64),
  stalled boolean NOT NULL DEFAULT false,
  rights_affirmed boolean NOT NULL DEFAULT false,
  has_source_image boolean NOT NULL DEFAULT false,
  source_image_ext text CHECK (source_image_ext IN ('png', 'jpg')),
  extra_images jsonb NOT NULL DEFAULT '[]',
  source_image_sha256 text,
  next_poll_at timestamptz,
  lease_until timestamptz,
  poll_count integer NOT NULL DEFAULT 0,
  last_polled_at timestamptz,
  last_poll_error text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);
CREATE INDEX models_org_created_idx ON public.models (org_id, created_at DESC);
CREATE UNIQUE INDEX models_org_idempotency_idx ON public.models (org_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX models_provider_job_idx ON public.models (provider_job_id) WHERE provider_job_id IS NOT NULL;
CREATE INDEX models_pollable_idx ON public.models (next_poll_at) WHERE status = 'processing';

-- What the customer used. Rows are never updated or deleted, including when a model is deleted.
CREATE TABLE public.usage_ledger (
  id uuid PRIMARY KEY,
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  model_id uuid,
  delta integer NOT NULL CHECK (delta <> 0),
  reason text NOT NULL CHECK (reason IN ('local_cap_grant', 'job_debit', 'job_refund')),
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL,
  UNIQUE (org_id, idempotency_key)
);

-- What a provider job cost OrbitShelf. One row per model: a second write cannot double-count.
CREATE TABLE public.provider_cost_events (
  id uuid PRIMARY KEY,
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  model_id uuid NOT NULL,
  engine_id text NOT NULL,
  usd double precision NOT NULL CHECK (usd >= 0),
  evidence text NOT NULL CHECK (evidence IN ('published', 'invoice')),
  created_at timestamptz NOT NULL,
  UNIQUE (org_id, model_id)
);

CREATE TABLE public.job_events (
  id uuid PRIMARY KEY,
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  model_id uuid NOT NULL,
  state text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL
);
CREATE INDEX job_events_model_idx ON public.job_events (org_id, model_id, created_at);

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY,
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  action text NOT NULL,
  model_id uuid,
  detail text,
  created_at timestamptz NOT NULL
);

-- Turns an engine off without a deploy: UPDATE or INSERT a row here. It can only disable, never enable.
CREATE TABLE public.engine_switches (
  engine_id text PRIMARY KEY,
  disabled boolean NOT NULL DEFAULT true,
  reason text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Shared across processes, unlike an in-memory counter.
CREATE TABLE public.rate_limits (
  key text NOT NULL,
  window_start bigint NOT NULL,
  hits integer NOT NULL,
  PRIMARY KEY (key, window_start)
);

-- RLS on every table. No policy means no access: only the owner (the server) reaches engine_switches and rate_limits.
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_cost_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engine_switches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY organizations_member_select ON public.organizations FOR SELECT USING (app.is_org_member(id));
CREATE POLICY memberships_self_select ON public.memberships FOR SELECT USING (auth_user_id = app.current_user_id());
CREATE POLICY app_users_member_select ON public.app_users FOR SELECT USING (app.is_org_member(org_id));
CREATE POLICY models_member_select ON public.models FOR SELECT USING (app.is_org_member(org_id));
CREATE POLICY usage_ledger_member_select ON public.usage_ledger FOR SELECT USING (app.is_org_member(org_id));
CREATE POLICY job_events_member_select ON public.job_events FOR SELECT USING (app.is_org_member(org_id));
-- provider_cost_events and audit_log have no policy on purpose: internal costs are not shown to customers.

-- Role used to test the policies strictly. It stands in for Supabase's `authenticated` role.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated_tenant') THEN
    CREATE ROLE authenticated_tenant NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END
$$;
GRANT USAGE ON SCHEMA public, app TO authenticated_tenant;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO authenticated_tenant;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated_tenant;

-- Supabase grants its API roles full table privileges by default. Reads stay filtered by RLS; writes are removed outright.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM authenticated, anon;
    GRANT USAGE ON SCHEMA app TO authenticated, anon;
    GRANT EXECUTE ON FUNCTION app.current_user_id(), app.is_org_member(text) TO authenticated, anon;
  END IF;
END
$$;

-- Private bucket for GLB files and source photos. Only exists on Supabase.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('orbitshelf-private', 'orbitshelf-private', false)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END
$$;

-- ===== 0002_asset_versions.sql =====
-- Each optimization creates a new version and the original is always kept.

ALTER TABLE public.models
  ADD COLUMN current_version_id uuid;

CREATE TABLE public.asset_versions (
  id uuid PRIMARY KEY,
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  preset text NOT NULL CHECK (preset IN ('original', 'web', 'store', 'game')),
  bytes integer NOT NULL CHECK (bytes >= 0),
  sha256 text NOT NULL CHECK (char_length(sha256) = 64),
  diagnostics jsonb NOT NULL,
  created_at timestamptz NOT NULL
);
CREATE INDEX asset_versions_model_idx ON public.asset_versions (org_id, model_id, created_at);
CREATE UNIQUE INDEX asset_versions_one_original_idx ON public.asset_versions (model_id) WHERE preset = 'original';

ALTER TABLE public.asset_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY asset_versions_member_select ON public.asset_versions FOR SELECT USING (app.is_org_member(org_id));

GRANT SELECT ON public.asset_versions TO authenticated_tenant;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.asset_versions FROM authenticated, anon;
  END IF;
END
$$;

-- ===== 0003_profiles.sql =====
-- Onboarding answers and the active workspace. They only change what is highlighted: never permissions, balance or accounting.

ALTER TABLE public.app_users
  ADD COLUMN use_case text CHECK (use_case IN ('commerce', 'game', 'pro', 'explore')),
  ADD COLUMN experience text CHECK (experience IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN goal text CHECK (goal IN ('photos', 'text', 'assets', 'publish')),
  ADD COLUMN active_workspace text CHECK (active_workspace IN ('commerce', 'game', 'pro', 'explore')),
  ADD COLUMN onboarded_at timestamptz,
  ADD COLUMN onboarding_skipped_at timestamptz;

-- ===== 0004_library_embeds.sql =====
-- Projects, tags, favorites, trash and thumbnails for the library, and revocable public viewers.

CREATE TABLE public.projects (
  id uuid PRIMARY KEY,
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  created_at timestamptz NOT NULL
);
CREATE INDEX projects_org_idx ON public.projects (org_id, created_at);

ALTER TABLE public.models
  ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN favorite boolean NOT NULL DEFAULT false,
  ADD COLUMN has_thumbnail boolean NOT NULL DEFAULT false,
  ADD COLUMN thumbnail_ext text CHECK (thumbnail_ext IN ('png', 'jpg')),
  ADD COLUMN deleted_at timestamptz;
CREATE INDEX models_trash_idx ON public.models (deleted_at) WHERE deleted_at IS NOT NULL;

CREATE TABLE public.embeds (
  id uuid PRIMARY KEY,
  token text NOT NULL UNIQUE CHECK (char_length(token) >= 32),
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  allowed_domains text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL,
  revoked_at timestamptz
);
CREATE INDEX embeds_org_idx ON public.embeds (org_id, created_at);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY projects_member_select ON public.projects FOR SELECT USING (app.is_org_member(org_id));
CREATE POLICY embeds_member_select ON public.embeds FOR SELECT USING (app.is_org_member(org_id));

GRANT SELECT ON public.projects, public.embeds TO authenticated_tenant;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.projects, public.embeds FROM authenticated, anon;
  END IF;
END
$$;

-- ===== 0005_ledger_amounts.sql =====
-- Jobs can cost different amounts. A capture records that a reservation became final and moves no balance, so only it may have a zero delta.

ALTER TABLE public.usage_ledger DROP CONSTRAINT IF EXISTS usage_ledger_delta_check;
ALTER TABLE public.usage_ledger DROP CONSTRAINT IF EXISTS usage_ledger_reason_check;
ALTER TABLE public.usage_ledger
  ADD CONSTRAINT usage_ledger_reason_check CHECK (reason IN ('local_cap_grant', 'plan_grant', 'job_debit', 'job_capture', 'job_refund', 'adjustment', 'expiry')),
  ADD CONSTRAINT usage_ledger_delta_check CHECK ((reason = 'job_capture' AND delta = 0) OR (reason <> 'job_capture' AND delta <> 0));

-- ===== 0006_shopify.sql =====
-- A store connection and each publication. Tokens are encrypted by the server before they reach this table.

CREATE TABLE public.integrations (
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('shopify')),
  shop text NOT NULL,
  access_token_enc text NOT NULL,
  refresh_token_enc text,
  expires_at timestamptz,
  scopes text NOT NULL,
  connected_at timestamptz NOT NULL,
  revoked_at timestamptz,
  PRIMARY KEY (org_id, provider)
);
CREATE INDEX integrations_shop_idx ON public.integrations (provider, shop);

CREATE TABLE public.publications (
  id uuid PRIMARY KEY,
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  model_id uuid NOT NULL,
  checksum text NOT NULL,
  shop text NOT NULL,
  product_id text NOT NULL,
  product_title text NOT NULL,
  state text NOT NULL CHECK (state IN ('processing', 'published', 'failed')),
  remote_file_id text,
  error text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);
CREATE INDEX publications_model_idx ON public.publications (org_id, model_id, created_at);

-- RLS with no policy on integrations: tokens never reach a client, even encrypted.
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
CREATE POLICY publications_member_select ON public.publications FOR SELECT USING (app.is_org_member(org_id));

GRANT SELECT ON public.integrations, public.publications TO authenticated_tenant;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public.integrations FROM authenticated, anon;
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.publications FROM authenticated, anon;
  END IF;
END
$$;

-- ===== 0007_api_tokens.sql =====
-- Tokens for the public API. Only a hash is stored: the token itself is shown once and cannot be recovered.

CREATE TABLE public.api_tokens (
  id uuid PRIMARY KEY,
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  token_hash text NOT NULL UNIQUE CHECK (char_length(token_hash) = 64),
  prefix text NOT NULL,
  scopes text[] NOT NULL,
  created_at timestamptz NOT NULL,
  last_used_at timestamptz,
  revoked_at timestamptz
);
CREATE INDEX api_tokens_org_idx ON public.api_tokens (org_id, created_at);

-- RLS with no policy: only the server reads this table.
ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.api_tokens TO authenticated_tenant;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public.api_tokens FROM authenticated, anon;
  END IF;
END
$$;

-- ===== 0008_webhooks.sql =====
-- Signed notifications sent to an address the customer chooses. The signing secret is encrypted by the server before it reaches this table.

CREATE TABLE public.webhook_endpoints (
  id uuid PRIMARY KEY,
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  url text NOT NULL CHECK (char_length(url) BETWEEN 8 AND 500),
  secret_enc text NOT NULL,
  created_at timestamptz NOT NULL,
  disabled_at timestamptz
);
CREATE INDEX webhook_endpoints_org_idx ON public.webhook_endpoints (org_id, created_at);

-- One row per event and address. next_attempt_at is NULL once there is nothing left to try.
CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY,
  endpoint_id uuid NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event text NOT NULL,
  dedupe_key text NOT NULL,
  payload text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz,
  delivered_at timestamptz,
  last_status integer,
  last_error text,
  created_at timestamptz NOT NULL,
  UNIQUE (endpoint_id, dedupe_key)
);
CREATE INDEX webhook_deliveries_due_idx ON public.webhook_deliveries (next_attempt_at) WHERE next_attempt_at IS NOT NULL;
CREATE INDEX webhook_deliveries_org_idx ON public.webhook_deliveries (org_id, created_at);

-- RLS with no policy: only the server reads these tables.
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.webhook_endpoints, public.webhook_deliveries TO authenticated_tenant;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public.webhook_endpoints, public.webhook_deliveries FROM authenticated, anon;
  END IF;
END
$$;


-- ===== 0009_billing_events.sql =====
-- What the payment webhook and the owner's admin panel did with each payment, refund or credit change.
-- A payment that could not be credited, or a refund waiting for a manual reversal, is listed here so nothing depends on reading server logs.
-- Owner-only: RLS with no policy, so customers cannot read it.

CREATE TABLE public.billing_events (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('payment', 'refund', 'dispute', 'admin_adjustment')),
  payment_id text CHECK (payment_id IS NULL OR char_length(payment_id) <= 200),
  org_id text REFERENCES public.organizations(id) ON DELETE SET NULL,
  credits integer NOT NULL DEFAULT 0,
  outcome text NOT NULL CHECK (char_length(outcome) BETWEEN 1 AND 60),
  detail text CHECK (detail IS NULL OR char_length(detail) <= 500),
  created_at timestamptz NOT NULL
);
CREATE INDEX billing_events_created_idx ON public.billing_events (created_at DESC);
CREATE INDEX billing_events_org_idx ON public.billing_events (org_id, created_at DESC);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.billing_events TO authenticated_tenant;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public.billing_events FROM authenticated, anon;
  END IF;
END
$$;
