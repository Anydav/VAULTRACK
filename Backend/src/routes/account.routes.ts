import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  createAccountController,
  getAccountsController,
  updateAccountController,
  removeAccountController,
} from "../controllers/account.controller.js";

const router = Router();

router.post("/", authMiddleware, createAccountController);
router.get("/", authMiddleware, getAccountsController);
router.patch("/:id", authMiddleware, updateAccountController);
router.delete("/:id", authMiddleware, removeAccountController);

export default router;