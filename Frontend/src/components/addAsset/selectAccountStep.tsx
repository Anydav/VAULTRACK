import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { getAccounts } from "../../services/account.service";
import { useAddAssetModal } from "../../context/addAssetModelcontext";

export default function SelectAccountStep() {
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  const { selectedAsset, setSelectedAccountId, goToStep } =
    useAddAssetModal();

  function handleSelectAccount(accountId: string) {
    setSelectedAccountId(accountId);
    goToStep(selectedAsset ? "details" : "asset");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[160px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-text" />
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {accounts.map((account) => (
        <button
          key={account.id}
          type="button"
          onClick={() => handleSelectAccount(account.id)}
          className="flex h-32 w-32 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-gray-200 p-4 text-center hover:border-primary hover:bg-gray-50"
        >
          <span className="line-clamp-2 text-sm font-semibold text-text">
            {account.name}
          </span>
          <span className="text-xs text-gray-400">{account.account_type}</span>
        </button>
      ))}

      <button
        type="button"
        onClick={() => goToStep("createAccount")}
        className="flex h-32 w-32 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 text-gray-500 hover:border-primary hover:text-text"
      >
        <Plus className="h-6 w-6" />
        <span className="text-xs font-medium">Add Account</span>
      </button>
    </div>
  );
}