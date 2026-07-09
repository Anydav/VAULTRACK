import api from "./api";
import type { AuthResponse, LoginInput, SignupInput } from "../types/auth";

export async function signup(input: SignupInput): Promise<AuthResponse> {
  const response = await api.post("/auth/signup", input);
  return response.data;
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const response = await api.post("/auth/login", input);
  return response.data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}