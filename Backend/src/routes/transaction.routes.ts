import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {createTransactionController,getTransactionsController,} from "../controllers/transaction.controller.js";

const router = Router();

router.post("/", authMiddleware, createTransactionController);
router.get("/", authMiddleware, getTransactionsController);

export default router;
