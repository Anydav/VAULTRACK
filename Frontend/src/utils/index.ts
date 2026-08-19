export const noop = () => {}

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
