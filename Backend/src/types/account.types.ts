export interface CreateAccountInput {
  userId: string;
  name: string;
  accountType: string;
  currency?: string;
}