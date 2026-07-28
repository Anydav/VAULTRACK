import { getExchangeRate, convertCurrency, getUserCurrencyContext, BASE_CURRENCY } from "./currency.service.js";
import { getUserAssets } from "./userAsset.service.js";
import {
  syncCryptoPricesIfStale
} from "./price.service.js";

export async function getDashboardSummary(userId: string) {
  await syncCryptoPricesIfStale();

  const baseCurrency = BASE_CURRENCY;
  const { displayCurrency } = await getUserCurrencyContext(userId);
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