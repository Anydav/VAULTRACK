import type { Holding } from "./userAssets";

export interface DashboardSummary {
  baseCurrency: string;
  displayCurrency: string;
  exchangeRate: number;

  totalPortfolioValueBase: number;
  totalCostBase: number;
  totalProfitLossBase: number;

  totalPortfolioValueDisplay: number;
  totalCostDisplay: number;
  totalProfitLossDisplay: number;

  totalProfitLossPercentage: number;
  numberOfHoldings: number;
  holdings: Holding[];
}