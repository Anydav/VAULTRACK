def compute_portfolio_summary(holdings: list[dict]) -> dict:
    total_value = sum(h["current_value_usd"] for h in holdings)
    type_totals = {}
    market_totals = {}
    enriched_holdings = []

    if holdings ==[] or len(holdings) == 0:
        return {
            "total_value_usd": 0,
            "type_allocation_pct": {},
            "market_allocation_pct": {},
            "top_holding": None,
            "holdings": [],
            "message": "No holdings provided."
        }
    
    else:
        for h in holdings:
            gain_loss_pct = round(
                (h["current_value_usd"] - h["cost_usd"]) / h["cost_usd"] * 100, 1
            )
            type_totals[h["type"]] = type_totals.get(h["type"], 0) + h["current_value_usd"]
            market_totals[h["market"]] = market_totals.get(h["market"], 0) + h["current_value_usd"]

            enriched_holdings.append({
                "symbol": h["symbol"],
                "current_value_usd": round(h["current_value_usd"], 2),
                "gain_loss_pct": gain_loss_pct
            })

        def to_pct(totals):
            return {k: round(v / total_value * 100, 1) for k, v in totals.items()}

        top_holding = max(enriched_holdings, key=lambda h: h["current_value_usd"])

        return {
            "total_value_usd": round(total_value, 2),
            "type_allocation_pct": to_pct(type_totals),
            "market_allocation_pct": to_pct(market_totals),
            "top_holding": {
                "symbol": top_holding["symbol"],
                "pct_of_portfolio": round(top_holding["current_value_usd"] / total_value * 100, 1)
            },
            "holdings": enriched_holdings
        }