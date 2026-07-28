import api from "./api";
import type { Asset } from "../types/asset";

export async function searchAssets(
  query: string,
  market: string = "CRYPTO"
): Promise<Asset[]> {
  const response = await api.get("/assets", {
    params: {
      market,
      query,
    },
  });
  return response.data.data;
}