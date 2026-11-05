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
