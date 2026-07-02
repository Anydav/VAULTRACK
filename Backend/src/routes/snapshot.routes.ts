import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createPortfolioSnapshotController, getPortfolioSnapshotsController, getSnapshotPerformanceController,  } from "../controllers/snapshot.controller.js";

const router = Router();

router.post("/", authMiddleware, createPortfolioSnapshotController);
router.get("/", authMiddleware, getPortfolioSnapshotsController);
router.get("/performance", authMiddleware, getSnapshotPerformanceController);

export default router;