import api from "./api";
import type { Holding, CreateHoldingInput } from "../types/userAssets";

export async function getUserAssets(): Promise<Holding[]> {
  const response = await api.get("/user-assets");
  return response.data.data;
}

export async function createHolding(input: CreateHoldingInput): Promise<Holding> {
  const response = await api.post("/user-assets", {
    accountId: input.accountId,
    assetId: input.assetId,
    quantity: input.quantity,
    costPrice: input.costPrice,
    costCurrency: input.costCurrency,
    acquiredAt: input.acquiredAt,
  });
  return response.data.data;
}