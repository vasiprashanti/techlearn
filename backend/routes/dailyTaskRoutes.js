import express from "express";
import { getTodayDailyTasks, submitDailyTask } from "../controllers/dailyTaskController.js";
import { protect } from "../middleware/authMiddleware.js";

const dailyTaskRouter = express.Router();

dailyTaskRouter.get("/today", protect, getTodayDailyTasks);
dailyTaskRouter.post("/submit", protect, submitDailyTask);

export default dailyTaskRouter;
