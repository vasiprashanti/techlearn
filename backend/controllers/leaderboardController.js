import User from "../models/User.js";
import UserProgress from "../models/UserProgress.js";
import PracticeSubmission from "../models/PracticeSubmission.js";
import StudentMcqSubmission from "../models/StudentMcqSubmission.js";
import { TASK_XP } from "../services/xpService.js";

const DEFAULT_LIMIT = 20;
const MCQ_XP_VALUE = TASK_XP.MCQ || 10;

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
      .populate("userId", "firstName lastName email avatar role batchId programSelection")
      .lean();

    const isProjectUser = req.user && req.user.programSelection === "Full Stack Project Program";

    let filteredRows = progressRows.filter((row) => row.userId && row.userId.role !== "admin");

    if (isProjectUser) {
      const userBatchIdStr = req.user.batchId ? req.user.batchId.toString() : null;
      filteredRows = filteredRows.filter((row) => {
        const rowBatchIdStr = row.userId.batchId ? row.userId.batchId.toString() : null;
        return rowBatchIdStr && rowBatchIdStr === userBatchIdStr;
      });
    }

    const learnerRows = filteredRows;
    const learnerIds = learnerRows.map((row) => row.userId._id);
    const learnerEmails = learnerRows
      .map((row) => String(row.userId.email || "").trim().toLowerCase())
      .filter(Boolean);

    const [practiceSolvedCounts, collegeMcqSubmissions] = await Promise.all([
      learnerIds.length
        ? PracticeSubmission.aggregate([
            { $match: { userId: { $in: learnerIds }, isCorrect: true } },
            { $group: { _id: "$userId", solvedCount: { $sum: 1 } } },
          ])
        : [],
      learnerEmails.length
        ? StudentMcqSubmission.find({ studentEmail: { $in: learnerEmails } })
            .select("studentEmail answers")
            .lean()
        : [],
    ]);

    const practiceSolvedByUserId = new Map(
      practiceSolvedCounts.map((entry) => [String(entry._id), entry.solvedCount])
    );
    const collegeMcqSolvedByEmail = new Map();
    const collegeMcqXpByEmail = new Map();
    collegeMcqSubmissions.forEach((submission) => {
      const email = String(submission.studentEmail || "").trim().toLowerCase();
      const correctAnswers = (submission.answers || []).filter((answer) => answer.isCorrect).length;
      collegeMcqSolvedByEmail.set(email, (collegeMcqSolvedByEmail.get(email) || 0) + correctAnswers);
      collegeMcqXpByEmail.set(email, (collegeMcqXpByEmail.get(email) || 0) + correctAnswers * MCQ_XP_VALUE);
    });

    const leaderboardRows = learnerRows
      .map((row) => {
        const courseXp = isProjectUser ? 0 : sumMapValues(row.courseXP);
        const exerciseXp = isProjectUser ? 0 : sumMapValues(row.exerciseXP);
        const projectXp = sumMapValues(row.projectXP);
        const email = String(row.userId.email || "").trim().toLowerCase();
        const assessmentXp = isProjectUser ? 0 : (collegeMcqXpByEmail.get(email) || 0);
        const totalXp = courseXp + exerciseXp + projectXp + assessmentXp;

        const completedExercises = Array.isArray(row.completedExercises)
          ? row.completedExercises.length
          : 0;

        const solvedCount = (
          (practiceSolvedByUserId.get(String(row.userId._id)) || 0) +
          (collegeMcqSolvedByEmail.get(email) || 0) ||
          completedExercises
        );

        return {
          userId: row.userId._id.toString(),
          name: buildDisplayName(row.userId),
          avatar: buildAvatarUrl(row.userId),
          totalXp,
          courseXp,
          exerciseXp,
          projectXp,
          assessmentXp,
          completedExercises,
          solvedCount,
          updatedAt: row.updatedAt,
        };
      })
      .sort((a, b) => {
        if (b.totalXp !== a.totalXp) return b.totalXp - a.totalXp;
        if (b.solvedCount !== a.solvedCount) {
          return b.solvedCount - a.solvedCount;
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
            projectXp: 0,
            assessmentXp: 0,
            completedExercises: 0,
            solvedCount: 0,
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
