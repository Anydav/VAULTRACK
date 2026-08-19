import { rateLimit } from "express-rate-limit";
import { Request, Response } from "express";

export const analysisRateLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 3 minute window
  limit: 5, // 5 AI requests per user per minute
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req: Request, res: Response) => {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
      throw new Error("Rate limiter reached without authenticated user");
    }
    return req.user.userId;
  },
  message: {
    error: "Too many analysis requests. Please wait a moment and try again.",
  },
});