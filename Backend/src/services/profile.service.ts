import { supabase } from "../config/supabase.js";
import { UpdatePreferredCurrencyInput } from "../types/profile.type.js";

export async function updatePreferredCurrency(
  input: UpdatePreferredCurrencyInput
) {
  const { userId, currency } = input;

  const { data, error } = await supabase
    .from("profiles")
    .update({ preferred_currency: currency })
    .eq("id", userId)
    .select("id, email, full_name, preferred_currency, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
