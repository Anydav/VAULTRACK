import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAccounts } from "../../services/account.service";
import { getUserAssets } from "../../services/userAssets.service";
import {ErrorState} from  "../../components/ui/errorState"
import { formatCurrency } from "../../utils";
import { Card } from "../../components/ui/card";

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
      <Card>
        <div className="flex min-h-[100px] flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-text" />
          <p className="text-sm font-medium text-gray-400">
            Loading custodian...
          </p>
        </div>
      </Card>
    );
  }
  if (accountsError || holdingsError) {
  return (
    <Card>
      <ErrorState
        onRetry={() => {
          refetchAccounts();
          refetchHoldings();
        }}
      />
    </Card>
  );
}
  if (!account) {
    return (
      <Card>
        <p className="text-sm text-gray-400">Custodian not found.</p>
      </Card>
    );
  }

  const isProfit = totalProfit >= 0;

  return (
    <Card>
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
    </Card>
  );
}