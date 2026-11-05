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
