import  api  from "./api";
import type { Account, CreateAccountInput } from "../types/account";

export async function getAccounts(): Promise<Account[]> {
  const response = await api.get("/accounts");
  return response.data.data;
}

export async function createAccount(input: CreateAccountInput): Promise<Account> {
  const response = await api.post("/accounts", input);
  return response.data.data;
}