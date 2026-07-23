import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "../../services/dashboard.service";
import { getAccounts } from "../../services/account.service";
import { LoadingSpinner } from "../../components/ui/loadingSpinner";
import { EmptyState } from "../../components/ui/emptyState";

export default function PortfolioSummary() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  if (summaryLoading || accountsLoading) {
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

  const stats = [
    {
      label: "Total Value",
      value: ` ${summary.totalPortfolioValueDisplay.toLocaleString()}`,
    },
    {
      label: "Total Cost",
      value: ` ${summary.totalCostDisplay.toLocaleString()}`,
    },
    {
      label: "Accounts",
      value: accounts.length,
    },
    {
      label: "Total Profit",
      value: `${isProfit ? "+" : ""} ${summary.totalProfitLossDisplay.toLocaleString()}`,
      highlight: isProfit,
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-primary">
        Portfolio Summary
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-highlight-bg p-4"
          >
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p
              className={`mt-1 text-lg font-bold ${
                stat.highlight ? "text-success" : "text-primary"
              }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}