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
