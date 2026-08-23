import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { getAccounts, createAccount } from "../../services/account.service";
import { useAddAssetModal } from "../../context/addAssetModelcontext";

interface PresetCustodian {
  name: string;
  accountType: string;
  currency: string;
  color: string;
  initials: string;
  domain: string;
}

const CRYPTO_CUSTODIANS: PresetCustodian[] = [
  { name: "Bybit", accountType: "Crypto Exchange", currency: "USD", color: "#F7A600", initials: "BY", domain: "bybit.com" },
  { name: "Binance", accountType: "Crypto Exchange", currency: "USD", color: "#EFB90B", initials: "BN", domain: "binance.com" },
  { name: "Trust Wallet", accountType: "Crypto Wallet", currency: "USD", color: "#3375BB", initials: "TW", domain: "trustwallet.com" },
];

const STOCK_CUSTODIANS: PresetCustodian[] = [
  { name: "Bamboo", accountType: "Brokerage", currency: "USD", color: "#00A86B", initials: "BB", domain: "investbamboo.com" },
  { name: "Stanbic IBTC", accountType: "Brokerage", currency: "NGN", color: "#0033A0", initials: "SB", domain: "stanbicibtc.com" },
  { name: "Chaka", accountType: "Brokerage", currency: "USD", color: "#6C5CE7", initials: "CK", domain: "chaka.com" },
  { name: "Cowrywise", accountType: "Investment Platform", currency: "NGN", color: "#00B4A0", initials: "CW", domain: "cowrywise.com" },
];

const PRESET_BY_NAME = new Map(
  [...CRYPTO_CUSTODIANS, ...STOCK_CUSTODIANS].map((preset) => [
    preset.name.toLowerCase(),
    preset,
  ])
);

const AVATAR_COLORS = [
  "var(--color-primary)",
  "var(--color-accent-secondary)",
  "#F5B841",
  "#7C9EFF",
  "#E57373",
  "#16A34A",
];

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface CustodianLogoProps {
  name: string;
  domain?: string;
  color: string;
  initials: string;
}

function CustodianLogo({ name, domain, color, initials }: CustodianLogoProps) {
  const [failed, setFailed] = useState(false);

  if (domain && !failed) {
    return (
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm">
        <img
          src={`https://logo.clearbit.com/${domain}?size=128`}
          alt={`${name} logo`}
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  );
}

interface CustodianCardProps {
  name: string;
  subtitle: string;
  color: string;
  initials: string;
  domain?: string;
  onClick: () => void;
  disabled?: boolean;
  isPending?: boolean;
}

function CustodianCard({
  name,
  subtitle,
  color,
  initials,
  domain,
  onClick,
  disabled,
  isPending,
}: CustodianCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 p-4 text-center transition hover:border-primary hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? (
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: color }}
        >
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        </span>
      ) : (
        <CustodianLogo name={name} domain={domain} color={color} initials={initials} />
      )}
      <span className="w-full">
        <span className="line-clamp-1 block text-sm font-semibold text-text">
          {name}
        </span>
        <span className="line-clamp-1 block text-xs text-gray-400">
          {isPending ? "Adding..." : subtitle}
        </span>
      </span>
    </button>
  );
}

export default function SelectAccountStep() {
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  const queryClient = useQueryClient();
  const { selectedAsset, setSelectedAccountId, goToStep } =
    useAddAssetModal();
  const [pendingName, setPendingName] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: (account) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setSelectedAccountId(account.id);
      goToStep(selectedAsset ? "details" : "asset");
    },
    onSettled: () => setPendingName(null),
  });

  function handleSelectExisting(accountId: string) {
    setSelectedAccountId(accountId);
    goToStep(selectedAsset ? "details" : "asset");
  }

  function handleSelectPreset(preset: PresetCustodian) {
    setPendingName(preset.name);
    createMutation.mutate({
      name: preset.name,
      accountType: preset.accountType,
      currency: preset.currency,
    });
  }

  const existingNames = new Set(
    accounts.map((account) => account.name.trim().toLowerCase())
  );
  const cryptoOptions = CRYPTO_CUSTODIANS.filter(
    (preset) => !existingNames.has(preset.name.toLowerCase())
  );
  const stockOptions = STOCK_CUSTODIANS.filter(
    (preset) => !existingNames.has(preset.name.toLowerCase())
  );

  const isBusy = createMutation.isPending;
  const gridClasses = "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4";

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => goToStep("createAccount")}
          disabled={isBusy}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f241f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Custodian
        </button>
      </div>

      {(isLoading || accounts.length > 0) && (
        <section>
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Your Custodians
          </h3>
          {isLoading ? (
            <div className="flex min-h-[72px] items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-text" />
            </div>
          ) : (
            <div className={gridClasses}>
              {accounts.map((account) => {
                const preset = PRESET_BY_NAME.get(
                  account.name.trim().toLowerCase()
                );
                return (
                  <CustodianCard
                    key={account.id}
                    name={account.name}
                    subtitle={account.account_type}
                    color={preset?.color ?? getAvatarColor(account.name)}
                    initials={preset?.initials ?? getInitials(account.name)}
                    domain={preset?.domain}
                    disabled={isBusy}
                    onClick={() => handleSelectExisting(account.id)}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}

      {cryptoOptions.length > 0 && (
        <section>
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Crypto Custodians
          </h3>
          <div className={gridClasses}>
            {cryptoOptions.map((preset) => (
              <CustodianCard
                key={preset.name}
                name={preset.name}
                subtitle={`${preset.accountType} · ${preset.currency}`}
                color={preset.color}
                initials={preset.initials}
                domain={preset.domain}
                disabled={isBusy}
                isPending={pendingName === preset.name}
                onClick={() => handleSelectPreset(preset)}
              />
            ))}
          </div>
        </section>
      )}

      {stockOptions.length > 0 && (
        <section>
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Stock &amp; Investment Custodians
          </h3>
          <div className={gridClasses}>
            {stockOptions.map((preset) => (
              <CustodianCard
                key={preset.name}
                name={preset.name}
                subtitle={`${preset.accountType} · ${preset.currency}`}
                color={preset.color}
                initials={preset.initials}
                domain={preset.domain}
                disabled={isBusy}
                isPending={pendingName === preset.name}
                onClick={() => handleSelectPreset(preset)}
              />
            ))}
          </div>
        </section>
      )}

      {createMutation.isError && (
        <p className="text-center text-sm text-red-500">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}
