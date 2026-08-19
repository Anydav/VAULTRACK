import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAccounts } from "../../services/account.service";
import { getUserAssets } from "../../services/userAssets.service";
import {ErrorState} from  "../../components/ui/errorState"
import { formatCurrency } from "../../utils";

interface AccountSummaryCardProps {
  accountId: string;
}

export default function AccountSummaryCard({
  accountId,
}: AccountSummaryCardProps) {
  const { data: accounts = [], isLoading: accountsLoading, isError: accountsError, refetch: refetchAccounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  const { data: holdings = [], isLoading: holdingsLoading, isError: holdingsError, refetch: refetchHoldings } = useQuery({
    queryKey: ["user-assets"],
    queryFn: getUserAssets,
  });

  const account = accounts.find((acc) => acc.id === accountId);

  const { totalValue, totalCost, totalProfit, currency, count } = useMemo(() => {
    const accountHoldings = holdings.filter(
      (holding) => holding.accounts?.id === accountId
    );

    const value = accountHoldings.reduce(
      (sum, h) => sum + h.valuation.currentValueDisplay,
      0
    );
    const cost = accountHoldings.reduce(
      (sum, h) => sum + h.valuation.totalCostDisplay,
      0
    );
    const profit = accountHoldings.reduce(
      (sum, h) => sum + h.valuation.profitLossDisplay,
      0
    );

    return {
      totalValue: value,
      totalCost: cost,
      totalProfit: profit,
      currency: accountHoldings[0]?.valuation.displayCurrency ?? "",
      count: accountHoldings.length,
    };
  }, [holdings, accountId]);

  if (accountsLoading || holdingsLoading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <div className="flex min-h-[100px] flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-text" />
          <p className="text-sm font-medium text-gray-400">
            Loading account...
          </p>
        </div>
      </div>
    );
  }
  if (accountsError || holdingsError) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <ErrorState
        onRetry={() => {
          refetchAccounts();
          refetchHoldings();
        }}
      />
    </div>
  );
}
  if (!account) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <p className="text-sm text-gray-400">Account not found.</p>
      </div>
    );
  }

  const isProfit = totalProfit >= 0;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          
          <p className="mt-1 text-xs text-gray-400">Holdings</p>
          <p className="text-lg font-bold text-text">{count}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Total Value</p>
          <p className="text-lg font-bold text-text">
            {formatCurrency(totalValue, currency)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Total Cost</p>
          <p className="text-lg font-bold text-text">
            {formatCurrency(totalCost, currency)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Total Profit</p>
          <p
            className={`text-lg font-bold ${
              isProfit ? "text-success" : "text-danger"
            }`}
          >
            {isProfit ? "+" : ""}
            {formatCurrency(totalProfit, currency)}
          </p>
        </div>
      </div>
    </div>
  );
}