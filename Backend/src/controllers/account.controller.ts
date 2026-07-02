import { Request, Response } from "express";
import { createAccount, getUserAccounts } from "../services/account.service.js";

export async function createAccountController(req: Request, res: Response) {
  try {
    const { name, accountType, currency } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!name || !accountType) {
      return res.status(400).json({
        success: false,
        message: "Account name and account type are required",
      });
    }

    const account = await createAccount({
      userId: req.user.userId,
      name,
      accountType,
      currency,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: account,
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

export async function getAccountsController(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const accounts = await getUserAccounts(req.user.userId);

    return res.status(200).json({
      success: true,
      message: "Accounts fetched successfully",
      data: accounts,
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