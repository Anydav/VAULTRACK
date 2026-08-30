export const noop = () => {}

// Set right after signup so the dashboard knows to prompt for a display
// currency once, then consumed (removed) the first time it's read.
export const CURRENCY_PROMPT_STORAGE_KEY = "vaulttrack_show_currency_prompt";

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

export const CURRENCY_META: Record<
  SupportedCurrency,
  { name: string; flag: string }
> = {
  USD: { name: "US Dollar", flag: "🇺🇸" },
  NGN: { name: "Nigerian Naira", flag: "🇳🇬" },
  EUR: { name: "Euro", flag: "🇪🇺" },
  GBP: { name: "British Pound", flag: "🇬🇧" },
  GHS: { name: "Ghanaian Cedi", flag: "🇬🇭" },
  KES: { name: "Kenyan Shilling", flag: "🇰🇪" },
  ZAR: { name: "South African Rand", flag: "🇿🇦" },
  CAD: { name: "Canadian Dollar", flag: "🇨🇦" },
  AUD: { name: "Australian Dollar", flag: "🇦🇺" },
  JPY: { name: "Japanese Yen", flag: "🇯🇵" },
};
