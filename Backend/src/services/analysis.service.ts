interface FlaskHolding {
  symbol: string;
  type: string;
  market: string;
  current_value_usd: number;
  cost_usd: number;
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
}

const FLASK_URL = process.env.FLASK_ANALYSIS_URL || "http://127.0.0.1:5001";

function mapToFlaskHoldings(enrichedAssets: any[]): FlaskHolding[] {
  return enrichedAssets.map((holding) => ({
    symbol: holding.assets?.symbol,
    type: holding.assets?.asset_type,
    market: holding.assets?.market,
    current_value_usd: holding.valuation.currentValueBase,
    cost_usd: holding.valuation.totalCostBase,
  }));
}

export async function getPortfolioAnalysis(enrichedAssets: any[], question: string) {
  const holdings = mapToFlaskHoldings(enrichedAssets);
  console.log("[analysis.service] Sending to Flask:", JSON.stringify(holdings, null, 2));

  const exit = new AbortController();
  const timoutId = setTimeout(() => exit.abort(), 10000); // 10 seconds timeout 

  try {  
    const response = await fetch(`${FLASK_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holdings, question }),
      signal: exit.signal
    });

    console.log("[analysis.service] Flask status:", response.status);
    clearTimeout(timoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[analysis.service] Flask error body:", errorText);
      throw new Error(`Analysis service returned ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("[analysis.service] ERROR:", error);

    if (error.name === "AbortError") {
      throw new Error("Analysis service timed out. Please try again.");
    }

    throw new Error("Could not reach the analysis service.");
  }

}