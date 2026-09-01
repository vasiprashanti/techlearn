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

const buildAvatarUrl = (user) => user?.avatar || "";

const buildDisplayName = (user) => {
  const userFullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  if (userFullName) return userFullName;

  const emailUsername = String(user?.email || "").split("@")[0];
  if (user?.name && user.name !== emailUsername) return user.name;
  return emailUsername || "Learner";
};

const normalizeTokens = (user) => {
  const programSelection = String(user?.programSelection || "").trim();
  return [
    user?.targetRole,
    user?.otherTargetRole,
    user?.learningGoal,
    user?.placementCategory,
    ...(programSelection && programSelection !== "Placement Sprint" ? [programSelection] : []),
    ...(Array.isArray(user?.skills) ? user.skills : []),
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
};

const getPersonalizationScore = (candidate, viewer) => {
  const viewerTokens = normalizeTokens(viewer);
  if (!viewerTokens.length) return 0;
  const candidateTokens = normalizeTokens(candidate);
  return viewerTokens.reduce(
    (score, token) => score + (
      candidateTokens.some((value) => value === token || value.includes(token) || token.includes(value))
        ? 1
        : 0
    ),
    0
  );
};

const rankRows = (rows) => rows
  .sort((a, b) => {
    if (b.totalXp !== a.totalXp) return b.totalXp - a.totalXp;
    if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
    return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
  })
  .map((entry, index) => {
    const { profile, ...publicEntry } = entry;
    return { ...publicEntry, rank: index + 1 };
  });

export const getPublicLeaderboard = async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : DEFAULT_LIMIT;

    // Start with learner accounts and left-join progress. Previously this
    // endpoint started with UserProgress, so a new learner had no row and the
    // user-specific board rendered empty.
    const learners = await User.find({ role: { $ne: "admin" } })
      .select("firstName lastName name email avatar role programSelection targetRole otherTargetRole skills learningGoal placementCategory updatedAt")
      .lean();
    const learnerIds = learners.map((learner) => learner._id);
    const progressRows = learnerIds.length
      ? await UserProgress.find({ userId: { $in: learnerIds } }).lean()
      : [];
    const progressByUserId = new Map(progressRows.map((row) => [String(row.userId), row]));
    const learnerEmails = learners
      .map((learner) => String(learner.email || "").trim().toLowerCase())
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

    const allRows = learners.map((learner) => {
      const progress = progressByUserId.get(String(learner._id)) || {};
      const userProgram = learner.programSelection || "Placement Sprint";
      const isProjectOnly = userProgram === "Full Stack Project Program";
      const isPlacementOnly = userProgram === "Placement Sprint";
      const courseXp = isProjectOnly ? 0 : sumMapValues(progress.courseXP);
      const exerciseXp = isProjectOnly ? 0 : sumMapValues(progress.exerciseXP);
      const projectXp = isPlacementOnly ? 0 : sumMapValues(progress.projectXP);
      const email = String(learner.email || "").trim().toLowerCase();
      const assessmentXp = isProjectOnly ? 0 : (collegeMcqXpByEmail.get(email) || 0);
      const totalXp = courseXp + exerciseXp + projectXp + assessmentXp;
      const completedExercises = Array.isArray(progress.completedExercises)
        ? progress.completedExercises.length
        : 0;
      const solvedCount = (
        (practiceSolvedByUserId.get(String(learner._id)) || 0)
        + (collegeMcqSolvedByEmail.get(email) || 0)
      ) || completedExercises;

      return {
        userId: learner._id.toString(),
        name: buildDisplayName(learner),
        avatar: buildAvatarUrl(learner),
        totalXp,
        courseXp,
        exerciseXp,
        projectXp,
        assessmentXp,
        completedExercises,
        solvedCount,
        updatedAt: progress.updatedAt || learner.updatedAt,
        profile: learner,
      };
    });

    const matchingRows = req.user
      ? allRows.filter((entry) => getPersonalizationScore(entry.profile, req.user) > 0)
      : [];
    const personalized = matchingRows.length >= 3;
    const visibleRows = personalized ? matchingRows : allRows;
    const rankedRows = rankRows(visibleRows);

    let currentUser = null;
    if (req.user) {
      const userId = req.user._id.toString();
      currentUser = rankedRows.find((entry) => entry.userId === userId) || null;

      if (!currentUser && req.user.role !== "admin") {
        currentUser = {
          rank: rankedRows.length + 1,
          userId,
          name: buildDisplayName(req.user),
          avatar: buildAvatarUrl(req.user),
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

    const publicRows = rankedRows.length
      ? rankedRows
      : [{
          rank: 1,
          userId: "community-benchmark",
          name: "TechLearn Community",
          avatar: "",
          totalXp: 0,
          courseXp: 0,
          exerciseXp: 0,
          projectXp: 0,
          assessmentXp: 0,
          completedExercises: 0,
          solvedCount: 0,
        }];

    return res.status(200).json({
      success: true,
      data: {
        entries: publicRows.slice(0, limit),
        currentUser,
        totalParticipants: publicRows.length,
        globalParticipants: allRows.length,
        scope: personalized ? "personalized" : "global",
        personalized,
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
