import type { TableColumn } from "../tables/table";
import type { Transaction } from "../../types/transaction";
import { formatCurrency } from "../../utils";

export function formatTransactionDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Grey label for removed transactions and accounts
export function RemovedLabel({ children = "Removed" }: { children?: string }) {
  return <span className="text-xs font-medium text-gray-400">{children}</span>;
}

// Columns shared by the Custodian page and History. Prices are shown in the
// currency the user paid.
export const transactionColumns: TableColumn<Transaction>[] = [
  {
    key: "date",
    header: "Date",
    render: (tx) => formatTransactionDate(tx.occurred_at),
  },
  {
    key: "type",
    header: "Type",
    mobile: "value",
    render: (tx) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
          tx.type === "buy" ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
        }`}
      >
        {tx.type === "buy" ? "Buy" : "Sell"}
      </span>
    ),
  },
  {
    key: "asset",
    header: "Asset",
    mobile: "title",
    render: (tx) => (
      <span className="font-medium text-text">{tx.assets?.symbol ?? "-"}</span>
    ),
  },
  {
    key: "qty",
    header: "QTY",
    render: (tx) => tx.quantity,
  },
  {
    key: "price",
    header: "Price",
    align: "right",
    render: (tx) => formatCurrency(Number(tx.price_per_unit), tx.price_currency),
  },
  {
    key: "custodian",
    header: "Custodian",
    render: (tx) => (
      <span>
        {tx.accounts?.name ?? "-"}
        {tx.accounts?.removed_at && (
          <>
            {" "}
            <RemovedLabel>(removed)</RemovedLabel>
          </>
        )}
      </span>
    ),
  },
];
