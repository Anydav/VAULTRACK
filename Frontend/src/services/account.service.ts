import  api  from "./api";
import type { Account, CreateAccountInput, UpdateAccountInput } from "../types/account";

export async function getAccounts(): Promise<Account[]> {
  const response = await api.get("/accounts");
  return response.data.data;
}

export async function createAccount(input: CreateAccountInput): Promise<Account> {
  const response = await api.post("/accounts", input);
  return response.data.data;
}

export async function updateAccount(accountId: string, input: UpdateAccountInput): Promise<Account> {
  const response = await api.patch(`/accounts/${accountId}`, input);
  return response.data.data;
}

// Marks the account removed: its holdings leave the portfolio, its
// transactions stay in History
export async function removeAccount(accountId: string): Promise<void> {
  await api.delete(`/accounts/${accountId}`);
}
