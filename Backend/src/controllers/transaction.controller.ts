import { Request, Response } from "express";
import { createTransaction, getTransactions } from "../services/transaction.service.js";
import { SUPPORTED_CURRENCIES } from "../services/currency.service.js";

const TRADE_TYPES = ["buy", "sell"];

export async function createTransactionController(req: Request, res: Response) {
  try {
    const { accountId, assetId, type, quantity, pricePerUnit, priceCurrency, occurredAt, notes } =
      req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!accountId || !assetId || !TRADE_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Account, asset, and a type of buy or sell are required",
      });
    }

    if (!(Number(quantity) > 0)) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    if (pricePerUnit === undefined || pricePerUnit === null || !(Number(pricePerUnit) >= 0)) {
      return res.status(400).json({
        success: false,
        message: "Price per unit is required",
      });
    }

    if (priceCurrency && !SUPPORTED_CURRENCIES.includes(String(priceCurrency).toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Unsupported currency",
      });
    }

    const transaction = await createTransaction({
      userId: req.user.userId,
      accountId,
      assetId,
      type,
      quantity: Number(quantity),
      pricePerUnit: Number(pricePerUnit),
      priceCurrency,
      occurredAt,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Transaction recorded successfully",
      data: transaction,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    // Selling more than you hold, or someone else's account, is the user's to fix
    const status = message.startsWith("Cannot sell") || message === "Account not found" ? 400 : 500;

    return res.status(status).json({
      success: false,
      message,
    });
  }
}

export async function getTransactionsController(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { accountId, assetId } = req.query;

    const transactions = await getTransactions(req.user.userId, {
      accountId: typeof accountId === "string" ? accountId : undefined,
      assetId: typeof assetId === "string" ? assetId : undefined,
    });

    return res.status(200).json({
      success: true,
      message: "Transactions fetched successfully",
      data: transactions,
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
