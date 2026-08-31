import express from "express";
import { optionalProtect } from "../middleware/authMiddleware.js";
import { listPublicJobs, listRecommendedJobs } from "../controllers/jobController.js";

const router = express.Router();

router.get("/for-you", optionalProtect, listRecommendedJobs);
router.get("/", optionalProtect, listPublicJobs);

export default router;
