import CodingRound from "../models/CodingRound.js";
import {
  DAILY_CHALLENGE_RULES,
  getAttemptTimeRemainingSeconds,
  getDailyChallengeAttempt,
  resolveDailyChallengeContext,
  resolveDailyChallengeParticipant,
  upsertDailyChallengeRound,
} from "../utils/dailyChallengeUtils.js";

const buildChallengeResponse = ({ codingRound, batch, question, dayNumber, attempt = null }) => ({
  id: codingRound._id,
  linkId: codingRound.linkId,
  title: codingRound.title,
  trackType: codingRound.trackType,
  challengeType: codingRound.challengeType,
  dayNumber,
  batchId: batch?._id || codingRound.batchId,
  batchName: batch?.name || codingRound.college || "",
  durationMinutes: codingRound.duration,
  questionId: question?._id || codingRound.questionId,
  questionTitle: question?.title || codingRound.problems?.[0]?.problemTitle || "",
  instructions: DAILY_CHALLENGE_RULES,
  attempt: attempt
    ? {
        id: attempt._id,
        status: attempt.status,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        secondsRemaining: getAttemptTimeRemainingSeconds(attempt),
      }
    : null,
  routes: {
    entry: `/daily-challenge/${codingRound.linkId}`,
    instructions: `/daily-challenge/${codingRound.linkId}/instructions`,
    test: `/daily-challenge/${codingRound.linkId}/test`,
    result: `/daily-challenge/${codingRound.linkId}/result`,
  },
});

export const getActiveDailyChallenge = async (req, res) => {
  try {
    const context = await resolveDailyChallengeContext({
      user: req.user,
      email: req.query.email,
      trackType: req.query.trackType,
    });

    const codingRound = await upsertDailyChallengeRound(context);
    const attempt =
      context.studentEmail && context.student
        ? await getDailyChallengeAttempt({
            codingRoundId: codingRound._id,
            studentEmail: context.studentEmail,
          })
        : null;

    return res.status(200).json({
      success: true,
      data: buildChallengeResponse({
        codingRound,
        batch: context.batch,
        question: context.question,
        dayNumber: context.dayNumber,
        attempt,
      }),
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode === 500) {
      console.error("getActiveDailyChallenge error:", error);
    }
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to fetch the active Daily Challenge.",
    });
  }
};

export const getDailyChallengeByLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const codingRound = await CodingRound.findOne({
      linkId,
      challengeType: "daily_challenge",
      isActive: true,
    }).lean();

    if (!codingRound) {
      return res.status(404).json({
        success: false,
        message: "Daily Challenge not found.",
      });
    }

    let attempt = null;
    if (req.query.email) {
      const participant = await resolveDailyChallengeParticipant({
        codingRound,
        user: req.user,
        email: req.query.email,
      });

      attempt = await getDailyChallengeAttempt({
        codingRoundId: codingRound._id,
        studentEmail: participant.studentEmail,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...codingRound,
        durationMinutes: codingRound.duration,
        instructions: DAILY_CHALLENGE_RULES,
        attempt: attempt
          ? {
              id: attempt._id,
              status: attempt.status,
              startedAt: attempt.startedAt,
              expiresAt: attempt.expiresAt,
              secondsRemaining: getAttemptTimeRemainingSeconds(attempt),
            }
          : null,
      },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode === 500) {
      console.error("getDailyChallengeByLink error:", error);
    }
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to fetch Daily Challenge details.",
    });
  }
};

export const syncDailyChallengeForToday = async (req, res) => {
  try {
    const context = await resolveDailyChallengeContext({
      user: req.user,
      email: req.body?.email || req.query?.email,
      trackType: req.body?.trackType || req.query?.trackType,
    });

    const codingRound = await upsertDailyChallengeRound(context);
    return res.status(200).json({
      success: true,
      data: buildChallengeResponse({
        codingRound,
        batch: context.batch,
        question: context.question,
        dayNumber: context.dayNumber,
      }),
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode === 500) {
      console.error("syncDailyChallengeForToday error:", error);
    }
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to sync Daily Challenge.",
    });
  }
};
