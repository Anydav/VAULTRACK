import api from "./api";

export interface HoldingSummary {
  symbol: string;
  current_value_usd: number;
  gain_loss_pct: number;
}

export interface TopHolding {
  symbol: string;
  pct_of_portfolio: number;
}

export interface PortfolioSummary {
  total_value_usd: number;
  type_allocation_pct: Record<string, number>;
  market_allocation_pct: Record<string, number>;
  top_holding: TopHolding | null;
  holdings: HoldingSummary[];
  message?: string;
}

export interface AskPortfolioAIResponse {
  summary: PortfolioSummary;
  answer: string;
}

// The API only distinguishes two 400 cases and one generic 500 (per the
// reference doc) — this wrapper preserves that distinction so the UI can
// tell "you typed something invalid" apart from "something broke, retry."
export class PortfolioAIError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function askPortfolioAI(
  userId: string,
  question: string
): Promise<AskPortfolioAIResponse> {
  try {
    const response = await api.post("/analysis/ask", { userId, question });
    return response.data;
  } catch (error: any) {
    const status = error?.response?.status ?? 0;
    const message =
      error?.response?.data?.error ?? "Something went wrong. Please try again.";
    throw new PortfolioAIError(message, status);
  }
}