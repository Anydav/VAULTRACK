import { useState } from "react";
import SnapshotTable from "./snapShotTable";
import TransactionTable from "../../components/transactions/transactionTable";
import { PageHeader } from "../../components/ui/pageHeader";
import { Button } from "../../components/ui/button";
import { useAddAssetModal } from "../../context/addAssetModelcontext";

const tabs = [
  { key: "transactions", label: "Transactions" },
  { key: "snapshots", label: "Snapshots" },
] as const;

type HistoryTab = (typeof tabs)[number]["key"];

export default function History() {
  const [tab, setTab] = useState<HistoryTab>("transactions");
  const { openAddAssetModal } = useAddAssetModal();

  return (
    <div className="space-y-6">
      <PageHeader title="History" />

      <div role="tablist" className="flex gap-6 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium ${
              tab === t.key
                ? "border-text text-text"
                : "border-transparent text-gray-400 hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Every transaction, read-only: changes are made on the Custodian and asset pages */}
      {tab === "transactions" ? (
        <TransactionTable
          emptyAction={<Button onClick={() => openAddAssetModal()}>+ Add Asset</Button>}
        />
      ) : (
        <SnapshotTable />
      )}
    </div>
  );
}
