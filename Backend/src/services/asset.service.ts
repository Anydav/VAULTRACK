import { supabase } from "../config/supabase.js";
import { SearchAssetInput } from "../types/asset.types.js";
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
export async function searchAssets(input: SearchAssetInput, userId: string) {
  const { market, query, allCoins = false } = input;

  const normalizedMarket = market.toUpperCase().trim();
  const normalizedQuery = (query ?? "").trim();

  let localAssetsQuery = supabase
    .from("assets")
    .select(
      "id, symbol, name, asset_type, market, currency, external_id, asset_prices ( price, currency, price_time )"
    )
    .eq("market", normalizedMarket);

  // No query yet (e.g. the asset picker's default browse list) — just
  // list assets for the market instead of filtering by symbol/name.
  if (normalizedQuery) {
    localAssetsQuery = localAssetsQuery.or(
      `symbol.ilike.${escapePostgrestValue(
        `%${normalizedQuery}%`
      )},name.ilike.${escapePostgrestValue(`%${normalizedQuery}%`)}`
    );
  }

  const { data: localAssets, error: localError } = await localAssetsQuery
    .order("symbol", { ascending: true })
    .limit(10);

  if (localError) {
    throw new Error(localError.message);
  }
  const localResults = localAssets ?? [];

  // Normal searches stay local-only so they're instant. "Search all coins"
  // (allCoins) also asks CoinGecko, so coins that share letters with a saved
  // one (ETHFI when ETH is saved) can still be found.
  if (localResults.length > 0 && !allCoins) {
    return await attachDisplayPrices(localResults, userId);
  }
  // The CoinGecko discovery fallback only makes sense for an actual
  // search term — an empty browse query with no local rows just means
  // there's nothing to show yet.
  if (!normalizedQuery || normalizedMarket !== "CRYPTO") {
    return await attachDisplayPrices(localResults, userId);
  }
  const data = await searchCryptoAssetsFromCoinGecko(normalizedQuery);

  if (data.length === 0) {
    return await attachDisplayPrices(localResults, userId);
  }

  const assetsToInsert = data.map((asset) => ({
    symbol: asset.symbol,
    name: asset.name,
    asset_type: asset.assetType,
    market: asset.market,
    currency: asset.currency,
    external_id: asset.externalId,
  }));

  // Keyed on the CoinGecko id, not the symbol: many coins share a symbol
  // (PEPE, ETH, ...), and keying on symbol made them overwrite each other.
  const { data: savedAssets, error: insertError } = await supabase
    .from("assets")
    .upsert(assetsToInsert, {
      onConflict: "market,external_id",
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

  // Local matches first, then newly found coins; a coin in both shows once.
  const resultIds = [
    ...new Set([...localResults, ...savedAssets].map((asset) => asset.id)),
  ];

  const { data: pricedAssets, error: pricedError } = await supabase
    .from("assets")
    .select(
      "id, symbol, name, asset_type, market, currency, external_id, asset_prices ( price, currency, price_time )"
    )
    .in("id", resultIds);

  if (pricedError) {
    throw new Error(pricedError.message);
  }

  // The database doesn't return rows in the order we asked, so put them
  // back in order: local first.
  const assetsById = new Map(pricedAssets.map((asset) => [asset.id, asset]));
  const orderedAssets = resultIds
    .map((id) => assetsById.get(id))
    .filter((asset) => asset !== undefined);

  return await attachDisplayPrices(orderedAssets, userId);
}