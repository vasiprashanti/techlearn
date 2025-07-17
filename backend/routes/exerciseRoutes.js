import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import Exercise from "../models/Exercise.js";
import UserProgress from "../models/UserProgress.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Submit Exercise + Award XP
router.post("/:courseId/:exerciseId/submit", protect, async (req, res) => {
  const { courseId, exerciseId } = req.params;
  const userId = req.user._id;

  try {
    if (
      !mongoose.Types.ObjectId.isValid(courseId) ||
      !mongoose.Types.ObjectId.isValid(exerciseId)
    ) {
      return res.status(400).json({ error: "Invalid course or exercise ID" });
    }

    const exercise = await Exercise.findOne({ _id: exerciseId, courseId });
    if (!exercise) return res.status(404).json({ error: "Exercise not found" });

    let progress = await UserProgress.findOne({ userId });
    if (!progress) {
      progress = new UserProgress({
        userId,
        totalExerciseXP: 0,
        exerciseXP: new Map(),
        completedExercises: [],
        courseXP: new Map(),
        totalCourseXP: 0,
        completedQuizzes: [],
        answeredQuestions: new Map(),
      });
    }

    if (
      progress.completedExercises.some((id) => id.toString() === exerciseId)
    ) {
      return res.status(400).json({ message: "Exercise already completed" });
    }

    const xpToAdd = 10;
    const currentXP = progress.exerciseXP.get(courseId) || 0;
    progress.exerciseXP.set(courseId, currentXP + xpToAdd);
    progress.completedExercises.push(new mongoose.Types.ObjectId(exerciseId));
    await progress.save();

    const totalExerciseXP = [...progress.exerciseXP.values()].reduce(
      (sum, val) => sum + val,
      0
    );

    res.status(200).json({
      message: "Exercise completed successfully",
      addedXP: xpToAdd,
      totalExerciseXP,
    });
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ error: "Exercise submission failed" });
  }
});

//Submit Code to Judge0
router.post("/:courseId/:exerciseId/submit-code", protect, async (req, res) => {
  const { courseId, exerciseId } = req.params;
  const { language, code, input } = req.body;

  const languageMap = {
    python: 71,
    java: 62,
  };

  const languageId = languageMap[language.toLowerCase()];
  if (!languageId) {
    return res
      .status(400)
      .json({
        error: "Unsupported language. Please provide 'python' or 'java'.",
      });
  }

  try {
    const submission = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
      {
        source_code: code,
        stdin: input || "",
        language_id: languageId,
      },
      {
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
          "Content-Type": "application/json",
        },
      }
    );

    const result = submission.data;
    return res.status(200).json({
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      status: result.status,
      time: result.time,
      memory: result.memory,
    });
  } catch (err) {
    console.error("Judge0 error:", err.message);
    return res.status(500).json({ error: "Code execution failed" });
  }
});

// Get all exercises for a course
router.get("/:courseId", protect, async (req, res) => {
  const { courseId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: "Invalid course ID" });
    }

    const exercises = await Exercise.find({ courseId });
    res.status(200).json(exercises);
  } catch (err) {
    console.error("Fetch exercises error:", err.message);
    res.status(500).json({ error: "Failed to fetch exercises" });
  }
});

export default router;
