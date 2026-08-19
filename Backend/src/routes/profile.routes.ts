import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { updatePreferredCurrencyController } from "../controllers/profile.controller.js";

const router = Router();

router.patch("/currency", authMiddleware, updatePreferredCurrencyController);

export default router;
