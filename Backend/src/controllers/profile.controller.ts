import { Request, Response } from "express";
import { updatePreferredCurrency } from "../services/profile.service.js";
import { SUPPORTED_CURRENCIES } from "../services/currency.service.js";

export async function updatePreferredCurrencyController(
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

    const { currency } = req.body;
    const normalizedCurrency =
      typeof currency === "string" ? currency.toUpperCase().trim() : "";

    if (!SUPPORTED_CURRENCIES.includes(normalizedCurrency)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported currency. Choose one of: ${SUPPORTED_CURRENCIES.join(
          ", "
        )}`,
      });
    }

    const profile = await updatePreferredCurrency({
      userId: req.user.userId,
      currency: normalizedCurrency,
    });

    return res.status(200).json({
      success: true,
      message: "Preferred currency updated successfully",
      user: profile,
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
