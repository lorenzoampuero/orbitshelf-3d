-- Onboarding answers and the active workspace. They only change what is highlighted: never permissions, balance or accounting.

ALTER TABLE public.app_users
  ADD COLUMN use_case text CHECK (use_case IN ('commerce', 'game', 'pro', 'explore')),
  ADD COLUMN experience text CHECK (experience IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN goal text CHECK (goal IN ('photos', 'text', 'assets', 'publish')),
  ADD COLUMN active_workspace text CHECK (active_workspace IN ('commerce', 'game', 'pro', 'explore')),
  ADD COLUMN onboarded_at timestamptz,
  ADD COLUMN onboarding_skipped_at timestamptz;
