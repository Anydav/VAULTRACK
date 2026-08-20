import { useQuery } from "@tanstack/react-query";
import { getUserAssets } from "../../services/userAssets.service";
import { ErrorState } from "../../components/ui/errorState";
import { formatCurrency } from "../../utils";

export default function AssetHoldingCard() {
  const { data: holdings = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["user-assets"],
    queryFn: getUserAssets,
  });

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <h2 className="mb-4 text-lg font-semibold text-text">
        Asset Holding
      </h2>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading holdings...</p> ): isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : holdings.length === 0 ? (
        <p className="text-sm text-gray-400">No holdings yet.</p>
      ) : (
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-400">
              <th className="pb-2 pr-3 font-medium">Asset</th>
              <th className="px-3 pb-2 font-medium">QTY</th>
              <th className="px-3 pb-2 font-medium">Current Value</th>
              <th className="pb-2 pl-3 font-medium">P/L%</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => {
              const isProfit = holding.valuation.profitLossDisplay >= 0;

              return (
                <tr key={holding.id} className="border-t border-border transition-colors hover:bg-background/60">
                  <td className="py-2 pr-3 font-medium text-text">
                    {holding.assets?.symbol}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{holding.quantity}</td>
                  <td className="px-3 py-2 text-gray-600">
                    {formatCurrency(
                      holding.valuation.currentValueDisplay,
                      holding.valuation.displayCurrency
                    )}
                  </td>
                  <td
                    className={`py-2 pl-3 font-medium ${
                      isProfit ? "text-success" : "text-danger"
                    }`}
                  >
                    {isProfit ? "+" : ""}
                    {holding.valuation.profitLossPercentage.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}