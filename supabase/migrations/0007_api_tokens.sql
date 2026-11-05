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
