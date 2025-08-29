import mongoose from "mongoose";
import axios from "axios";
import Exercise from "../models/Exercise.js";
import UserProgress from "../models/UserProgress.js";
import Course from "../models/Course.js";
import { LANGUAGE_IDS } from "../utils/judgeUtil.js";

// This function manually marks exercises as completed without code validation
export const submitExercise = async (req, res) => {
  const { courseId, exerciseId } = req.params;
  const userId = req.user._id;

  try {
    if (
      !mongoose.Types.ObjectId.isValid(courseId) ||
      !mongoose.Types.ObjectId.isValid(exerciseId)
    ) {
      return res.status(400).json({ error: "Invalid course or exercise ID" });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Verify exercise exists and belongs to this course
    const exercise = await Exercise.findOne({ _id: exerciseId, courseId });
    if (!exercise) {
      return res.status(404).json({
        error: "Exercise not found or doesn't belong to this course",
      });
    }

    let progress = await UserProgress.findOne({ userId });
    if (!progress) {
      progress = new UserProgress({
        userId,
        exerciseXP: new Map(),
        completedExercises: [],
        courseXP: new Map(),
        answeredCheckpointMcqs: new Map(),
      });
    }

    // Check if this specific exercise is already completed
    if (
      progress.completedExercises.some(
        (item) => item.exerciseId && item.exerciseId.toString() === exerciseId
      )
    ) {
      return res.status(400).json({ message: "Exercise already completed" });
    }

    const xpToAdd = 10;
    const currentXP = progress.exerciseXP.get(courseId) || 0;
    progress.exerciseXP.set(courseId, currentXP + xpToAdd);

    progress.completedExercises.push({
      exerciseId: new mongoose.Types.ObjectId(exerciseId),
      completedAt: new Date(),
    });

    // Calculate total possible XP for this course only
    const exercisesForThisCourse = await Exercise.countDocuments({
      courseId: new mongoose.Types.ObjectId(courseId),
    });
    const totalExerciseXP = exercisesForThisCourse * 10;

    await progress.save();

    res.status(200).json({
      message: "Exercise completed successfully (manual submission)",
      addedXP: xpToAdd,
      totalExerciseXP, // Only for this course
      exerciseId,
      courseId,
      note: "Consider using /submit-code endpoint for automatic validation",
    });
  } catch (err) {
    console.error("Exercise submission failed", err);
    return res.status(500).json({ error: "Exercise submission failed" });
  }
};

// Submit code to Judge0 and check output
export const submitExerciseCode = async (req, res) => {
  const { courseId, exerciseId } = req.params;
  const { language, code, input } = req.body;
  const userId = req.user._id;

  const languageId = LANGUAGE_IDS[language?.toLowerCase()];
  if (!languageId) {
    return res.status(400).json({
      error: `Unsupported language: ${language}. Supported languages: ${Object.keys(
        LANGUAGE_IDS
      ).join(", ")}`,
    });
  }

  try {
    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(courseId) ||
      !mongoose.Types.ObjectId.isValid(exerciseId)
    ) {
      return res.status(400).json({ error: "Invalid course or exercise ID" });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Verify exercise exists and belongs to this course
    const exercise = await Exercise.findOne({ _id: exerciseId, courseId });
    if (!exercise) {
      return res.status(404).json({
        error: "Exercise not found or doesn't belong to this course",
      });
    }

    const expectedOutput = exercise.expectedOutput?.trim(); // For user reference
    const expectedProgramOutput = exercise.expectedProgramOutput?.trim(); // For validation
    const inputToUse = input || exercise.input || "";

    // Submit to Judge0 API
    const submission = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
      {
        source_code: code,
        language_id: languageId,
        stdin: inputToUse,
        expected_output: expectedProgramOutput, // Use program output for Judge0 validation
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          "X-RapidAPI-Key": process.env.JUDGE0_RAPIDAPI_KEY,
        },
      }
    );

    const { stdout, stderr, compile_output, token, status } = submission.data;

    // Check for compilation errors
    if (compile_output) {
      return res.status(400).json({
        success: false,
        error: "Compilation error",
        details: compile_output,
        isOutputCorrect: false,
        output: stdout?.trim() || "",
        expectedOutput, // Sample code for user reference
        expectedProgramOutput, // Expected program output for validation
        token,
      });
    }

    // Check for runtime errors
    if (stderr) {
      return res.status(400).json({
        success: false,
        error: "Runtime error",
        details: stderr,
        isOutputCorrect: false,
        output: stdout?.trim() || "",
        expectedOutput, // Sample code for user reference
        expectedProgramOutput, // Expected program output for validation
        token,
      });
    }

    // Compare the output with the expected program output
    const userOutput = stdout?.trim() || "";
    const isOutputCorrect = expectedProgramOutput
      ? userOutput === expectedProgramOutput
      : false; // If no expected output is set, mark as incorrect

    let xpAwarded = 0;
    let alreadyCompleted = false;

    // Get or create user progress
    let userProgress = await UserProgress.findOne({ userId });
    if (!userProgress) {
      userProgress = new UserProgress({
        userId,
        exerciseXP: new Map(),
        completedExercises: [],
        courseXP: new Map(),
        answeredCheckpointMcqs: new Map(),
      });
    }

    // If output is correct, award XP and mark as completed
    if (isOutputCorrect) {
      // Check if this specific exercise is already completed
      const isAlreadyCompleted = userProgress.completedExercises.some(
        (item) => item.exerciseId && item.exerciseId.toString() === exerciseId
      );

      if (!isAlreadyCompleted) {
        xpAwarded = 10;
        const currentXP = userProgress.exerciseXP.get(courseId) || 0;
        userProgress.exerciseXP.set(courseId, currentXP + xpAwarded);

        userProgress.completedExercises.push({
          exerciseId: new mongoose.Types.ObjectId(exerciseId),
          completedAt: new Date(),
        });

        await userProgress.save();
      } else {
        alreadyCompleted = true;
      }
    }

    // Calculate total possible XP for this course
    const exercisesForThisCourse = await Exercise.countDocuments({
      courseId: new mongoose.Types.ObjectId(courseId),
    });
    const totalExerciseXP = exercisesForThisCourse * 10;

    // Get updated courseXP and exerciseXP for frontend display
    const courseXPObject = {};
    const exerciseXPObject = {};
    if (userProgress && userProgress.courseXP) {
      for (const [courseId, xp] of userProgress.courseXP) {
        courseXPObject[courseId] = xp;
      }
    }
    if (userProgress && userProgress.exerciseXP) {
      for (const [courseId, xp] of userProgress.exerciseXP) {
        exerciseXPObject[courseId] = xp;
      }
    }

    res.status(200).json({
      success: true,
      message: isOutputCorrect
        ? alreadyCompleted
          ? "Exercise already completed"
          : "Exercise completed successfully"
        : "Exercise submitted but output is incorrect",
      isOutputCorrect,
      output: userOutput,
      expectedOutput, // Sample code for user reference
      expectedProgramOutput, // Expected program output for validation
      xpAwarded,
      alreadyCompleted,
      totalExerciseXP,
      exerciseId,
      courseId,
      token,
      status,
      courseXP: courseXPObject, // Frontend can use this to display XP card
      exerciseXP: exerciseXPObject, // Frontend can use this to display XP card
    });
  } catch (err) {
    console.error("Code submission error:", err);

    // Handle Judge0 API errors specifically
    if (err.response) {
      return res.status(500).json({
        success: false,
        error: "Judge0 API error",
        details: err.response.data?.message || "Unknown Judge0 error",
        isOutputCorrect: false,
      });
    }

    res.status(500).json({
      success: false,
      error: "Code submission failed",
      details: err.message,
      isOutputCorrect: false,
    });
  }
};

// Get Course Exercises
export const getCourseExercises = async (req, res) => {
  const { courseId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: "Invalid course ID" });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Fetch exercises for this course
    const exercises = await Exercise.find({ courseId });

    res.status(200).json({
      exercises: exercises.map((exercise) => ({
        exerciseId: exercise._id,
        title: exercise.title,
        question: exercise.question,
        expectedOutput: exercise.expectedOutput, // Sample code for user reference
        expectedProgramOutput: exercise.expectedProgramOutput, // Expected program output
        input: exercise.input,
        createdAt: exercise.createdAt,
        updatedAt: exercise.updatedAt,
      })),
    });
  } catch (err) {
    console.error("Get course exercises failed", err);
    return res.status(500).json({ error: "Get course exercises failed" });
  }
};
