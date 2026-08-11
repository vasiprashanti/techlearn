import mongoose from "mongoose";
import { getTrackAssignmentDate, calculateCurrentDayNumber } from "./trackAssignmentSchedule.js";
import Batch, { BATCH_STATUS } from "../models/Batch.js";
import CodingRound from "../models/CodingRound.js";
import College from "../models/College.js";
import Question from "../models/Questions.js";
import Program from "../models/Program.js";
import Student from "../models/Student.js";
import Track from "../models/Track.js";
import DailyChallengeAttempt from "../models/DailyChallengeAttempt.js";
import { resolveProgramSchedule } from "./programSchedule.js";

export const DAILY_CHALLENGE_RULES = {
  timerLimitMinutes: 60,
  submitLimitPerQuestion: 1,
  antiCheatRules: [
    "Do not switch tabs or windows during the challenge.",
    "You can run code multiple times before final submission.",
    "Only one final submission is allowed per question.",
    "The challenge is auto-submitted when the timer ends.",
  ],
};

const DEMO_COLLEGE_NAME = "Public Demo College";
const DEMO_BATCH_NAME = "Public Demo Batch";

const getISTDateParts = (date) => {
  const d = new Date(date);
  const istDate = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return {
    year: istDate.getUTCFullYear(),
    month: istDate.getUTCMonth(),
    date: istDate.getUTCDate(),
  };
};

export const startOfDay = (date = new Date()) => {
  const { year, month, date: day } = getISTDateParts(date);
  const utcTime = Date.UTC(year, month, day, 0, 0, 0, 0);
  return new Date(utcTime - 5.5 * 60 * 60 * 1000);
};

export const endOfDay = (date = new Date()) => {
  const { year, month, date: day } = getISTDateParts(date);
  const utcTime = Date.UTC(year, month, day, 23, 59, 59, 999);
  return new Date(utcTime - 5.5 * 60 * 60 * 1000);
};

export const normalizeTrackType = (value = "") => {
  const normalized = String(value).trim().toLowerCase();
  if (normalized.includes("dsa")) return "DSA";
  if (normalized.includes("sql")) return "SQL";
  return "Core";
};

export const mapQuestionToProblem = (question) => ({
  questionId: question._id,
  problemTitle: question.title,
  description: question.description || "Solve the assigned Daily Challenge question.",
  difficulty: question.difficulty || "Medium",
  inputDescription: question.inputFormat || "Refer to the prompt for input details.",
  outputDescription: question.outputFormat || "Return the expected output for the given input.",
  categoryType: question.categoryType || "Coding",
  tags: (question.tags || []).filter(t => t && String(t).trim()),
  categoryTitle: question.categoryTitle || "",
  starterCode: question.content?.starterCode || {},
  content: {
    options: question.content?.options || question.options || [],
    tags: (question.tags || []).filter(t => t && String(t).trim()),
    categoryTitle: question.categoryTitle || "",
    starterCode: question.content?.starterCode || {},
  },
  visibleTestCases: (question.visibleTestCases?.length ? question.visibleTestCases : question.content?.visibleTestCases || []).map((testCase) => ({
    input: testCase.input || "",
    expectedOutput: testCase.expectedOutput !== undefined ? testCase.expectedOutput : (testCase.output || ""),
  })),
  hiddenTestCases: (question.hiddenTestCases?.length ? question.hiddenTestCases : question.content?.hiddenTestCases || []).map((testCase) => ({
    input: testCase.input || "",
    expectedOutput: testCase.expectedOutput !== undefined ? testCase.expectedOutput : (testCase.output || ""),
  })),
});

const combineDateAndTime = (date, timeString = "00:00") => {
  const { year, month, date: day } = getISTDateParts(date);
  const [hours, minutes] = String(timeString || "00:00")
    .split(":")
    .map((value) => Number(value || 0));
  const utcTime = Date.UTC(year, month, day, hours, minutes, 0, 0);
  return new Date(utcTime - 5.5 * 60 * 60 * 1000);
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

  const requestedTrackType = String(trackType || "").trim();
  const normalizedTrackType = requestedTrackType ? normalizeTrackType(requestedTrackType) : "";

  if (user || email) {
    studentContext = await resolveChallengeStudent({ user, email, allowGuestFallback: true });
  } else {
    studentContext = { student: null, studentEmail: "", accessSource: "guest" };
  }

  // Block access if student/user is assigned to Project Sprint only
  const studentProgram = studentContext.student?.programSelection || user?.programSelection;
  if (studentProgram === "Full Stack Project Program") {
    const error = new Error("Daily Challenge access is not enabled for accounts assigned to Project Sprint. Only Placement Sprint or Both are allowed.");
    error.statusCode = 403;
    throw error;
  }

  const schedule = studentContext.student
    ? await resolveProgramSchedule({ user, student: studentContext.student })
    : {
        programId: null,
        scheduleType: "batch",
        batchId: null,
        individualStartDate: null,
      };

  const batch = schedule.batchId
    ? await Batch.findById(schedule.batchId)
    : (studentContext.student ? null : await ensureDemoBatch());

  if (schedule.batchId && !batch) {
    const error = new Error("The assigned batch could not be found.");
    error.statusCode = 403;
    throw error;
  }

  if (batch && batch.status !== BATCH_STATUS.ACTIVE) {
    const error = new Error("This batch is not active for Daily Challenge access.");
    error.statusCode = 403;
    throw error;
  }

  const TrackTemplate = mongoose.model("TrackTemplate");
  let program = schedule.programId
    ? await Program.findById(schedule.programId).lean()
    : null;
  if (!program && studentProgram) {
    program = await Program.findOne({ programType: studentProgram, status: "Active" }).sort({ createdAt: -1 }).lean();
  }

  let trackTemplate = null;
  if (batch) {
    trackTemplate = batch.assignedDailyChallengeTrack
      ? await TrackTemplate.findById(batch.assignedDailyChallengeTrack)
      : null;
    if (!trackTemplate) {
      const candidateTemplateIds = [
        ...(batch.assignedTrackTemplateIds || []),
        batch.assignedTrackTemplate,
      ].filter(Boolean);
      if (candidateTemplateIds.length) {
        trackTemplate = await TrackTemplate.findOne({
          _id: { $in: candidateTemplateIds },
          trackType: "Daily Challenge",
          status: "Active",
        });
      }
    }
  }

  if (!trackTemplate) {
    if (program?.trackTemplateIds?.length) {
      trackTemplate = await TrackTemplate.findOne({
        _id: { $in: program.trackTemplateIds },
        trackType: "Daily Challenge",
        status: "Active",
      });
    }
    if (!trackTemplate && !schedule.programId) {
      trackTemplate = await TrackTemplate.findOne({ trackType: "Daily Challenge", status: "Active" }).sort({ createdAt: -1 });
    }
  }

  const individualStartDate = batch ? null : (schedule.individualStartDate || studentContext.student?.createdAt || user?.createdAt || new Date());
  const dayNumber = calculateCurrentDayNumber(batch, trackTemplate, "Daily Challenge", individualStartDate);
  const now = new Date();

  if (dayNumber === 0) {
    const error = new Error("Today’s Daily Challenge has not been released yet.");
    error.statusCode = 404;
    throw error;
  }

  if (batch?.expiryDate && now > endOfDay(batch.expiryDate)) {
    const error = new Error("This batch has expired for Daily Challenge access.");
    error.statusCode = 403;
    throw error;
  }

  const desiredTrackType = normalizeTrackType(
    normalizedTrackType || studentContext.student?.primaryTrack || batch?.assignedTrack || "DSA"
  );

  console.log("[DAILY_CHALLENGE_DEBUG] Track Search:", {
    batchId: batch?._id || null,
    programId: schedule.programId || null,
    scheduleType: schedule.scheduleType,
    desiredTrackType,
    requestedTrackType,
    studentPrimaryTrack: studentContext.student?.primaryTrack,
    batchAssignedTrack: batch?.assignedTrack,
  });

  if (trackTemplate) {
    const dayAssignment = (trackTemplate.dayAssignments || []).find(
      (assignment) => Number(assignment.dayNumber) === Number(dayNumber)
    );
    const templateQuestionIds = dayAssignment?.tasks?.length
      ? dayAssignment.tasks.map((task) => task.questionId).filter(Boolean)
      : [dayAssignment?.questionId].filter(Boolean);

    if (templateQuestionIds.length) {
      const questions = await Question.find({ _id: { $in: templateQuestionIds } }).lean();
      const questionOrder = new Map(templateQuestionIds.map((id, index) => [String(id), index]));
      const orderedQuestions = questions.sort(
        (a, b) => (questionOrder.get(String(a._id)) ?? 0) - (questionOrder.get(String(b._id)) ?? 0)
      );
      if (orderedQuestions.length) {
        return {
          student: studentContext.student,
          studentEmail: studentContext.studentEmail,
          accessSource: studentContext.accessSource,
          batch,
          program,
          programId: schedule.programId || program?._id || null,
          scheduleType: schedule.scheduleType,
          individualStartDate,
          track: {
            _id: trackTemplate._id,
            trackType: desiredTrackType,
            name: trackTemplate.name,
          },
          question: orderedQuestions[0],
          questions: orderedQuestions,
          dayNumber,
          durationMinutes: DAILY_CHALLENGE_RULES.timerLimitMinutes,
        };
      }
    }

    // If an active track template is assigned to this batch but has NO questions for today's exact dayNumber, throw error
    const error = new Error(`No Daily Challenge questions are configured for Day ${dayNumber} in the assigned track.`);
    error.statusCode = 404;
    throw error;
  }

  if (!batch) {
    const error = new Error("No Daily Challenge track template is configured for this individual program.");
    error.statusCode = 404;
    throw error;
  }

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
  const durationMinutes = DAILY_CHALLENGE_RULES.timerLimitMinutes;

  const orderedQuestions = track.orderedQuestionIds || [];
  const resolvedQuestion = orderedQuestions[dayNumber - 1];
  const resolvedQuestionId = resolvedQuestion?._id || resolvedQuestion;

  if (!resolvedQuestionId) {
    const error = new Error(`No Daily Challenge questions are configured for today (Day ${dayNumber}).`);
    error.statusCode = 404;
    throw error;
  }

  const resolvedQuestionIds = [resolvedQuestionId];

  const questions = await Promise.all(
    resolvedQuestionIds.map(async (qId) => {
      const qDoc = await Question.findById(qId).lean();
      return qDoc;
    })
  );

  const validQuestions = questions.filter(Boolean);
  if (validQuestions.length === 0) {
    const error = new Error(`The configured Daily Challenge questions for today (Day ${dayNumber}) could not be found.`);
    error.statusCode = 404;
    throw error;
  }

  return {
    student: studentContext.student,
    studentEmail: studentContext.studentEmail,
    accessSource: studentContext.accessSource,
    batch,
    program,
    programId: schedule.programId || program?._id || null,
    scheduleType: schedule.scheduleType,
    individualStartDate,
    track,
    questions: validQuestions,
    dayNumber,
    durationMinutes,
  };
};

export const upsertDailyChallengeRound = async ({
  batch,
  program,
  programId,
  track,
  questions,
  dayNumber,
  durationMinutes,
  individualStartDate,
}) => {
  const anchorDate = batch?.startDate || individualStartDate || new Date();
  const dateStr = new Date(anchorDate).toISOString().slice(0, 10).replace(/[^0-9]/g, "");
  const linkId = batch?._id
    ? `daily-${batch._id}-${String(track.trackType || "track").toLowerCase()}-day-${dayNumber}-${dateStr}`
    : `daily-program-${programId || program?._id || "individual"}-${String(track.trackType || "track").toLowerCase()}-day-${dayNumber}-${dateStr}`;
  const resolvedQuestions = Array.isArray(questions) && questions.length > 0 ? questions : [];

  const problems = resolvedQuestions.map((q) => mapQuestionToProblem(q));

  const roundPayload = {
    title: `Daily Challenge - ${batch?.name || program?.name || "Individual Program"} - ${track.trackType} - Day ${dayNumber}`,
    college: batch?.name || program?.name || "Individual Program",
    batchId: batch?._id || null,
    programId: programId || program?._id || null,
    trackId: track._id,
    date: startOfDay(),
    duration: durationMinutes,
    problems,
    linkId,
    isActive: true,
    challengeType: "daily_challenge",
    questionId: resolvedQuestions[0]?._id || null, // Fallback link for backward compatibility
    dayNumber,
    trackType: normalizeTrackType(track.trackType),
  };

  return CodingRound.findOneAndUpdate(
    { linkId },
    { $set: roundPayload },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate("questionId");
};

export const resolveDailyChallengeParticipant = async ({ codingRound, user, email }) => {
  const { student, studentEmail, accessSource } = await resolveChallengeStudent({
    user,
    email,
    allowGuestFallback: true,
  });

  if (!student) {
    const error = new Error("Student mapping is required for Daily Challenge access.");
    error.statusCode = 403;
    throw error;
  }

  const schedule = await resolveProgramSchedule({
    user,
    student,
    programId: codingRound.programId || null,
  });

  if (codingRound.batchId) {
    if (!schedule.batchId || String(schedule.batchId) !== String(codingRound.batchId)) {
      const error = new Error("This Daily Challenge is not assigned to your batch.");
      error.statusCode = 403;
      throw error;
    }
  } else if (codingRound.programId) {
    if (String(schedule.programId || "") !== String(codingRound.programId) || schedule.batchId) {
      const error = new Error("This Daily Challenge is not assigned to your individual program schedule.");
      error.statusCode = 403;
      throw error;
    }
  }

  return { student, studentEmail, accessSource, schedule };
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
      batchId: codingRound.batchId || null,
      programId: codingRound.programId || null,
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
