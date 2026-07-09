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

  const { data: snapshots = [], isLoading } = useQuery({
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

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#17352F]">Analysis</h2>

        <div className="flex gap-1">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                range === option
                  ? "bg-[#C8F169] text-[#17352F]"
                  : "text-gray-400 hover:bg-gray-100"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-72">
        {isLoading ? (
          <p className="text-sm text-gray-400">Loading chart...</p>
        ) : filteredData.length === 0 ? (
          <p className="text-sm text-gray-400">
            Not enough snapshot data yet.
          </p>
        ) : (
          
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#17352F" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#17352F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#94A3B8" }}
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
                  `${props.payload.currency ?? ""} ${value.toLocaleString()}`
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#17352F"
                strokeWidth={2}
                fill="url(#portfolioGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
         
        )}
      </div>
    </div>
  );
}