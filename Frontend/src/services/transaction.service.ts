import api from "./api";
import type { Transaction, CreateTransactionInput, TransactionFilters } from "../types/transaction";

// Includes removed transactions and ones on removed accounts (for History)
export async function getTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
  const response = await api.get("/transactions", { params: filters });
  return response.data.data;
}

// Shared query, so every page asking for the same filters shares one cache entry
export function transactionsQuery(filters: TransactionFilters = {}) {
  return {
    queryKey: ["transactions", filters],
    queryFn: () => getTransactions(filters),
  };
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const response = await api.post("/transactions", input);
  return response.data.data;
}

// Marks the transaction removed; it stays in History
export async function removeTransaction(transactionId: string): Promise<void> {
  await api.delete(`/transactions/${transactionId}`);
}
