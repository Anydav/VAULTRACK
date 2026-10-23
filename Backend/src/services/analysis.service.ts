import { ConversationMessage } from "./conversation.service.js";

interface FlaskHolding {
  symbol: string;
  type: string;
  market: string;
  current_value_usd: number;
  cost_usd: number;
}

interface UpdatedMemory {
  summary_text: string;
  folded_message_id: string;
}

interface AnalyzeResponse {
  summary: {
    total_value_usd: number;
    type_allocation_pct: Record<string, number>;
    market_allocation_pct: Record<string, number>;
    top_holding: { symbol: string; pct_of_portfolio: number };
    holdings: { symbol: string; current_value_usd: number; gain_loss_pct: number }[];
  };
  answer: string;
  updated_memory: UpdatedMemory | null;
}

const FLASK_URL = process.env.FLASK_ANALYSIS_URL;

// Errors we raise on purpose, with a message that's safe to show the user.
class AnalysisServiceError extends Error {}

// Flask replies to errors with { "error": "..." }; use that message when present.
function readFlaskError(body: string, status: number): string {
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed?.error === "string") {
      return parsed.error;
    }
  } catch {
    // Not JSON (e.g. an HTML error page from Render)
  }
  return `The analysis service failed (status ${status}).`;
}

function mapToFlaskHoldings(enrichedAssets: any[]): FlaskHolding[] {
  return enrichedAssets.map((holding) => ({
    symbol: holding.assets?.symbol,
    type: holding.assets?.asset_type,
    market: holding.assets?.market,
    current_value_usd: holding.valuation.currentValueBase,
    cost_usd: holding.valuation.totalCostBase,
  }));
}

export async function getPortfolioAnalysis(
  enrichedAssets: any[],
  question: string,
  memorySummary: string,
  recentMessages: ConversationMessage[]
): Promise<AnalyzeResponse> {
  const holdings = mapToFlaskHoldings(enrichedAssets);
  console.log("[analysis.service] Sending to Flask:", JSON.stringify(holdings, null, 2));

  const exit = new AbortController();
  // Vercel cuts proxied requests at 120s; give up on Flask well before that so
  // our own timeout message reaches the user instead of Vercel's error.
  const timeoutId = setTimeout(() => exit.abort(), 100000); // 100 seconds

  try {
    const response = await fetch(`${FLASK_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        holdings,
        question,
        memory_summary: memorySummary,
        recent_messages: recentMessages,
      }),
      signal: exit.signal,
    });

    console.log("[analysis.service] Flask status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[analysis.service] Flask error body:", errorText);
      throw new AnalysisServiceError(readFlaskError(errorText, response.status));
    }

    return await response.json();
  } catch (error) {
    console.error("[analysis.service] ERROR:", error);

    if (error instanceof AnalysisServiceError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Analysis service timed out. Please try again.");
    }
    if (error instanceof SyntaxError) {
      throw new Error("The analysis service sent back an invalid response.");
    }
    throw new Error("Could not reach the analysis service.");
  } finally {
    clearTimeout(timeoutId);
  }
}