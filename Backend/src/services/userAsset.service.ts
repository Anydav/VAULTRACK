import { supabase } from "../config/supabase.js";
import { CreateUserAssetInput } from "../types/userAsset.types.js";
import {getUserCurrencyContext,getExchangeRate,convertCurrency,convertAmount, BASE_CURRENCY} from "./currency.service.js";



export async function createUserAsset(input: CreateUserAssetInput) {
  
  const {
  userId,
  accountId,
  assetId,
  quantity,
  costPrice,
  costCurrency,
  acquiredAt,
} = input;

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

let normalizedCostPrice = costPrice;

if (costPrice != null && costCurrency) {
  const { amount } = await convertAmount(costPrice, costCurrency, BASE_CURRENCY);
  normalizedCostPrice = amount;
}

const { data, error } = await supabase
  .from("user_assets")
  .insert({
    user_id: userId,
    account_id: accountId,
    asset_id: assetId,
    quantity,
    cost_price: normalizedCostPrice,
    cost_currency: BASE_CURRENCY,
    acquired_at: acquiredAt,
  })
    .select(
      `
      id,
      quantity,
      cost_price,
      cost_currency,
      acquired_at,
      created_at,
      accounts (
        id,
        name,
        account_type,
        currency
      ),
      assets (
        id,
        symbol,
        name,
        asset_type,
        market,
        currency,
        external_id,
        asset_prices (
          id,
          price,
          currency,
          source,
          price_time
        )
      )
      `
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getUserAssets(userId: string) {
  const baseCurrency = BASE_CURRENCY;
  const { displayCurrency } = await getUserCurrencyContext(userId);
  const exchangeRate = await getExchangeRate(baseCurrency, displayCurrency);

  const { data, error } = await supabase
    .from("user_assets")
    .select(
      `
      id,
      quantity,
      cost_price,
      cost_currency,
      acquired_at,
      created_at,
      accounts (
        id,
        name,
        account_type,
        currency
      ),
      assets (
        id,
        symbol,
        name,
        asset_type,
        market,
        currency,
        external_id,
        asset_prices (
         id,
         price,
         currency,
         source,
         price_time
      )
      )
      `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const enrichedUserAssets = data.map((holding: any) => {
    const quantity = Number(holding.quantity);
    const costPrice = Number(holding.cost_price || 0);

    const latestPrice = Number(holding.assets?.asset_prices?.price || 0);

    const currentValueBase = quantity * latestPrice;
    const totalCostBase = quantity * costPrice;
    const profitLossBase = currentValueBase - totalCostBase;

    const profitLossPercentage =
      totalCostBase > 0 ? (profitLossBase / totalCostBase) * 100 : 0;

    return {
      ...holding,
      valuation: {
        baseCurrency,
        displayCurrency,
        exchangeRate,

        latestPrice,
        latestPriceDisplay: convertCurrency(latestPrice, exchangeRate),
        currentValueBase,
        totalCostBase,
        profitLossBase,

        currentValueDisplay: convertCurrency(currentValueBase, exchangeRate),
        totalCostDisplay: convertCurrency(totalCostBase, exchangeRate),
        profitLossDisplay: convertCurrency(profitLossBase, exchangeRate),

        profitLossPercentage,

        priceCurrency:
          holding.assets?.asset_prices?.currency || holding.assets?.currency,
        priceLastUpdated: holding.assets?.asset_prices?.price_time || null,
        // displayCurrency already exists above — this is just a reminder
        // that every *Display-suffixed field is in displayCurrency, not
        // priceCurrency. Frontend should label those fields accordingly.
      },
    };
  });

  return enrichedUserAssets;
}