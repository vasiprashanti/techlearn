import UserProgress from "../models/UserProgress.js";
import Quiz from "../models/Quiz.js";
import Course from "../models/Course.js";
import Exercise from "../models/Exercise.js";

// Check if a question has already been answered
export const checkIfQuestionAnswered = async ({
  userId,
  quizId,
  questionId,
}) => {
  let userProgress = await UserProgress.findOne({ userId });
  if (!userProgress) return { answered: false };

  // Check if this specific question has already been answered
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
      // ✅ Add missing fields for consistency
      exerciseXP: new Map(),
      totalExerciseXP: 0,
      completedExercises: [],
    });
  }

  // ✅ Consistent string conversion
  const quizIdStr = quizId.toString();
  const courseIdStr = courseId.toString();

  // Add this questionId to answeredQuestions for this quiz
  const answered = userProgress.answeredQuestions.get(quizIdStr) || [];
  answered.push(questionId);
  userProgress.answeredQuestions.set(quizIdStr, answered);

  // Add XP for this question
  const currentCourseXP = userProgress.courseXP.get(courseIdStr) || 0;
  userProgress.courseXP.set(courseIdStr, currentCourseXP + xp);

  // Recalculate total course XP
  userProgress.totalCourseXP = Array.from(
    userProgress.courseXP.values()
  ).reduce((sum, xp) => sum + xp, 0);

  await userProgress.save();

  // Check if quiz is complete
  const quiz = await Quiz.findById(quizId);
  const isQuizComplete = quiz && answered.length === quiz.questions.length;

  // ✅ Mark quiz as completed when all questions are answered
  if (
    isQuizComplete &&
    !userProgress.completedQuizzes.some((id) => id.toString() === quizIdStr)
  ) {
    userProgress.completedQuizzes.push(quizId);
    await userProgress.save();
  }

  return {
    success: true,
    quizComplete: isQuizComplete,
    totalAnswered: answered.length,
    totalQuestions: quiz ? quiz.questions.length : 0,
  };
};

// Get Current Authenticated User's Progress
export const getUserProgress = async (req, res) => {
  const userId = req.user._id;

  try {
    // ✅ Include answeredQuestions and completedExercises in the select
    const userProgress = await UserProgress.findOne({ userId }).select(
      "courseXP exerciseXP totalCourseXP totalExerciseXP completedQuizzes answeredQuestions completedExercises"
    );

    if (!userProgress) {
      return res.status(200).json({
        courseXP: {},
        exerciseXP: {},
        totalCourseXP: 0,
        totalExerciseXP: 0,
        completedQuizzes: [],
        answeredQuestions: {}, // ✅ Add this
        completedExercises: [], // ✅ Add this
      });
    }

    // Recalculate totals to ensure consistency
    let recalculatedTotalCourseXP = 0;
    let recalculatedTotalExerciseXP = 0;

    // Convert Maps to plain objects for JSON response
    const courseXPObject = {};
    const exerciseXPObject = {};

    for (const [courseId, xp] of userProgress.courseXP) {
      courseXPObject[courseId] = xp;
      recalculatedTotalCourseXP += xp;
    }

    for (const [courseId, xp] of userProgress.exerciseXP) {
      exerciseXPObject[courseId] = xp;
      recalculatedTotalExerciseXP += xp;
    }

    // ✅ Convert answeredQuestions Map to plain object
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
      totalCourseXP: recalculatedTotalCourseXP,
      totalExerciseXP: recalculatedTotalExerciseXP,
      completedQuizzes: userProgress.completedQuizzes || [],
      answeredQuestions: answeredQuestionsObject, // ✅ Include this
      completedExercises: userProgress.completedExercises || [], // ✅ Include this
    });
  } catch (err) {
    console.error("User Progress Fetch Error:", err.message);
    return res.status(500).json({ message: "Failed to fetch user progress" });
  }
};

// recordExerciseAttempt route

export const recordExerciseAttempt = async (req, res) => {
  try {
    // ✅ Fix: use req.user._id instead of req.user.userId
    const userId = req.user._id;
    const { courseId, exerciseId, questionId, xp } = req.body;

    let userProgress = await UserProgress.findOne({ userId });

    if (!userProgress) {
      userProgress = new UserProgress({
        userId,
        exerciseXP: new Map(),
        totalExerciseXP: 0,
        completedExercises: [],
        // ✅ Add missing fields for consistency
        courseXP: new Map(),
        totalCourseXP: 0,
        completedQuizzes: [],
        answeredQuestions: new Map(),
      });
    }

    // ✅ Convert courseId to string for consistency
    const courseIdStr = courseId.toString();

    // Add XP for this exercise question
    const currentXP = userProgress.exerciseXP.get(courseIdStr) || 0;
    userProgress.exerciseXP.set(courseIdStr, currentXP + xp);

    // ✅ Recalculate total exercise XP from all courses
    userProgress.totalExerciseXP = Array.from(
      userProgress.exerciseXP.values()
    ).reduce((sum, xp) => sum + xp, 0);

    if (
      !userProgress.completedExercises.some(
        (id) => id.toString() === exerciseId
      )
    ) {
      userProgress.completedExercises.push(exerciseId);
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
