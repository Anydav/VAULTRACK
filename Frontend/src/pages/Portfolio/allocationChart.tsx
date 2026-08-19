import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { getUserAssets } from "../../services/userAssets.service";
import { ErrorState } from "../../components/ui/errorState";

type GroupBy = "asset" | "market" | "account";

const GROUP_OPTIONS: { label: string; value: GroupBy }[] = [
  { label: "Asset", value: "asset" },
  { label: "Market", value: "market" },
  { label: "Account", value: "account" },
];

const COLORS = [ "var(--color-primary)","var(--color-accent)", "#F5B841", "#7C9EFF", "#E57373", "#8E8E8E"];

export default function AllocationChart() {
  const [groupBy, setGroupBy] = useState<GroupBy>("asset");

  const { data: holdings = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["user-assets"],
    queryFn: getUserAssets,
  });

  const { chartData, total, currency } = useMemo(() => {
    const groups = new Map<string, number>();

    for (const holding of holdings) {
      let key = "Unknown";

      if (groupBy === "asset") {
        key = holding.assets?.symbol ?? "Unknown";
      } else if (groupBy === "market") {
        key = holding.assets?.market ?? "Unknown";
      } else if (groupBy === "account") {
        key = holding.accounts?.name ?? "Unknown";
      }

      const currentValue = holding.valuation.currentValueDisplay;
      groups.set(key, (groups.get(key) ?? 0) + currentValue);
    }

    const data = Array.from(groups.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    const currencyCode = holdings[0]?.valuation.priceCurrency ?? "";

    return { chartData: data, total: totalValue, currency: currencyCode };
  }, [holdings, groupBy]);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">
          Allocation Analysis
        </h2>

        <div className="flex gap-1">
          {GROUP_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setGroupBy(option.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                groupBy === option.value
                  ? "bg-accent text-primary"
                  : "text-gray-400 hover:bg-gray-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
            <p className="text-sm font-medium text-gray-400">
              Loading allocation...
            </p>
          </div>
        ) : isError ? (
          
            <ErrorState
              onRetry={() => {
                refetch();
              }}
            />
        ) : chartData.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-2">
            <p className="text-base font-semibold text-gray-500">
              No holdings yet
            </p>
            <p className="text-sm text-gray-400">
              Add assets to see your allocation.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative h-52 w-52 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      `${currency} ${value.toLocaleString()}`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-sm font-bold text-primary">
                   {total.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="w-full space-y-2">
              {chartData.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2 text-gray-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    {item.name}
                  </span>
                  <span className="font-medium text-primary">
                     {item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}