export interface CreateUserAssetInput {
  userId: string;
  accountId: string;
  assetId: string;
  quantity: number;
  costPrice?: number;
  costCurrency?: string;
  acquiredAt?: string;
}

export interface GetUserAssetsInput {
  userId: string;
}