import  api  from "./api";
import type { Account } from "../types/account";

export async function getAccounts(): Promise<Account[]> {
  const response = await api.get("/accounts");
  return response.data.data;
}