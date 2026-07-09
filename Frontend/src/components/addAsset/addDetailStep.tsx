import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createHolding } from "../../services/userAssets.service";
import { useAddAssetModal } from "../../context/addAssetModelcontext";

export default function AssetDetailsStep() {
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [costCurrency, setCostCurrency] = useState("USD");
  const [acquiredAt, setAcquiredAt] = useState("");

  const queryClient = useQueryClient();
  const { selectedAccountId, selectedAsset, closeModal } =
    useAddAssetModal();

  const selectedAssetId = selectedAsset?.id ?? null;

  const mutation = useMutation({
    mutationFn: () => {
      if (!selectedAccountId || !selectedAssetId) {
        throw new Error("Missing account or asset selection");
      }

      return createHolding({
        accountId: selectedAccountId,
        assetId: selectedAssetId,
        quantity: Number(quantity),
        costPrice: costPrice ? Number(costPrice) : undefined,
        costCurrency: costCurrency || undefined,
        acquiredAt: acquiredAt || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      closeModal();
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs text-gray-500">Quantity</label>
          <span className="text-sm font-semibold text-[#17352F]">
            {quantity || "0"}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={0.01}
          value={quantity || "0"}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full accent-[#17352F]"
        />
        <input
          type="number"
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Or type an exact amount"
          required
          className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#17352F]"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-500">
          Cost price (optional)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="any"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#17352F]"
          />
          <button
            type="button"
            onClick={() => {
              if (selectedAsset?.asset_prices?.price != null) {
                setCostPrice(String(selectedAsset.asset_prices.price));
              }
            }}
            disabled={selectedAsset?.asset_prices?.price == null}
            className="whitespace-nowrap rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:border-[#17352F] hover:text-[#17352F] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Current Price
          </button>
        </div>
      </div>    

      <div>
        <label className="mb-1 block text-xs text-gray-500">
          Cost currency
        </label>
        <input
          type="text"
          value={costCurrency}
          onChange={(e) => setCostCurrency(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#17352F]"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-500">
          Acquired date (optional)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={acquiredAt}
            onChange={(e) => setAcquiredAt(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#17352F]"
          />
          <button
            type="button"
            onClick={() =>
              setAcquiredAt(new Date().toISOString().split("T")[0])
            }
            className="whitespace-nowrap rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:border-[#17352F] hover:text-[#17352F]"
          >
            Today
          </button>
        </div>
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
        {mutation.isPending ? "Adding..." : "Add Asset"}
      </button>
    </form>
  );
}