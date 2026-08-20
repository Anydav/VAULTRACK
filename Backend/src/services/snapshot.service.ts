import { supabase } from "../config/supabase.js";
import { getDashboardSummary } from "./dashboard.service.js";
import {
  getUserCurrencyContext,
  getExchangeRate,
  convertCurrency,
  BASE_CURRENCY,
} from "./currency.service.js";

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

// Snapshots only persist base-currency facts; the display-currency view is
// derived from the user's *current* preference at read time so historical
// rows never go stale when a user changes their preferred currency.
function withDisplayValues(
  snapshot: any,
  displayCurrency: string,
  exchangeRate: number
) {
  return {
    ...snapshot,
    display_currency: displayCurrency,
    exchange_rate: exchangeRate,
    total_portfolio_value_display: convertCurrency(
      Number(snapshot.total_portfolio_value_base),
      exchangeRate
    ),
    total_cost_display: convertCurrency(
      Number(snapshot.total_cost_base),
      exchangeRate
    ),
    total_profit_loss_display: convertCurrency(
      Number(snapshot.total_profit_loss_base),
      exchangeRate
    ),
  };
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

  if (!data || data.length === 0) {
    return [];
  }

  const { displayCurrency } = await getUserCurrencyContext(userId);
  const exchangeRate = await getExchangeRate(BASE_CURRENCY, displayCurrency);

  return data.map((snapshot) =>
    withDisplayValues(snapshot, displayCurrency, exchangeRate)
  );
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