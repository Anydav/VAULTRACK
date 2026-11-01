import SnapshotTable from "./snapShotTable";
import TransactionTable from "../../components/transactions/transactionTable";

export default function History() {
  return (
    <div className="space-y-6">
      {/* Every transaction, read-only: changes are made on the Custodian and asset pages */}
      <TransactionTable />
      <SnapshotTable />
    </div>
  );
}
