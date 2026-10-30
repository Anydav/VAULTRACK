import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {createTransactionController,getTransactionsController,updateTransactionController,deleteTransactionController,} from "../controllers/transaction.controller.js";

const router = Router();

router.post("/", authMiddleware, createTransactionController);
router.get("/", authMiddleware, getTransactionsController);
router.patch("/:id", authMiddleware, updateTransactionController);
router.delete("/:id", authMiddleware, deleteTransactionController);

export default router;
