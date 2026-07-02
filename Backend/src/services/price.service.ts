import { supabase } from "../config/supabase.js";
import { getCryptoPricesFromCoinGecko } from "./coinGecko.service.js";

export async function syncCryptoPrices() {
  const { data: cryptoAssets, error: assetsError } = await supabase
    .from("assets")
    .select("id, external_id, currency")
    .eq("market", "CRYPTO")
    .not("external_id", "is", null);

  if (assetsError) {
    throw new Error(assetsError.message);
  }

  if (!cryptoAssets || cryptoAssets.length === 0) {
    return [];
  }

  const coinIds = cryptoAssets.map((asset) => asset.external_id);

  const prices = await getCryptoPricesFromCoinGecko(coinIds, "usd");

  type AssetPriceRow = {
  asset_id: string;
  price: number;
  currency: string;
  source: string;
  price_time: string;
};

const priceRows: AssetPriceRow[] = [];

for (const asset of cryptoAssets) {
  const priceData = prices[asset.external_id];

  if (!priceData || priceData.usd === undefined) {
    continue;
  }

  priceRows.push({
    asset_id: asset.id,
    price: priceData.usd,
    currency: "USD",
    source: "coingecko",
    price_time: new Date().toISOString(),
  });
}

if (priceRows.length === 0) {
  return [];
}

  const { data, error } = await supabase
    .from("asset_prices")
    .upsert(priceRows, {
      onConflict: "asset_id",
    })
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function syncCryptoPricesIfStale(staleMinutes = 5) {
  const { data: latestPrices, error } = await supabase
    .from("asset_prices")
    .select("price_time")
    .eq("source", "coingecko")
    .order("price_time", { ascending: true })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if (!latestPrices || latestPrices.length === 0) {
    return await syncCryptoPrices();
  }

  const oldestPriceTime = new Date(latestPrices[0].price_time).getTime();
  const now = Date.now();

  const ageInMinutes = (now - oldestPriceTime) / (1000 * 60);

  if (ageInMinutes >= staleMinutes) {
    return await syncCryptoPrices();
  }

  return [];
}