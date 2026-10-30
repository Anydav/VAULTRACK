export type TradeType = "buy" | "sell";

export interface CreateTransactionInput {
  userId: string;
  accountId: string;
  assetId: string;
  type: TradeType;
  quantity: number;
  pricePerUnit: number;
  priceCurrency?: string;
  occurredAt?: string;
  notes?: string;
}

export interface UpdateTransactionInput {
  quantity?: number;
  pricePerUnit?: number;
  priceCurrency?: string;
  occurredAt?: string;
  notes?: string;
}

export interface TransactionFilters {
  accountId?: string;
  assetId?: string;
}
