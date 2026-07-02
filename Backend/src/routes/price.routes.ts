import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { syncCryptoPricesController } from "../controllers/price.controller.js";

const router = Router();

router.post("/sync-crypto", authMiddleware, syncCryptoPricesController);

export default router;