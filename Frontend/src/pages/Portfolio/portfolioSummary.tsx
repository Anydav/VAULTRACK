import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "../../services/dashboard.service";
import { getAccounts } from "../../services/account.service";

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
        <div className="flex min-h-[160px] flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#17352F]" />
          <p className="text-sm font-medium text-gray-400">
            Loading summary...
          </p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex min-h-[160px] flex-col items-center justify-center gap-2">
          <p className="text-base font-semibold text-gray-500">
            No data available
          </p>
          <p className="text-sm text-gray-400">
            Check back once your portfolio data is ready.
          </p>
        </div>
      </div>
    );
  }

  const isProfit = summary.totalProfitLossDisplay >= 0;

  const stats = [
    {
      label: "Total Value",
      value: `${summary.displayCurrency} ${summary.totalPortfolioValueDisplay.toLocaleString()}`,
    },
    {
      label: "Total Cost",
      value: `${summary.displayCurrency} ${summary.totalCostDisplay.toLocaleString()}`,
    },
    {
      label: "Accounts",
      value: accounts.length,
    },
    {
      label: "Total Profit",
      value: `${isProfit ? "+" : ""}${summary.displayCurrency} ${summary.totalProfitLossDisplay.toLocaleString()}`,
      highlight: isProfit,
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-[#17352F]">
        Portfolio Summary
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-[#FFF7D6] p-4"
          >
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p
              className={`mt-1 text-lg font-bold ${
                stat.highlight ? "text-green-600" : "text-[#17352F]"
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