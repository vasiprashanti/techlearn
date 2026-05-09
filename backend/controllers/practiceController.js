import mongoose from "mongoose";
import PracticeSubmission from "../models/PracticeSubmission.js";
import PracticeStreak from "../models/PracticeStreak.js";
import {
  PRACTICE_TOTALS,
  PRACTICE_TRACKS,
  normalizePracticeTrack,
  isPracticeQuestionId,
} from "../utils/practiceCatalog.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const toDateKey = (date = new Date()) =>
  new Date(date).toISOString().split("T")[0];

const diffDays = (fromKey, toKey) => {
  if (!fromKey || !toKey) return null;
  const [fromYear, fromMonth, fromDay] = fromKey.split("-").map(Number);
  const [toYear, toMonth, toDay] = toKey.split("-").map(Number);
  const fromUtc = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const toUtc = Date.UTC(toYear, toMonth - 1, toDay);
  return Math.round((toUtc - fromUtc) / DAY_MS);
};

const upsertPracticeStreak = async ({ userId, solvedAt }) => {
  const todayKey = toDateKey(solvedAt);
  let streak = await PracticeStreak.findOne({ userId });

  if (!streak) {
    streak = new PracticeStreak({
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastSolvedAt: null,
      lastSolvedDate: "",
    });
  }

  if (streak.lastSolvedDate === todayKey) {
    streak.lastSolvedAt = solvedAt;
  } else {
    let nextStreak = 1;
    if (streak.lastSolvedDate) {
      const daysApart = diffDays(streak.lastSolvedDate, todayKey);
      if (daysApart === 1) {
        nextStreak = (streak.currentStreak || 0) + 1;
      }
    }

    streak.currentStreak = nextStreak;
    streak.longestStreak = Math.max(streak.longestStreak || 0, nextStreak);
    streak.lastSolvedAt = solvedAt;
    streak.lastSolvedDate = todayKey;
  }

  await streak.save();
  return streak;
};

export const recordPracticeSubmission = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { questionId, track, isCorrect } = req.body || {};

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    if (!questionId || typeof questionId !== "string") {
      return res.status(400).json({
        success: false,
        message: "questionId is required and must be a string.",
      });
    }

    if (typeof isCorrect !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isCorrect is required and must be boolean.",
      });
    }

    const normalizedTrack = normalizePracticeTrack(track);
    if (!normalizedTrack) {
      return res.status(400).json({
        success: false,
        message: `Invalid track. Allowed: ${PRACTICE_TRACKS.join(", ")}.`,
      });
    }

    const trimmedQuestionId = questionId.trim();
    if (!isPracticeQuestionId(normalizedTrack, trimmedQuestionId)) {
      return res.status(400).json({
        success: false,
        message: "questionId does not belong to the selected track.",
      });
    }

    const existing = await PracticeSubmission.findOne({
      userId,
      questionId: trimmedQuestionId,
    }).lean();

    const resolvedCorrect = Boolean(existing?.isCorrect) || Boolean(isCorrect);
    const now = new Date();

    const submission = await PracticeSubmission.findOneAndUpdate(
      { userId, questionId: trimmedQuestionId },
      {
        $set: {
          track: normalizedTrack,
          isCorrect: resolvedCorrect,
          attemptedAt: now,
        },
        $setOnInsert: {
          userId,
          questionId: trimmedQuestionId,
        },
      },
      { upsert: true, new: true }
    ).lean();

    let streakPayload = null;
    if (resolvedCorrect) {
      const streak = await upsertPracticeStreak({ userId, solvedAt: now });
      streakPayload = {
        current: streak.currentStreak || 0,
        longest: streak.longestStreak || 0,
        lastSolvedAt: streak.lastSolvedAt,
        lastActivityDate: streak.lastSolvedDate || null,
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        submission,
        streak: streakPayload,
      },
    });
  } catch (error) {
    console.error("recordPracticeSubmission error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to record practice submission.",
    });
  }
};

export const getPracticeStats = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const [trackAgg, streak] = await Promise.all([
      PracticeSubmission.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: "$track",
            attempted: { $sum: 1 },
            correct: {
              $sum: {
                $cond: [{ $eq: ["$isCorrect", true] }, 1, 0],
              },
            },
          },
        },
      ]),
      PracticeStreak.findOne({ userId }).lean(),
    ]);

    const trackStatsMap = Object.fromEntries(
      PRACTICE_TRACKS.map((track) => [
        track,
        {
          track,
          total: PRACTICE_TOTALS[track] || 0,
          attempted: 0,
          correct: 0,
          accuracy: 0,
        },
      ])
    );

    trackAgg.forEach((entry) => {
      const trackName = entry._id;
      if (!trackStatsMap[trackName]) return;
      const attempted = entry.attempted || 0;
      const correct = entry.correct || 0;
      trackStatsMap[trackName].attempted = attempted;
      trackStatsMap[trackName].correct = correct;
      trackStatsMap[trackName].accuracy = attempted
        ? Math.round((correct / attempted) * 1000) / 10
        : 0;
    });

    const streakPayload = {
      current: streak?.currentStreak || 0,
      longest: streak?.longestStreak || 0,
      lastSolvedAt: streak?.lastSolvedAt || null,
      lastActivityDate: streak?.lastSolvedDate || null,
    };

    return res.status(200).json({
      success: true,
      data: {
        streak: streakPayload,
        tracks: PRACTICE_TRACKS.map((track) => trackStatsMap[track]),
      },
    });
  } catch (error) {
    console.error("getPracticeStats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch practice stats.",
    });
  }
};
