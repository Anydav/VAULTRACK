import { Request, Response } from "express";
import { searchAssets } from "../services/asset.service.js";

export async function searchAssetsController(req: Request, res: Response) {
  try {
    const market = req.query.market as string;
    const query = req.query.query as string;

    if (!market || !query) {
      return res.status(400).json({
        success: false,
        message: "Market and query are required",
      });
    }

    const assets = await searchAssets({
      market,
      query,
    });

    return res.status(200).json({
      success: true,
      message: "Assets fetched successfully",
      data: assets,
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