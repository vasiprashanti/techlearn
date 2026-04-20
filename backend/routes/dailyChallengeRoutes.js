import express from "express";
import {
  autoSubmitRound,
  codingRateLimit,
  endCodingRound,
  runCodingRoundAnswers,
  sendCodingRoundOTP,
  submitCodingRoundAnswers,
  verifyOTPAndGetCodingRound,
} from "../controllers/codingRoundController.js";
import {
  getActiveDailyChallenge,
  getDailyChallengeByLink,
  syncDailyChallengeForToday,
} from "../controllers/dailyChallengeController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const dailyChallengeRouter = express.Router();

dailyChallengeRouter.get("/active", protect, getActiveDailyChallenge);
dailyChallengeRouter.post("/admin/sync", protect, isAdmin, syncDailyChallengeForToday);
dailyChallengeRouter.get("/:linkId", getDailyChallengeByLink);
dailyChallengeRouter.post("/:linkId/send-otp", sendCodingRoundOTP);
dailyChallengeRouter.post("/:linkId/verify-otp", verifyOTPAndGetCodingRound);
dailyChallengeRouter.post("/:linkId/auto-submit", autoSubmitRound);
dailyChallengeRouter.post("/:linkId/run", codingRateLimit, runCodingRoundAnswers);
dailyChallengeRouter.post("/:linkId/submit", codingRateLimit, submitCodingRoundAnswers);
dailyChallengeRouter.post("/:linkId/end", endCodingRound);

export default dailyChallengeRouter;
