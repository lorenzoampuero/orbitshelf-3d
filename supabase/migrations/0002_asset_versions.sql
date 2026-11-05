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
