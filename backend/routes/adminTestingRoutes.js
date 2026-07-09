import express from "express";
import {
  getDailyChallengeE2EReport,
  seedDailyChallengeE2E,
  seedDailyChallengeE2ESelfServe,
} from "../controllers/admin/adminTestingController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/daily-challenge-e2e/self-serve", seedDailyChallengeE2ESelfServe);
router.get("/daily-challenge-e2e/self-serve/report", getDailyChallengeE2EReport);
router.post("/daily-challenge-e2e", protect, isAdmin, seedDailyChallengeE2E);

export default router;
