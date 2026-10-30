import { supabase } from "../config/supabase.js";
import { CreateUserAssetInput } from "../types/userAsset.types.js";
import {getUserCurrencyContext,getExchangeRate,convertCurrency, BASE_CURRENCY} from "./currency.service.js";
import { createTransaction } from "./transaction.service.js";

const HOLDING_SELECT = `
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
      `;

export async function createUserAsset(input: CreateUserAssetInput) {
  const { userId, accountId, assetId, quantity, costPrice, costCurrency, acquiredAt } = input;

  // v2: adding an asset records a buy; the database trigger updates the holding.
  // A missing cost counts as 0, as it did in v1.
  await createTransaction({
    userId,
    accountId,
    assetId,
    type: "buy",
    quantity,
    pricePerUnit: costPrice ?? 0,
    priceCurrency: costCurrency,
    occurredAt: acquiredAt,
  });

  const { data, error } = await supabase
    .from("user_assets")
    .select(HOLDING_SELECT)
    .eq("account_id", accountId)
    .eq("asset_id", assetId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getUserAssets(
  userId: string,
  currencyContext?: { displayCurrency: string; exchangeRate: number }
) {
  const baseCurrency = BASE_CURRENCY;

  const [{ displayCurrency, exchangeRate }, { data, error }] = await Promise.all([
    currencyContext
      ? Promise.resolve(currencyContext)
      : (async () => {
          const { displayCurrency } = await getUserCurrencyContext(userId);
          const exchangeRate = await getExchangeRate(baseCurrency, displayCurrency);
          return { displayCurrency, exchangeRate };
        })(),
    supabase
    .from("user_assets")
    .select(HOLDING_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false }),
  ]);

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