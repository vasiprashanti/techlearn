import express from "express";
import {
  autoSubmitRound,
  dailyChallengeAccessRateLimit,
  dailyChallengeOtpRateLimit,
  codingRateLimit,
  endCodingRound,
  runCodingRoundAnswers,
  sendCodingRoundOTP,
  startDailyChallengeAttempt,
  submitCodingRoundAnswers,
  verifyOTPAndGetCodingRound,
} from "../controllers/codingRoundController.js";
import {
  getActiveDailyChallenge,
  getDailyChallengeByLink,
  syncDailyChallengeForToday,
} from "../controllers/dailyChallengeController.js";
import { optionalProtect, protect, isAdmin } from "../middleware/authMiddleware.js";

const dailyChallengeRouter = express.Router();

dailyChallengeRouter.get("/active", optionalProtect, dailyChallengeAccessRateLimit, getActiveDailyChallenge);
dailyChallengeRouter.post("/admin/sync", protect, isAdmin, syncDailyChallengeForToday);
dailyChallengeRouter.get("/:linkId", optionalProtect, getDailyChallengeByLink);
dailyChallengeRouter.post("/:linkId/send-otp", optionalProtect, dailyChallengeOtpRateLimit, sendCodingRoundOTP);
dailyChallengeRouter.post("/:linkId/verify-otp", optionalProtect, dailyChallengeOtpRateLimit, verifyOTPAndGetCodingRound);
dailyChallengeRouter.post("/:linkId/start", optionalProtect, dailyChallengeAccessRateLimit, startDailyChallengeAttempt);
dailyChallengeRouter.post("/:linkId/auto-submit", optionalProtect, autoSubmitRound);
dailyChallengeRouter.post("/:linkId/run", optionalProtect, codingRateLimit, runCodingRoundAnswers);
dailyChallengeRouter.post("/:linkId/submit", optionalProtect, codingRateLimit, submitCodingRoundAnswers);
dailyChallengeRouter.post("/:linkId/end", optionalProtect, endCodingRound);

export default dailyChallengeRouter;
