import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  createAccountController,
  getAccountsController,
} from "../controllers/account.controller.js";

const router = Router();

router.post("/", authMiddleware, createAccountController);
router.get("/", authMiddleware, getAccountsController);

export default router;