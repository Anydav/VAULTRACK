import { supabase } from "../config/supabase.js";
import { CreateTransactionInput, TransactionFilters } from "../types/transaction.types.js";
import { getExchangeRate, BASE_CURRENCY } from "./currency.service.js";

// Records a buy or sell. The database trigger then recalculates the
// holding (user_assets) and rejects a sell bigger than what's held.
export async function createTransaction(input: CreateTransactionInput) {
  const { userId, accountId, assetId, type, quantity, pricePerUnit, priceCurrency, occurredAt, notes } = input;

  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("id")
    .eq("id", accountId)
    .eq("user_id", userId)
    .maybeSingle();

  if (accountError) {
    throw new Error(accountError.message);
  }

  if (!account) {
    throw new Error("Account not found");
  }

  // The price is kept in the currency the user paid in, with the USD rate
  // saved alongside, so this transaction's USD cost never changes later.
  const currency = (priceCurrency ?? BASE_CURRENCY).toUpperCase();
  const fxRateToUsd = await getExchangeRate(currency, BASE_CURRENCY);

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      account_id: accountId,
      asset_id: assetId,
      type,
      quantity,
      price_per_unit: pricePerUnit,
      price_currency: currency,
      fx_rate_to_usd: fxRateToUsd,
      occurred_at: occurredAt,
      notes,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getTransactions(userId: string, filters: TransactionFilters = {}) {
  let query = supabase
    .from("transactions")
    .select(
      `
      id,
      type,
      quantity,
      price_per_unit,
      price_currency,
      fx_rate_to_usd,
      occurred_at,
      source,
      notes,
      created_at,
      accounts (
        id,
        name
      ),
      assets (
        id,
        symbol,
        name,
        market
      )
      `
    )
    .eq("user_id", userId)
    .order("occurred_at", { ascending: false });

  if (filters.accountId) {
    query = query.eq("account_id", filters.accountId);
  }

  if (filters.assetId) {
    query = query.eq("asset_id", filters.assetId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Money put in minus money taken out, in USD: buys add, sells subtract.
export async function getNetInvestedBase(userId: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select("type, quantity, price_per_unit, fx_rate_to_usd")
    .eq("user_id", userId)
    .in("type", ["buy", "sell"]);

  if (error) {
    throw new Error(error.message);
  }

  return data.reduce((total, t) => {
    const amountUsd = Number(t.quantity) * Number(t.price_per_unit) * Number(t.fx_rate_to_usd);
    return t.type === "buy" ? total + amountUsd : total - amountUsd;
  }, 0);
}
