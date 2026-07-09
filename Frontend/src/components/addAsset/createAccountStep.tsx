import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAccount } from "../../services/account.service";
import { useAddAssetModal } from "../../context/addAssetModelcontext";

export default function CreateAccountStep() {
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState("");
  const [currency, setCurrency] = useState("");

  const queryClient = useQueryClient();
  const { selectedAsset, setSelectedAccountId, goToStep } =
    useAddAssetModal();

  const mutation = useMutation({
    mutationFn: () => createAccount({ name, accountType, currency }),
    onSuccess: (account) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setSelectedAccountId(account.id);
      goToStep(selectedAsset ? "details" : "asset");
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-gray-500">
          Account name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#17352F]"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-500">
          Account type
        </label>
        <input
          type="text"
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
          placeholder="e.g. bank, wallet"
          required
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#17352F]"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-500">
          Currency (optional)
        </label>
        <input
          type="text"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          placeholder="e.g. USD"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#17352F]"
        />
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-500">
          Something went wrong. Please try again.
        </p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full rounded-xl bg-[#17352F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0f241f] disabled:opacity-60"
      >
        {mutation.isPending ? "Creating..." : "Create Account"}
      </button>
    </form>
  );
}