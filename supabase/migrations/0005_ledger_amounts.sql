-- Jobs can cost different amounts. A capture records that a reservation became final and moves no balance, so only it may have a zero delta.

ALTER TABLE public.usage_ledger DROP CONSTRAINT IF EXISTS usage_ledger_delta_check;
ALTER TABLE public.usage_ledger DROP CONSTRAINT IF EXISTS usage_ledger_reason_check;
ALTER TABLE public.usage_ledger
  ADD CONSTRAINT usage_ledger_reason_check CHECK (reason IN ('local_cap_grant', 'plan_grant', 'job_debit', 'job_capture', 'job_refund', 'adjustment', 'expiry')),
  ADD CONSTRAINT usage_ledger_delta_check CHECK ((reason = 'job_capture' AND delta = 0) OR (reason <> 'job_capture' AND delta <> 0));
