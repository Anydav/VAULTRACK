-- Turn on row-level security for every table, with no policies.
-- The backend uses the secret (service_role) key, which bypasses RLS, so the app is unaffected.
-- Requests with the public anon key now see no rows and can't write any.
alter table public.profiles            enable row level security;
alter table public.auth_credentials    enable row level security;
alter table public.accounts            enable row level security;
alter table public.assets              enable row level security;
alter table public.asset_prices        enable row level security;
alter table public.user_assets         enable row level security;
alter table public.exchange_rates      enable row level security;
alter table public.portfolio_snapshots enable row level security;
alter table public.conversations       enable row level security;
alter table public.user_memory         enable row level security;
alter table public.transactions        enable row level security;
