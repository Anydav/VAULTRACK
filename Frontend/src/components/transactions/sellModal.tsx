import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "../ui/model";
import { createTransaction } from "../../services/transaction.service";
import { useToast } from "../../context/toastContext";
import type { Holding } from "../../types/userAssets";
import { SUPPORTED_CURRENCIES } from "../../utils";
import { getErrorMessage, refreshPortfolio, todayLocal } from "../../utils/apiError";

interface SellModalProps {
  // One holding, or the same asset in several custodians (asset page): then
  // the form asks which custodian to sell from.
  holdings: Holding[];
  onClose: () => void;
}

export default function SellModal({ holdings, onClose }: SellModalProps) {
  const [holdingId, setHoldingId] = useState(holdings[0].id);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState(holdings[0].valuation.displayCurrency || "USD");
  const [date, setDate] = useState("");

  const holding = holdings.find((h) => h.id === holdingId) ?? holdings[0];

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const symbol = holding.assets?.symbol ?? "";
  const tooMuch = Number(quantity) > holding.quantity;

  const mutation = useMutation({
    mutationFn: () => {
      if (!holding.accounts || !holding.assets) {
        throw new Error("Missing account or asset");
      }

      return createTransaction({
        accountId: holding.accounts.id,
        assetId: holding.assets.id,
        type: "sell",
        quantity: Number(quantity),
        pricePerUnit: Number(price),
        priceCurrency: currency,
        // A sale dated today gets the current time, so it lands after a buy
        // added earlier today instead of at midnight before it.
        occurredAt: date === todayLocal() ? new Date().toISOString() : date,
      });
    },
    onSuccess: () => {
      refreshPortfolio(queryClient);
      showToast(`Sold ${quantity} ${symbol}`, "success", 4000);
      onClose();
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!tooMuch) mutation.mutate();
  }

  const inputClass =
    "flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#17352F]";
  const sideButtonClass =
    "whitespace-nowrap rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:border-accent-secondary hover:text-text";

  return (
    <Modal isOpen onClose={onClose} title={`Sell ${symbol}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm text-gray-500">
          Record a sale you made. This counts toward your profit.
        </p>

        {holdings.length > 1 && (
          <div>
            <label className="mb-1 block text-xs text-gray-500">Custodian</label>
            <select
              value={holdingId}
              onChange={(e) => setHoldingId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-surface px-3 py-2 text-sm outline-none focus:border-[#17352F]"
            >
              {holdings.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.accounts?.name ?? "-"} ({h.quantity} {symbol})
                </option>
              ))}
            </select>
          </div>
        )}

        <p className="text-sm font-medium text-text">
          You hold {holding.quantity} {symbol}
          {holdings.length > 1 && ` in ${holding.accounts?.name ?? "this custodian"}`}
        </p>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Quantity</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="any"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setQuantity(String(holding.quantity))}
              className={sideButtonClass}
            >
              Max
            </button>
          </div>
          {tooMuch && (
            <p className="mt-1 text-xs text-red-500">
              You only hold {holding.quantity} {symbol}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Price per unit</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="any"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => {
                setPrice(String(holding.valuation.latestPriceDisplay));
                setCurrency(holding.valuation.displayCurrency);
              }}
              className={sideButtonClass}
            >
              Current Price
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-surface px-3 py-2 text-sm outline-none focus:border-[#17352F]"
          >
            {SUPPORTED_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Date</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              max={todayLocal()}
              onChange={(e) => setDate(e.target.value)}
              required
              className={inputClass}
            />
            <button type="button" onClick={() => setDate(todayLocal())} className={sideButtonClass}>
              Today
            </button>
          </div>
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-500">{getErrorMessage(mutation.error)}</p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending || tooMuch}
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {mutation.isPending ? "Recording..." : "Record sale"}
        </button>
      </form>
    </Modal>
  );
}
