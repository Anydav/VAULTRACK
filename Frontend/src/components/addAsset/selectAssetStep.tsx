import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { searchAssets } from "../../services/asset.service";
import { useAddAssetModal } from "../../context/addAssetModelcontext";
import { Asset } from "../../types/asset";

export default function SelectAssetStep() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["asset-search", debouncedQuery],
    queryFn: () => searchAssets(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

 const { setSelectedAsset, goToStep } = useAddAssetModal();

  function handleSelectAsset(asset: Asset) {
    setSelectedAsset(asset);
    goToStep("details");
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search assets..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-[#17352F]"
        />
      </div>

      <div className="max-h-64 space-y-1 overflow-y-auto">
        {isFetching ? (
          <p className="py-4 text-center text-sm text-gray-400">
            Searching...
          </p>
        ) : debouncedQuery.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">
            Start typing to search assets
          </p>
        ) : results.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">
            No results found
          </p>
        ) : (
          results.map((asset) => (
           <button
              key={asset.id}
              type="button"
              onClick={() => handleSelectAsset(asset)}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-left text-sm hover:border-primary hover:bg-gray-50"
            >
              <span className="flex flex-col items-start">
                <span className="font-medium text-primary">
                  {asset.symbol}
                </span>
                <span className="text-xs text-gray-400">{asset.name}</span>
              </span>
              <span className="text-xs font-medium text-primary">
                {asset.asset_prices?.priceDisplay != null
                  ? `${asset.asset_prices.displayCurrency} ${asset.asset_prices.priceDisplay.toLocaleString()}`
                  : "—"}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}