import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Search } from "lucide-react";
import { NavLink } from "react-router-dom";
import { getMe } from "../../services/profile.service";
import { getUserAssets } from "../../services/userAssets.service";
import { searchAssets } from "../../services/asset.service";

export function Topbar() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });

  const { data: holdings = [] } = useQuery({
    queryKey: ["user-assets"],
    queryFn: getUserAssets,
  });

  const { data: marketResults = [], isFetching: marketLoading } = useQuery({
    queryKey: ["asset-search", debouncedQuery],
    queryFn: () => searchAssets(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  const matchingHoldings = holdings.filter((holding) =>
    holding.assets?.symbol
      ?.toLowerCase()
      .includes(debouncedQuery.toLowerCase()) ||
    holding.assets?.name?.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  const showDropdown = debouncedQuery.length > 0;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="flex h-20 items-center justify-between gap-4 rounded-2xl bg-white px-4 shadow-sm sm:px-6">
      {/* Greeting + date */}
      <div className="min-w-0 shrink-0">
        <h1 className="truncate text-base font-semibold sm:text-lg">
          <span className="text-gray-800">Hello, </span>
          <span style={{ color: "#1E9301" }}>
            {profileLoading ? "..." : profile?.full_name?.split(" ")[0] ?? "there"}
          </span>
        </h1>
        <p className="hidden text-xs text-gray-400 sm:block">{today}</p>
      </div>

      {/* Search bar */}
      <div className="relative hidden flex-1 justify-center md:flex">
        <div className="w-full max-w-md">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search assets..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-700 outline-none focus:border-[#1E9301]"
            />
          </div>

          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
              {matchingHoldings.length > 0 && (
                <div className="p-2">
                  <p className="px-2 py-1 text-xs font-semibold text-gray-400">
                    Your Holdings
                  </p>
                  {matchingHoldings.map((holding) => (
                    <NavLink
                      key={holding.id}
                      to={`/assets/${holding.id}`}
                      onClick={() => setQuery("")}
                      className="flex items-center justify-between rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <span>{holding.assets?.symbol}</span>
                      <span className="text-xs text-gray-400">
                        {holding.assets?.name}
                      </span>
                    </NavLink>
                  ))}
                </div>
              )}

              <div className="p-2">
                <p className="px-2 py-1 text-xs font-semibold text-gray-400">
                  Market Results
                </p>
                {marketLoading ? (
                  <p className="px-2 py-2 text-sm text-gray-400">
                    Searching...
                  </p>
                ) : marketResults.length === 0 ? (
                  <p className="px-2 py-2 text-sm text-gray-400">
                    No results found
                  </p>
                ) : (
                  marketResults.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between rounded-lg px-2 py-2 text-sm text-gray-700"
                    >
                      <span>{asset.symbol}</span>
                      <span className="text-xs text-gray-400">
                        {asset.name}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification + profile */}
      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <button
          type="button"
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200" />
      </div>
    </header>
  );
}