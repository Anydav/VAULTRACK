import api from "./api";
import type { Profile } from "../types/profile";

export async function getMe(): Promise<Profile> {
  const response = await api.get("/auth/me");
  return response.data.user;
}

export async function updatePreferredCurrency(
  currency: string
): Promise<Profile> {
  const response = await api.patch("/profile/currency", { currency });
  return response.data.user;
}