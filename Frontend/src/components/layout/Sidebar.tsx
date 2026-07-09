import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, LogOut } from "lucide-react";
import { getAccounts } from "../../services/account.service";
import { getUserAssets } from "../../services/userAssets.service";
import { logout } from "../../services/auth.service";

import Logo from "../../assets/Vector.png";
import DashboardIcon from "../../assets/Category.png";
import PortfolioIcon from "../../assets/Chat.png";
import AccountsIcon from "../../assets/stats.png";
import AssetsIcon from "../../assets/Search.png";
import HistoryIcon from "../../assets/Chart.png";
import SettingsIcon from "../../assets/Setting.png";

const topNavItems = [
  { label: "Dashboard", path: "/dashboard", icon: DashboardIcon },
  { label: "Portfolio", path: "/portfolio", icon: PortfolioIcon },
];

const bottomNavItems = [
  { label: "History", path: "/history", icon: HistoryIcon },
  { label: "Settings", path: "/settings", icon: SettingsIcon },
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

  const { data: holdings = [], isLoading: assetsLoading } = useQuery({
    queryKey: ["user-assets"],
    queryFn: getUserAssets,
  });

  const topAssets = [...holdings]
    .sort((a, b) => b.valuation.currentValueDisplay - a.valuation.currentValueDisplay)
    .slice(0, 5);

  async function handleLogout() {
    await logout();
    queryClient.clear();
    navigate("/auth");
  }
  return (
    <aside className=" hidden h-[calc(100vh-2rem)] w-64 shrink-0 rounded-2xl bg-[#17352F] text-white md:flex md:flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-8">
        <img src={Logo} alt="VaultTrack Logo" className="h-8 w-8" />
        <p className="text-xl font-bold text-[#FFD85B]">VaultTrack</p>
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
                      ? "bg-[#C8F169] text-[#17352F]"
                      : "text-white hover:bg-white/10"
                  }`
                }
              >
                <img
                  src={item.icon}
                  alt=""
                  className="h-5 w-5 object-contain"
                />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setIsAccountsOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <span className="flex items-center gap-3">
                <img src={AccountsIcon} alt="" className="h-5 w-5 object-contain" />
               <span>Accounts</span>
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
                  <p className="text-sm text-white/60">No accounts yet</p>
                ): (
                  accounts.map((account) => (
                    <NavLink
                      key={account.id}
                      to={`/accounts/${account.id}`}
                      className={({ isActive }) =>
                        `block rounded-lg px-3 py-2 text-sm transition ${
                          isActive
                            ? "bg-[#C8F169] text-[#17352F]"
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
  <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10">
    <NavLink
      to="/assets"
      className={({ isActive }) =>
        `flex flex-1 items-center gap-3 ${
          isActive ? "text-[#C8F169]" : "text-white"
        }`
      }
    >
      <img src={AssetsIcon} alt="" className="h-5 w-5 object-contain" />
      <span>Assets</span>
    </NavLink>

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
          {topAssets.map((holding) => (
  <NavLink
    key={holding.id}
    to={`/assets/${holding.id}`}
    className={({ isActive }) =>
      `block rounded-lg px-3 py-2 text-sm transition ${
        isActive
          ? "bg-[#C8F169] text-[#17352F]"
          : "text-white/80 hover:bg-white/10 hover:text-white"
      }`
    }
  >
    {holding.assets?.symbol ?? holding.assets?.name}
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
            ? "bg-[#C8F169] text-[#17352F]"
            : "text-white hover:bg-white/10"
        }`
      }
    >
      <img src={item.icon} alt="" className="h-5 w-5 object-contain" />
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