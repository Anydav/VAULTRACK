import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccounts, removeAccount } from "../../services/account.service";
import { transactionsQuery } from "../../services/transaction.service";
import AccountSummaryCard from "../Accounts/accountSummaryCard";
import AccountAssetsTable from "../Accounts/accountAssetTable";
import TransactionTable from "../../components/transactions/transactionTable";
import EditAccountModal from "./editAccountModal";
import SellModal from "../../components/transactions/sellModal";
import { ConfirmModal } from "../../components/ui/confirmModal";
import { PageHeader } from "../../components/ui/pageHeader";
import { Tabs } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { useAddAssetModal } from "../../context/addAssetModelcontext";
import { useToast } from "../../context/toastContext";
import type { Holding } from "../../types/userAssets";
import { getErrorMessage, refreshPortfolio } from "../../utils/apiError";

const tabs = [
  { key: "assets", label: "Assets" },
  { key: "transactions", label: "Transactions" },
] as const;

type CustodianTab = (typeof tabs)[number]["key"];

export default function AccountDetail() {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [sellHolding, setSellHolding] = useState<Holding | null>(null);
  const [tab, setTab] = useState<CustodianTab>("assets");

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  // Same query as the transactions table; used for the count in Remove
  const { data: transactions = [] } = useQuery({
    ...transactionsQuery({ accountId }),
    enabled: !!accountId,
  });

  const account = accounts.find((acc) => acc.id === accountId);

  const { openAddAssetModal } = useAddAssetModal();

  const removeMutation = useMutation({
    mutationFn: () => removeAccount(accountId!),
    onSuccess: () => {
      refreshPortfolio(queryClient);
      showToast(`${account?.name ?? "Custodian"} removed`, "success", 4000);
      navigate("/dashboard");
    },
  });

if (!accountId) {
  return <p className="text-sm text-gray-400">Invalid custodian.</p>;
}

  return (
    <div className="space-y-6">
      <PageHeader
        title={account?.name ?? "Custodian"}
        actions={
          <>
            <Button variant="secondary" disabled={!account} onClick={() => setIsEditOpen(true)}>
              Edit
            </Button>
            <Button variant="secondary" disabled={!account} onClick={() => setIsRemoveOpen(true)}>
              Remove
            </Button>
            <Button onClick={() => openAddAssetModal({ accountId })}>+ Add Asset</Button>
          </>
        }
      />

      <AccountSummaryCard accountId={accountId} />
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "assets" ? (
        <AccountAssetsTable accountId={accountId} onSell={setSellHolding} />
      ) : (
        <TransactionTable
          accountId={accountId}
          onSell={setSellHolding}
          hideTitle
          emptyMessage="No transactions in this custodian yet"
        />
      )}

      {isEditOpen && account && (
        <EditAccountModal account={account} onClose={() => setIsEditOpen(false)} />
      )}

      {isRemoveOpen && account && (
        <ConfirmModal
          title={`Remove ${account.name}?`}
          confirmLabel="Remove"
          onConfirm={() => removeMutation.mutate()}
          onClose={() => setIsRemoveOpen(false)}
          isPending={removeMutation.isPending}
          error={removeMutation.isError ? getErrorMessage(removeMutation.error) : null}
        >
          <p>
            Its holdings leave your portfolio and totals. Its {transactions.length}{" "}
            {transactions.length === 1 ? "transaction stays" : "transactions stay"} in History.
          </p>
        </ConfirmModal>
      )}

      {sellHolding && (
        <SellModal holdings={[sellHolding]} onClose={() => setSellHolding(null)} />
      )}
    </div>
  );
}
