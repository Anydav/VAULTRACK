-- v2 transactions model: transactions become the source of truth and
-- user_assets becomes a cache recalculated from them.
-- Runs once, as one transaction: if any step fails, nothing changes.
begin;

-- Step 1: keep an untouched copy of the v1 holdings
create table public.user_assets_v1_backup as select * from public.user_assets;
alter table public.user_assets_v1_backup enable row level security;

-- Step 2: v1 costs are copied as-is below, so stop if any isn't in USD
do $$
begin
  if exists (select 1 from public.user_assets
             where cost_currency is not null and cost_currency <> 'USD') then
    raise exception 'Found a holding whose cost is not in USD; migration stopped';
  end if;
end;
$$;

-- Step 3: replace the unused v1 transactions table (0 rows)
drop table public.transactions;

create table public.transactions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  account_id uuid not null,
  asset_id uuid,
  type text not null,
  quantity numeric,
  price_per_unit numeric,
  price_currency text not null,
  fx_rate_to_usd numeric not null,
  occurred_at timestamptz not null default now(),
  source text not null default 'manual',
  external_id text,
  import_batch_id uuid,
  transfer_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_pkey primary key (id),
  constraint transactions_type_check check (type in (
    'buy', 'sell', 'deposit', 'withdrawal', 'dividend', 'interest', 'transfer_in', 'transfer_out')),
  -- buys, sells and transfers need an asset, a positive quantity and a price
  constraint transactions_position_check check (
    type not in ('buy', 'sell', 'transfer_in', 'transfer_out')
    or (asset_id is not null and quantity > 0 and price_per_unit >= 0)),
  constraint transactions_fx_rate_check check (fx_rate_to_usd > 0),
  constraint transactions_external_id_unique unique (account_id, source, external_id),
  constraint transactions_user_id_fkey foreign key (user_id) references public.profiles (id),
  constraint transactions_account_id_fkey foreign key (account_id) references public.accounts (id),
  constraint transactions_asset_id_fkey foreign key (asset_id) references public.assets (id)
);
create index idx_transactions_user_id on public.transactions (user_id);
create index idx_transactions_account_asset on public.transactions (account_id, asset_id, occurred_at);
alter table public.transactions enable row level security;
create trigger trg_transactions_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();

-- Step 4: rebuild one holding (account + asset) from its transactions, oldest first.
-- Average cost: a buy adds quantity and cost; a sell removes quantity and the
-- same share of cost, so the average cost per unit doesn't change.
create function public.recalculate_holding(p_account_id uuid, p_asset_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  t record;
  v_user_id uuid;
  v_quantity numeric := 0;
  v_cost numeric := 0;  -- total cost of what's still held, in USD
  v_first_buy timestamptz;
begin
  for t in
    select * from public.transactions
    where account_id = p_account_id and asset_id = p_asset_id
      and type in ('buy', 'sell', 'transfer_in', 'transfer_out')
    order by occurred_at, created_at, id
  loop
    v_user_id := t.user_id;
    if t.type in ('buy', 'transfer_in') then
      v_quantity := v_quantity + t.quantity;
      v_cost := v_cost + t.quantity * t.price_per_unit * t.fx_rate_to_usd;
      v_first_buy := coalesce(v_first_buy, t.occurred_at);
    else
      if t.quantity > v_quantity then
        raise exception 'Cannot sell % when only % is held at that date', t.quantity, v_quantity;
      end if;
      v_cost := v_cost - v_cost * (t.quantity / v_quantity);
      v_quantity := v_quantity - t.quantity;
      if v_quantity = 0 then
        v_first_buy := null;  -- fully sold; a later buy starts a new holding
      end if;
    end if;
  end loop;

  if v_quantity = 0 then
    -- nothing held (no transactions, or everything sold): remove the holding
    delete from public.user_assets
    where account_id = p_account_id and asset_id = p_asset_id;
  else
    insert into public.user_assets
      (user_id, account_id, asset_id, quantity, cost_price, cost_currency, acquired_at)
    values
      (v_user_id, p_account_id, p_asset_id, v_quantity, v_cost / v_quantity, 'USD', v_first_buy)
    on conflict (account_id, asset_id) do update set
      quantity = excluded.quantity,
      cost_price = excluded.cost_price,
      cost_currency = excluded.cost_currency,
      acquired_at = excluded.acquired_at,
      updated_at = now();
  end if;
end;
$$;

revoke execute on function public.recalculate_holding(uuid, uuid) from public, anon, authenticated;
grant execute on function public.recalculate_holding(uuid, uuid) to service_role;

-- Step 5: whenever a transaction is added, edited or deleted, rebuild the holding it belongs to
-- (on an edit that moves it to another account or asset, rebuild both)
create function public.transactions_recalculate_holding()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.asset_id is not null then
    perform public.recalculate_holding(old.account_id, old.asset_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.asset_id is not null then
    perform public.recalculate_holding(new.account_id, new.asset_id);
  end if;
  return null;
end;
$$;

-- Step 6: each v1 holding becomes one buy transaction (v1 costs are already USD)
insert into public.transactions
  (user_id, account_id, asset_id, type, quantity, price_per_unit,
   price_currency, fx_rate_to_usd, occurred_at, source, notes)
select user_id, account_id, asset_id, 'buy', quantity, coalesce(cost_price, 0),
       'USD', 1, coalesce(acquired_at, created_at, now()), 'manual',
       'Migrated from v1 holding ' || id
from public.user_assets;

-- Step 7: one holding per account + asset. Keep the oldest row of each
-- duplicate pair so its id (used in /assets/<id> links) still works.
delete from public.user_assets
where id in (
  select id from (
    select id, row_number() over (
      partition by account_id, asset_id order by created_at nulls last, id) as n
    from public.user_assets
  ) ranked
  where n > 1
);
alter table public.user_assets
  add constraint user_assets_account_asset_unique unique (account_id, asset_id);

-- Step 8: rebuild every holding from its transactions
select public.recalculate_holding(account_id, asset_id)
from (select distinct account_id, asset_id from public.transactions) pairs;

-- Step 9: every account + asset must have the same quantity and total cost as before
do $$
begin
  if exists (
    select 1
    from (select account_id, asset_id, sum(quantity) as qty,
                 sum(quantity * coalesce(cost_price, 0)) as cost
          from public.user_assets_v1_backup
          group by account_id, asset_id) before
    full join (select account_id, asset_id, quantity as qty, quantity * cost_price as cost
               from public.user_assets) after
      using (account_id, asset_id)
    where after.qty is distinct from before.qty
       or abs(after.cost - before.cost) > 0.000001
  ) then
    raise exception 'Holdings changed during migration; nothing was applied';
  end if;
end;
$$;

-- Step 10: from now on, holdings follow transactions automatically
create trigger trg_transactions_recalculate_holding
  after insert or update or delete on public.transactions
  for each row execute function public.transactions_recalculate_holding();

-- Money put in minus money taken out, so charts can tell deposits from market growth.
-- Existing snapshots stay empty: v1 didn't record it.
alter table public.portfolio_snapshots add column net_invested_base numeric;

commit;
