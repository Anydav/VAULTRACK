import { supabase } from "../config/supabase.js";
import { CreateAccountInput, UpdateAccountInput } from "../types/account.types.js";

export async function createAccount(input: CreateAccountInput) {
  const { userId, name, accountType, currency } = input;

  const { data, error } = await supabase
    .from("accounts")
    .insert({
      user_id: userId,
      name,
      account_type: accountType,
      currency,
    })
    .select("id, user_id, name, account_type, currency, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getUserAccounts(userId: string) {
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, account_type, currency, created_at")
    .eq("user_id", userId)
    .is("removed_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateAccount(userId: string, accountId: string, changes: UpdateAccountInput) {
  const update: Record<string, unknown> = {};

  if (changes.name !== undefined) update.name = changes.name;
  if (changes.accountType !== undefined) update.account_type = changes.accountType;
  if (changes.currency !== undefined) update.currency = changes.currency;

  const { data, error } = await supabase
    .from("accounts")
    .update(update)
    .eq("id", accountId)
    .eq("user_id", userId)
    .is("removed_at", null)
    .select("id, name, account_type, currency, created_at")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Account not found");
  }

  return data;
}

// Marks the account removed and takes its holdings out of the portfolio. Its
// transactions are kept for History (remove_account database function).
export async function removeAccount(userId: string, accountId: string) {
  const { data: removed, error } = await supabase.rpc("remove_account", {
    p_account_id: accountId,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!removed) {
    throw new Error("Account not found");
  }
}
