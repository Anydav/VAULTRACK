import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Search, ChevronDown } from "lucide-react";
import { NavLink } from "react-router-dom";
import { getMe } from "../../services/profile.service";
import { getUserAssets } from "../../services/userAssets.service";
import { searchAssets } from "../../services/asset.service";
import { useAddAssetModal } from "../../context/addAssetModelcontext";

export function Topbar() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
 const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  const { data: marketResults = [], isFetching: marketLoading, isError: marketError, refetch: refetchMarket } = useQuery({
  queryKey: ["asset-search", debouncedQuery],
  queryFn: async () => {
  const results = await Promise.allSettled([
    searchAssets(debouncedQuery, "CRYPTO"),
    searchAssets(debouncedQuery, "NGX"),
  ]);
  return results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);
},
  enabled: debouncedQuery.length > 0,
});

  const matchingHoldings = holdings.filter((holding) =>
    holding.assets?.symbol
      ?.toLowerCase()
      .includes(debouncedQuery.toLowerCase()) ||
    holding.assets?.name?.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  
   useEffect(() => {
  if (debouncedQuery.length > 0) {
    setIsDropdownOpen(true);
  }
}, [debouncedQuery]);

useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      setIsDropdownOpen(false);
    }
  }
  function handleEscape(event: KeyboardEvent) {
    if (event.key === "Escape") {
      setIsDropdownOpen(false);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  document.addEventListener("keydown", handleEscape);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
    document.removeEventListener("keydown", handleEscape);
  };
}, []);

const showDropdown = isDropdownOpen && debouncedQuery.length > 0;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const { openAddAssetModal } = useAddAssetModal();
  const [isDarkMode, setIsDarkMode] = useState(false);
 

  function toggleTheme() {
    setIsDarkMode((prev) => {
      const next = !prev;
      document.body.classList.toggle("theme-dark", next);
      return next;
    });
  }

  return (
    <header className="flex h-20 items-center justify-between gap-4 rounded-2xl bg-white px-4 shadow-sm sm:px-6">
      {/* Greeting + date */}
      <div className="min-w-0 shrink-0">
        <h1 className="truncate text-base font-semibold sm:text-lg">
          <span className="text-gray-800">Hello, </span>
          <span className="text-accent-secondary">
            {profileLoading ? "..." : profile?.full_name?.split(" ")[0] ?? "there"}
          </span>
        </h1>
        <p className="hidden text-xs text-gray-400 sm:block">{today}</p>
      </div>

      {/* Search bar */}
      <div className=" hidden flex-1 justify-center md:flex">
        <div ref={searchRef} className="relative w-full max-w-md">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search assets..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-700 outline-none focus:border-accent-secondary"
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
                      onClick={() => {
  setQuery("");
  setIsDropdownOpen(false);
}}
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
  <p className="px-2 py-2 text-sm text-gray-400">Searching...</p>
) : marketError ? (
  <p className="flex items-center justify-between px-2 py-2 text-sm text-danger">
    Search failed.
    <button
      type="button"
      onClick={() => refetchMarket()}
      className="font-semibold underline"
    >
      Try again
    </button>
  </p>
) : marketResults.length === 0 ? (
                  <p className="px-2 py-2 text-sm text-gray-400">
                    No results found
                  </p>
                ) : (
                  marketResults.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => {
  openAddAssetModal({ asset });
  setQuery("");
  setIsDropdownOpen(false);
}}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <span className="flex flex-col items-start">
                        <span>{asset.symbol}</span>
                        <span className="text-xs text-gray-400">
                          {asset.name}
                        </span>
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
          )}
        </div>
      </div>

      {/* Notification + profile */}
      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme color"
          className="relative h-7 w-14 shrink-0 rounded-full transition-colors duration-300"
            style={{
            backgroundColor: isDarkMode ? "#17352F" : "#1E3A8A",
          }}
          
        >
          <span
            className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
              isDarkMode ? "translate-x-7" : "translate-x-0"
            }`}
          />
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <img
            src="https://flagcdn.com/w40/ng.png"
            alt="Nigeria flag"
            className="h-4 w-5 rounded-sm object-cover"
          />
          <span>NGN</span>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </button>

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