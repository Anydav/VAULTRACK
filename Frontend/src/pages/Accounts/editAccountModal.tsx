import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "../../components/ui/model";
import { updateAccount } from "../../services/account.service";
import { useToast } from "../../context/toastContext";
import type { Account } from "../../types/account";
import { getErrorMessage } from "../../utils/apiError";

interface EditAccountModalProps {
  account: Account;
  onClose: () => void;
}

// Same fields as "Add Custodian"; only changes the name, type and currency
export default function EditAccountModal({ account, onClose }: EditAccountModalProps) {
  const [name, setName] = useState(account.name);
  const [accountType, setAccountType] = useState(account.account_type);
  const [currency, setCurrency] = useState(account.currency ?? "");

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: () =>
      updateAccount(account.id, {
        name,
        accountType,
        currency: currency || undefined,
      }),
    onSuccess: () => {
      // Names show in holdings and transactions too
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["user-assets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      showToast("Custodian updated", "success", 4000);
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#17352F]";

  return (
    <Modal isOpen onClose={onClose} title="Edit custodian">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Custodian name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Custodian type</label>
          <input
            type="text"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            placeholder="e.g. bank, exchange, brokerage"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Currency (optional)</label>
          <input
            type="text"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            placeholder="e.g. USD"
            className={inputClass}
          />
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-500">{getErrorMessage(mutation.error)}</p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {mutation.isPending ? "Saving..." : "Save"}
        </button>
      </form>
    </Modal>
  );
}
