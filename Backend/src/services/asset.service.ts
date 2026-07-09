import { supabase } from "../config/supabase.js";
import { CreateAssetInput, SearchAssetInput } from "../types/asset.types.js";
import { searchCryptoAssetsFromCoinGecko } from "./coinGecko.service.js";
import { syncCryptoPricesIfStale } from "./price.service.js";

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

export async function searchAssets(input: SearchAssetInput) {
  const { market, query } = input;

  const normalizedMarket = market.toUpperCase().trim();
  const normalizedQuery = query.trim();

  const { data: localAssets, error: localError } = await supabase
    .from("assets")
    .select(
      "id, symbol, name, asset_type, market, currency, external_id, asset_prices ( price, currency, price_time )"
    )
    .eq("market", normalizedMarket)
    .or(`symbol.ilike.%${normalizedQuery}%,name.ilike.%${normalizedQuery}%`)
    .limit(10);

  if (localError) {
    throw new Error(localError.message);
  }
  if (localAssets && localAssets.length > 0) {
    return localAssets;
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

  return pricedAssets;
}