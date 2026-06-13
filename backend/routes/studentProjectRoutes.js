import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getActiveProject,
  getProjectOverview,
  getDayNotes,
  toggleTask
} from "../controllers/studentProjectController.js";

const router = express.Router();

router.get("/active", protect, getActiveProject);
router.get("/overview", protect, getProjectOverview);
router.get("/day-notes/:dayNumber", protect, getDayNotes);
router.post("/tasks/:taskId/toggle", protect, toggleTask);

export default router;
