import User from "../models/User.js";
import UserProgress from "../models/UserProgress.js";

const DEFAULT_LIMIT = 20;

const sumMapValues = (value) => {
  if (!value || typeof value !== "object") return 0;
  return Object.values(value).reduce(
    (total, entry) => total + (typeof entry === "number" ? entry : 0),
    0
  );
};

const buildAvatarUrl = (user) => user.avatar || "";

const buildDisplayName = (user) =>
  [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
  user.email ||
  "Learner";

export const getPublicLeaderboard = async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 100)
        : DEFAULT_LIMIT;

    const progressRows = await UserProgress.find({})
      .populate("userId", "firstName lastName email avatar role")
      .lean();

    const leaderboardRows = progressRows
      .filter((row) => row.userId && row.userId.role !== "admin")
      .map((row) => {
        const courseXp = sumMapValues(row.courseXP);
        const exerciseXp = sumMapValues(row.exerciseXP);
        const totalXp = courseXp + exerciseXp;

        return {
          userId: row.userId._id.toString(),
          name: buildDisplayName(row.userId),
          avatar: buildAvatarUrl(row.userId),
          totalXp,
          courseXp,
          exerciseXp,
          completedExercises: Array.isArray(row.completedExercises)
            ? row.completedExercises.length
            : 0,
          updatedAt: row.updatedAt,
        };
      })
      .sort((a, b) => {
        if (b.totalXp !== a.totalXp) return b.totalXp - a.totalXp;
        if (b.completedExercises !== a.completedExercises) {
          return b.completedExercises - a.completedExercises;
        }
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    let currentUser = null;

    if (req.user) {
      const userId = req.user._id.toString();
      currentUser = leaderboardRows.find((entry) => entry.userId === userId) || null;

      if (!currentUser && req.user.role !== "admin") {
        const fallbackUser = await User.findById(req.user._id)
          .select("firstName lastName email avatar")
          .lean();

        if (fallbackUser) {
          currentUser = {
            rank: leaderboardRows.length + 1,
            userId,
            name: buildDisplayName(fallbackUser),
            avatar: buildAvatarUrl(fallbackUser),
            totalXp: 0,
            courseXp: 0,
            exerciseXp: 0,
            completedExercises: 0,
          };
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        entries: leaderboardRows.slice(0, limit),
        currentUser,
        totalParticipants: leaderboardRows.length,
      },
    });
  } catch (error) {
    console.error("getPublicLeaderboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard.",
      error: error.message,
    });
  }
};
