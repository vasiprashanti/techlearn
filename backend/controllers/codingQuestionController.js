import mongoose from "mongoose";
import Batch from "../models/Batch.js";
import CodingRound from "../models/CodingRound.js";
import Question from "../models/Questions.js";
import StudentCodingSubmission from "../models/StudentCodingSubmission.js";
import Track from "../models/Track.js";
import User from "../models/User.js";
import {
  mapQuestionToProblem,
  normalizeTrackType,
  resolveChallengeStudent,
} from "../utils/dailyChallengeUtils.js";

const parsePositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const resolveUserId = async ({ user, email, student }) => {
  if (user?._id) return user._id;
  if (student?.userId) return student.userId;

  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;

  const matchedUser = await User.findOne({ email: normalizedEmail }).select("_id").lean();
  return matchedUser?._id || null;
};

export const listCodingQuestions = async (req, res) => {
  try {
    const query = {
      status: "Active",
      categoryType: "coding",
    };

    if (req.query.categorySlug) {
      query.categorySlug = String(req.query.categorySlug);
    }

    if (req.query.categoryType) {
      query.categoryType = String(req.query.categoryType);
    }

    if (req.query.trackType) {
      query.trackType = String(req.query.trackType);
    }

    const questions = await Question.find(query)
      .select("title difficulty categorySlug categoryTitle trackType tags createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const data = questions.map((question) => ({
      id: question._id,
      title: question.title,
      difficulty: question.difficulty,
      categorySlug: question.categorySlug,
      categoryTitle: question.categoryTitle,
      trackType: question.trackType,
      tags: question.tags || [],
      created: question.createdAt?.toISOString?.().slice(0, 10) || "",
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("listCodingQuestions error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch coding questions." });
  }
};

export const getCodingQuestionDetail = async (req, res) => {
  try {
    const { questionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ success: false, message: "Invalid questionId." });
    }

    const question = await Question.findById(questionId).lean();
    if (!question || question.status === "Archived") {
      return res.status(404).json({ success: false, message: "Question not found." });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: question._id,
        title: question.title,
        description: question.description || "",
        difficulty: question.difficulty,
        categorySlug: question.categorySlug,
        categoryTitle: question.categoryTitle,
        categoryType: question.categoryType || "coding",
        trackType: question.trackType,
        tags: question.tags || [],
        inputFormat: question.inputFormat || "",
        outputFormat: question.outputFormat || "",
        constraints: question.constraints || "",
        timeLimit: question.timeLimit || 1,
        memoryLimit: question.memoryLimit || 256,
        starterCode: question.starterCode || "",
        visibleTestCases: question.visibleTestCases || [],
      },
    });
  } catch (error) {
    console.error("getCodingQuestionDetail error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch question details." });
  }
};

export const createCodingQuestionSession = async (req, res) => {
  try {
    const { questionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ success: false, message: "Invalid questionId." });
    }

    const email = String(req.body?.email || req.query?.email || req.user?.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required to start a coding session." });
    }

    const question = await Question.findById(questionId).lean();
    if (!question || question.status === "Archived") {
      return res.status(404).json({ success: false, message: "Question not found." });
    }

    const { student, studentEmail } = await resolveChallengeStudent({
      user: req.user,
      email,
      allowGuestFallback: true,
    });

    if (!student) {
      return res.status(403).json({ success: false, message: "Unable to map student for coding session." });
    }

    const batch = await Batch.findById(student.batchId).lean();
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found for coding session." });
    }

    const normalizedTrackType = normalizeTrackType(
      question.trackType || question.categoryTitle || student.primaryTrack || batch.assignedTrack || "DSA"
    );

    let track = await Track.findOne({ batchId: batch._id, trackType: normalizedTrackType }).lean();
    if (!track) {
      track = await Track.findOne({ batchId: batch._id }).lean();
    }

    if (!track) {
      return res.status(404).json({ success: false, message: "Track not found for coding session." });
    }

    const linkId = `qb-${question._id}`;
    const durationMinutes = parsePositiveNumber(question.timeLimit, 30);

    const roundPayload = {
      title: `${question.title} - Practice`,
      college: batch.name,
      batchId: batch._id,
      trackId: track._id,
      date: new Date(),
      duration: durationMinutes,
      problems: [mapQuestionToProblem(question)],
      linkId,
      isActive: true,
      challengeType: "track_question",
      questionId: question._id,
      categoryId: question.categoryId || null,
      categoryType: question.categoryType || "coding",
      trackType: normalizedTrackType,
    };

    const codingRound = await CodingRound.findOneAndUpdate(
      { linkId },
      { $set: roundPayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const userId = await resolveUserId({ user: req.user, email: studentEmail, student });

    await StudentCodingSubmission.findOneAndUpdate(
      { codingRoundId: codingRound._id, studentEmail },
      {
        $set: {
          studentId: student._id,
          userId,
          batchId: codingRound.batchId,
          trackId: codingRound.trackId,
          questionId: codingRound.questionId,
          studentEmail,
          startedAt: new Date(),
          attemptStatus: "started",
          isRoundEnded: false,
          autoEnded: false,
        },
        $setOnInsert: {
          problemScores: new Map(),
          totalScore: 0,
          submittedAt: new Date(),
          lastSubmissionAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      data: {
        codingRound,
        linkId: codingRound.linkId,
        studentEmail,
      },
    });
  } catch (error) {
    console.error("createCodingQuestionSession error:", error);
    return res.status(500).json({ success: false, message: "Failed to start coding session." });
  }
};
