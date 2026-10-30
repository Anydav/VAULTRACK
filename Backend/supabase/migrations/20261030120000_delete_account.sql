-- Deletes an account with all its transactions, in one transaction.
-- The transactions go in a single statement, so the holdings trigger runs once
-- they're all gone. Deleting them one by one could remove a buy before the
-- sell that needs it, and the trigger would reject that.
-- The account's holdings are removed by the trigger (nothing left to hold).
-- Returns false if the account doesn't exist or isn't this user's.
create or replace function public.delete_account(p_account_id uuid, p_user_id uuid)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.accounts where id = p_account_id and user_id = p_user_id) then
    return false;
  end if;

  delete from public.transactions where account_id = p_account_id;
  delete from public.accounts where id = p_account_id;
  return true;
end;
$$;

-- Only the backend (service role) may call this
revoke execute on function public.delete_account(uuid, uuid) from public, anon, authenticated;
grant execute on function public.delete_account(uuid, uuid) to service_role;
