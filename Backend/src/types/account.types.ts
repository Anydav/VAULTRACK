export interface CreateAccountInput {
  userId: string;
  name: string;
  accountType: string;
  currency?: string;
}

export interface UpdateAccountInput {
  userId: string;
  accountId: string;
  name?: string;
  accountType?: string;
  currency?: string;
}