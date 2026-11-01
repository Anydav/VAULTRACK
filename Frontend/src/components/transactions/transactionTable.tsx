import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { transactionsQuery } from "../../services/transaction.service";
import { getUserAssets } from "../../services/userAssets.service";
import { Table, type TableColumn } from "../tables/table";
import { transactionColumns, RemovedLabel } from "./transactionColumns";
import RemoveTransactionModal from "./removeTransactionModal";
import type { Transaction } from "../../types/transaction";
import type { Holding } from "../../types/userAssets";
import { Card } from "../ui/card";

interface TransactionTableProps {
  accountId?: string;
  assetId?: string;
  // Given where the user can act (Custodian and asset pages): shows Remove on
  // each row and lets "Record a sale instead" open Sell. Without it the table
  // is read-only (History).
  onSell?: (holding: Holding) => void;
  emptyMessage?: string;
}

// Transactions, newest first, including removed ones. Filtered by custodian
// and/or asset; the column already given by the page is left out.
export default function TransactionTable({
  accountId,
  assetId,
  onSell,
  emptyMessage = "No transactions yet",
}: TransactionTableProps) {
  const [toRemove, setToRemove] = useState<Transaction | null>(null);

  const { data: transactions = [], isLoading, isError, refetch } = useQuery(
    transactionsQuery({ accountId, assetId })
  );

  const { data: holdings = [] } = useQuery({
    queryKey: ["user-assets"],
    queryFn: getUserAssets,
  });

  const columns: TableColumn<Transaction>[] = transactionColumns.filter(
    (column) =>
      !(column.key === "asset" && assetId) && !(column.key === "custodian" && accountId)
  );

  columns.push({
    key: "status",
    header: "",
    align: "right",
    render: (tx) => {
      if (tx.removed_at) return <RemovedLabel />;
      // Transactions on a removed custodian can't be changed
      if (!onSell || tx.accounts?.removed_at) return null;

      return (
        <button
          type="button"
          onClick={() => setToRemove(tx)}
          className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-danger hover:border-danger"
        >
          Remove
        </button>
      );
    },
  });

  // For a buy of something still held, offer Sell instead of Remove
  const holdingForRemove =
    toRemove?.type === "buy"
      ? holdings.find(
          (h) => h.accounts?.id === toRemove.accounts?.id && h.assets?.id === toRemove.assets?.id
        )
      : undefined;

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-text">Transactions</h2>

      <Table
        columns={columns}
        data={transactions}
        getRowKey={(tx) => tx.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyMessage={emptyMessage}
      />

      {toRemove && (
        <RemoveTransactionModal
          transaction={toRemove}
          onClose={() => setToRemove(null)}
          onRecordSale={
            holdingForRemove && onSell
              ? () => {
                  setToRemove(null);
                  onSell(holdingForRemove);
                }
              : undefined
          }
        />
      )}
    </Card>
  );
}
