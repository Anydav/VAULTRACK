import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { getPortfolioSnapshots } from "../../services/snapShot.service";
import {ErrorState} from "../../components/ui/errorState";
import { formatCurrency } from "../../utils";

type RangeOption = "1W" | "1M" | "3M" | "1Y" | "All";

const RANGE_OPTIONS: RangeOption[] = ["1W", "1M", "3M", "1Y", "All"];

const RANGE_DAYS: Record<Exclude<RangeOption, "All">, number> = {
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "1Y": 365,
};

export default function AnalysisChart() {
  const [range, setRange] = useState<RangeOption>("1M");

  const { data: snapshots = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["portfolio-snapshots"],
    queryFn: getPortfolioSnapshots,
  });
  

  const filteredData = useMemo(() => {
    const sorted = [...snapshots].sort(
      (a, b) =>
        new Date(a.snapshot_date).getTime() -
        new Date(b.snapshot_date).getTime()
    );

    const dataset =
      range === "All"
        ? sorted
        : sorted.filter((snapshot) => {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - RANGE_DAYS[range]);
            return new Date(snapshot.snapshot_date) >= cutoff;
          });

    return dataset.map((snapshot) => ({
      date: new Date(snapshot.snapshot_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: snapshot.total_portfolio_value_display,
      currency: snapshot.display_currency,
    }));
  }, [snapshots, range]);
  const chartData = useMemo(() => {
  if (filteredData.length === 0) {
    return [
      { date: "", value: 0 },
      { date: "", value: 0 },
    ];
  }
  if (filteredData.length === 1) {
    return [filteredData[0], filteredData[0]];
  }
  return filteredData;
}, [filteredData]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">Analysis</h2>

        <div className="flex gap-1">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                range === option
                  ? "bg-accent text-primary"
                  : "text-gray-400 hover:bg-gray-100"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-4 h-72">
        {isLoading ? (
  <p className="text-sm text-gray-400">Loading chart...</p>
) : isError ? (
  <ErrorState onRetry={() => refetch()} />
) : (
  <>
          
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
              domain={[0, "dataMax"]}
                tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) =>
                  value >= 1_000_000
                    ? `${(value / 1_000_000).toFixed(1)}M`
                    : `${(value / 1000).toFixed(0)}k`
                }
              />
              <Tooltip
                formatter={(value: number, _name, props) =>
                  formatCurrency(value, props.payload.currency)
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-accent)"
                strokeWidth={2}
                fill="url(#portfolioGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
           {filteredData.length === 0 && (
      <div className="absolute inset-0 flex items-center justify-center bg-white/60">
        <p className="text-sm text-gray-400">Not enough snapshot data yet.</p>
      </div>
    )}
  </>
         
        )}
      </div>
    </div>
  );
}