import express from "express";
import { getPlacementLearningDashboard } from "../controllers/placementLearningController.js";
import { protect } from "../middleware/authMiddleware.js";

const placementLearningRouter = express.Router();

placementLearningRouter.get("/dashboard", protect, getPlacementLearningDashboard);

export default placementLearningRouter;
