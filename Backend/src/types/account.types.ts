export interface CreateAccountInput {
  userId: string;
  name: string;
  accountType: string;
  currency?: string;
}

export interface UpdateAccountInput {
  name?: string;
  accountType?: string;
  currency?: string;
}
