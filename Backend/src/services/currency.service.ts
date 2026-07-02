import { supabase } from "../config/supabase.js";

export async function getExchangeRate(
  baseCurrency: string,
  targetCurrency: string
) {
  const base = baseCurrency.toUpperCase();
  const target = targetCurrency.toUpperCase();

  if (base === target) {
    return 1;
  }

  const { data, error } = await supabase
    .from("exchange_rates")
    .select("rate")
    .eq("base_currency", base)
    .eq("target_currency", target)
    .order("rate_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(`Exchange rate not found for ${base} to ${target}`);
  }

  return Number(data.rate);
}

export function convertCurrency(amount: number, rate: number) {
  return amount * rate;
}