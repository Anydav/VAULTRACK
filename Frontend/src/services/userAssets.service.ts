import api from "./api";
import type { Holding } from "../types/userAssets";

export async function getUserAssets(): Promise<Holding[]> {
  const response = await api.get("/user-assets");
  return response.data.data;
}