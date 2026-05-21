import Question from "../models/Questions.js";
import PracticeSubmission from "../models/PracticeSubmission.js";
import mongoose from "mongoose";
import { normalizeCategoryType } from "../utils/questionBank.js";

const TRACKS = ["DSA", "Core CS", "SQL", "Aptitude"];

const normalizePracticeTrack = (value = "") => {
  const normalized = String(value).trim().toLowerCase();
  if (normalized.includes("dsa") || normalized.includes("data structures")) return "DSA";
  if (normalized.includes("core") || normalized.includes("cs")) return "Core CS";
  if (normalized.includes("sql") || normalized.includes("database")) return "SQL";
  if (normalized.includes("aptitude")) return "Aptitude";
  return "";
};

const toDayKey = (date) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const calculateStreak = (submissions) => {
  const days = [...new Set(submissions.map((entry) => toDayKey(entry.submittedAt)).filter(Boolean))].sort().reverse();
  if (!days.length) return { currentStreak: 0, lastActivityDate: null };

  let cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  const todayKey = cursor.toISOString().slice(0, 10);

  const yesterday = new Date(cursor);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  if (days[0] !== todayKey && days[0] !== yesterdayKey) {
    return { currentStreak: 0, lastActivityDate: days[0] };
  }

  let streak = 0;
  const daySet = new Set(days);
  if (days[0] === yesterdayKey) cursor = yesterday;

  while (daySet.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return { currentStreak: streak, lastActivityDate: days[0] };
};

const formatQuestion = (question) => {
  const category = question.categoryId && typeof question.categoryId === "object" ? question.categoryId : null;
  const categoryType = normalizeCategoryType(question.categoryType || category?.categoryType);
  if (categoryType && categoryType !== "Coding") return null;

  const content = question.content || {};
  const track = normalizePracticeTrack(category?.title || question.categoryTitle || question.trackType);
  if (!track) return null;

  return {
    id: String(question._id),
    title: question.title,
    subtitle: question.tags?.[0] || category?.title || question.categoryTitle || question.trackType || track,
    difficulty: question.difficulty || "Easy",
    topic: track,
    categoryType: categoryType || "Coding",
    description: question.description || "",
    inputFormat: question.inputFormat || "",
    outputFormat: question.outputFormat || "",
    visibleTestCases: content.visibleTestCases?.length ? content.visibleTestCases : question.visibleTestCases || [],
    hiddenTestCases: content.hiddenTestCases?.length ? content.hiddenTestCases : question.hiddenTestCases || [],
    editorial: question.editorial || content.solutionNotes || "",
    solutionCode: question.solutionCode || "",
  };
};

export const listPracticeQuestions = async (req, res) => {
  try {
    const requestedTrack = normalizePracticeTrack(req.query.track);
    const query = {
      status: "Active",
      isActive: { $ne: false },
      $or: [{ categoryType: "Coding" }, { categoryType: { $exists: false } }, { categoryType: null }],
    };

    const questions = await Question.find(query)
      .populate("categoryId", "title slug categoryType")
      .sort({ createdAt: -1 })
      .lean();
    const data = questions
      .map(formatQuestion)
      .filter(Boolean)
      .filter((question) => !requestedTrack || question.topic === requestedTrack);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("listPracticeQuestions error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch practice questions." });
  }
};

export const recordPracticeSubmission = async (req, res) => {
  try {
    const track = normalizePracticeTrack(req.body.track);
    const questionIdRaw = String(req.body.questionId || "").trim();

    if (!questionIdRaw) {
      return res.status(400).json({ success: false, message: "questionId is required." });
    }

    if (!TRACKS.includes(track)) {
      return res.status(400).json({ success: false, message: "track must be one of DSA, Core CS, SQL, or Aptitude." });
    }

    let canonicalQuestion = null;
    if (mongoose.Types.ObjectId.isValid(questionIdRaw)) {
      canonicalQuestion = await Question.findById(questionIdRaw)
        .select("_id categoryId categoryType")
        .lean();
    }

    const selectedAnswer = String(req.body.selectedAnswer || "").trim().toUpperCase();
    const normalizedCategoryType = normalizeCategoryType(canonicalQuestion?.categoryType || req.body.categoryType);
    const isMcqSubmission = normalizedCategoryType === "MCQ" && ["A", "B", "C", "D"].includes(selectedAnswer);

    const isCorrect = Boolean(req.body.isCorrect);
    const score = Number.isFinite(Number(req.body.score)) ? Number(req.body.score) : (isCorrect ? 1 : 0);
    const accuracy = Number.isFinite(Number(req.body.accuracy)) ? Number(req.body.accuracy) : (isCorrect ? 100 : 0);

    const submission = await PracticeSubmission.create({
      userId: req.user._id,
      questionId: questionIdRaw,
      questionBankId: canonicalQuestion?._id || null,
      categoryId: canonicalQuestion?.categoryId || null,
      categoryType: normalizedCategoryType || null,
      track,
      source: req.body.source || "practice",
      selectedAnswer: isMcqSubmission ? selectedAnswer : "",
      isCorrect,
      score,
      accuracy,
      submittedAt: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
    });

    return res.status(201).json({ success: true, data: submission });
  } catch (error) {
    console.error("recordPracticeSubmission error:", error);
    return res.status(500).json({ success: false, message: "Failed to record practice submission." });
  }
};

export const getPracticeStats = async (req, res) => {
  try {
    const [questions, submissions] = await Promise.all([
      Question.find({
        status: "Active",
        isActive: { $ne: false },
        $or: [{ categoryType: "Coding" }, { categoryType: { $exists: false } }, { categoryType: null }],
      })
        .select("trackType categoryTitle categoryType categoryId")
        .populate("categoryId", "title slug categoryType")
        .lean(),
      PracticeSubmission.find({ userId: req.user._id }).sort({ submittedAt: -1 }).lean(),
    ]);

    const stats = Object.fromEntries(
      TRACKS.map((track) => [
        track,
        {
          track,
          total: 0,
          attempted: 0,
          correct: 0,
          accuracy: 0,
        },
      ])
    );

    for (const question of questions) {
      const track = normalizePracticeTrack(question.categoryId?.title || question.categoryTitle || question.trackType);
      if (stats[track]) stats[track].total += 1;
    }

    const attemptedByTrack = Object.fromEntries(TRACKS.map((track) => [track, new Set()]));
    const correctByTrack = Object.fromEntries(TRACKS.map((track) => [track, new Set()]));

    for (const submission of submissions) {
      if (!stats[submission.track]) continue;
      attemptedByTrack[submission.track].add(submission.questionId);
      if (submission.isCorrect) correctByTrack[submission.track].add(submission.questionId);
    }

    for (const track of TRACKS) {
      stats[track].attempted = attemptedByTrack[track].size;
      stats[track].correct = correctByTrack[track].size;
      stats[track].accuracy =
        stats[track].attempted > 0
          ? Number(((stats[track].correct / stats[track].attempted) * 100).toFixed(1))
          : 0;
    }

    const streak = calculateStreak(submissions);

    return res.status(200).json({
      success: true,
      data: {
        streak: streak.currentStreak,
        lastActivityDate: streak.lastActivityDate,
        tracks: TRACKS.map((track) => stats[track]),
      },
    });
  } catch (error) {
    console.error("getPracticeStats error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch practice stats." });
  }
};
