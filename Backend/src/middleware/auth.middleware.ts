import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET: string = process.env.JWT_SECRET ?? "";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in environment variables");
}

interface JwtPayload {
  userId: string;
  email: string;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.vaulttrack_token;

   let token: string | undefined;

if (cookieToken) {
  token = cookieToken;
} else if (
  authHeader &&
  authHeader.startsWith("Bearer ")
) {
  token = authHeader.split(" ")[1];
}

if (!token) {
  return res.status(401).json({
    success: false,
    message: "Access denied. No token provided.",
  });
}

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}