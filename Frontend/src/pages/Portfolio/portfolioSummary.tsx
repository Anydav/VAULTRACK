import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "../../services/dashboard.service";
import { getAccounts } from "../../services/account.service";
import { LoadingSpinner } from "../../components/ui/loadingSpinner";
import { EmptyState } from "../../components/ui/emptyState";
import { ErrorState } from "../../components/ui/errorState";
import { formatCurrency } from "../../utils";

export default function PortfolioSummary() {
  const { data: summary, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
  });

  const { data: accounts = [], isLoading: accountsLoading, isError: accountsError, refetch: refetchAccounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  if (summaryLoading || accountsLoading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <LoadingSpinner message="Loading summary..." />
      </div>
    );
  }
  if (summaryError || accountsError) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <ErrorState
        onRetry={() => {
          refetchSummary();
          refetchAccounts();
        }}
      />
    </div>
  );
}

  if (!summary) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
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
      value: formatCurrency(summary.totalPortfolioValueDisplay, summary.displayCurrency),
    },
    {
      label: "Total Cost",
      value: formatCurrency(summary.totalCostDisplay, summary.displayCurrency),
    },
    {
      label: "Accounts",
      value: accounts.length,
    },
    {
      label: "Total Profit",
      value: `${isProfit ? "+" : ""}${formatCurrency(summary.totalProfitLossDisplay, summary.displayCurrency)}`,
      variant: isProfit ? "success" : "danger",
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <h2 className="mb-4 text-lg font-semibold text-text">
        Portfolio  Summary
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-highlight-bg p-3"
          >
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p
             className={`mt-1 text-lg font-bold ${
               stat.variant === "success"
                 ? "text-success"
                 : stat.variant === "danger"
                 ? "text-danger"
                 : "text-primary"
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