import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { getUserAssets } from "../../services/userAssets.service";
import { transactionsQuery } from "../../services/transaction.service";
import { Table, type TableColumn } from "../../components/tables/table";
import TransactionTable from "../../components/transactions/transactionTable";
import SellModal from "../../components/transactions/sellModal";
import { LoadingSpinner } from "../../components/ui/loadingSpinner";
import { ErrorState } from "../../components/ui/errorState";
import { useAddAssetModal } from "../../context/addAssetModelcontext";
import type { Asset } from "../../types/asset";
import type { Holding } from "../../types/userAssets";
import { formatCurrency } from "../../utils";
import { Card } from "../../components/ui/card";
import { PageHeader } from "../../components/ui/pageHeader";
import { Button } from "../../components/ui/button";

// "5 min ago", "3 h ago", or the date if older than a day
function timeAgo(date: string) {
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} h ago`;
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// One page per asset, combining every custodian that holds it
export default function AssetDetail() {
  const { assetId } = useParams<{ assetId: string }>();
  const [sellHoldings, setSellHoldings] = useState<Holding[] | null>(null);
  const { openAddAssetModal } = useAddAssetModal();

  const {
    data: holdings = [],
    isLoading: holdingsLoading,
    isError: holdingsError,
    refetch: refetchHoldings,
  } = useQuery({
    queryKey: ["user-assets"],
    queryFn: getUserAssets,
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    ...transactionsQuery({ assetId }),
    enabled: !!assetId,
  });

  const assetHoldings = useMemo(
    () => holdings.filter((h) => h.assets?.id === assetId),
    [holdings, assetId]
  );

  // Totals across custodians. Avg cost = total cost / total quantity.
  const totals = useMemo(() => {
    const quantity = assetHoldings.reduce((sum, h) => sum + Number(h.quantity), 0);
    const value = assetHoldings.reduce((sum, h) => sum + h.valuation.currentValueDisplay, 0);
    const cost = assetHoldings.reduce((sum, h) => sum + h.valuation.totalCostDisplay, 0);
    const portfolioValue = holdings.reduce((sum, h) => sum + h.valuation.currentValueDisplay, 0);

    return {
      quantity,
      value,
      cost,
      avgCost: quantity > 0 ? cost / quantity : 0,
      profit: value - cost,
      profitPercentage: cost > 0 ? ((value - cost) / cost) * 100 : 0,
      portfolioShare: portfolioValue > 0 ? (value / portfolioValue) * 100 : 0,
    };
  }, [assetHoldings, holdings]);

  if (holdingsLoading || transactionsLoading) {
    return <LoadingSpinner message="Loading asset..." />;
  }

  if (holdingsError) {
    return <ErrorState onRetry={() => refetchHoldings()} />;
  }

  const first = assetHoldings[0];
  const asset = first?.assets ?? transactions[0]?.assets;

  const backLink = (
    <Link
      to="/assets"
      className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-text"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Assets
    </Link>
  );

  if (!asset) {
    return (
      <div className="space-y-6">
        {backLink}
        <p className="text-sm text-gray-400">Asset not found.</p>
      </div>
    );
  }

  const currency = first?.valuation.displayCurrency ?? "";
  const isProfit = totals.profit >= 0;

  // Add more opens Add Asset with this asset chosen; the price lets its
  // "Current Price" button work
  function handleAddMore() {
    if (!asset) return;
    const selected: Asset = {
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      market: asset.market,
      asset_type: first?.assets?.asset_type ?? "",
      currency: first?.assets?.currency ?? "",
      external_id: first?.assets?.external_id ?? null,
      asset_prices: first
        ? {
            price: first.valuation.latestPrice,
            currency: first.valuation.priceCurrency,
            price_time: first.valuation.priceLastUpdated ?? "",
            priceDisplay: first.valuation.latestPriceDisplay,
            displayCurrency: first.valuation.displayCurrency,
          }
        : null,
    };
    openAddAssetModal({ asset: selected });
  }

  const heldInColumns: TableColumn<Holding>[] = [
    {
      key: "custodian",
      header: "Custodian",
      render: (h) =>
        h.accounts ? (
          <Link to={`/accounts/${h.accounts.id}`} className="font-medium text-text hover:underline">
            {h.accounts.name}
          </Link>
        ) : (
          "-"
        ),
    },
    {
      key: "qty",
      header: "QTY",
      render: (h) => h.quantity,
    },
    {
      key: "value",
      header: "Value",
      align: "right",
      render: (h) => formatCurrency(h.valuation.currentValueDisplay, h.valuation.displayCurrency),
    },
    {
      key: "pnl",
      header: "P/L",
      align: "right",
      render: (h) => {
        const profit = h.valuation.profitLossDisplay >= 0;
        return (
          <span className={profit ? "text-success" : "text-danger"}>
            {profit ? "+" : ""}
            {formatCurrency(h.valuation.profitLossDisplay, h.valuation.displayCurrency)}
          </span>
        );
      },
    },
    {
      key: "sell",
      header: "",
      align: "right",
      render: (h) => (
        <button
          type="button"
          onClick={() => setSellHoldings([h])}
          className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:border-accent-secondary hover:text-text"
        >
          Sell
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {backLink}

      <PageHeader
        title={
          <>
            {asset.symbol} <span className="text-base font-medium text-gray-400">· {asset.name} · {asset.market}</span>
          </>
        }
        subtitle={
          first && (
            <>
              Price {formatCurrency(first.valuation.latestPriceDisplay, currency)}
              {first.valuation.priceLastUpdated && ` · updated ${timeAgo(first.valuation.priceLastUpdated)}`}
            </>
          )
        }
        actions={
          <>
            <Button
              variant="secondary"
              disabled={assetHoldings.length === 0}
              onClick={() => setSellHoldings(assetHoldings)}
            >
              Sell
            </Button>
            <Button onClick={handleAddMore}>+ Add more</Button>
          </>
        }
      />

      {assetHoldings.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">You don't hold any {asset.symbol} right now.</p>
        </Card>
      ) : (
        <>
          <Card>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-gray-400">You hold</p>
                <p className="text-lg font-bold text-text">
                  {totals.quantity} {asset.symbol}
                </p>
                <p className="text-xs text-gray-400">{totals.portfolioShare.toFixed(1)}% of portfolio</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Value</p>
                <p className="text-lg font-bold text-text">{formatCurrency(totals.value, currency)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Avg cost</p>
                <p className="text-lg font-bold text-text">{formatCurrency(totals.avgCost, currency)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Profit/Loss</p>
                <p className={`text-lg font-bold ${isProfit ? "text-success" : "text-danger"}`}>
                  {isProfit ? "+" : ""}
                  {formatCurrency(totals.profit, currency)}
                </p>
                <p className={`text-xs ${isProfit ? "text-success" : "text-danger"}`}>
                  {isProfit ? "+" : ""}
                  {totals.profitPercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-text">Held in</h2>
            <Table columns={heldInColumns} data={assetHoldings} getRowKey={(h) => h.id} />
          </Card>
        </>
      )}

      <TransactionTable
        assetId={assetId}
        onSell={(h) => setSellHoldings([h])}
        emptyMessage={`No ${asset.symbol} transactions yet`}
      />

      {sellHoldings && (
        <SellModal holdings={sellHoldings} onClose={() => setSellHoldings(null)} />
      )}
    </div>
  );
}
