import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { searchAssets } from "../../services/asset.service";
import { useAddAssetModal } from "../../context/addAssetModelcontext";
import { Asset } from "../../types/asset";
import { formatCurrency } from "../../utils";

function interleave(a: Asset[], b: Asset[]): Asset[] {
  const result: Asset[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (a[i]) result.push(a[i]);
    if (b[i]) result.push(b[i]);
  }
  return result;
}

async function fetchMixedAssets(query: string, allCoins: boolean): Promise<Asset[]> {
  const [cryptoResult, ngxResult] = await Promise.allSettled([
    searchAssets(query, "CRYPTO", allCoins),
    searchAssets(query, "NGX"),
  ]);

  // Only surface an error if BOTH markets failed — one market being
  // down shouldn't hide results the other one did return.
  if (cryptoResult.status === "rejected" && ngxResult.status === "rejected") {
    throw cryptoResult.reason;
  }

  const cryptoAssets = cryptoResult.status === "fulfilled" ? cryptoResult.value : [];
  const ngxAssets = ngxResult.status === "fulfilled" ? ngxResult.value : [];

  const mixed = interleave(cryptoAssets, ngxAssets);
  // "Search all coins" can find more than 10, so show them all (the list scrolls).
  return allCoins ? mixed : mixed.slice(0, 10);
}

export default function SelectAssetStep() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  // Which search text "Search all coins" was clicked for. Typing something
  // new no longer matches it, so search goes back to fast/local by itself.
  const [allCoinsQuery, setAllCoinsQuery] = useState<string | null>(null);
  const searchAllCoins = allCoinsQuery === debouncedQuery;

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const {
    data: results = [],
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["asset-search", debouncedQuery, searchAllCoins],
    queryFn: () => fetchMixedAssets(debouncedQuery, searchAllCoins),
  });

  const { setSelectedAsset, goToStep } = useAddAssetModal();

  function handleSelectAsset(asset: Asset) {
    setSelectedAsset(asset);
    goToStep("details");
  }

  const isBrowsing = debouncedQuery.length === 0;

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

      {isBrowsing && !isFetching && results.length > 0 && (
        <p className="text-xs text-gray-400">
          Popular assets — search to find something specific.
        </p>
      )}

      <div className="max-h-64 space-y-1 overflow-y-auto">
        {isFetching ? (
          <p className="py-4 text-center text-sm text-gray-400">
            {isBrowsing ? "Loading assets..." : "Searching..."}
          </p>
        ) : isError ? (
          <div className="flex items-center justify-center gap-3 py-4 text-sm text-danger">
            <span>Couldn't load assets.</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="font-semibold underline"
            >
              Try again
            </button>
          </div>
        ) : results.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">
            {isBrowsing ? "No assets available yet" : "No results found"}
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
                <span className="flex items-center gap-2">
                  <span className="font-medium text-text">
                    {asset.symbol}
                  </span>
                  <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                    {asset.market}
                  </span>
                </span>
                <span className="text-xs text-gray-400">{asset.name}</span>
              </span>
              <span className="text-xs font-medium text-text">
                {asset.asset_prices?.priceDisplay != null
                  ? formatCurrency(
                      asset.asset_prices.priceDisplay,
                      asset.asset_prices.displayCurrency
                    )
                  : "—"}
              </span>
            </button>
          ))
        )}
      </div>

      {!isBrowsing && !isFetching && !isError && !searchAllCoins && (
        <button
          type="button"
          onClick={() => setAllCoinsQuery(debouncedQuery)}
          className="w-full py-1 text-center text-xs text-gray-400 hover:text-text"
        >
          Not seeing your coin?{" "}
          <span className="font-semibold underline">Search all coins</span>
        </button>
      )}
    </div>
  );
}
