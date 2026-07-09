import express from "express";
import { seedDailyChallengeE2E } from "../controllers/admin/adminTestingController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/daily-challenge-e2e", protect, isAdmin, seedDailyChallengeE2E);

export default router;
