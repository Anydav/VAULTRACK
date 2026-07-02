import { Request, Response } from "express";
import { createPortfolioSnapshot, getPortfolioSnapshots, getSnapshotPerformance } from "../services/snapshot.service.js";

export async function createPortfolioSnapshotController(
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

    const snapshot = await createPortfolioSnapshot(req.user.userId);

    return res.status(201).json({
      success: true,
      message: "Portfolio snapshot created successfully",
      data: snapshot,
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

export async function getPortfolioSnapshotsController(
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

    const snapshots = await getPortfolioSnapshots(req.user.userId);

    return res.status(200).json({
      success: true,
      message: "Portfolio snapshots fetched successfully",
      data: snapshots,
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

export async function getSnapshotPerformanceController(
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

    const performance = await getSnapshotPerformance(req.user.userId);

    return res.status(200).json({
      success: true,
      message: "Snapshot performance fetched successfully",
      data: performance,
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