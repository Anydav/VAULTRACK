export const noop = () => {}

export function formatCurrency(amount: number, currency?: string) {
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency ? `${currency} ${formatted}` : formatted;
}

export const SUPPORTED_CURRENCIES = [
  "USD",
  "NGN",
  "EUR",
  "GBP",
  "GHS",
  "KES",
  "ZAR",
  "CAD",
  "AUD",
  "JPY",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
