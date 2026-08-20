import { Request, Response } from "express";
import { createUserAsset, getUserAssets,} from "../services/userAsset.service.js";

export async function createUserAssetController(req: Request, res: Response) {
  try {
    const { accountId, assetId, quantity, costPrice, costCurrency, acquiredAt } =
      req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!accountId || !assetId || quantity === undefined || quantity === null) {
      return res.status(400).json({
        success: false,
        message: "Account, asset, and quantity are required",
      });
    }

    const userAsset = await createUserAsset({
      userId: req.user.userId,
      accountId,
      assetId,
      quantity,
      costPrice,
      costCurrency,
      acquiredAt,
    });

    return res.status(201).json({
      success: true,
      message: "Asset added to portfolio successfully",
      data: userAsset,
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

export async function getUserAssetsController(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userAssets = await getUserAssets(req.user.userId);

    return res.status(200).json({
      success: true,
      message: "User assets fetched successfully",
      data: userAssets,
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