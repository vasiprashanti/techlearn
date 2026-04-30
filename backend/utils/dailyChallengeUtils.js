import Batch, { BATCH_STATUS } from "../models/Batch.js";
import CodingRound from "../models/CodingRound.js";
import College from "../models/College.js";
import Question from "../models/Questions.js";
import Student from "../models/Student.js";
import Track from "../models/Track.js";
import DailyChallengeAttempt from "../models/DailyChallengeAttempt.js";

export const DAILY_CHALLENGE_RULES = {
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

const DEMO_COLLEGE_NAME = "Public Demo College";
const DEMO_BATCH_NAME = "Public Demo Batch";

export const startOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

export const endOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

export const normalizeTrackType = (value = "") => {
  const normalized = String(value).trim().toLowerCase();
  if (normalized.includes("dsa")) return "DSA";
  if (normalized.includes("sql")) return "SQL";
  return "Core";
};

export const mapQuestionToProblem = (question) => ({
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

const combineDateAndTime = (date, timeString = "00:00") => {
  const baseDate = new Date(date);
  const [hours, minutes] = String(timeString || "00:00")
    .split(":")
    .map((value) => Number(value || 0));

  baseDate.setHours(hours || 0, minutes || 0, 0, 0);
  return baseDate;
};

const ensureDemoBatch = async () => {
  let batch = await Batch.findOne({ name: DEMO_BATCH_NAME });
  if (batch) {
    return batch;
  }

  let college = await College.findOne({ name: DEMO_COLLEGE_NAME });
  if (!college) {
    college = await College.create({
      name: DEMO_COLLEGE_NAME,
      code: "PUBLIC-DEMO",
      city: "Online",
      contactEmail: "demo@techlearn.local",
      contactPerson: "TechLearn Demo",
    });
  }

  batch = await Batch.create({
    collegeId: college._id,
    name: DEMO_BATCH_NAME,
    startDate: new Date("2026-01-01T00:00:00.000Z"),
    expiryDate: new Date("2030-12-31T00:00:00.000Z"),
    assignedTrack: "DSA",
    releaseTime: "00:00",
    status: BATCH_STATUS.ACTIVE,
    batchSize: null,
  });

  await Track.insertMany([
    { batchId: batch._id, trackType: "Core", durationDays: 1, orderedQuestionIds: [] },
    { batchId: batch._id, trackType: "DSA", durationDays: 1, orderedQuestionIds: [] },
    { batchId: batch._id, trackType: "SQL", durationDays: 1, orderedQuestionIds: [] },
  ]);

  return batch;
};

const ensureGuestStudent = async (email) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  let student = await Student.findOne({ email: normalizedEmail });
  if (student) {
    return student;
  }

  const demoBatch = await ensureDemoBatch();
  student = await Student.create({
    collegeId: demoBatch.collegeId,
    batchId: demoBatch._id,
    name: normalizedEmail.split("@")[0] || "Guest Student",
    email: normalizedEmail,
    rollNo: "",
    primaryTrack: "DSA",
    status: "Active",
    isGuest: true,
  });

  return student;
};

export const resolveChallengeStudent = async ({ user, email, allowGuestFallback = true }) => {
  const normalizedEmail = String(email || user?.email || "")
    .trim()
    .toLowerCase();

  if (user?.email && normalizedEmail && user.email.toLowerCase() !== normalizedEmail) {
    const error = new Error("Authenticated Daily Challenge access must use your own email.");
    error.statusCode = 403;
    throw error;
  }

  let student = null;
  if (normalizedEmail) {
    student = await Student.findOne({ email: normalizedEmail });
  }

  if (!student && allowGuestFallback && normalizedEmail) {
    student = await ensureGuestStudent(normalizedEmail);
  }

  return {
    student,
    studentEmail: normalizedEmail,
    accessSource: student?.isGuest ? "guest" : "student",
  };
};

export const resolveDailyChallengeContext = async ({ user, email, trackType }) => {
  let studentContext;
  if (user?.role === "admin") {
    const error = new Error("Daily Challenge user flow is not available for admin accounts.");
    error.statusCode = 403;
    throw error;
  }

  const normalizedTrackType = normalizeTrackType(trackType);

  if (user || email) {
    studentContext = await resolveChallengeStudent({ user, email, allowGuestFallback: true });
  } else {
    studentContext = { student: null, studentEmail: "", accessSource: "guest" };
  }

  const batch = studentContext.student
    ? await Batch.findById(studentContext.student.batchId)
    : await ensureDemoBatch();

  if (!batch) {
    const error = new Error("No batch is assigned for this Daily Challenge access.");
    error.statusCode = 404;
    throw error;
  }

  if (batch.status !== BATCH_STATUS.ACTIVE) {
    const error = new Error("This batch is not active for Daily Challenge access.");
    error.statusCode = 403;
    throw error;
  }

  const releaseStart = combineDateAndTime(batch.startDate, batch.releaseTime || "00:00");
  const batchEnd = endOfDay(batch.expiryDate);
  const now = new Date();

  if (now < releaseStart) {
    const error = new Error("Today’s Daily Challenge has not been released yet.");
    error.statusCode = 404;
    throw error;
  }

  if (now > batchEnd) {
    const error = new Error("This batch has expired for Daily Challenge access.");
    error.statusCode = 403;
    throw error;
  }

  const desiredTrackType = normalizeTrackType(
    normalizedTrackType || studentContext.student?.primaryTrack || batch.assignedTrack || "DSA"
  );

  let track = await Track.findOne({
    batchId: batch._id,
    trackType: desiredTrackType,
  })
    .populate("orderedQuestionIds")
    .lean();

  if (!track) {
    track = await Track.findOne({ batchId: batch._id })
      .populate("orderedQuestionIds")
      .lean();
  }

  if (!track) {
    const error = new Error("No track is configured for this batch.");
    error.statusCode = 404;
    throw error;
  }

  const dayNumber = Math.floor((now.getTime() - releaseStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const orderedQuestions = track.orderedQuestionIds || [];
  const resolvedQuestion = orderedQuestions[dayNumber - 1];
  const resolvedQuestionId = resolvedQuestion?._id || resolvedQuestion;

  if (!resolvedQuestionId) {
    const error = new Error("No Daily Challenge question is configured for today.");
    error.statusCode = 404;
    throw error;
  }

  const question =
    resolvedQuestion.hiddenTestCases && resolvedQuestion.visibleTestCases
      ? resolvedQuestion
      : await Question.findById(resolvedQuestionId).lean();

  if (!question) {
    const error = new Error("The configured Daily Challenge question could not be found.");
    error.statusCode = 404;
    throw error;
  }

  const durationMinutes = DAILY_CHALLENGE_RULES.timerLimitMinutes;

  return {
    student: studentContext.student,
    studentEmail: studentContext.studentEmail,
    accessSource: studentContext.accessSource,
    batch,
    track,
    question,
    dayNumber,
    durationMinutes,
  };
};

export const upsertDailyChallengeRound = async ({ batch, track, question, dayNumber, durationMinutes }) => {
  const linkId = `daily-${batch._id}-${String(track.trackType || "track").toLowerCase()}-day-${dayNumber}`;
  const roundPayload = {
    title: `Daily Challenge - ${batch.name} - ${track.trackType} - Day ${dayNumber}`,
    college: batch.name,
    batchId: batch._id,
    trackId: track._id,
    date: startOfDay(),
    duration: durationMinutes,
    problems: [mapQuestionToProblem(question)],
    linkId,
    isActive: true,
    challengeType: "daily_challenge",
    questionId: question._id,
    dayNumber,
    trackType: normalizeTrackType(track.trackType),
  };

  return CodingRound.findOneAndUpdate(
    { linkId },
    { $set: roundPayload },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export const resolveDailyChallengeParticipant = async ({ codingRound, user, email }) => {
  const { student, studentEmail, accessSource } = await resolveChallengeStudent({
    user,
    email,
    allowGuestFallback: true,
  });

  if (!student || !student.batchId) {
    const error = new Error("Student-to-batch mapping is required for Daily Challenge access.");
    error.statusCode = 403;
    throw error;
  }

  if (String(student.batchId) !== String(codingRound.batchId)) {
    const error = new Error("This Daily Challenge is not assigned to your batch.");
    error.statusCode = 403;
    throw error;
  }

  return { student, studentEmail, accessSource };
};

export const getDailyChallengeAttempt = async ({ codingRoundId, studentEmail }) =>
  DailyChallengeAttempt.findOne({
    codingRoundId,
    studentEmail: String(studentEmail || "").trim().toLowerCase(),
  });

export const ensureDailyChallengeAttempt = async ({
  codingRound,
  student,
  studentEmail,
  accessSource,
  markOtpVerified = false,
  startAttempt = false,
}) => {
  let attempt = await getDailyChallengeAttempt({
    codingRoundId: codingRound._id,
    studentEmail,
  });

  const now = new Date();
  if (!attempt) {
    attempt = new DailyChallengeAttempt({
      codingRoundId: codingRound._id,
      studentId: student?._id || null,
      batchId: codingRound.batchId,
      trackId: codingRound.trackId,
      questionId: codingRound.questionId,
      studentEmail,
      status: markOtpVerified ? "otp_verified" : "started",
      accessSource: accessSource || "student",
      otpVerifiedAt: markOtpVerified ? now : null,
      startedAt: startAttempt ? now : null,
      expiresAt: startAttempt ? new Date(now.getTime() + codingRound.duration * 60 * 1000) : null,
      lastActiveAt: now,
      timerDurationMinutes: Number(codingRound.duration || DAILY_CHALLENGE_RULES.timerLimitMinutes),
    });
  } else {
    attempt.studentId = attempt.studentId || student?._id || null;
    attempt.lastActiveAt = now;
    if (markOtpVerified && !attempt.otpVerifiedAt) {
      attempt.otpVerifiedAt = now;
      if (attempt.status === "otp_verified") {
        attempt.status = "otp_verified";
      }
    }

    if (startAttempt && !attempt.startedAt) {
      attempt.startedAt = now;
      attempt.expiresAt = new Date(now.getTime() + codingRound.duration * 60 * 1000);
      attempt.status = "started";
    } else if (startAttempt && attempt.status === "otp_verified") {
      attempt.status = "started";
    }
  }

  await attempt.save();
  return attempt;
};

export const getAttemptTimeRemainingSeconds = (attempt) => {
  if (!attempt?.expiresAt) return 0;
  return Math.max(0, Math.floor((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000));
};

export const isAttemptExpired = (attempt) => {
  if (!attempt?.expiresAt) return false;
  return Date.now() >= new Date(attempt.expiresAt).getTime();
};
