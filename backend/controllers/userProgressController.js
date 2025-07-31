import mongoose from "mongoose";
import UserProgress from "../models/UserProgress.js";
import Quiz from "../models/Quiz.js";
import Exercise from "../models/Exercise.js";

// Check if a question has already been answered
export const checkIfQuestionAnswered = async ({
  userId,
  quizId,
  questionId,
}) => {
  let userProgress = await UserProgress.findOne({ userId });
  if (!userProgress) return { answered: false };

  const answered = userProgress.answeredQuestions.get(quizId.toString()) || [];
  if (answered.map((id) => id.toString()).includes(questionId.toString())) {
    return { error: "You have already answered this question." };
  }

  return { answered: false };
};

// Update progress and XP for any answer attempt
export const recordQuizAttempt = async ({
  userId,
  quizId,
  courseId,
  questionId,
  xp,
}) => {
  let userProgress = await UserProgress.findOne({ userId });
  if (!userProgress) {
    userProgress = new UserProgress({
      userId,
      completedQuizzes: [],
      courseXP: new Map(),
      totalCourseXP: 0,
      answeredQuestions: new Map(),
      exerciseXP: new Map(),
      totalExerciseXP: 0,
      completedExercises: [],
    });
  }

  const quizIdStr = quizId.toString();
  const courseIdStr = courseId.toString();

  // Add this questionId to answeredQuestions for this quiz
  const answered = userProgress.answeredQuestions.get(quizIdStr) || [];
  answered.push(questionId);
  userProgress.answeredQuestions.set(quizIdStr, answered);

  // Add XP for this question (earned XP, not total possible)
  const currentCourseXP = userProgress.courseXP.get(courseIdStr) || 0;
  userProgress.courseXP.set(courseIdStr, currentCourseXP + xp);

  //  FIX: Calculate GLOBAL totals across ALL courses
  const allQuizzes = await Quiz.find();
  let totalPossibleQuizXP = 0;
  for (const quiz of allQuizzes) {
    totalPossibleQuizXP += quiz.questions.length * 10; // 10 XP per question
  }
  userProgress.totalCourseXP = totalPossibleQuizXP;

  const totalExercisesGlobally = await Exercise.countDocuments();
  userProgress.totalExerciseXP = totalExercisesGlobally * 10; // 10 XP per exercise

  await userProgress.save();

  // Check if quiz is complete
  const quiz = await Quiz.findById(quizId);
  const isQuizComplete = quiz && answered.length === quiz.questions.length;

  if (
    isQuizComplete &&
    !userProgress.completedQuizzes.some(
      (item) => item.quizId && item.quizId.toString() === quizIdStr
    )
  ) {
    userProgress.completedQuizzes.push({
      quizId: new mongoose.Types.ObjectId(quizId),
      completedAt: new Date(),
    });
    await userProgress.save();
  }

  return {
    success: true,
    quizComplete: isQuizComplete,
    totalAnswered: answered.length,
    totalQuestions: quiz ? quiz.questions.length : 0,
  };
};

export const recordExerciseAttempt = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId, exerciseId, questionId, xp } = req.body;

    let userProgress = await UserProgress.findOne({ userId });

    if (!userProgress) {
      userProgress = new UserProgress({
        userId,
        exerciseXP: new Map(),
        totalExerciseXP: 0,
        completedExercises: [],
        courseXP: new Map(),
        totalCourseXP: 0,
        completedQuizzes: [],
        answeredQuestions: new Map(),
      });
    }

    const courseIdStr = courseId.toString();
    const currentXP = userProgress.exerciseXP.get(courseIdStr) || 0;
    userProgress.exerciseXP.set(courseIdStr, currentXP + xp);

    //  FIX: Calculate GLOBAL totals across ALL courses
    const allQuizzes = await Quiz.find();
    let totalPossibleQuizXP = 0;
    for (const quiz of allQuizzes) {
      totalPossibleQuizXP += quiz.questions.length * 10; // 10 XP per question
    }
    userProgress.totalCourseXP = totalPossibleQuizXP;

    const totalExercisesGlobally = await Exercise.countDocuments();
    userProgress.totalExerciseXP = totalExercisesGlobally * 10; // 10 XP per exercise

    // Use correct schema structure for exercise completion
    if (
      !userProgress.completedExercises.some(
        (item) => item.exerciseId && item.exerciseId.toString() === exerciseId
      )
    ) {
      userProgress.completedExercises.push({
        exerciseId: new mongoose.Types.ObjectId(exerciseId),
        completedAt: new Date(),
      });
    }

    await userProgress.save();

    return res
      .status(200)
      .json({ success: true, totalExerciseXP: userProgress.totalExerciseXP });
  } catch (error) {
    console.error("Error in recordExerciseAttempt:", error);
    return res
      .status(500)
      .json({ message: "Failed to record exercise attempt" });
  }
};

export const getUserProgress = async (req, res) => {
  const userId = req.user._id;

  try {
    const userProgress = await UserProgress.findOne({ userId });

    if (!userProgress) {
      //  Calculate global totals even for new users
      const allQuizzes = await Quiz.find();
      let totalPossibleQuizXP = 0;
      for (const quiz of allQuizzes) {
        totalPossibleQuizXP += quiz.questions.length * 10;
      }

      const totalExercisesGlobally = await Exercise.countDocuments();
      const totalPossibleExerciseXP = totalExercisesGlobally * 10;

      return res.status(200).json({
        courseXP: {},
        exerciseXP: {},
        totalCourseXP: totalPossibleQuizXP,
        totalExerciseXP: totalPossibleExerciseXP,
        completedQuizzes: [],
        answeredQuestions: {},
        completedExercises: [],
      });
    }

    // Update global totals every time user progress is fetched
    const allQuizzes = await Quiz.find();
    let totalPossibleQuizXP = 0;
    for (const quiz of allQuizzes) {
      totalPossibleQuizXP += quiz.questions.length * 10;
    }

    const totalExercisesGlobally = await Exercise.countDocuments();
    const totalPossibleExerciseXP = totalExercisesGlobally * 10;

    // Update the stored values
    userProgress.totalCourseXP = totalPossibleQuizXP;
    userProgress.totalExerciseXP = totalPossibleExerciseXP;
    await userProgress.save();

    // Convert Maps to plain objects for JSON response
    const courseXPObject = {};
    const exerciseXPObject = {};

    for (const [courseId, xp] of userProgress.courseXP) {
      courseXPObject[courseId] = xp;
    }

    for (const [courseId, xp] of userProgress.exerciseXP) {
      exerciseXPObject[courseId] = xp;
    }

    // Convert answeredQuestions Map to plain object
    const answeredQuestionsObject = {};
    if (userProgress.answeredQuestions) {
      for (const [quizId, questionIds] of userProgress.answeredQuestions) {
        answeredQuestionsObject[quizId] = questionIds.map((id) =>
          id.toString()
        );
      }
    }

    return res.status(200).json({
      _id: userProgress._id,
      courseXP: courseXPObject,
      exerciseXP: exerciseXPObject,
      totalCourseXP: userProgress.totalCourseXP,
      totalExerciseXP: userProgress.totalExerciseXP,
      completedQuizzes: userProgress.completedQuizzes || [],
      answeredQuestions: answeredQuestionsObject,
      completedExercises: userProgress.completedExercises || [],
    });
  } catch (err) {
    console.error("User Progress Fetch Error:", err.message);
    return res.status(500).json({ message: "Failed to fetch user progress" });
  }
};
