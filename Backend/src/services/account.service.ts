import { supabase } from "../config/supabase.js";
import { CreateAccountInput } from "../types/account.types.js";

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