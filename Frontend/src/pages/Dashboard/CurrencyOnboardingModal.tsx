import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "../../components/ui/model";
import { getMe, updatePreferredCurrency } from "../../services/profile.service";
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_META,
  CURRENCY_PROMPT_STORAGE_KEY,
} from "../../utils";

export default function CurrencyOnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Reading + consuming the flag has to happen in an effect, not a
  // useState initializer — Strict Mode double-invokes initializers during
  // render, and the second call would find the flag already removed by
  // the first, silently discarding it before the modal ever opened.
  useEffect(() => {
    const shouldShow =
      sessionStorage.getItem(CURRENCY_PROMPT_STORAGE_KEY) === "1";

    if (shouldShow) {
      sessionStorage.removeItem(CURRENCY_PROMPT_STORAGE_KEY);
      setIsOpen(true);
    }
  }, []);

  const queryClient = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });

  const mutation = useMutation({
    mutationFn: updatePreferredCurrency,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["me"], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ["user-assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setIsOpen(false);
    },
  });

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Pick your display currency"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Choose the currency your portfolio values should be shown in. You
          can change this anytime from the top bar.
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SUPPORTED_CURRENCIES.map((currencyCode) => {
            const meta = CURRENCY_META[currencyCode];
            const isSelected = profile?.preferred_currency === currencyCode;

            return (
              <button
                key={currencyCode}
                type="button"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(currencyCode)}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left transition hover:border-primary hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isSelected ? "border-primary bg-accent" : "border-gray-200"
                }`}
              >
                <span className="text-lg leading-none">{meta.flag}</span>
                <span className="flex min-w-0 flex-col">
                  <span
                    className={`text-sm font-semibold ${
                      isSelected ? "text-accent-secondary" : "text-text"
                    }`}
                  >
                    {currencyCode}
                  </span>
                  <span className="truncate text-[10px] text-gray-400">
                    {meta.name}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {mutation.isError && (
          <p className="text-center text-sm text-red-500">
            Something went wrong. Please try again.
          </p>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="w-full text-center text-xs font-medium text-gray-400 hover:text-gray-600"
        >
          Maybe later
        </button>
      </div>
    </Modal>
  );
}
