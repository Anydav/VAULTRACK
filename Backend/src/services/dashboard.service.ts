import { supabase } from "../config/supabase.js";
import { getExchangeRate, convertCurrency } from "./currency.service.js";
import { getUserAssets } from "./userAsset.service.js";
import {
  syncCryptoPricesIfStale
} from "./price.service.js";

export async function getDashboardSummary(userId: string) {
  await syncCryptoPricesIfStale();

  const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("preferred_currency")
  .eq("id", userId)
  .single();

if (profileError) {
  throw new Error(profileError.message);
}

const displayCurrency = profile?.preferred_currency || "USD";
const baseCurrency = "USD";

const exchangeRate = await getExchangeRate(baseCurrency, displayCurrency);

  const holdings = await getUserAssets(userId);

  const summary = holdings.reduce(
    (totals: any, holding: any) => {
      const currentValue = holding.valuation?.currentValueBase || 0;
      const totalCost = holding.valuation?.totalCostBase || 0;
      const profitLoss = holding.valuation?.profitLossBase || 0;

      totals.totalPortfolioValue += currentValue;
      totals.totalCost += totalCost;
      totals.totalProfitLoss += profitLoss;

      return totals;
    },
    {
      totalPortfolioValue: 0,
      totalCost: 0,
      totalProfitLoss: 0,
    }
  );

  const totalProfitLossPercentage =
    summary.totalCost > 0
      ? (summary.totalProfitLoss / summary.totalCost) * 100
      : 0;

 return {
  baseCurrency,
  displayCurrency,
  exchangeRate,

  totalPortfolioValueBase: summary.totalPortfolioValue,
  totalCostBase: summary.totalCost,
  totalProfitLossBase: summary.totalProfitLoss,

  totalPortfolioValueDisplay: convertCurrency(
    summary.totalPortfolioValue,
    exchangeRate
  ),
  totalCostDisplay: convertCurrency(summary.totalCost, exchangeRate),
  totalProfitLossDisplay: convertCurrency(
    summary.totalProfitLoss,
    exchangeRate
  ),

  totalProfitLossPercentage,
  numberOfHoldings: holdings.length,
  holdings,
};
}