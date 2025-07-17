import express from "express";
import {
  submitTransactionId,
  approveClubMember,
  rejectClubMember,
  getAllClubTransactions,
} from "../controllers/transactionController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/submit-transaction", protect, submitTransactionId);
router.post("/admin/club/approve", protect, approveClubMember);
router.post("/admin/club/reject", protect, rejectClubMember);
router.get("/admin/club/transactions", protect, getAllClubTransactions);

export default router;
