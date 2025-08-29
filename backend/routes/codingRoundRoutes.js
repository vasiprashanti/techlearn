import express from "express";
import {
  createCodingRound,
  getAllCodingRounds,
  getOneCodingRound,
  updateCodingRound,
  deleteCodingRound,
  sendCodingRoundOTP,
  verifyOTPAndGetCodingRound,
  submitCodingRoundAnswers,
  runCodingRoundAnswers,
  getCodingRoundScores,
} from "../controllers/codingRoundController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const codingRoundRoutes = express.Router();

// Admin routes
codingRoundRoutes.post("/", protect, isAdmin, createCodingRound);
codingRoundRoutes.get(
  "/admin/getAllCodingRounds",
  protect,
  isAdmin,
  getAllCodingRounds
);
codingRoundRoutes.put(
  "/admin/:codingRoundId",
  protect,
  isAdmin,
  updateCodingRound
);
codingRoundRoutes.delete(
  "/admin/:codingRoundId",
  protect,
  isAdmin,
  deleteCodingRound
);
codingRoundRoutes.get(
  "/admin/:codingRoundId/scores",
  protect,
  isAdmin,
  getCodingRoundScores
);

// Public routes for students
codingRoundRoutes.get("/:linkId", getOneCodingRound);
codingRoundRoutes.post("/:linkId/send-otp", sendCodingRoundOTP);
codingRoundRoutes.post("/:linkId/verify-otp", verifyOTPAndGetCodingRound);
codingRoundRoutes.post("/:linkId/run", runCodingRoundAnswers);
codingRoundRoutes.post("/:linkId/submit", submitCodingRoundAnswers);

export default codingRoundRoutes;
