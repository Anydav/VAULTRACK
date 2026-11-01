-- Remove instead of delete: accounts and transactions get a removed_at date
-- and are kept, so the History page can still show them.
-- Runs as one transaction: if any step fails, nothing changes.
begin;

-- Step 1: empty = active, a date = removed on that day
alter table public.accounts add column removed_at timestamptz;
alter table public.transactions add column removed_at timestamptz;

-- Step 2: holdings count only active transactions on active accounts.
-- Same function as in 20261030000000_transactions_model.sql; only the
-- query at the top of the loop changes.
create or replace function public.recalculate_holding(p_account_id uuid, p_asset_id uuid)
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
    select tx.* from public.transactions tx
    join public.accounts a on a.id = tx.account_id
    where tx.account_id = p_account_id and tx.asset_id = p_asset_id
      and tx.removed_at is null and a.removed_at is null
      and tx.type in ('buy', 'sell', 'transfer_in', 'transfer_out')
    order by tx.occurred_at, tx.created_at, tx.id
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

-- Step 3: replace delete_account with remove_account
drop function public.delete_account(uuid, uuid);

-- Marks an account removed and takes its holdings out of the portfolio.
-- Its transactions are kept, unchanged, for the History page.
-- Returns false if the account doesn't exist, isn't this user's, or is already removed.
create function public.remove_account(p_account_id uuid, p_user_id uuid)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  update public.accounts set removed_at = now()
  where id = p_account_id and user_id = p_user_id and removed_at is null;

  if not found then
    return false;
  end if;

  delete from public.user_assets where account_id = p_account_id;
  return true;
end;
$$;

-- Only the backend (service role) may call this
revoke execute on function public.remove_account(uuid, uuid) from public, anon, authenticated;
grant execute on function public.remove_account(uuid, uuid) to service_role;

commit;
