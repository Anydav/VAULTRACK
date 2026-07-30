import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { analysisRateLimiter } from "../middleware/rateLimit.middleware.js";
import { getPortfolioAnalysis } from "../services/analysis.service.js";
import { getUserAssets } from "../services/userAsset.service.js";

const router = Router();

router.post("/ask", authMiddleware, analysisRateLimiter, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { question } = req.body;
    console.log("[analysis] Incoming request:", { userId, question });

    if (!(typeof question === "string" && question.trim().length > 0)) {
      return res.status(400).json({ error: "question is required and must be a non-empty string." });
    }

    const enrichedAssets = await getUserAssets(userId);
    console.log("[analysis] Fetched assets from Supabase:", enrichedAssets.length, "holdings");

    const result = await getPortfolioAnalysis(enrichedAssets, question);
    console.log("[analysis] Flask response received:", result.summary?.total_value_usd);

    res.json(result);
  } catch (err) {
    console.error("[analysis] ERROR:", err);
    res.status(500).json({ error: err.message || "Failed to analyze portfolio" });
  }
});

export default router;