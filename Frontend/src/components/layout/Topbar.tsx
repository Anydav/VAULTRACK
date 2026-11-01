import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ChevronDown, Moon, Sun, LogOut, Menu, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../services/auth.service";
import { getMe, updatePreferredCurrency } from "../../services/profile.service";
import { getUserAssets } from "../../services/userAssets.service";
import { searchAssets } from "../../services/asset.service";
import { useAddAssetModal } from "../../context/addAssetModelcontext";
import { SUPPORTED_CURRENCIES, CURRENCY_META, formatCurrency } from "../../utils";

interface TopbarProps {
  onOpenNav: () => void;
}

export function Topbar({ onOpenNav }: TopbarProps) {
  // Phones: the search box replaces the bar's contents while it's open
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  // See selectAssetStep: "Search all coins" applies only to the text it was clicked for.
  const [allCoinsQuery, setAllCoinsQuery] = useState<string | null>(null);
  const searchAllCoins = allCoinsQuery === debouncedQuery;
  const searchRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
 const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const queryClient = useQueryClient();
  const profileRef = useRef<HTMLDivElement>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Moved here from the Sidebar
  async function handleLogout() {
    await logout();
    queryClient.clear();
    navigate("/auth");
  }

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

  const changeCurrencyMutation = useMutation({
    mutationFn: updatePreferredCurrency,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["me"], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ["user-assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setIsCurrencyDropdownOpen(false);
    },
  });

  const { data: marketResults = [], isFetching: marketLoading, isError: marketError, refetch: refetchMarket } = useQuery({
  // Own cache name: the add-asset picker shapes its results differently.
  queryKey: ["topbar-asset-search", debouncedQuery, searchAllCoins],
  queryFn: async () => {
  const results = await Promise.allSettled([
    searchAssets(debouncedQuery, "CRYPTO", searchAllCoins),
    searchAssets(debouncedQuery, "NGX"),
  ]);
  return results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);
},
  enabled: debouncedQuery.length > 0,
});

  // One entry per asset, even if it's held with several custodians
  const matchingHoldings = holdings.filter(
    (holding, index) =>
      holding.assets &&
      holdings.findIndex((h) => h.assets?.id === holding.assets?.id) === index &&
      (holding.assets.symbol?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        holding.assets.name?.toLowerCase().includes(debouncedQuery.toLowerCase()))
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
    if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
      setIsCurrencyDropdownOpen(false);
    }
    if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
      setIsProfileMenuOpen(false);
    }
  }
  function handleEscape(event: KeyboardEvent) {
    if (event.key === "Escape") {
      setIsDropdownOpen(false);
      setIsCurrencyDropdownOpen(false);
      setIsProfileMenuOpen(false);
      setIsMobileSearchOpen(false);
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
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.body.classList.contains("theme-dark")
  );

  function toggleTheme() {
    setIsDarkMode((prev) => {
      const next = !prev;
      document.body.classList.toggle("theme-dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }

  function closeMobileSearch() {
    setIsMobileSearchOpen(false);
    setQuery("");
  }

  const initials = (profile?.full_name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <header className="flex h-16 items-center justify-between gap-2 rounded-2xl border border-border bg-surface px-3 shadow-[var(--shadow-card)] sm:gap-4 sm:px-6 md:h-20">
      {/* Phones: menu button */}
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open menu"
        className={`-ml-1 rounded-full p-2 text-gray-600 hover:bg-gray-100 md:hidden ${
          isMobileSearchOpen ? "hidden" : ""
        }`}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Greeting + date */}
      <div
        className={`min-w-0 flex-1 md:flex-none md:shrink-0 ${
          isMobileSearchOpen ? "hidden md:block" : ""
        }`}
      >
        <p className="truncate font-display text-base font-semibold sm:text-lg">
          <span className="text-gray-800">Hello, </span>
          <span className="text-accent-secondary">
            {profileLoading ? "..." : profile?.full_name?.split(" ")[0] ?? "there"}
          </span>
        </p>
        <p className="hidden text-xs text-gray-400 sm:block">{today}</p>
      </div>

      {/* Search bar */}
      <div className={`flex-1 justify-center md:flex ${isMobileSearchOpen ? "flex" : "hidden"}`}>
        <div ref={searchRef} className="relative w-full max-w-md">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search assets..."
                autoFocus={isMobileSearchOpen}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-700 outline-none focus:border-accent-secondary"
              />
            </div>
            <button
              type="button"
              onClick={closeMobileSearch}
              aria-label="Close search"
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
              {matchingHoldings.length > 0 && (
                <div className="p-2">
                  <p className="px-2 py-1 text-xs font-semibold text-gray-400">
                    Your Holdings
                  </p>
                  {matchingHoldings.map((holding) => (
                    <NavLink
                      key={holding.id}
                      to={`/assets/${holding.assets?.id}`}
                      onClick={() => {
  setQuery("");
  setIsDropdownOpen(false);
  setIsMobileSearchOpen(false);
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
  setIsMobileSearchOpen(false);
}}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <span className="flex flex-col items-start">
                        <span>{asset.symbol}</span>
                        <span className="text-xs text-gray-400">
                          {asset.name}
                        </span>
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
                {!marketLoading && !marketError && !searchAllCoins && (
                  <button
                    type="button"
                    onClick={() => setAllCoinsQuery(debouncedQuery)}
                    className="w-full px-2 py-2 text-left text-xs text-gray-400 hover:text-gray-700"
                  >
                    Not seeing your coin?{" "}
                    <span className="font-semibold underline">Search all coins</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification + profile */}
      <div
        className={`flex shrink-0 items-center gap-1 sm:gap-4 ${
          isMobileSearchOpen ? "hidden md:flex" : ""
        }`}
      >
        {/* Phones: search button */}
        <button
          type="button"
          onClick={() => setIsMobileSearchOpen(true)}
          aria-label="Search assets"
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100 md:hidden"
        >
          <Search className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          className="hidden rounded-full p-2 text-gray-500 hover:bg-gray-100 sm:block"
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <div ref={currencyRef} className="relative">
          <button
            type="button"
            onClick={() => setIsCurrencyDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:gap-2 sm:px-3"
          >
            <span>{CURRENCY_META[profile?.preferred_currency as keyof typeof CURRENCY_META]?.flag ?? "🇺🇸"}</span>
            <span>{profile?.preferred_currency ?? "USD"}</span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-gray-400 sm:block" />
          </button>

          {isCurrencyDropdownOpen && (
            <div className="fixed inset-x-3 top-20 z-20 overflow-hidden rounded-xl border border-border bg-surface shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72">
              <p className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Display Currency
              </p>
              <div className="grid grid-cols-2 gap-1 p-2">
                {SUPPORTED_CURRENCIES.map((currencyCode) => {
                  const meta = CURRENCY_META[currencyCode];
                  const isSelected = profile?.preferred_currency === currencyCode;

                  return (
                    <button
                      key={currencyCode}
                      type="button"
                      disabled={changeCurrencyMutation.isPending}
                      onClick={() => changeCurrencyMutation.mutate(currencyCode)}
                      title={meta.name}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 ${
                        isSelected ? "bg-accent" : ""
                      }`}
                    >
                      <span className="text-base leading-none">{meta.flag}</span>
                      <span className="flex min-w-0 flex-col">
                        <span
                          className={`text-sm font-semibold ${
                            isSelected ? "text-accent-secondary" : "text-gray-700"
                          }`}
                        >
                          {currencyCode}
                        </span>
                        <span className="truncate text-[10px] text-gray-400">
                          {meta.name}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((open) => !open)}
            aria-label="Account menu"
            aria-expanded={isProfileMenuOpen}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white ring-offset-2 ring-offset-surface hover:ring-2 hover:ring-accent-secondary"
          >
            {initials}
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
              <div className="border-b border-border px-4 py-3">
                <p className="truncate text-sm font-semibold text-text">{profile?.full_name}</p>
                <p className="truncate text-xs text-gray-400">{profile?.email}</p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:hidden"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDarkMode ? "Light mode" : "Dark mode"}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-danger hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}