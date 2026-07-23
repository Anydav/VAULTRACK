import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "../../services/dashboard.service";
import { getAccounts } from "../../services/account.service";
import { getSnapshotPerformance } from "../../services/snapShot.service";
import { LoadingSpinner } from "../../components/ui/loadingSpinner";
import { EmptyState } from "../../components/ui/emptyState";

export default function SummaryCard() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });
  const { data: performance, isLoading: performanceLoading } = useQuery({
    queryKey: ["snapshot-performance"],
    queryFn: getSnapshotPerformance,
  });

  if (summaryLoading || accountsLoading || performanceLoading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <LoadingSpinner message="Loading summary..." />
      </div>
    );
  }

  if (!summary) {
    return (
       <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <EmptyState
          title="No data available"
          description="Check back once your portfolio data is ready."
        />
      </div>
    );
  }
  const isProfit = summary.totalProfitLossDisplay >= 0;
  const todayChangePercentage = performance?.changePercentage ?? 0;
  const isTodayProfit = todayChangePercentage >= 0;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-15 sm:flex-row sm:justify-between">
        <div className="space-y-5">
          <h3 className="text-sm text-gray-400">Total Portfolio Value</h3>
          <h2 className="mt-1 text-3xl font-bold text-primary">
            {summary.displayCurrency} {summary.totalPortfolioValueDisplay.toLocaleString()}
          </h2>
          <p className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            Today
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                isProfit
                  ? "bg-accent text-primary"
                  : "bg-danger text-primary"
              }`}
            >
              {isTodayProfit ? "+" : ""}
              {todayChangePercentage.toFixed(1)}%
            </span>
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <h4 className="text-xs text-gray-400">Total Cost</h4>
            <p className="text-sm font-semibold text-primary">
              {summary.displayCurrency} {summary.totalCostDisplay.toLocaleString()}
            </p>
          </div>
          <div>
            <h4 className="text-xs text-gray-400">Total Profit</h4>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-primary">
                {summary.displayCurrency} {summary.totalProfitLossDisplay.toLocaleString()}
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isProfit
                    ? "bg-accent text-primary"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {isProfit ? "+" : ""}
                {summary.totalProfitLossPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-3 border-t border-gray-100 pt-4">
        <div>
          <p className="text-xs text-gray-400">No of Asset</p>
          <p className="text-lg font-bold text-primary">
            {summary.numberOfHoldings}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">No of Account</p>
          <p className="text-lg font-bold text-primary">
            {accounts.length}
          </p>
        </div>
      </div>
    </div>
  );
}