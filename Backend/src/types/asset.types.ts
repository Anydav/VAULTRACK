export interface CreateAssetInput {
  symbol: string;
  name: string;
  assetType: string;
  market: string;
  currency: string;
}

export interface SearchAssetInput {
  market: string;
  query: string;
}