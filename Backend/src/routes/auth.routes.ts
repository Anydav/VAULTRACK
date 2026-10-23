import { Router } from "express";
import { loginController,signupController, meController, logoutController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { loginRateLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

router.post("/signup", signupController);
router.post("/login", loginRateLimiter, loginController);
router.get("/me", authMiddleware, meController);
router.post("/logout", logoutController);
export default router;