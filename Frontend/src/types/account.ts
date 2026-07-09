export interface Account {
  id: string;
  name: string;
  account_type: string;
  currency: string | null;
  created_at?: string;
}
export interface CreateAccountInput {
  name: string;
  accountType: string;
  currency?: string;
}