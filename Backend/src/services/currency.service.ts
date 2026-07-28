import { supabase } from "../config/supabase.js";
import axios from "axios";

export const BASE_CURRENCY = "USD";
const EXCHANGE_API_BASE_URL =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies";

export async function syncExchangeRates(baseCurrency: string = "usd") {
  const response = await axios.get(`${EXCHANGE_API_BASE_URL}/${baseCurrency}.json`);
  const rates = response.data[baseCurrency];

  if (!rates) {
    throw new Error(`No rates found for base currency ${baseCurrency}`);
  }

  const rowsToUpsert = Object.entries(rates).map(([targetCurrency, rate]) => ({
    base_currency: baseCurrency.toUpperCase(),
    target_currency: targetCurrency.toUpperCase(),
    rate: rate as number,
    rate_time: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("exchange_rates")
    .upsert(rowsToUpsert, {
      onConflict: "base_currency,target_currency",
    });

  if (error) {
    throw new Error(error.message);
  }

  return rowsToUpsert.length;
}

export async function syncExchangeRatesIfStale(staleMinutes = 60, baseCurrency = "usd") {
  const { data: latest, error } = await supabase
    .from("exchange_rates")
    .select("rate_time")
    .eq("base_currency", baseCurrency.toUpperCase())
    .order("rate_time", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if (!latest || latest.length === 0) {
    return await syncExchangeRates(baseCurrency);
  }

  const ageInMinutes =
    (Date.now() - new Date(latest[0].rate_time).getTime()) / (1000 * 60);

  if (ageInMinutes >= staleMinutes) {
    return await syncExchangeRates(baseCurrency);
  }

  return 0;
}

export async function getExchangeRate(
  baseCurrency: string,
  targetCurrency: string
) {
  const base = baseCurrency.toUpperCase();
  const target = targetCurrency.toUpperCase();

  if (base === target) {
    return 1;
  }

  await syncExchangeRatesIfStale(60, base.toLowerCase());

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
export async function getUserCurrencyContext(userId: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("preferred_currency")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    displayCurrency: profile?.preferred_currency || "USD",
  };
}

export async function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string
) {
  const rate = await getExchangeRate(fromCurrency, toCurrency);

  return {
    amount: convertCurrency(amount, rate),
    rate,
  };
}