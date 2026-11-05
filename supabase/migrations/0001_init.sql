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
