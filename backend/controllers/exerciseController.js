import mongoose from "mongoose";
import axios from "axios";
import Exercise from "../models/Exercise.js";
import UserProgress from "../models/UserProgress.js";
import Course from "../models/Course.js";
import Quiz from "../models/Quiz.js";

// Submit Exercise and Award XP
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
        totalExerciseXP: 0,
        exerciseXP: new Map(),
        completedExercises: [],
        courseXP: new Map(),
        totalCourseXP: 0,
        completedQuizzes: [],
        answeredQuestions: new Map(),
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

    // FIX: Calculate GLOBAL totals
    const allQuizzes = await Quiz.find();
    let totalPossibleQuizXP = 0;
    for (const quiz of allQuizzes) {
      totalPossibleQuizXP += quiz.questions.length * 10;
    }
    progress.totalCourseXP = totalPossibleQuizXP;

    const totalExercisesGlobally = await Exercise.countDocuments();
    progress.totalExerciseXP = totalExercisesGlobally * 10;

    await progress.save();

    const totalExerciseXP = [...progress.exerciseXP.values()].reduce(
      (sum, val) => sum + val,
      0
    );

    res.status(200).json({
      message: "Exercise completed successfully",
      addedXP: xpToAdd,
      totalExerciseXP: progress.totalExerciseXP, // Global total, not earned total
      exerciseId,
      courseId,
    });
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ error: "Exercise submission failed" });
  }
};

// Submit code to Judge0 and check output
export const submitExerciseCode = async (req, res) => {
  const { courseId, exerciseId } = req.params;
  const { language, code, input } = req.body;

  const languageMap = {
    python: 71,
    java: 62,
    c: 50,
  };

  const langKey = language?.toLowerCase();
  const languageId = languageMap[langKey];
  if (!languageId) {
    console.error(`Unsupported language received in submitExerciseCode: '${language}'`);
    return res.status(400).json({
      error: "Unsupported language. Please use 'python', 'java', or 'c'.",
      received: language,
      allowed: Object.keys(languageMap)
    });
  }

  try {
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

    const expectedOutput = exercise.expectedOutput?.trim();
    const inputToUse = input || exercise.input || "";

    // Encode source_code and stdin as base64
    const base64Source = Buffer.from(code || '', 'utf-8').toString('base64');
    const base64Input = Buffer.from(inputToUse || '', 'utf-8').toString('base64');

    // Log Judge0 payload and headers
    const judge0Payload = {
      source_code: base64Source,
      stdin: base64Input,
      language_id: languageId,
    };
    const judge0Headers = {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
      "Content-Type": "application/json",
    };
    console.log("[Judge0] Payload:", judge0Payload);
    console.log("[Judge0] Headers:", judge0Headers);

    try {
      const submission = await axios.post(
        "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true",
        judge0Payload,
        { headers: judge0Headers }
      );

      const result = submission.data;
      // Decode output if present (Judge0 returns base64 if base64_encoded=true)
      const decode = (val) => val ? Buffer.from(val, 'base64').toString('utf-8') : '';
      const actualOutput = decode(result.stdout || '');
      const isCorrect = expectedOutput === actualOutput.trim();

      return res.status(200).json({
        stdout: actualOutput,
        stderr: decode(result.stderr),
        compile_output: decode(result.compile_output),
        status: result.status,
        time: result.time,
        memory: result.memory,
        correct: isCorrect,
        expected: expectedOutput,
        exerciseId,
        courseId,
      });
    } catch (judge0Err) {
      // Log full error response from Judge0
      if (judge0Err.response) {
        console.error("[Judge0] Error response:", judge0Err.response.data);
        return res.status(500).json({
          error: "Judge0 error",
          judge0: judge0Err.response.data
        });
      } else {
        console.error("[Judge0] Error:", judge0Err.message);
        return res.status(500).json({
          error: "Judge0 error",
          message: judge0Err.message
        });
      }
    }
  } catch (err) {
    console.error("Judge0 error:", err.message);
    return res.status(500).json({ error: "Code execution failed" });
  }
};

// Get ALL exercises for a course
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

    // Get ALL exercises for this course (not just the linked one)
    const exercises = await Exercise.find({ courseId });


    if (!exercises || exercises.length === 0) {
      return res
        .status(404)
        .json({ error: "No exercises found for this course" });
    }

    const mappedExercises = exercises.map((exercise) => ({
      exerciseId: exercise._id,
      question: exercise.question,
      realLifeApplication: exercise.realLifeApplication,
      exerciseAnswers: exercise.exerciseAnswers,
      expectedOutput: exercise.expectedOutput,
      input: exercise.input,
      createdAt: exercise.createdAt,
      updatedAt: exercise.updatedAt,
    }));
    res.status(200).json({
      courseId: courseId,
      exerciseCount: exercises.length,
      exercises: mappedExercises,
    });
  } catch (err) {
    console.error("Fetch exercises error:", err.message);
    res.status(500).json({ error: "Failed to fetch exercises" });
  }
};

//exerciseController export fixed
