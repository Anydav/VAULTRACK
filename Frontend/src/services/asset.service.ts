import api from "./api";
import type { Asset } from "../types/asset";

export async function searchAssets(
  query: string,
  market: string = "CRYPTO",
  allCoins: boolean = false
): Promise<Asset[]> {
  const response = await api.get("/assets", {
    params: {
      market,
      query,
      allCoins: allCoins || undefined, // left out of the URL when false
    },
  });
  return response.data.data;
}