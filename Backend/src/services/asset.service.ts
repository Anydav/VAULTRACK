import { supabase } from "../config/supabase.js";
import { CreateAssetInput, SearchAssetInput } from "../types/asset.types.js";
import { searchCryptoAssetsFromCoinGecko } from "./coinGecko.service.js";
import { syncCryptoPricesIfStale } from "./price.service.js";
import {getUserCurrencyContext,getExchangeRate,convertCurrency} from "./currency.service.js";

function escapePostgrestValue(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

async function attachDisplayPrices(assets: any[], userId: string) {
  const { displayCurrency } = await getUserCurrencyContext(userId);

  return Promise.all(
    assets.map(async (asset) => {
      const rawPrice = asset.asset_prices?.price;
      const priceCurrency = asset.asset_prices?.currency;

      if (rawPrice == null || !priceCurrency) {
        return {
          ...asset,
          asset_prices: asset.asset_prices
            ? { ...asset.asset_prices, priceDisplay: null, displayCurrency }
            : null,
        };
      }

      const rate = await getExchangeRate(priceCurrency, displayCurrency);
      const priceDisplay = convertCurrency(rawPrice, rate);

      return {
        ...asset,
        asset_prices: {
          ...asset.asset_prices,
          priceDisplay,
          displayCurrency,
        },
      };
    })
  );
}
export async function createAsset(input: CreateAssetInput) {
  const { symbol, name, assetType, market, currency } = input;

  const normalizedSymbol = symbol.toUpperCase().trim();
  const normalizedMarket = market.toUpperCase().trim();

  const { data, error } = await supabase
    .from("assets")
    .insert({
      symbol: normalizedSymbol,
      name,
      asset_type: assetType,
      market: normalizedMarket,
      currency,
    })
    .select("id, symbol, name, asset_type, market, currency, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function searchAssets(input: SearchAssetInput, userId: string) {
  const { market, query } = input;

  const normalizedMarket = market.toUpperCase().trim();
  const normalizedQuery = query.trim();

  const { data: localAssets, error: localError } = await supabase
    .from("assets")
    .select(
      "id, symbol, name, asset_type, market, currency, external_id, asset_prices ( price, currency, price_time )"
    )
    .eq("market", normalizedMarket)
    .or(
      `symbol.ilike.${escapePostgrestValue(
        `%${normalizedQuery}%`
      )},name.ilike.${escapePostgrestValue(`%${normalizedQuery}%`)}`
    )
    .limit(10);

  if (localError) {
    throw new Error(localError.message);
  }
 if (localAssets && localAssets.length > 0) {
    return await attachDisplayPrices(localAssets, userId);
  }
  if (normalizedMarket !== "CRYPTO") {
    return [];
  }
  const data = await searchCryptoAssetsFromCoinGecko(normalizedQuery);

  if (data.length === 0) {
    return [];
  }

  const assetsToInsert = data.map((asset) => ({
    symbol: asset.symbol,
    name: asset.name,
    asset_type: asset.assetType,
    market: asset.market,
    currency: asset.currency,
    external_id: asset.externalId,
  }));

  const { data: savedAssets, error: insertError } = await supabase
    .from("assets")
    .upsert(assetsToInsert, {
      onConflict: "symbol,market",
    })
    .select(
      "id, symbol, name, asset_type, market, currency, external_id, asset_prices ( price, currency, price_time )"
    );

  if (insertError) {
    throw new Error(insertError.message);
  }

  // Newly discovered assets have no price yet — sync immediately so
  // this search response (and any immediate re-fetch) has real prices.
  await syncCryptoPricesIfStale(0);

  const { data: pricedAssets, error: pricedError } = await supabase
    .from("assets")
    .select(
      "id, symbol, name, asset_type, market, currency, external_id, asset_prices ( price, currency, price_time )"
    )
    .in(
      "id",
      savedAssets.map((asset) => asset.id)
    );

  if (pricedError) {
    throw new Error(pricedError.message);
  }

  return await attachDisplayPrices(pricedAssets, userId);
}