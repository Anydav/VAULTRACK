export interface SignupInput {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  preferred_currency: string;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
}