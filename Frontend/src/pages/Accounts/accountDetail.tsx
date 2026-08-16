import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAccounts } from "../../services/account.service";
import AccountSummaryCard from "../Accounts/accountSummaryCard";
import AccountAssetsTable from "../Accounts/accountAssetTable";
import { useAddAssetModal } from "../../context/addAssetModelcontext";  

export default function AccountDetail() {
  const { accountId } = useParams<{ accountId: string }>();

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  const account = accounts.find((acc) => acc.id === accountId);

  const { openAddAssetModal } = useAddAssetModal();

if (!accountId) {
  return <p className="text-sm text-gray-400">Invalid account.</p>;
}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">{account?.name ?? "Account"}</h1>
        <button
          type="button"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f241f]"
          onClick={() => openAddAssetModal({ accountId })}
        >
          + Add Asset
        </button>
      </div>

      <AccountSummaryCard accountId={accountId} />
      <AccountAssetsTable accountId={accountId} />
    </div>
  );
}