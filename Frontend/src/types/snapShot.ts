export interface PortfolioSnapshot {
  id: string;
  user_id: string;
  base_currency: string;
  total_portfolio_value_base: number;
  total_cost_base: number;
  total_profit_loss_base: number;
  display_currency: string;
  exchange_rate: number;
  total_portfolio_value_display: number;
  total_cost_display: number;
  total_profit_loss_display: number;
  snapshot_date: string;
}

export interface SnapshotPerformance {
  latestSnapshot: PortfolioSnapshot | null;
  previousSnapshot: PortfolioSnapshot | null;
  changeBase: number;
  changeDisplay: number;
  changePercentage: number;
  message: string;
}