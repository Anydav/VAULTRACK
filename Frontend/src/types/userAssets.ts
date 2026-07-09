export interface Holding {
  id: string;
  quantity: number;
  cost_price: number | null;
  cost_currency: string | null;
  acquired_at: string | null;
  created_at: string;
  accounts: {
    id: string;
    name: string;
    account_type: string;
    currency: string | null;
  } | null;
  assets: {
    id: string;
    symbol: string;
    name: string;
    asset_type: string;
    market: string;
    currency: string;
    external_id: string | null;
  } | null;
  valuation: {
    latestPrice: number;
    currentValueDisplay: number;
    totalCostDisplay: number;
    profitLossDisplay: number;
    profitLossPercentage: number;
    priceCurrency: string;
    priceLastUpdated: string | null;
  };
}

export interface CreateHoldingInput {
  accountId: string;
  assetId: string;
  quantity: number;
  costPrice?: number;
  costCurrency?: string;
  acquiredAt?: string;
}