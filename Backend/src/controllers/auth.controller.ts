import { Request, Response } from "express";
import { loginUser, signupUser } from "../services/auth.service.js";
import { validatePassword } from "../utils/passwordValidator.js";
import { validateEmail } from "../utils/emailValidator.js";
import { supabase } from "../config/supabase.js";

export async function signupController(req: Request, res: Response) {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, and password are required",
      });
    }
    const emailValidation = validateEmail(email);

    if (!emailValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.message,
      });
    }
    const passwordValidation = validatePassword(password);

    if (!passwordValidation.isValid) {
     return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    const result = await signupUser({
      fullName,
      email,
      password,
    });

    res.cookie("vaulttrack_token", result.token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: result.user,
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

export async function loginController(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await loginUser({
      email,
      password,
    });

    res.cookie("vaulttrack_token", result.token, {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

return res.status(200).json({
  success: true,
  message: "Login successful",
  user: result.user,
});
    
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    return res.status(401).json({
      success: false,
      message,
    });
  }
}

export async function meController(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, preferred_currency, created_at")
      .eq("id", req.user.userId)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user: profile,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
}

export async function logoutController(req: Request, res: Response) {
  res.clearCookie("vaulttrack_token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
}