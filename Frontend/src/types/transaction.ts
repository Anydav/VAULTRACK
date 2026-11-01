export type TransactionType = "buy" | "sell";

export interface Transaction {
  id: string;
  type: TransactionType;
  quantity: number;
  price_per_unit: number;
  price_currency: string;
  fx_rate_to_usd: number;
  occurred_at: string;
  source: string;
  notes: string | null;
  created_at: string;
  removed_at: string | null;
  accounts: {
    id: string;
    name: string;
    removed_at: string | null;
  } | null;
  assets: {
    id: string;
    symbol: string;
    name: string;
    market: string;
  } | null;
}

export interface TransactionFilters {
  accountId?: string;
  assetId?: string;
}

export interface CreateTransactionInput {
  accountId: string;
  assetId: string;
  type: TransactionType;
  quantity: number;
  pricePerUnit: number;
  priceCurrency?: string;
  occurredAt?: string;
  notes?: string;
}
