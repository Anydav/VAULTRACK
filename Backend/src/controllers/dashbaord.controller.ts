import { Request, Response } from "express";
import { getDashboardSummary } from "../services/dashboard.service.js";

export async function getDashboardSummaryController(
  req: Request,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const summary = await getDashboardSummary(req.user.userId);

    return res.status(200).json({
      success: true,
      message: "Dashboard summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    return res.status(500).json({
      success: false,
      message,
    });
  }
}