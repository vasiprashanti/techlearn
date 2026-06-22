import express from "express";
import { getTodayDailyTasks, submitDailyTask } from "../controllers/dailyTaskController.js";
import { protect, requirePlacementProgram } from "../middleware/authMiddleware.js";

const dailyTaskRouter = express.Router();

dailyTaskRouter.use(protect, requirePlacementProgram);
dailyTaskRouter.get("/today", getTodayDailyTasks);
dailyTaskRouter.post("/submit", submitDailyTask);

export default dailyTaskRouter;
