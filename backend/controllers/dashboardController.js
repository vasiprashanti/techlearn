import UserProgress from "../models/UserProgress.js";

export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;
    let progress = await UserProgress.findOne({ userId });

    if (!progress) {
      // If no progress, send defaults or empty data
      return res.status(200).json({
        courseProgress: {},
        exerciseProgress: { totalExercises: 0, completedExercises: 0 },
        calendarActivity: {},
        recentActivity: {},
        enrolledCourses: [],
        xpPoints: {
          xpFromLearn: 0,
          xpFromBuild: 0,
          totalXP: 0,
        },
      });
    }

    res.status(200).json({
      courseProgress: progress.courseProgress || {},
      exerciseProgress: progress.exerciseProgress || {
        totalExercises: 0,
        completedExercises: 0,
      },
      calendarActivity: progress.calendarActivity || {},
      recentActivity: progress.recentActivity || {},
      enrolledCourses: progress.enrolledCourses || [],
      xpPoints: {
        xpFromLearn: progress.xpFromLearn,
        xpFromBuild: progress.xpFromBuild,
        totalXP: progress.xpFromLearn + progress.xpFromBuild,
      },
    });
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    res.status(500).json({ message: "Server error fetching dashboard data" });
  }
};
