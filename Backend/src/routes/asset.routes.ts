import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { searchAssetsController } from "../controllers/asset.controller.js";

const router = Router();

router.get("/", authMiddleware, searchAssetsController);

export default router;