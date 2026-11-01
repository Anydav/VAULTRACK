import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, LogOut, LayoutDashboard, PieChart, Landmark, Coins, History, Sparkles } from "lucide-react";
import { getAccounts } from "../../services/account.service";
import { getUserAssets } from "../../services/userAssets.service";
import { logout } from "../../services/auth.service";

import Logo from "../../assets/Vector.png";

const topNavItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Portfolio", path: "/portfolio", icon: PieChart },
];

const bottomNavItems = [
  { label: "History", path: "/history", icon: History },
  { label: "Analysis", path: "/Analysis", icon: Sparkles },
];

export function Sidebar() {
   const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const location = useLocation();
  const isOnAssetsRoute = location.pathname.startsWith("/assets");
  const isOnAssetsList = location.pathname === "/assets";
  const isOnAccountsRoute = location.pathname.startsWith("/accounts");
 useEffect(() => {
  if (location.pathname.startsWith("/assets")) {
    setIsAssetsOpen(true);
  }
  if (location.pathname.startsWith("/accounts")) {
    setIsAccountsOpen(true);
  }
}, [location.pathname]);

  const { data: holdings = [], isLoading: assetsLoading } = useQuery({
    queryKey: ["user-assets"],
    queryFn: getUserAssets,
  });

  // One entry per asset, adding up the custodians that hold it
  const topAssets = Object.values(
    holdings.reduce<Record<string, { id: string; label: string; value: number }>>((byAsset, holding) => {
      if (!holding.assets) return byAsset;
      const entry = (byAsset[holding.assets.id] ??= {
        id: holding.assets.id,
        label: holding.assets.symbol ?? holding.assets.name,
        value: 0,
      });
      entry.value += holding.valuation.currentValueDisplay;
      return byAsset;
    }, {})
  )
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  async function handleLogout() {
    await logout();
    queryClient.clear();
    navigate("/auth");
  }
  return (
    <aside className=" hidden h-[calc(100vh-2rem)] w-64 shrink-0 rounded-2xl bg-primary text-white md:flex md:flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-8">
        <img src={Logo} alt="VaultTrack Logo" className="h-8 w-8" />
        <p className="text-xl font-bold text-[#efeeea]">VaultTrack</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {topNavItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-accent text-primary"
                      : "text-white hover:bg-white/10"
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setIsAccountsOpen((prev) => !prev)}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 ${
                isOnAccountsRoute ? "bg-white/10" : ""
              }`}
            >
              <span className="flex items-center gap-3">
                <Landmark className="h-5 w-5" />
               <span>Custodians</span>
              </span>

              <ChevronDown
                className={`h-4 w-4 transition ${
                  isAccountsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isAccountsOpen && (
              <div className="mt-2 space-y-1 pl-8">
                {accountsLoading ? (
                  <p className="text-sm text-white/60">Loading...</p>
                ) : accounts.length === 0 ? (
                  <p className="text-sm text-white/60">No custodians yet</p>
                ): (
                  accounts.map((account) => (
                    <NavLink
                      key={account.id}
                      to={`/accounts/${account.id}`}
                      className={({ isActive }) =>
                        `block rounded-lg px-3 py-2 text-sm transition ${
                          isActive
                            ? "bg-accent text-primary"
                            : "text-white/80 hover:bg-white/10 hover:text-white"
                        }`
                      }
                    >
                      {account.name}
                    </NavLink>
                  ))
                )}
              </div>
            )}
          </li>
<li>
  <div className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
    isOnAssetsList
      ? "bg-accent text-primary"
      : isOnAssetsRoute
      ? "bg-white/10 text-white"
      : "text-white hover:bg-white/10"
  }`}>
    <button
  type="button"
  onClick={() => {
    if (location.pathname.startsWith("/assets")) {
      setIsAssetsOpen((prev) => !prev);
    } else {
      navigate("/assets");
      setIsAssetsOpen(true);
    }
  }}
  className="flex flex-1 items-center gap-3"
>
  <Coins className="h-5 w-5" />
  <span>Assets</span>
</button>

    <button
      type="button"
      onClick={() => setIsAssetsOpen((prev) => !prev)}
      aria-label="Toggle assets"
    >
      <ChevronDown
  className={`h-4 w-4 transition ${
    isAssetsOpen ? "rotate-180" : ""
  }`}
/>
    </button>
  </div>

  {isAssetsOpen && (
    <div className="mt-2 space-y-1 pl-8">
      {assetsLoading ? (
        <p className="text-sm text-white/60">Loading...</p>
      ) : topAssets.length === 0 ? (
        <p className="text-sm text-white/60">No assets yet</p>
      ) : (
        <>
          {topAssets.map((asset) => (
  <NavLink
    key={asset.id}
    to={`/assets/${asset.id}`}
    className={({ isActive }) =>
      `block rounded-lg px-3 py-2 text-sm transition ${
        isActive
          ? "bg-accent text-primary"
          : "text-white/80 hover:bg-white/10 hover:text-white"
      }`
    }
  >
    {asset.label}
  </NavLink>
))}
        </>
      )}
    </div>
  )}
</li>
{bottomNavItems.map((item) => (
  <li key={item.path}>
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
          isActive
            ? "bg-accent text-primary"
            : "text-white hover:bg-white/10"
        }`
      }
    >
      <item.icon className="h-5 w-5" />
      <span>{item.label}</span>
    </NavLink>
  </li>
))}
          <li>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
    );
}