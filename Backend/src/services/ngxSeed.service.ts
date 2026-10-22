// backend/src/services/ngxSeed.service.ts
//
// One-time (but idempotent/re-runnable) seed for the NGX stock universe.
// Populates `assets` with all 146 NGX tickers so that searchAssets() can
// later query them locally, with zero live Mansa calls per user search.
import { supabase } from "../config/supabase.js";
import { fetchNgxStocks } from "./mansaMarket.service.js";
import { getExchangeRate, convertCurrency, BASE_CURRENCY } from "./currency.service.js";

export interface SeedNgxAssetsResult {
  attempted: number;
  seeded: number;
  pricesWritten: number;
}

export async function seedNgxAssets(): Promise<SeedNgxAssetsResult> {
  const { data: stocks } = await fetchNgxStocks();

  // NGX tickers are unique, so the ticker doubles as external_id. That lets
  // stocks and crypto share the same (market, external_id) unique key.
  const rows = stocks.map((stock) => ({
    symbol: stock.ticker,
    name: stock.name,
    market: "NGX",
    asset_type: "stock",
    currency: "NGN",
    external_id: stock.ticker,
  }));

  const { error, data: seededRows } = await supabase
    .from("assets")
    .upsert(rows, { onConflict: "market,external_id" })
    .select();

  if (error) {
    throw new Error(`Failed to seed NGX assets: ${error.message}`);
  }

  const rate = await getExchangeRate("NGN", BASE_CURRENCY);

  const stockByTicker = new Map(stocks.map((stock) => [stock.ticker, stock]));

  const priceRows = (seededRows ?? []).map((assetRow) => {
    const stock = stockByTicker.get(assetRow.symbol)!;
    return {
      asset_id: assetRow.id,
      price: convertCurrency(stock.price, rate),
      currency: BASE_CURRENCY,
      source: "mansa",
      price_time: new Date().toISOString(),
    };
  });

  const { error: priceError, data: insertedPrices } = await supabase
    .from("asset_prices")
    .upsert(priceRows, { onConflict: "asset_id" })
    .select();

  if (priceError) {
    throw new Error(`Failed to seed NGX asset prices: ${priceError.message}`);
  }

  return {
    attempted: rows.length,
    seeded: seededRows?.length ?? 0,
    pricesWritten: insertedPrices?.length ?? 0,
  };
}