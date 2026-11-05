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
