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
  getCollegeMcqById,
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

// Admin: Get info of one college MCQ by ID
collegeMcqRouter.get("/admin/:mcqId", protect, isAdmin, getCollegeMcqById);

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
