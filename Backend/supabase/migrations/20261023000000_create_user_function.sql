-- Creates a profile and its password row in one transaction,
-- so a failed signup never leaves a profile without a password.
create or replace function public.create_user(
  p_full_name text,
  p_email text,
  p_password_hash text
)
returns json
language plpgsql
set search_path = ''
as $$
declare
  new_profile public.profiles;
begin
  -- Step 1: create the profile
  insert into public.profiles (full_name, email, preferred_currency)
  values (p_full_name, p_email, 'NGN')
  returning * into new_profile;

  -- Step 2: save the password hash, linked to the new profile
  insert into public.auth_credentials (user_id, password_hash)
  values (new_profile.id, p_password_hash);

  -- Send back the same profile fields the backend returns today
  return json_build_object(
    'id', new_profile.id,
    'email', new_profile.email,
    'full_name', new_profile.full_name,
    'preferred_currency', new_profile.preferred_currency,
    'created_at', new_profile.created_at
  );
end;
$$;

-- Only the backend (service role) may call this
revoke execute on function public.create_user(text, text, text) from public, anon, authenticated;
grant execute on function public.create_user(text, text, text) to service_role;
