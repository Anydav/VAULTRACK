import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  LayoutDashboard,
  PieChart,
  Landmark,
  Coins,
  History,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { getAccounts } from "../../services/account.service";
import { getUserAssets } from "../../services/userAssets.service";
import Logo from "../../assets/Vector.png";

const topNavItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Portfolio", path: "/portfolio", icon: PieChart },
];

const bottomNavItems = [
  { label: "History", path: "/history", icon: History },
  { label: "Analysis", path: "/Analysis", icon: Sparkles },
];

// Top-level links: gold when you're on that page
function rowClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
    isActive ? "bg-accent text-primary" : "text-white hover:bg-white/10"
  }`;
}

// Links inside a dropdown: same rule, smaller; long names are cut with "…"
function subItemClass({ isActive }: { isActive: boolean }) {
  return `block truncate rounded-lg px-3 py-2 text-sm transition ${
    isActive
      ? "bg-accent font-medium text-primary"
      : "text-white/75 hover:bg-white/10 hover:text-white"
  }`;
}

interface NavGroupProps {
  icon: LucideIcon;
  label: string;
  isOpen: boolean;
  isInside: boolean; // you're on one of its pages: faint highlight
  onToggle: () => void;
  children: ReactNode;
}

// A row that opens a list underneath it (Custodians, Assets)
function NavGroup({ icon: Icon, label, isOpen, isInside, onToggle, children }: NavGroupProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 ${
          isInside ? "bg-white/10" : ""
        }`}
      >
        <Icon className="h-5 w-5" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Slides open by growing from 0 to full height; hidden items can't be tabbed to */}
      <div
        className={`grid transition-[grid-template-rows,visibility] duration-200 ${
          isOpen ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="ml-6 mt-1 space-y-1 border-l border-white/15 pl-3">{children}</div>
        </div>
      </div>
    </li>
  );
}

export function Sidebar() {
  const { pathname } = useLocation();
  const isOnAccounts = pathname.startsWith("/accounts");
  const isOnAssets = pathname.startsWith("/assets");

  const [isAccountsOpen, setIsAccountsOpen] = useState(isOnAccounts);
  const [isAssetsOpen, setIsAssetsOpen] = useState(isOnAssets);

  // Arriving on a custodian or asset page opens its group
  useEffect(() => {
    if (isOnAccounts) setIsAccountsOpen(true);
    if (isOnAssets) setIsAssetsOpen(true);
  }, [isOnAccounts, isOnAssets]);

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

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

  return (
    <aside className="hidden h-[calc(100vh-2rem)] w-64 shrink-0 rounded-2xl bg-primary text-white md:flex md:flex-col">
      <div className="flex items-center gap-3 px-6 py-8">
        <img src={Logo} alt="VaultTrack Logo" className="h-8 w-8" />
        <p className="text-xl font-bold text-[#efeeea]">VaultTrack</p>
      </div>

      <nav className="thin-scrollbar flex-1 overflow-y-auto px-4 pb-4">
        <ul className="space-y-2">
          {topNavItems.map((item) => (
            <li key={item.path}>
              <NavLink to={item.path} className={rowClass}>
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}

          <NavGroup
            icon={Landmark}
            label="Custodians"
            isOpen={isAccountsOpen}
            isInside={isOnAccounts}
            onToggle={() => setIsAccountsOpen((open) => !open)}
          >
            {accountsLoading ? (
              <p className="px-3 py-2 text-sm text-white/60">Loading...</p>
            ) : accounts.length === 0 ? (
              <p className="px-3 py-2 text-sm text-white/60">No custodians yet</p>
            ) : (
              accounts.map((account) => (
                <NavLink
                  key={account.id}
                  to={`/accounts/${account.id}`}
                  title={account.name}
                  className={subItemClass}
                >
                  {account.name}
                </NavLink>
              ))
            )}
          </NavGroup>

          <NavGroup
            icon={Coins}
            label="Assets"
            isOpen={isAssetsOpen}
            isInside={isOnAssets}
            onToggle={() => setIsAssetsOpen((open) => !open)}
          >
            <NavLink to="/assets" end className={subItemClass}>
              All assets
            </NavLink>
            {assetsLoading ? (
              <p className="px-3 py-2 text-sm text-white/60">Loading...</p>
            ) : (
              topAssets.map((asset) => (
                <NavLink
                  key={asset.id}
                  to={`/assets/${asset.id}`}
                  title={asset.label}
                  className={subItemClass}
                >
                  {asset.label}
                </NavLink>
              ))
            )}
          </NavGroup>

          {bottomNavItems.map((item) => (
            <li key={item.path}>
              <NavLink to={item.path} className={rowClass}>
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
