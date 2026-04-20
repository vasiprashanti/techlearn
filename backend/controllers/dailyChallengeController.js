import CodingRound from "../models/CodingRound.js";
import Question from "../models/Questions.js";
import TrackTemplate from "../models/TrackTemplate.js";

const DAILY_CHALLENGE_RULES = {
  timerLimitMinutes: 30,
  runLimitPerQuestion: 5,
  submitLimitPerQuestion: 1,
  antiCheatRules: [
    "Do not switch tabs or windows during the challenge.",
    "Code runs are limited to five attempts per question.",
    "Only one final submission is allowed per question.",
    "The challenge is auto-submitted when the timer ends.",
  ],
};

const startOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const normalizeTrackType = (value = "") => {
  const normalized = String(value).trim().toLowerCase();
  if (normalized.includes("dsa")) return "DSA";
  if (normalized.includes("sql")) return "SQL";
  return "Core CS";
};

const mapQuestionToProblem = (question) => ({
  problemTitle: question.title,
  description: question.description || "Solve the assigned Daily Challenge question.",
  difficulty: question.difficulty || "Medium",
  inputDescription: question.inputFormat || "Refer to the prompt for input details.",
  outputDescription: question.outputFormat || "Return the expected output for the given input.",
  visibleTestCases: (question.visibleTestCases || []).map((testCase) => ({
    input: testCase.input || "",
    expectedOutput: testCase.output || "",
  })),
  hiddenTestCases: (question.hiddenTestCases || []).map((testCase) => ({
    input: testCase.input || "",
    expectedOutput: testCase.output || "",
  })),
});

const resolveActiveTemplate = async (trackType) => {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const match = {
    status: "Active",
    startDate: { $lte: todayEnd },
    endDate: { $gte: todayStart },
  };

  if (trackType) {
    match.category = new RegExp(`^${String(trackType).trim()}$`, "i");
  }

  const templates = await TrackTemplate.find(match)
    .sort({ startDate: 1, createdAt: -1 })
    .populate("batchId", "name")
    .populate("dayAssignments.questionId")
    .lean();

  for (const template of templates) {
    const templateStart = startOfDay(template.startDate);
    const dayNumber =
      Math.floor((todayStart.getTime() - templateStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const assignment = (template.dayAssignments || []).find(
      (item) => item.dayNumber === dayNumber && item.questionId
    );

    if (assignment?.questionId) {
      return { template, dayNumber, question: assignment.questionId };
    }
  }

  return null;
};

const upsertDailyChallengeRound = async ({ template, dayNumber, question }) => {
  const linkId = `daily-${template._id}-day-${dayNumber}`;
  const duration = Number(question.timeLimit || DAILY_CHALLENGE_RULES.timerLimitMinutes);
  const batchName = template.batchId?.name || "Daily Challenge";

  const roundPayload = {
    title: `Daily Challenge - ${template.name} - Day ${dayNumber}`,
    college: batchName,
    date: startOfDay(),
    duration: duration > 0 ? duration : DAILY_CHALLENGE_RULES.timerLimitMinutes,
    problems: [mapQuestionToProblem(question)],
    linkId,
    isActive: true,
    challengeType: "daily_challenge",
    trackTemplateId: template._id,
    questionId: question._id,
    dayNumber,
    trackType: normalizeTrackType(template.category),
  };

  return CodingRound.findOneAndUpdate(
    { linkId },
    { $set: roundPayload },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export const getActiveDailyChallenge = async (req, res) => {
  try {
    if (req.user?.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Daily Challenge user flow is not available for admin accounts.",
      });
    }

    const resolved = await resolveActiveTemplate(req.query.trackType);
    if (!resolved) {
      return res.status(404).json({
        success: false,
        message: "No active Daily Challenge is configured for today.",
      });
    }

    const codingRound = await upsertDailyChallengeRound(resolved);

    return res.status(200).json({
      success: true,
      data: {
        id: codingRound._id,
        linkId: codingRound.linkId,
        title: codingRound.title,
        trackType: codingRound.trackType,
        challengeType: codingRound.challengeType,
        dayNumber: codingRound.dayNumber,
        batchName: resolved.template.batchId?.name || "",
        durationMinutes: codingRound.duration,
        startDate: resolved.template.startDate,
        endDate: resolved.template.endDate,
        templateId: resolved.template._id,
        questionId: resolved.question._id,
        questionTitle: resolved.question.title,
        instructions: DAILY_CHALLENGE_RULES,
        routes: {
          entry: `/daily-challenge/${codingRound.linkId}`,
          instructions: `/daily-challenge/${codingRound.linkId}/instructions`,
          test: `/daily-challenge/${codingRound.linkId}/test`,
          result: `/daily-challenge/${codingRound.linkId}/result`,
        },
      },
    });
  } catch (error) {
    console.error("getActiveDailyChallenge error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch the active Daily Challenge.",
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

    return res.status(200).json({
      success: true,
      data: {
        ...codingRound,
        instructions: DAILY_CHALLENGE_RULES,
      },
    });
  } catch (error) {
    console.error("getDailyChallengeByLink error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Daily Challenge details.",
    });
  }
};

export const syncDailyChallengeForToday = async (req, res) => {
  try {
    const resolved = await resolveActiveTemplate(req.body?.trackType || req.query?.trackType);
    if (!resolved) {
      return res.status(404).json({
        success: false,
        message: "No active Daily Challenge is configured for today.",
      });
    }

    const codingRound = await upsertDailyChallengeRound(resolved);
    return res.status(200).json({
      success: true,
      data: codingRound,
    });
  } catch (error) {
    console.error("syncDailyChallengeForToday error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to sync Daily Challenge.",
    });
  }
};
