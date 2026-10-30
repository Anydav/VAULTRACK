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

// Deletes the account with all its transactions and holdings (delete_account
// database function, all-or-nothing).
export async function deleteAccount(userId: string, accountId: string) {
  const { data: deleted, error } = await supabase.rpc("delete_account", {
    p_account_id: accountId,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!deleted) {
    throw new Error("Account not found");
  }
}
