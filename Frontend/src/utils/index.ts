export const noop = () => {}

// Set right after signup so the dashboard knows to prompt for a display
// currency once, then consumed (removed) the first time it's read.
export const CURRENCY_PROMPT_STORAGE_KEY = "vaulttrack_show_currency_prompt";

// CAD and AUD keep a prefix (CA$, A$) so they don't read as US dollars
const NARROW_SYMBOL_EXCEPTIONS = new Set(["CAD", "AUD"]);

// "$12,400.00", "₦18,500,000.00", "¥1,500": symbols are shorter than codes
export function formatCurrency(amount: number, currency?: string) {
  if (!currency) {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: NARROW_SYMBOL_EXCEPTIONS.has(currency) ? "symbol" : "narrowSymbol",
    }).format(amount);
  } catch {
    // Unknown currency code: fall back to "XYZ 1,234.00" instead of crashing the page
    return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
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
