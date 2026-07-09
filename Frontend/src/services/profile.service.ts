import api from "./api";
import type { Profile } from "../types/profile";

export async function getMe(): Promise<Profile> {
  const response = await api.get("/auth/me");
  return response.data.user;
}