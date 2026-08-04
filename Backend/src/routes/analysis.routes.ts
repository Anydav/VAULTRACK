import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { analysisRateLimiter } from "../middleware/rateLimit.middleware.js";
import { getPortfolioAnalysis } from "../services/analysis.service.js";
import { getUserAssets } from "../services/userAsset.service.js";

const router = Router();

router.post("/ask", authMiddleware, analysisRateLimiter, async (req: Request, res: Response) => {
  try {

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
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
  const message = err instanceof Error ? err.message : "Failed to analyze portfolio";
  res.status(500).json({ error: message });
}
});

export default router;