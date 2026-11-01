import { useState } from "react";
import SnapshotTable from "./snapShotTable";
import TransactionTable from "../../components/transactions/transactionTable";
import { PageHeader } from "../../components/ui/pageHeader";
import { Tabs } from "../../components/ui/tabs";
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

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* Every transaction, read-only: changes are made on the Custodian and asset pages */}
      {tab === "transactions" ? (
        <TransactionTable
          hideTitle
          emptyAction={<Button onClick={() => openAddAssetModal()}>+ Add Asset</Button>}
        />
      ) : (
        <SnapshotTable />
      )}
    </div>
  );
}
