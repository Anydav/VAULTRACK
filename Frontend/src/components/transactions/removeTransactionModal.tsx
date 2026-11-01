import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfirmModal } from "../ui/confirmModal";
import { removeTransaction } from "../../services/transaction.service";
import { useToast } from "../../context/toastContext";
import type { Transaction } from "../../types/transaction";
import { formatCurrency } from "../../utils";
import { getErrorMessage, refreshPortfolio } from "../../utils/apiError";
import { formatTransactionDate } from "./transactionColumns";

interface RemoveTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
  // Given only for a buy of an asset still held: offers Sell instead
  onRecordSale?: () => void;
}

export default function RemoveTransactionModal({
  transaction,
  onClose,
  onRecordSale,
}: RemoveTransactionModalProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: () => removeTransaction(transaction.id),
    onSuccess: () => {
      refreshPortfolio(queryClient);
      showToast("Transaction removed", "success", 4000);
      onClose();
    },
  });

  const summary = `${transaction.type === "buy" ? "Buy" : "Sell"} · ${transaction.quantity} ${
    transaction.assets?.symbol ?? ""
  } @ ${formatCurrency(Number(transaction.price_per_unit), transaction.price_currency)} · ${formatTransactionDate(
    transaction.occurred_at
  )}`;

  return (
    <ConfirmModal
      title="Remove this transaction?"
      confirmLabel="Remove"
      onConfirm={() => mutation.mutate()}
      onClose={onClose}
      isPending={mutation.isPending}
      error={mutation.isError ? getErrorMessage(mutation.error) : null}
      secondaryAction={
        onRecordSale ? { label: "Record a sale instead", onClick: onRecordSale } : undefined
      }
    >
      <p className="font-medium text-text">{summary}</p>
      {transaction.type === "buy" ? (
        <p>
          Only remove a transaction you entered by mistake. It will be treated as if it never
          happened. If you sold this asset, use Sell instead.
        </p>
      ) : (
        <p>It will be treated as if it never happened.</p>
      )}
    </ConfirmModal>
  );
}
