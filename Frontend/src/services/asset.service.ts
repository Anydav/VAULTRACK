import api from "./api";
import type { Asset } from "../types/asset";

export async function searchAssets(query: string): Promise<Asset[]> {
  const response = await api.get("/assets", {
    params: {
      market: "CRYPTO",
      query,
    },
  });
  return response.data.data;
}