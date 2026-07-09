import { useQuery } from "@tanstack/react-query";
import { getUserAssets } from "../../services/userAssets.service";

export default function AssetHoldingCard() {
  const { data: holdings = [], isLoading } = useQuery({
    queryKey: ["user-assets"],
    queryFn: getUserAssets,
  });

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-[#17352F]">
        Asset Holding
      </h2>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading holdings...</p>
      ) : holdings.length === 0 ? (
        <p className="text-sm text-gray-400">No holdings yet.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-400">
              <th className="pb-2 font-medium">Asset</th>
              <th className="pb-2 font-medium">QTY</th>
              <th className="pb-2 font-medium">Current Value</th>
              <th className="pb-2 font-medium">P/L</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => {
              const isProfit = holding.valuation.profitLoss >= 0;

              return (
                <tr key={holding.id} className="border-t border-gray-50">
                  <td className="py-2 font-medium text-[#17352F]">
                    {holding.assets?.symbol}
                  </td>
                  <td className="py-2 text-gray-600">{holding.quantity}</td>
                  <td className="py-2 text-gray-600">
                    {holding.valuation.currentValue.toLocaleString()}
                  </td>
                  <td
                    className={`py-2 font-medium ${
                      isProfit ? "text-green-600" : "text-red-500"
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
      )}
    </div>
  );
}