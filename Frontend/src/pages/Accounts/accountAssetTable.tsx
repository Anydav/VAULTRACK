import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserAssets } from "../../services/userAssets.service";
import { Table, type TableColumn } from "../../components/tables/table";
import { AssetLink } from "../../components/ui/assetLink";
import type { Holding } from "../../types/userAssets";
import { formatCurrency } from "../../utils";

interface AccountAssetsTableProps {
  accountId: string;
  onSell: (holding: Holding) => void;
}

export default function AccountAssetsTable({
  accountId,
  onSell,
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
      render: (holding) => <AssetLink holding={holding} />,
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
      render: (holding) =>
        formatCurrency(
          holding.valuation.currentValueDisplay,
          holding.valuation.displayCurrency
        ),
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
            {formatCurrency(
              holding.valuation.profitLossDisplay,
              holding.valuation.displayCurrency
            )}
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
    {
      key: "sell",
      header: "",
      align: "right",
      render: (holding) => (
        <button
          type="button"
          onClick={() => onSell(holding)}
          className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:border-accent-secondary hover:text-text"
        >
          Sell
        </button>
      ),
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <h2 className="mb-4 text-lg font-semibold text-text">Assets</h2>

      <Table
  columns={columns}
  data={accountHoldings}
  getRowKey={(holding) => holding.id}
  isLoading={isLoading}
  isError={isError}
  onRetry={() => refetch()}
  emptyMessage="No assets in this custodian yet"
/>
    </div>
  );
}