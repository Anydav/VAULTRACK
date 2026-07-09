export interface Asset {
  id: string;
  symbol: string;
  name: string;
  asset_type: string;
  market: string;
  currency: string;
  external_id: string | null;
  asset_prices: {
    price: number;
    currency: string;
    price_time: string;
  } | null;
}