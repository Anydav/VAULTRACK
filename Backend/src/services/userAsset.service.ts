import { supabase } from "../config/supabase.js";
import { CreateUserAssetInput } from "../types/userAsset.types.js";
import { getExchangeRate, convertCurrency } from "./currency.service.js";

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

  const { data, error } = await supabase
    .from("user_assets")
    .insert({
      user_id: userId,
      account_id: accountId,
      asset_id: assetId,
      quantity,
      cost_price: costPrice,
      cost_currency: costCurrency,
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
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("preferred_currency")
    .eq("id", userId)
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const baseCurrency = "USD";
  const displayCurrency = profile?.preferred_currency || "USD";
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
      },
    };
  });

  return enrichedUserAssets;
}