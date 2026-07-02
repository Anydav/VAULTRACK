import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getDashboardSummaryController } from "../controllers/dashbaord.controller.js";

const router = Router();

router.get("/summary", authMiddleware, getDashboardSummaryController);

export default router;