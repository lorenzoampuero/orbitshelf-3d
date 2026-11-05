-- OrbitShelf 3D — Multi-tenant schema + Row Level Security (RLS)
-- Compatible with PostgreSQL 15+ / Supabase / PGlite

CREATE SCHEMA IF NOT EXISTS app;

-- Session helper: reads the authenticated user UUID from the Supabase JWT claims
-- (request.jwt.claims, or the legacy request.jwt.claim.sub) or, for local/PGlite tests, app.current_user_id.
CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    NULLIF(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', '')::uuid,
    NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid,
    NULLIF(current_setting('app.current_user_id', true), '')::uuid
  );
$$;

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  slug text NOT NULL UNIQUE CHECK (char_length(slug) BETWEEN 2 AND 80),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

CREATE OR REPLACE FUNCTION app.is_org_member(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.org_id = target_org_id
      AND m.user_id = app.current_user_id()
  );
$$;

CREATE TABLE IF NOT EXISTS public.plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  monthly_attempts integer NOT NULL CHECK (monthly_attempts >= 0),
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES public.plans(id),
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'trialing', 'active', 'canceled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id)
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 75),
  sku text NOT NULL DEFAULT '' CHECK (char_length(sku) <= 64),
  category text NOT NULL DEFAULT 'home-decor' CHECK (category IN ('home-decor', 'lighting', 'furniture', 'accessories', 'other')),
  width_mm numeric(10, 2) CHECK (width_mm IS NULL OR width_mm > 0),
  height_mm numeric(10, 2) CHECK (height_mm IS NULL OR height_mm > 0),
  depth_mm numeric(10, 2) CHECK (depth_mm IS NULL OR depth_mm > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.asset_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  storage_key text NOT NULL,
  mime_type text NOT NULL CHECK (mime_type IN ('image/png', 'image/jpeg', 'image/webp')),
  width_px integer NOT NULL CHECK (width_px BETWEEN 256 AND 8192),
  height_px integer NOT NULL CHECK (height_px BETWEEN 256 AND 8192),
  sha256 text NOT NULL CHECK (char_length(sha256) = 64),
  rights_confirmed boolean NOT NULL DEFAULT true CHECK (rights_confirmed = true),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.asset_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  upload_id uuid REFERENCES public.asset_uploads(id) ON DELETE SET NULL,
  provider text NOT NULL CHECK (provider IN ('demo', 'sloyd')),
  provider_job_id text,
  state text NOT NULL CHECK (state IN ('queued', 'pending', 'running', 'success', 'error')),
  texture_resolution text CHECK (texture_resolution IN ('none', '512', '1k', '2k')),
  estimated_provider_credits integer NOT NULL DEFAULT 0 CHECK (estimated_provider_credits >= 0),
  failure_code text,
  failure_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.asset_jobs(id) ON DELETE SET NULL,
  source text NOT NULL CHECK (source IN ('demo', 'sloyd')),
  provenance text NOT NULL CHECK (provenance IN ('demo-sample', 'ai-generated')),
  status text NOT NULL CHECK (status IN ('processing', 'ready', 'failed', 'approved', 'rejected')),
  review_state text NOT NULL DEFAULT 'pending' CHECK (review_state IN ('pending', 'approved', 'rejected')),
  review_checklist jsonb NOT NULL DEFAULT '{"shape":false,"surfaces":false,"hiddenAngles":false,"material":false,"labels":false}'::jsonb,
  review_note text NOT NULL DEFAULT '' CHECK (char_length(review_note) <= 500),
  storage_key text,
  file_size_bytes integer CHECK (file_size_bytes IS NULL OR file_size_bytes >= 28),
  file_sha256 text CHECK (file_sha256 IS NULL OR char_length(file_sha256) = 64),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.viewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.usage_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.asset_jobs(id) ON DELETE SET NULL,
  delta integer NOT NULL CHECK (delta <> 0),
  reason text NOT NULL CHECK (reason IN ('local_cap_grant', 'job_debit', 'job_refund')),
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security on every table exposed through the Supabase API
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans FORCE ROW LEVEL SECURITY;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships FORCE ROW LEVEL SECURITY;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;

ALTER TABLE public.asset_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_uploads FORCE ROW LEVEL SECURITY;

ALTER TABLE public.asset_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_jobs FORCE ROW LEVEL SECURITY;

ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models FORCE ROW LEVEL SECURITY;

ALTER TABLE public.viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewers FORCE ROW LEVEL SECURITY;

ALTER TABLE public.usage_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_ledger FORCE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY org_member_select ON public.organizations
  FOR SELECT USING (app.is_org_member(id));

CREATE POLICY memberships_self_select ON public.memberships
  FOR SELECT USING (user_id = app.current_user_id() OR app.is_org_member(org_id));

-- Plans are a public catalogue: anyone may read, nobody writes through the API.
CREATE POLICY plans_public_select ON public.plans
  FOR SELECT USING (true);

-- Billing, jobs and the attempt ledger are written only by the server (service role, which bypasses RLS).
-- Members can read their own rows but cannot grant themselves plans, attempts or job states.
CREATE POLICY subscriptions_org_select ON public.subscriptions
  FOR SELECT USING (app.is_org_member(org_id));

CREATE POLICY products_org_all ON public.products
  FOR ALL USING (app.is_org_member(org_id)) WITH CHECK (app.is_org_member(org_id));

CREATE POLICY asset_uploads_org_all ON public.asset_uploads
  FOR ALL USING (app.is_org_member(org_id)) WITH CHECK (app.is_org_member(org_id));

CREATE POLICY asset_jobs_org_select ON public.asset_jobs
  FOR SELECT USING (app.is_org_member(org_id));

CREATE POLICY models_org_all ON public.models
  FOR ALL USING (app.is_org_member(org_id)) WITH CHECK (app.is_org_member(org_id));

CREATE POLICY viewers_org_all ON public.viewers
  FOR ALL USING (app.is_org_member(org_id)) WITH CHECK (app.is_org_member(org_id));

CREATE POLICY usage_ledger_org_select ON public.usage_ledger
  FOR SELECT USING (app.is_org_member(org_id));

-- Create an application role without BYPASSRLS so tests and connections verify policies strictly
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated_tenant') THEN
    CREATE ROLE authenticated_tenant NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public, app TO authenticated_tenant;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO authenticated_tenant;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated_tenant;

-- Supabase's API roles must be able to evaluate the policy helpers (the roles do not exist in PGlite).
-- anon always evaluates to "not a member", so it reads nothing but gets an empty result instead of an error.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    GRANT USAGE ON SCHEMA app TO authenticated, anon;
    GRANT EXECUTE ON FUNCTION app.current_user_id(), app.is_org_member(uuid) TO authenticated, anon;
  END IF;
END
$$;
