-- Baseline: the v1 schema as it exists in production on 2026-10-29.
-- Every statement is "if not exists" / "or replace", so running this on the
-- live database changes nothing; on an empty database it builds VAULTRACK.

-- Keeps updated_at current on every UPDATE
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Users
create table if not exists public.profiles (
  id uuid not null default gen_random_uuid(),
  email text not null,
  full_name text,
  preferred_currency text default 'NGN'::text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email)
);
create index if not exists idx_profiles_created_at on public.profiles (created_at);

-- Password hashes, kept off profiles
create table if not exists public.auth_credentials (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  password_hash text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint auth_credentials_pkey primary key (id),
  constraint auth_credentials_user_id_key unique (user_id),
  constraint auth_credentials_user_id_fkey foreign key (user_id) references public.profiles (id) on delete cascade
);
create index if not exists idx_auth_credentials_user_id on public.auth_credentials (user_id);

-- Where a user holds assets ("Custodian" in the UI)
create table if not exists public.accounts (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  account_type text not null,
  currency text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint accounts_pkey primary key (id),
  constraint accounts_user_id_fkey foreign key (user_id) references public.profiles (id)
);
create index if not exists idx_accounts_user_id on public.accounts (user_id);

-- Shared catalog of crypto and NGX assets
create table if not exists public.assets (
  id uuid not null default gen_random_uuid(),
  symbol text not null,
  name text not null,
  asset_type text not null,
  market text not null,
  currency text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  external_id text,
  constraint assets_pkey primary key (id),
  constraint assets_market_external_id_unique unique (market, external_id)
);
create index if not exists idx_assets_market on public.assets (market);
create index if not exists idx_assets_symbol_market on public.assets (symbol, market);

-- Latest price per asset (one row per asset, in USD)
create table if not exists public.asset_prices (
  id uuid not null default gen_random_uuid(),
  asset_id uuid not null,
  price numeric not null,
  currency text not null,
  source text,
  price_time timestamptz not null,
  created_at timestamptz default now(),
  constraint asset_prices_pkey primary key (id),
  constraint asset_prices_asset_id_unique unique (asset_id),
  constraint asset_prices_asset_id_fkey foreign key (asset_id) references public.assets (id)
);
create index if not exists idx_asset_prices_asset_id on public.asset_prices (asset_id);
create index if not exists idx_asset_prices_price_time on public.asset_prices (price_time);

-- Holdings: a user's quantity of an asset in an account
create table if not exists public.user_assets (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  account_id uuid not null,
  asset_id uuid not null,
  quantity numeric not null,
  cost_price numeric,
  cost_currency text,
  acquired_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint user_assets_pkey primary key (id),
  constraint user_assets_quantity_check check (quantity >= 0),
  constraint user_assets_cost_price_check check (cost_price >= 0),
  constraint user_assets_user_id_fkey foreign key (user_id) references public.profiles (id) on delete cascade,
  constraint user_assets_account_id_fkey foreign key (account_id) references public.accounts (id) on delete cascade,
  constraint user_assets_asset_id_fkey foreign key (asset_id) references public.assets (id) on delete cascade
);
create index if not exists idx_user_assets_user_id on public.user_assets (user_id);
create index if not exists idx_user_assets_account_id on public.user_assets (account_id);
create index if not exists idx_user_assets_asset_id on public.user_assets (asset_id);

-- Cached FX rates
create table if not exists public.exchange_rates (
  id uuid not null default gen_random_uuid(),
  base_currency text not null,
  target_currency text not null,
  rate numeric not null,
  source text,
  rate_time timestamptz not null,
  created_at timestamptz default now(),
  constraint exchange_rates_pkey primary key (id),
  constraint unique_base_target unique (base_currency, target_currency)
);
create index if not exists idx_exchange_rates_base_target on public.exchange_rates (base_currency, target_currency);
create index if not exists idx_exchange_rates_rate_time on public.exchange_rates (rate_time);

-- One row per user per day
create table if not exists public.portfolio_snapshots (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  base_currency text not null default 'USD'::text,
  total_portfolio_value_base numeric not null,
  total_cost_base numeric not null,
  total_profit_loss_base numeric not null,
  snapshot_date date not null,
  created_at timestamptz not null default now(),
  constraint portfolio_snapshots_pkey primary key (id),
  constraint unique_user_snapshot unique (user_id, snapshot_date),
  constraint portfolio_snapshots_user_id_fkey foreign key (user_id) references public.profiles (id) on delete cascade
);

-- AI Q&A history
create table if not exists public.conversations (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  question text not null,
  answer text not null,
  folded_into_summary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint conversations_pkey primary key (id),
  constraint conversations_user_id_fkey foreign key (user_id) references public.profiles (id) on delete cascade
);
create index if not exists idx_conversations_user_id on public.conversations (user_id, created_at);

-- One rolling AI summary per user
create table if not exists public.user_memory (
  user_id uuid not null,
  summary_text text not null default ''::text,
  updated_at timestamptz not null default now(),
  constraint user_memory_pkey primary key (user_id),
  constraint user_memory_user_id_fkey foreign key (user_id) references public.profiles (id) on delete cascade
);

-- Created in v1 but unused by any code (0 rows). Reshaped in the transactions-model migration.
create table if not exists public.transactions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  account_id uuid not null,
  asset_id uuid,
  transaction_type text not null,
  quantity numeric,
  price_per_unit numeric,
  currency text not null,
  total_amount numeric,
  transaction_date timestamptz default now(),
  notes text,
  created_at timestamptz default now(),
  constraint transactions_pkey primary key (id),
  constraint transactions_user_id_fkey foreign key (user_id) references public.profiles (id),
  constraint transactions_account_id_fkey foreign key (account_id) references public.accounts (id),
  constraint transactions_asset_id_fkey foreign key (asset_id) references public.assets (id)
);
create index if not exists idx_transactions_user_id on public.transactions (user_id);
create index if not exists idx_transactions_account_id on public.transactions (account_id);
create index if not exists idx_transactions_asset_id on public.transactions (asset_id);
create index if not exists idx_transactions_transaction_date on public.transactions (transaction_date);

-- updated_at triggers (user_assets has the column but no trigger in production; kept as-is)
create or replace trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create or replace trigger trg_accounts_updated_at before update on public.accounts
  for each row execute function public.set_updated_at();
create or replace trigger trg_assets_updated_at before update on public.assets
  for each row execute function public.set_updated_at();
