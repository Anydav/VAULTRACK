import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {createUserAssetController,getUserAssetsController,} from "../controllers/userAsset.controller.js";

const router = Router();

router.post("/", authMiddleware, createUserAssetController);
router.get("/", authMiddleware, getUserAssetsController);

export default router;