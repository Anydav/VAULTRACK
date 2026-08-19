import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserAssets } from "../../services/userAssets.service";
import { Table, type TableColumn } from "../../components/tables/table";
import type { Holding } from "../../types/userAssets";

interface AccountAssetsTableProps {
  accountId: string;
}

export default function AccountAssetsTable({
  accountId,
}: AccountAssetsTableProps) {
  const { data: holdings = [], isLoading, isError, refetch } = useQuery({
  queryKey: ["user-assets"],
  queryFn: getUserAssets,
});

  const accountHoldings = useMemo(
    () => holdings.filter((holding) => holding.accounts?.id === accountId),
    [holdings, accountId]
  );

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
      header: "ROI",
      align: "right",
      render: (holding) => {
        const isProfit = holding.valuation.profitLossPercentage >= 0;
        return (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              isProfit
                ? "bg-success-bg text-success"
                : "bg-danger-bg text-danger"
            }`}
          >
            {isProfit ? "+" : ""}
            {holding.valuation.profitLossPercentage.toFixed(1)}%
          </span>
        );
      },
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-primary">Assets</h2>

      <Table
  columns={columns}
  data={accountHoldings}
  getRowKey={(holding) => holding.id}
  isLoading={isLoading}
  isError={isError}
  onRetry={() => refetch()}
  emptyMessage="No assets in this account yet"
/>
    </div>
  );
}