import Batch, { BATCH_STATUS } from "../../models/Batch.js";
import CodingRound from "../../models/CodingRound.js";
import College from "../../models/College.js";
import DailyChallengeAttempt from "../../models/DailyChallengeAttempt.js";
import Question from "../../models/Questions.js";
import QuestionCategory from "../../models/QuestionCategory.js";
import Submission from "../../models/Submission.js";
import Student from "../../models/Student.js";
import StudentCodingSubmission from "../../models/StudentCodingSubmission.js";
import TrackTemplate from "../../models/TrackTemplate.js";
import User from "../../models/User.js";
import { resolveDailyChallengeContext, upsertDailyChallengeRound } from "../../utils/dailyChallengeUtils.js";

const E2E_SETUP_KEY = process.env.E2E_SETUP_KEY || "tls-e2e-judge0-2026-07-09";
const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getTodayWindow = () => {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const expiryDate = new Date(startDate);
  expiryDate.setDate(expiryDate.getDate() + 30);
  expiryDate.setHours(23, 59, 59, 999);
  return { startDate, expiryDate };
};

const questionPayloads = [
  {
    title: "E2E Python Easy Sum",
    description: "Read two integers and print their sum.",
    difficulty: "Easy",
    inputFormat: "Two space-separated integers.",
    outputFormat: "One integer.",
    visibleTestCases: [{ input: "2 3", output: "5" }],
    hiddenTestCases: [{ input: "10 15", output: "25" }],
  },
  {
    title: "E2E Java Medium Maximum",
    description: "Read N integers and print the largest value.",
    difficulty: "Medium",
    inputFormat: "First line N, second line N integers.",
    outputFormat: "One integer.",
    visibleTestCases: [{ input: "5\n1 9 3 4 2", output: "9" }],
    hiddenTestCases: [{ input: "4\n-5 -1 -9 -3", output: "-1" }],
  },
  {
    title: "E2E Hard Unique Count",
    description: "Read N integers and print the number of unique values.",
    difficulty: "Hard",
    inputFormat: "First line N, second line N integers.",
    outputFormat: "One integer.",
    visibleTestCases: [{ input: "6\n1 2 2 3 3 3", output: "3" }],
    hiddenTestCases: [{ input: "5\n7 7 7 8 9", output: "3" }],
  },
  {
    title: "E2E SQL Sum Query",
    description: "Write a SQL query that returns the value 12.",
    difficulty: "Easy",
    inputFormat: "No input.",
    outputFormat: "One numeric value.",
    visibleTestCases: [{ input: "", output: "12" }],
    hiddenTestCases: [{ input: "", output: "12" }],
    referenceLanguage: "sql",
  },
];

const upsertQuestion = async ({ category, payload }) => {
  const question = await Question.findOneAndUpdate(
    { title: payload.title, categoryId: category._id },
    {
      $set: {
        ...payload,
        categoryId: category._id,
        categoryType: "Coding",
        categorySlug: category.slug,
        categoryTitle: category.title,
        status: "Active",
        isActive: true,
        trackType: "DSA",
        tags: ["E2E", "JUDGE0"],
        referenceLanguage: payload.referenceLanguage || "python",
        content: {
          visibleTestCases: payload.visibleTestCases,
          hiddenTestCases: payload.hiddenTestCases,
          timeLimit: 1000,
          memoryLimit: 256,
          constraints: "",
          solutionNotes: "",
        },
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return question;
};

const assertE2ESetupKey = (req) => {
  const suppliedKey = req.get("x-e2e-setup-key") || req.query?.setupKey || req.body?.setupKey;
  if (suppliedKey !== E2E_SETUP_KEY) {
    const error = new Error("Invalid E2E setup key.");
    error.statusCode = 403;
    throw error;
  }
};

const getMapValue = (value, key) => {
  if (!value) return undefined;
  if (value instanceof Map) return value.get(String(key));
  return value[String(key)];
};

const normalizeMap = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  if (typeof value === "object") return value;
  return {};
};

const clearPreviousE2ESubmissions = async ({ codingRoundId, studentEmail }) => {
  const attempt = await DailyChallengeAttempt.findOne({ codingRoundId, studentEmail }).lean();
  const attemptId = attempt?._id || null;
  await Promise.all([
    DailyChallengeAttempt.deleteMany({ codingRoundId, studentEmail }),
    StudentCodingSubmission.deleteMany({ codingRoundId, studentEmail }),
    attemptId ? Submission.deleteMany({ attemptId }) : Promise.resolve(),
  ]);
};

const runSeedDailyChallengeE2E = async (req, res, { skipEnvGuard = false, resetAttempt = true } = {}) => {
  if (!skipEnvGuard && process.env.NODE_ENV === "production" && process.env.ENABLE_ADMIN_TESTING_ROUTES !== "true") {
    return res.status(404).json({ success: false, message: "Testing routes are disabled." });
  }

  try {
    const email = String(req.body?.email || "gillsdelhi@gmail.com").trim().toLowerCase();
    const studentName = String(req.body?.studentName || "Judge0 E2E Student").trim();
    const batchName = String(req.body?.batchName || "TLS E2E Judge0 Batch").trim();
    const collegeName = String(req.body?.collegeName || "TLS E2E Test College").trim();

    const college = await College.findOneAndUpdate(
      { name: { $regex: new RegExp(`^${escapeRegex(collegeName)}$`, "i") } },
      {
        $setOnInsert: {
          name: collegeName,
          code: "TLSE2E",
          city: "Test",
          status: "Active",
          contactPerson: "TechLearn QA",
          contactEmail: "test@gmail.com",
        },
      },
      { new: true, upsert: true }
    );

    const { startDate, expiryDate } = getTodayWindow();
    const batch = await Batch.findOneAndUpdate(
      { collegeId: college._id, name: batchName },
      {
        $set: {
          collegeId: college._id,
          name: batchName,
          startDate,
          expiryDate,
          releaseTime: "00:00",
          status: BATCH_STATUS.ACTIVE,
          assignedTrack: "DSA",
          programSelection: "Placement Sprint",
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const user = await User.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          firstName: studentName.split(" ")[0] || "Judge0",
          lastName: studentName.split(" ").slice(1).join(" ") || "E2E",
          email,
          role: "user",
          authProvider: "local",
          programSelection: "Placement Sprint",
        },
        $set: {
          batchId: batch._id,
          collegeName,
        },
      },
      { new: true, upsert: true }
    );

    const student = await Student.findOneAndUpdate(
      { email },
      {
        $set: {
          userId: user._id,
          collegeId: college._id,
          batchId: batch._id,
          name: studentName,
          email,
          primaryTrack: "DSA",
          programSelection: "Placement Sprint",
          status: "Active",
        },
        $setOnInsert: {
          rollNo: `E2E-${Date.now()}`,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const category = await QuestionCategory.findOneAndUpdate(
      { slug: "judge0-e2e-dsa" },
      {
        $set: {
          slug: "judge0-e2e-dsa",
          title: "JUDGE0 E2E DSA",
          subtitle: "Temporary QA category for Judge0 assessment testing",
          icon: "code",
          status: "Active",
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const questions = [];
    for (const payload of questionPayloads) {
      questions.push(await upsertQuestion({ category, payload }));
    }

    const trackTemplate = await TrackTemplate.findOneAndUpdate(
      { name: "JUDGE0_E2E_DAILY_CHALLENGE", trackType: "Daily Challenge" },
      {
        $set: {
          name: "JUDGE0_E2E_DAILY_CHALLENGE",
          trackType: "Daily Challenge",
          description: "Temporary Judge0 E2E Daily Challenge template",
          category: "DSA",
          batchId: batch._id,
          totalDays: 1,
          status: "Active",
          dayAssignments: [
            {
              dayNumber: 1,
              questionId: questions[0]._id,
              tasks: questions.map((question) => ({
                taskType: "Coding",
                questionId: question._id,
                batchId: batch._id,
                xpValue: 20,
                status: "Published",
              })),
            },
          ],
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    batch.assignedDailyChallengeTrack = trackTemplate._id;
    batch.assignedDailyChallengeTrackAt = startDate;
    batch.assignedTrackTemplate = trackTemplate._id;
    batch.assignedTrackTemplateAt = startDate;
    batch.assignedTrackTemplateIds = [trackTemplate._id];
    batch.assignedTrack = trackTemplate.name;
    await batch.save();

    const context = await resolveDailyChallengeContext({ email });
    const codingRound = await upsertDailyChallengeRound(context);
    if (resetAttempt) {
      await clearPreviousE2ESubmissions({ codingRoundId: codingRound._id, studentEmail: email });
    }

    return res.status(200).json({
      success: true,
      message: "Judge0 E2E Daily Challenge test setup is ready.",
      data: {
        student: { id: student._id, email: student.email, name: student.name },
        batch: { id: batch._id, name: batch.name },
        category: { id: category._id, title: category.title },
        trackTemplate: { id: trackTemplate._id, name: trackTemplate.name },
        questionIds: questions.map((question) => ({
          id: question._id,
          qid: question.qid,
          title: question.title,
          difficulty: question.difficulty,
        })),
        dailyChallenge: {
          id: codingRound._id,
          linkId: codingRound.linkId,
          title: codingRound.title,
          dayNumber: codingRound.dayNumber,
          url: `/daily-challenge/${codingRound.linkId}`,
        },
      },
    });
  } catch (error) {
    console.error("seedDailyChallengeE2E error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to seed Judge0 E2E Daily Challenge setup.",
    });
  }
};

export const seedDailyChallengeE2E = async (req, res) =>
  runSeedDailyChallengeE2E(req, res);

export const seedDailyChallengeE2ESelfServe = async (req, res) => {
  try {
    assertE2ESetupKey(req);
    return runSeedDailyChallengeE2E(req, res, { skipEnvGuard: true, resetAttempt: true });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to prepare E2E setup.",
    });
  }
};

export const getDailyChallengeE2EReport = async (req, res) => {
  try {
    assertE2ESetupKey(req);
    const email = String(req.query?.email || req.body?.email || "gillsdelhi@gmail.com").trim().toLowerCase();
    const batch = await Batch.findOne({ name: "TLS E2E Judge0 Batch" }).lean();
    const codingRound = await CodingRound.findOne({
      ...(batch?._id ? { batchId: batch._id } : {}),
      challengeType: "daily_challenge",
      isActive: true,
    })
      .sort({ updatedAt: -1 })
      .lean();

    const student = await Student.findOne({ email }).lean();
    const attempt = codingRound
      ? await DailyChallengeAttempt.findOne({ codingRoundId: codingRound._id, studentEmail: email }).lean()
      : null;
    const codingSubmission = codingRound
      ? await StudentCodingSubmission.findOne({ codingRoundId: codingRound._id, studentEmail: email }).lean()
      : null;
    const submission = attempt
      ? await Submission.findOne({ attemptId: attempt._id }).lean()
      : null;

    const problems = (codingRound?.problems || []).map((problem, index) => ({
      index,
      title: problem.problemTitle,
      difficulty: problem.difficulty,
      submitted: Boolean(getMapValue(codingSubmission?.problemSubmitted, index)),
      score: Number(getMapValue(codingSubmission?.problemScores, index) || 0),
      runCount: Number(getMapValue(codingSubmission?.problemRuns, index) || 0),
      testCaseResults: getMapValue(codingSubmission?.problemTestCaseResults, index) || [],
    }));

    return res.status(200).json({
      success: true,
      data: {
        student: student ? { id: student._id, email: student.email, name: student.name, batchId: student.batchId } : null,
        codingRound: codingRound
          ? {
              id: codingRound._id,
              title: codingRound.title,
              linkId: codingRound.linkId,
              dayNumber: codingRound.dayNumber,
              problemCount: codingRound.problems?.length || 0,
            }
          : null,
        attempt: attempt
          ? {
              id: attempt._id,
              status: attempt.status,
              startedAt: attempt.startedAt,
              submittedAt: attempt.submittedAt,
              endedAt: attempt.endedAt,
              finalSubmissionId: attempt.finalSubmissionId,
            }
          : null,
        codingSubmission: codingSubmission
          ? {
              id: codingSubmission._id,
              totalScore: codingSubmission.totalScore,
              isRoundEnded: codingSubmission.isRoundEnded,
              problemScores: normalizeMap(codingSubmission.problemScores),
              problemRuns: normalizeMap(codingSubmission.problemRuns),
              problemSubmitted: normalizeMap(codingSubmission.problemSubmitted),
              lastSubmissionAt: codingSubmission.lastSubmissionAt,
            }
          : null,
        adminSubmission: submission
          ? {
              id: submission._id,
              status: submission.status,
              totalScore: submission.totalScore,
              xpEarned: submission.xpEarned,
              runCount: submission.runCount,
              executionTime: submission.executionTime,
              memoryUsed: submission.memoryUsed,
              submittedAt: submission.submittedAt,
              finalSubmissionResults: submission.finalSubmissionResults,
            }
          : null,
        problems,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch E2E report.",
    });
  }
};
