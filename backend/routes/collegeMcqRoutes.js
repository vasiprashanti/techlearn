import express from "express";
import { protect, isAdmin } from "../middleware/authMiddleware.js";
import {
  createCollegeMcq,
  updateCollegeMcq,
  sendCollegeMcqOTP,
  verifyOTPAndGetCollegeMcq,
  submitCollegeMcqAnswers,
  getAllCollegeMcqs,
  getCollegeMcqScores,
  deleteCollegeMcq,
} from "../controllers/collegeMcqController.js";

const collegeMcqRouter = express.Router();

// Admin routes (protected)
collegeMcqRouter.post("/", protect, isAdmin, createCollegeMcq);
collegeMcqRouter.get(
  "/admin/allCollegeMcqs",
  protect,
  isAdmin,
  getAllCollegeMcqs
);

collegeMcqRouter.put("/admin/:mcqId", protect, isAdmin, updateCollegeMcq);

collegeMcqRouter.get(
  "/admin/:mcqId/scores",
  protect,
  isAdmin,
  getCollegeMcqScores
);
collegeMcqRouter.delete("/admin/:mcqId", protect, isAdmin, deleteCollegeMcq);

// Public routes for students
collegeMcqRouter.post("/:linkId/send-otp", sendCollegeMcqOTP);
collegeMcqRouter.post("/:linkId/verify-otp", verifyOTPAndGetCollegeMcq);
collegeMcqRouter.post("/:linkId/submit", submitCollegeMcqAnswers);

export default collegeMcqRouter;
