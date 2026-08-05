import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { analysisRateLimiter } from "../middleware/rateLimit.middleware.js";
import { getPortfolioAnalysis } from "../services/analysis.service.js";
import { getUserAssets } from "../services/userAsset.service.js";
import { getMemoryContext, saveConversationTurn } from "../services/conversation.service.js";

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

    const { memory_summary, recent_messages } = await getMemoryContext(userId);
    console.log("[analysis] Memory context:", { summaryLength: memory_summary.length, recentCount: recent_messages.length });

    const result = await getPortfolioAnalysis(enrichedAssets, question, memory_summary, recent_messages);
    console.log("[analysis] Flask response received:", result.summary?.total_value_usd);

    await saveConversationTurn(userId, question, result.answer, result.updated_memory);

    res.json({ summary: result.summary, answer: result.answer });
  } catch (err) {
  console.error("[analysis] ERROR:", err);
  const message = err instanceof Error ? err.message : "Failed to analyze portfolio";
  res.status(500).json({ error: message });
}
});

export default router;