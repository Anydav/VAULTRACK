import { Request, Response } from "express";
import { syncCryptoPrices } from "../services/price.service.js";

export async function syncCryptoPricesController(
  req: Request,
  res: Response
) {
  try {
    const syncedPrices = await syncCryptoPrices();

    return res.status(200).json({
      success: true,
      message: "Crypto prices synced successfully",
      data: syncedPrices,
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