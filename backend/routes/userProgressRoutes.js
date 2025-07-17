import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getUserProgress } from "../controllers/userProgressController.js";
import { recordExerciseAttempt } from "../controllers/userProgressController.js";

const userProgressRouter = express.Router();

userProgressRouter.get("/", protect, getUserProgress);
userProgressRouter.post(
  "/record-exercise-attempt",
  protect,
  recordExerciseAttempt
);

export default userProgressRouter;
