import { supabase } from "../config/supabase.js";
import { getDashboardSummary } from "./dashboard.service.js";

export async function createPortfolioSnapshot(userId: string) {
  const summary = await getDashboardSummary(userId);

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("portfolio_snapshots")
    .upsert(
      {
        user_id: userId,

        base_currency: summary.baseCurrency,
        total_portfolio_value_base: summary.totalPortfolioValueBase,
        total_cost_base: summary.totalCostBase,
        total_profit_loss_base: summary.totalProfitLossBase,

        display_currency: summary.displayCurrency,
        exchange_rate: summary.exchangeRate,
        total_portfolio_value_display: summary.totalPortfolioValueDisplay,
        total_cost_display: summary.totalCostDisplay,
        total_profit_loss_display: summary.totalProfitLossDisplay,

        snapshot_date: today,
      },
      {
        onConflict: "user_id,snapshot_date",
      }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getPortfolioSnapshots(userId: string) {
  const { data, error } = await supabase
    .from("portfolio_snapshots")
    .select("*")
    .eq("user_id", userId)
    .order("snapshot_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getSnapshotPerformance(userId: string) {
  const snapshots = await getPortfolioSnapshots(userId);

  if (snapshots.length === 0) {
    return {
      latestSnapshot: null,
      previousSnapshot: null,
      changeBase: 0,
      changeDisplay: 0,
      changePercentage: 0,
      message: "No snapshots available yet",
    };
  }

  if (snapshots.length === 1) {
    return {
      latestSnapshot: snapshots[0],
      previousSnapshot: null,
      changeBase: 0,
      changeDisplay: 0,
      changePercentage: 0,
      message: "Only one snapshot available, no comparison yet",
    };
  }

  const latestSnapshot = snapshots[snapshots.length - 1];
  const previousSnapshot = snapshots[snapshots.length - 2];

  const latestValueBase = Number(
    latestSnapshot.total_portfolio_value_base
  );

  const previousValueBase = Number(
    previousSnapshot.total_portfolio_value_base
  );

  const latestValueDisplay = Number(
    latestSnapshot.total_portfolio_value_display
  );

  const previousValueDisplay = Number(
    previousSnapshot.total_portfolio_value_display
  );

  const changeBase = latestValueBase - previousValueBase;
  const changeDisplay = latestValueDisplay - previousValueDisplay;

  const changePercentage =
    previousValueBase > 0
      ? (changeBase / previousValueBase) * 100
      : 0;

  return {
    latestSnapshot,
    previousSnapshot,
    changeBase,
    changeDisplay,
    changePercentage,
    message: "Snapshot performance calculated successfully",
  };
}