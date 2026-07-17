import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { getUserAssets } from "../../services/userAssets.service";
import { Table, type TableColumn } from "../../components/tables/table";
import type { Holding } from "../../types/userAssets";

export default function HoldingTable() {
  const [query, setQuery] = useState("");

  const { data: holdings = [], isLoading } = useQuery({
    queryKey: ["user-assets"],
    queryFn: getUserAssets,
  });

  const filteredHoldings = useMemo(() => {
    if (!query.trim()) return holdings;

    const normalizedQuery = query.trim().toLowerCase();

    return holdings.filter(
      (holding) =>
        holding.assets?.symbol?.toLowerCase().includes(normalizedQuery) ||
        holding.assets?.name?.toLowerCase().includes(normalizedQuery)
    );
  }, [holdings, query]);

  const columns: TableColumn<Holding>[] = [
    {
      key: "asset",
      header: "Asset",
      render: (holding) => (
        <span className="font-medium text-primary">
          {holding.assets?.symbol ?? "-"}
        </span>
      ),
    },
    {
      key: "qty",
      header: "QTY",
      render: (holding) => holding.quantity,
    },
    {
      key: "avgPrice",
      header: "Avg Price",
      align: "right",
      render: (holding) =>
        holding.cost_price != null
          ? holding.cost_price.toLocaleString()
          : "-",
    },
    {
      key: "currentPrice",
      header: "Current Price",
      align: "right",
      render: (holding) => holding.valuation.latestPrice.toLocaleString(),
    },
    {
      key: "value",
      header: "Value",
      align: "right",
      render: (holding) => holding.valuation.currentValueDisplay.toLocaleString(),
    },
    {
      key: "pnl",
      header: "P/L",
      align: "right",
      render: (holding) => {
        const isProfit = holding.valuation.profitLossDisplay >= 0;
        return (
          <span className={isProfit ? "text-success" : "text-danger"}>
            {isProfit ? "+" : ""}
            {holding.valuation.profitLossDisplay.toLocaleString()}
          </span>
        );
      },
    },
    {
      key: "roi",
      header: "ROI%",
      align: "right",
      render: (holding) => {
        const isProfit = holding.valuation.profitLossPercentage >= 0;
        return (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              isProfit
                ? "bg-accent text-primary"
                : "bg-danger-bg text-danger"
            }`}
          >
            {isProfit ? "+" : ""}
            {holding.valuation.profitLossPercentage.toFixed(1)}%
          </span>
        );
      },
    },
    {
      key: "account",
      header: "Account",
      render: (holding) => holding.accounts?.name ?? "-",
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-primary">
          Holding Table
        </h2>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search asset..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-700 outline-none focus:border-accent-secondary"
          />
        </div>
      </div>

      <div className="mt-4">
        <Table
          columns={columns}
          data={filteredHoldings}
          getRowKey={(holding) => holding.id}
          isLoading={isLoading}
          emptyMessage="No holdings yet"
        />
      </div>
    </div>
  );
}