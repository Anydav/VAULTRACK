import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {createTransactionController,getTransactionsController,removeTransactionController,} from "../controllers/transaction.controller.js";

const router = Router();

router.post("/", authMiddleware, createTransactionController);
router.get("/", authMiddleware, getTransactionsController);
router.delete("/:id", authMiddleware, removeTransactionController);

export default router;
