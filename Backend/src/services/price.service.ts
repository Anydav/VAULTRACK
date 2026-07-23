import { supabase } from "../config/supabase.js";
import { getCryptoPricesFromCoinGecko } from "./coinGecko.service.js";
import { fetchNgxStocks } from "./mansaMarket.service.js";
import { getExchangeRate,convertAmount, BASE_CURRENCY, convertCurrency } from "./currency.service.js";

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

  const { amount: normalizedPrice } = await convertAmount(
    priceData.usd,
    "USD",
    BASE_CURRENCY
  );

  priceRows.push({
    asset_id: asset.id,
    price: normalizedPrice,
    currency: BASE_CURRENCY,
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

export async function syncStockPrices() {
  const { data: ngxAssets, error: assetsError } = await supabase
    .from("assets")
    .select("id, symbol")
    .eq("market", "NGX");

  if (assetsError) {
    throw new Error(assetsError.message);
  }

  if (!ngxAssets || ngxAssets.length === 0) {
    return [];
  }

  const { data: stocks } = await fetchNgxStocks();

  // Fetch the NGN -> USD rate ONCE for the whole batch. Unlike crypto's
  // per-item convertAmount (a cheap USD->USD no-op there), this is a real
  // conversion shared by every NGX stock in this sync run.
  const rate = await getExchangeRate("NGN", BASE_CURRENCY);

  const stockByTicker = new Map(stocks.map((stock) => [stock.ticker, stock]));

  type AssetPriceRow = {
    asset_id: string;
    price: number;
    currency: string;
    source: string;
    price_time: string;
  };

  const priceRows: AssetPriceRow[] = [];

  for (const asset of ngxAssets) {
    const stock = stockByTicker.get(asset.symbol);

    if (!stock) {
      continue;
    }

    priceRows.push({
      asset_id: asset.id,
      price: convertCurrency(stock.price, rate),
      currency: BASE_CURRENCY,
      source: "mansa",
      price_time: new Date().toISOString(),
    });
  }

  if (priceRows.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("asset_prices")
    .upsert(priceRows, { onConflict: "asset_id" })
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function syncStockPricesIfStale(staleMinutes = 30) {
  const { data: latestPrices, error } = await supabase
    .from("asset_prices")
    .select("price_time")
    .eq("source", "mansa")
    .order("price_time", { ascending: true })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if (!latestPrices || latestPrices.length === 0) {
    return await syncStockPrices();
  }

  const oldestPriceTime = new Date(latestPrices[0].price_time).getTime();
  const ageInMinutes = (Date.now() - oldestPriceTime) / (1000 * 60);

  if (ageInMinutes >= staleMinutes) {
    return await syncStockPrices();
  }

  return [];
}