export interface Account {
  id: string;
  name: string;
  account_type: string;
  currency: string | null;
  created_at?: string;
}