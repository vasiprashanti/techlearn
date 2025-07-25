import UserProgress from "../models/UserProgress.js";
import Exercise from "../models/Exercise.js";
import Quiz from "../models/Quiz.js";

// Helper function to calculate total possible XP
const calculateTotalPossibleXP = async () => {
  // Calculate total exercises * 10 (10 XP per exercise)
  const totalExercises = await Exercise.countDocuments();
  const totalExerciseXP = totalExercises * 10;

  // Calculate total quiz questions * 10 (10 XP per question)
  const allQuizzes = await Quiz.find();
  let totalQuizQuestions = 0;
  for (const quiz of allQuizzes) {
    totalQuizQuestions += quiz.questions.length;
  }
  const totalCourseXP = totalQuizQuestions * 10;

  return { totalCourseXP, totalExerciseXP };
};

export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;
    const progress = await UserProgress.findOne({ userId }).populate(
      "completedExercises.exerciseId",
      "topicTitle"
    );

    if (!progress) {
      return res.status(200).json({
        courseXP: {},
        exerciseXP: {},
        totalCourseXP: 0, // Show 0 when no progress exists
        totalExerciseXP: 0, // Show 0 when no progress exists
        completedExercises: [],
        calendarActivity: {},
        answeredQuestions: {},
        courseProgress: { progressPercent: 0 },
        exerciseProgress: {
          totalExercises: 0, // Show 0 initially
          completedExercises: 0,
          progressPercent: 0,
        },
        quizProgress: {
          totalQuizzes: 0, // Show 0 initially
          completedQuizzes: 0,
          totalQuizQuestions: 0, // Show 0 initially
          answeredQuizQuestions: 0,
          progressPercent: 0,
        },
      });
    }

    // CALCULATE progress from actual data (no schema changes needed)
    const totalExercises = await Exercise.countDocuments();
    const totalQuizzes = await Quiz.countDocuments();

    const completedExercisesCount = progress.completedExercises.length;
    const completedQuizzesCount = progress.completedQuizzes.length;

    // Calculate quiz progress based on answered questions
    let totalQuizQuestions = 0;
    let answeredQuizQuestions = 0;

    // Get all quizzes to count total questions
    const allQuizzes = await Quiz.find();
    for (const quiz of allQuizzes) {
      totalQuizQuestions += quiz.questions.length;
    }

    // Count answered questions from progress.answeredQuestions
    if (progress.answeredQuestions) {
      for (const [quizId, questionIds] of progress.answeredQuestions) {
        answeredQuizQuestions += questionIds.length;
      }
    }

    const exercisePercent =
      totalExercises > 0
        ? Math.round((completedExercisesCount / totalExercises) * 1000) / 10
        : 0;
    const quizPercent =
      totalQuizQuestions > 0
        ? Math.round((answeredQuizQuestions / totalQuizQuestions) * 1000) / 10
        : 0;
    const courseProgressPercent =
      Math.round(((exercisePercent + quizPercent) / 2) * 10) / 10;

    // Create calendar activity
    const calendarActivity = {};
    if (progress.createdAt) {
      const dateKey = progress.createdAt.toISOString().split("T")[0];
      calendarActivity[dateKey] = "active"; // Use string instead of boolean
    }

    res.status(200).json({
      courseXP: progress.courseXP,
      exerciseXP: progress.exerciseXP,
      totalCourseXP: progress.totalCourseXP, // Use stored value from database
      totalExerciseXP: progress.totalExerciseXP, // Use stored value from database
      completedExercises: progress.completedExercises,
      calendarActivity,
      answeredQuestions: progress.answeredQuestions,
      totalCourseProgress: { progressPercent: courseProgressPercent },
      quizProgress: {
        totalQuizzes,
        completedQuizzes: completedQuizzesCount,
        totalQuizQuestions,
        answeredQuizQuestions,
        progressPercent: quizPercent,
      },
      exerciseProgress: {
        totalExercises,
        completedExercises: completedExercisesCount,
        progressPercent: exercisePercent,
      },
    });
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    res.status(500).json({ message: "Server error fetching dashboard data" });
  }
};
