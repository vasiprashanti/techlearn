import UserProgress from "../models/UserProgress.js";

export const updateCourseProgress = async (req, res) => {
  const { courseTitle, progressPercent, estimatedTimeRemaining } = req.body;
  const userId = req.user._id;

  try {
    let progress = await UserProgress.findOne({ userId });
    if (!progress) {
      progress = new UserProgress({ userId });
    }

    progress.courseProgress = {
      courseTitle,
      progressPercent,
      estimatedTimeRemaining: estimatedTimeRemaining || "0min",
    };

    await progress.save();

    res.status(200).json({
      message: "Course progress updated",
      courseProgress: progress.courseProgress,
    });
  } catch (err) {
    console.error("Update Course Progress Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

//updating exercise progress
export const updateExerciseProgress = async (req, res) => {
  const { totalExercises, completedExercises } = req.body;
  const userId = req.user._id;

  try {
    let progress = await UserProgress.findOne({ userId });
    if (!progress) {
      progress = new UserProgress({ userId });
    }

    progress.exerciseProgress = {
      totalExercises,
      completedExercises,
    };

    await progress.save();

    res.status(200).json({
      message: "Exercise progress updated",
      exerciseProgress: progress.exerciseProgress,
    });
  } catch (err) {
    console.error("Update Exercise Progress Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

//updating calender activity for the user
export const updateCalendarActivity = async (req, res) => {
  const { date, status } = req.body; // e.g., date: "2025-06-25", status: "Completed"
  const userId = req.user._id;

  try {
    let progress = await UserProgress.findOne({ userId });
    if (!progress) {
      progress = new UserProgress({ userId });
    }

    progress.calendarActivity.set(date, status);
    await progress.save();

    res.status(200).json({
      message: "Calendar activity updated",
      calendarActivity: Object.fromEntries(progress.calendarActivity),
    });
  } catch (error) {
    console.error("Update Calendar Activity Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
