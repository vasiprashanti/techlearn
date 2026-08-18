import mongoose from "mongoose";
import Program, { PROGRAM_PLACEMENT_CATEGORIES, PROGRAM_TYPES } from "../../models/Program.js";
import Batch from "../../models/Batch.js";
import Student from "../../models/Student.js";
import Course from "../../models/Course.js";
import Roadmap from "../../models/Roadmap.js";
import TrackTemplate from "../../models/TrackTemplate.js";
import CertificateTemplate from "../../models/CertificateTemplate.js";
import Project from "../../models/Project.js";
import User from "../../models/User.js";
import ProgramEnrollment from "../../models/ProgramEnrollment.js";
import DailyTaskAttempt from "../../models/DailyTaskAttempt.js";
import DailyChallengeAttempt from "../../models/DailyChallengeAttempt.js";
import StudentCodingSubmission from "../../models/StudentCodingSubmission.js";
import Blueprint from "../../models/Blueprint.js";
import {
  pauseProgramEnrollment,
  syncPrimaryProgramPointers,
  upsertProgramEnrollment,
} from "../../utils/programEnrollment.js";
import { expireAllActiveBatches } from "../../utils/batchLifecycle.js";
import { validateAndNormalizeProgramPhases } from "../../utils/programPhases.js";
import { deleteProgramPerformance } from "../../services/programPerformanceService.js";
import { syncProgramEnrollmentsForProgram } from "../../services/programCompletionService.js";

// Whitelist mapping for attachment entity types
export const ENTITY_CONFIG = {
  batches: {
    model: Batch,
    fieldKey: "batchIds",
    labelField: "name",
    selectFields: "_id name startDate expiryDate status",
  },
  students: {
    model: Student,
    fieldKey: "studentIds",
    labelField: "name",
    selectFields: "_id name email rollNo status batchId userId accuracy overallAccuracy createdAt",
  },
  courses: {
    model: Course,
    fieldKey: "courseIds",
    labelField: "title",
    selectFields: "_id title level courseType numTopics status",
  },
  roadmaps: {
    model: Roadmap,
    fieldKey: "roadmapIds",
    labelField: "title",
    selectFields: "_id title status createdAt",
  },
  "track-templates": {
    model: TrackTemplate,
    fieldKey: "trackTemplateIds",
    labelField: "name",
    selectFields: "_id name trackType status createdAt",
  },
  certificates: {
    model: CertificateTemplate,
    fieldKey: "certificateTemplateIds",
    labelField: "name",
    selectFields: "_id name description status",
  },
  projects: {
    model: Project,
    fieldKey: "projectIds",
    labelField: "title",
    selectFields: "_id title category duration_days status",
  },
};

const PROGRAM_REPORT_DAYS = 30;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MILLISECONDS = (5 * 60 + 30) * 60 * 1000;

const getIdString = (value) => {
  const id = value && typeof value === "object" && value._id ? value._id : value;
  return id ? id.toString() : "";
};

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseProgramDurationDays = (duration) => {
  if (typeof duration === "number" && Number.isFinite(duration)) {
    return Math.max(1, Math.round(duration));
  }

  const match = String(duration || "").match(/(\d+(?:\.\d+)?)\s*-?\s*(day|days|week|weeks|month|months|year|years)/i);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;

  const unit = match[2].toLowerCase();
  const multiplier = unit.startsWith("year")
    ? 365
    : unit.startsWith("month")
      ? 30
      : unit.startsWith("week")
        ? 7
        : 1;

  return Math.max(1, Math.round(amount * multiplier));
};

const resolveProgramDurationDays = ({ durationDays, duration }) => {
  const requestedDurationDays = durationDays === undefined || durationDays === null || durationDays === ""
    ? parseProgramDurationDays(duration)
    : Number(durationDays);
  return Number.isInteger(requestedDurationDays) ? requestedDurationDays : null;
};

const normalizePlacementCategories = (value, { allowLegacyFallback = false } = {}) => {
  const categories = Array.isArray(value)
    ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))]
    : [];
  const invalid = categories.filter((category) => !PROGRAM_PLACEMENT_CATEGORIES.includes(category));

  if (invalid.length > 0 && !allowLegacyFallback) {
    return {
      error: `Placement category must be one of: ${PROGRAM_PLACEMENT_CATEGORIES.join(", ")}.`,
    };
  }

  return {
    categories: invalid.length > 0 ? ["Both"] : categories,
  };
};

// Reports and enrollment stats use the product's India-facing calendar day,
// rather than the server's UTC day. This keeps "today" and current-month
// counts stable when the API is deployed outside India.
const getIstDateSerial = (value) => {
  const date = toDate(value);
  if (!date) return null;

  const shifted = new Date(date.getTime() + IST_OFFSET_MILLISECONDS);
  return Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate()
  ) / DAY_IN_MILLISECONDS;
};

const isTodayInIndia = (value, now = new Date()) => {
  const valueSerial = getIstDateSerial(value);
  return valueSerial !== null && valueSerial === getIstDateSerial(now);
};

const isCurrentMonthInIndia = (value, now = new Date()) => {
  const date = toDate(value);
  const current = toDate(now);
  if (!date || !current) return false;

  const shiftedDate = new Date(date.getTime() + IST_OFFSET_MILLISECONDS);
  const shiftedCurrent = new Date(current.getTime() + IST_OFFSET_MILLISECONDS);
  return shiftedDate.getUTCFullYear() === shiftedCurrent.getUTCFullYear()
    && shiftedDate.getUTCMonth() === shiftedCurrent.getUTCMonth();
};

const getProgramDayNumber = (startDate, now = new Date()) => {
  const startSerial = getIstDateSerial(startDate);
  const todaySerial = getIstDateSerial(now);
  if (startSerial === null || todaySerial === null) return null;
  return Math.max(0, Math.floor(todaySerial - startSerial) + 1);
};

const getProgramExpiryDate = (startDate, durationDays) => {
  const start = toDate(startDate);
  if (!start || !durationDays) return null;
  return new Date(start.getTime() + ((durationDays - 1) * DAY_IN_MILLISECONDS));
};

const getOriginalProgramStartDate = (student, enrollment) =>
  toDate(
    enrollment?.individualStartDate
      || enrollment?.assignedAt
      || student?.createdAt
  );

const getEffectiveScheduleStartDate = (student, enrollment) =>
  toDate(enrollment?.batchId?.startDate) || getOriginalProgramStartDate(student, enrollment);

const hasAttemptedTask = (attempt) =>
  (attempt?.tasksProgress || []).some((task) =>
    task?.attempted === true
      || ["In Progress", "Completed"].includes(task?.status)
      || Boolean(task?.completedAt)
      || Boolean(task?.selectedOption)
      || Boolean(task?.code)
  );

const getTaskScores = (attempt) => (attempt?.tasksProgress || [])
  .filter((task) => task?.attempted === true || ["In Progress", "Completed"].includes(task?.status) || task?.completedAt)
  .map((task) => {
    const accuracy = Number(task?.accuracy);
    if (Number.isFinite(accuracy)) return accuracy;
    if (task?.isCorrect === true) return 100;
    if (task?.isCorrect === false) return 0;
    return null;
  })
  .filter((score) => score !== null);

const getMapValues = (value) => {
  if (!value) return [];
  if (value instanceof Map) return [...value.values()];
  if (typeof value === "object") return Object.values(value);
  return [];
};

const hasSubmittedChallenge = (attempt, submission) =>
  ["submitted", "ended", "auto_submitted"].includes(attempt?.status)
    || Boolean(attempt?.codingSubmissionId || attempt?.finalSubmissionId)
    || getMapValues(submission?.problemSubmitted).some(Boolean);

const getChallengeScores = (submission) => {
  const totalScore = Number(submission?.totalScore);
  return Number.isFinite(totalScore) ? [totalScore] : [];
};

const addActivityState = (map, key, scores, timestamp) => {
  if (!key) return;
  const current = map.get(key) || { attempted: false, scores: [], latestAt: null };
  current.attempted = true;
  current.scores.push(...scores);
  const nextTimestamp = toDate(timestamp);
  if (nextTimestamp && (!current.latestAt || nextTimestamp > current.latestAt)) {
    current.latestAt = nextTimestamp;
  }
  map.set(key, current);
};

const formatActivityResult = (activity) => {
  if (!activity?.attempted) return "—";
  if (!activity.scores?.length) return "Attempted";
  const average = activity.scores.reduce((sum, score) => sum + score, 0) / activity.scores.length;
  return `${Math.round(average)}%`;
};

const getProgramStatus = ({ enrollment, expiryDate, now = new Date() }) => {
  if (enrollment?.status === "Completed") return "Completed";
  if (enrollment?.status === "Paused") return "Expired";
  const todaySerial = getIstDateSerial(now);
  const expirySerial = getIstDateSerial(expiryDate);
  if (todaySerial !== null && expirySerial !== null && expirySerial < todaySerial) return "Expired";
  return "Active";
};

const getStoredAccuracy = (enrollment) => {
  const candidates = [enrollment?.completionAccuracy];
  const value = candidates.map(Number).find((candidate) => Number.isFinite(candidate));
  return value === undefined ? null : value;
};

const averageScores = (...activities) => {
  const scores = activities.flatMap((activity) => activity?.scores || []);
  if (!scores.length) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

const buildProgramMonitoringData = async ({ program, enrollments, students }) => {
  const now = new Date();
  const durationDays = Number(program.durationDays) || parseProgramDurationDays(program.duration) || PROGRAM_REPORT_DAYS;
  const reportDays = durationDays;
  const programBatchIds = (program.batchIds || []).map(getIdString).filter(Boolean);
  const currentStudentIds = students.map((student) => getIdString(student)).filter(Boolean);
  const studentEmails = students.map((student) => String(student.email || "").trim().toLowerCase()).filter(Boolean);
  const userIds = [
    ...enrollments.map((enrollment) => getIdString(enrollment.userId)),
    ...students.map((student) => getIdString(student.userId)),
  ].filter(Boolean);
  const uniqueUserIds = [...new Set(userIds)];
  const scopeQuery = [
    { programId: program._id },
    ...(programBatchIds.length ? [{ batchId: { $in: programBatchIds } }] : []),
  ];

  const taskQuery = uniqueUserIds.length
    ? { userId: { $in: uniqueUserIds }, $or: scopeQuery }
    : null;
  const challengeIdentityQuery = currentStudentIds.length || studentEmails.length
    ? {
      $or: [
        ...(currentStudentIds.length ? [{ studentId: { $in: currentStudentIds } }] : []),
        ...(studentEmails.length ? [{ studentEmail: { $in: studentEmails } }] : []),
      ],
    }
    : null;
  const challengeQuery = challengeIdentityQuery
    ? { $and: [challengeIdentityQuery, { $or: scopeQuery }] }
    : null;

  const [taskAttempts, challengeAttempts, codingSubmissions] = await Promise.all([
    taskQuery
      ? DailyTaskAttempt.find(taskQuery).select("userId dayNumber tasksProgress updatedAt createdAt").lean()
      : [],
    challengeQuery
      ? DailyChallengeAttempt.find(challengeQuery)
        .select("codingRoundId studentId studentEmail status submittedAt endedAt lastActiveAt updatedAt createdAt codingSubmissionId finalSubmissionId")
        .populate("codingRoundId", "_id dayNumber")
        .lean()
      : [],
    challengeQuery
      ? StudentCodingSubmission.find(challengeQuery)
        .select("codingRoundId studentId studentEmail attemptId totalScore problemSubmitted submittedAt updatedAt createdAt")
        .populate("codingRoundId", "_id dayNumber")
        .lean()
      : [],
  ]);

  const taskActivityByUserDay = new Map();
  const taskActivityToday = new Set();
  for (const attempt of taskAttempts) {
    if (!hasAttemptedTask(attempt)) continue;
    const userId = getIdString(attempt.userId);
    const dayNumber = Number(attempt.dayNumber);
    if (!userId || !Number.isFinite(dayNumber)) continue;
    addActivityState(
      taskActivityByUserDay,
      `${userId}:${dayNumber}`,
      getTaskScores(attempt),
      attempt.updatedAt || attempt.createdAt
    );
    if (isTodayInIndia(attempt.updatedAt || attempt.createdAt, now)) taskActivityToday.add(userId);
  }

  const submissionByAttemptKey = new Map();
  const submissionByRoundStudentKey = new Map();
  for (const submission of codingSubmissions) {
    const attemptId = getIdString(submission.attemptId);
    const roundId = getIdString(submission.codingRoundId);
    const studentKey = getIdString(submission.studentId) || String(submission.studentEmail || "").toLowerCase();
    if (attemptId) submissionByAttemptKey.set(attemptId, submission);
    if (roundId && studentKey) submissionByRoundStudentKey.set(`${roundId}:${studentKey}`, submission);
  }

  const challengeActivityByStudentDay = new Map();
  const challengeActivityToday = new Set();
  for (const attempt of challengeAttempts) {
    const studentKey = getIdString(attempt.studentId) || String(attempt.studentEmail || "").toLowerCase();
    const roundId = getIdString(attempt.codingRoundId);
    const submission = submissionByAttemptKey.get(getIdString(attempt._id))
      || submissionByRoundStudentKey.get(`${roundId}:${studentKey}`);
    if (!studentKey || !hasSubmittedChallenge(attempt, submission)) continue;

    const dayNumber = Number(attempt.codingRoundId?.dayNumber || attempt.dayNumber);
    if (!Number.isFinite(dayNumber)) continue;
    const activityDate = attempt.submittedAt || attempt.endedAt || attempt.lastActiveAt || attempt.updatedAt || attempt.createdAt;
    addActivityState(
      challengeActivityByStudentDay,
      `${studentKey}:${dayNumber}`,
      getChallengeScores(submission),
      activityDate
    );
    if (isTodayInIndia(activityDate, now)) challengeActivityToday.add(studentKey);
  }

  const enrollmentByStudentId = new Map();
  enrollments.forEach((enrollment) => {
    const studentId = getIdString(enrollment.studentId);
    if (studentId && !enrollmentByStudentId.has(studentId)) enrollmentByStudentId.set(studentId, enrollment);
  });

  const studentMonitoringRows = students.map((student) => {
    const studentId = getIdString(student);
    const enrollment = enrollmentByStudentId.get(studentId) || null;
    const programStartDate = getOriginalProgramStartDate(student, enrollment);
    const scheduleStartDate = getEffectiveScheduleStartDate(student, enrollment);
    const programExpiryDate = getProgramExpiryDate(programStartDate, durationDays);
    const scheduleExpiryDate = getProgramExpiryDate(scheduleStartDate, durationDays);
    const dayNumber = getProgramDayNumber(scheduleStartDate, now);
    const userId = getIdString(enrollment?.userId) || getIdString(student.userId);
    const emailKey = String(student.email || "").trim().toLowerCase();
    const taskToday = userId && taskActivityToday.has(userId);
    const challengeToday = (studentId && challengeActivityToday.has(studentId)) || (emailKey && challengeActivityToday.has(emailKey));
    const taskActivities = Array.from(taskActivityByUserDay.entries())
      .filter(([key]) => key.startsWith(`${userId}:`))
      .map(([, activity]) => activity);
    const challengeActivities = Array.from(challengeActivityByStudentDay.entries())
      .filter(([key]) => key.startsWith(`${studentId}:`) || key.startsWith(`${emailKey}:`))
      .map(([, activity]) => activity);
    const status = getProgramStatus({ enrollment, expiryDate: scheduleExpiryDate, now });
    const completionAccuracy = status === "Completed"
      ? (getStoredAccuracy(enrollment) ?? averageScores(...taskActivities, ...challengeActivities))
      : null;
    const programReport = {
      studentId,
      dayNumber,
      status,
      days: Array.from({ length: reportDays }, (_, index) => {
        const reportDay = index + 1;
        const task = taskActivityByUserDay.get(`${userId}:${reportDay}`);
        const challenge = challengeActivityByStudentDay.get(`${studentId}:${reportDay}`)
          || challengeActivityByStudentDay.get(`${emailKey}:${reportDay}`);
        return {
          dayNumber: reportDay,
          dailyTask: {
            attempted: Boolean(task?.attempted),
            status: task?.attempted ? "Attempted" : "N/A",
            result: formatActivityResult(task),
          },
          dailyChallenge: {
            attempted: Boolean(challenge?.attempted),
            status: challenge?.attempted ? "Attempted" : "N/A",
            result: formatActivityResult(challenge),
          },
        };
      }),
    };

    return {
      ...student,
      enrollment,
      programStartDate,
      programExpiryDate,
      scheduleStartDate,
      scheduleExpiryDate,
      programDayNumber: dayNumber,
      programStatus: status,
      programAccess: enrollment?.accessTier === "Member" || program.pricingType === "Paid" ? "Paid" : "Trial",
      programPlan: program.planName || program.plan || null,
      completionAccuracy,
      activeToday: Boolean(taskToday || challengeToday),
      programReport,
    };
  });

  const everEnrolledStudentIds = new Set([
    ...currentStudentIds,
    ...enrollments.map((enrollment) => getIdString(enrollment.studentId)).filter(Boolean),
  ]);
  const currentEnrolled = studentMonitoringRows.filter((student) =>
    isCurrentMonthInIndia(student.programStartDate, now)
      && ["Active", "Completed"].includes(student.programStatus)
  ).length;
  const activeToday = studentMonitoringRows.filter((student) => student.activeToday).length;
  const completedStudents = studentMonitoringRows.filter((student) => student.programStatus === "Completed");
  const accuracyValues = completedStudents
    .map((student) => Number(student.completionAccuracy))
    .filter((accuracy) => Number.isFinite(accuracy));

  return {
    students: studentMonitoringRows,
    stats: {
      totalEnrolled: everEnrolledStudentIds.size,
      currentEnrolled,
      activeToday,
      completed: completedStudents.length,
      accuracy: accuracyValues.length
        ? Math.round(accuracyValues.reduce((sum, accuracy) => sum + accuracy, 0) / accuracyValues.length)
        : null,
    },
    reports: {
      days: reportDays,
    },
  };
};

/**
 * GET /api/admin/programs
 * Search, filter (programType, month, status), sort, paginate programs
 */
export const listPrograms = async (req, res) => {
  try {
    const {
      search = "",
      programType = "",
      month = "",
      status = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Search filter
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ name: searchRegex }, { description: searchRegex }, { programType: searchRegex }];
    }

    // Program Type filter
    if (programType.trim()) {
      query.programType = programType.trim();
    }

    // Status filter
    if (status.trim()) {
      query.status = status.trim();
    }

    // Month filter based on createdAt (expected format: YYYY-MM or MM)
    if (/^\d{4}-(0[1-9]|1[0-2])$/.test(month.trim())) {
      const parts = month.trim().split("-");
      if (parts.length === 2) {
        const year = parseInt(parts[0], 10);
        const monthNum = parseInt(parts[1], 10) - 1; // 0-indexed
        const startDate = new Date(Date.UTC(year, monthNum, 1));
        const endDate = new Date(Date.UTC(year, monthNum + 1, 0, 23, 59, 59, 999));
        query.createdAt = { $gte: startDate, $lte: endDate };
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const allowedSortFields = new Set([
      "name",
      "programType",
      "duration",
      "status",
      "visibility",
      "createdAt",
      "updatedAt",
    ]);
    const sortOptions = {};
    const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : "createdAt";
    sortOptions[safeSortBy] = sortOrder === "asc" ? 1 : -1;

    const totalPrograms = await Program.countDocuments(query);
    const rawPrograms = await Program.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const programs = rawPrograms.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      programType: p.programType,
      duration: p.duration,
      durationDays: p.durationDays || parseProgramDurationDays(p.duration),
      phases: p.phases || [],
      status: p.status,
      visibility: p.visibility,
      pricingType: p.pricingType,
      programFee: p.programFee,
      learningGoals: p.learningGoals || [],
      placementCategories: p.placementCategories || [],
      targetCompanies: p.targetCompanies || [],
      skillTags: p.skillTags || [],
      targetRoles: p.targetRoles || [],
      studentCount: Array.isArray(p.studentIds) ? p.studentIds.length : 0,
      batchCount: Array.isArray(p.batchIds) ? p.batchIds.length : 0,
      courseCount: Array.isArray(p.courseIds) ? p.courseIds.length : 0,
      roadmapCount: Array.isArray(p.roadmapIds) ? p.roadmapIds.length : 0,
      trackTemplateCount: Array.isArray(p.trackTemplateIds) ? p.trackTemplateIds.length : 0,
      certificateTemplateCount: Array.isArray(p.certificateTemplateIds) ? p.certificateTemplateIds.length : 0,
      projectCount: Array.isArray(p.projectIds) ? p.projectIds.length : 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    res.json({
      success: true,
      programs,
      pagination: {
        total: totalPrograms,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalPrograms / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Error listing programs:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch programs" });
  }
};

/**
 * POST /api/admin/programs
 * Create a new program
 */
export const createProgram = async (req, res) => {
  try {
    const {
      name,
      description,
      programType,
      duration,
      durationDays,
      phases,
      status,
      visibility,
      pricingType,
      programFee,
      learningGoals,
      placementCategories,
      targetCompanies,
      skillTags,
      targetRoles,
    } = req.body;

    if (!name || !programType || (!duration && durationDays === undefined)) {
      return res.status(400).json({
        success: false,
        message: "Program name, program type, and duration are required",
      });
    }

    const normalizedProgramType = String(programType).trim();
    if (!PROGRAM_TYPES.includes(normalizedProgramType)) {
      return res.status(400).json({
        success: false,
        message: "Program type must be Placement or Skill",
      });
    }

    const resolvedDurationDays = resolveProgramDurationDays({ durationDays, duration });
    if (!resolvedDurationDays) {
      return res.status(400).json({
        success: false,
        message: "Duration must be a whole number of days or a value such as 30 Days.",
      });
    }

    const phaseValidation = validateAndNormalizeProgramPhases({
      programType: normalizedProgramType,
      durationDays: resolvedDurationDays,
      phases,
    });
    if (phaseValidation.error) {
      return res.status(400).json({ success: false, message: phaseValidation.error });
    }

    const placementCategoryResult = normalizePlacementCategories(placementCategories);
    if (placementCategoryResult.error) {
      return res.status(400).json({ success: false, message: placementCategoryResult.error });
    }

    let parsedFee = 0;
    if (pricingType === "Paid") {
      parsedFee = Number(programFee);
      if (isNaN(parsedFee) || parsedFee < 0) {
        return res.status(400).json({
          success: false,
          message: "Program fee must be a non-negative number for Paid programs",
        });
      }
    }

    const program = new Program({
      name: name.trim(),
      description: (description || "").trim(),
      programType: normalizedProgramType,
      duration: `${resolvedDurationDays} Days`,
      durationDays: resolvedDurationDays,
      phases: phaseValidation.phases,
      status: status || "Draft",
      visibility: visibility || "Public",
      pricingType: pricingType || "Free",
      programFee: pricingType === "Paid" ? parsedFee : 0,
      learningGoals: Array.isArray(learningGoals) ? learningGoals : [],
      placementCategories: placementCategoryResult.categories,
      targetCompanies: Array.isArray(targetCompanies) ? targetCompanies : [],
      skillTags: Array.isArray(skillTags) ? skillTags : [],
      targetRoles: Array.isArray(targetRoles) ? targetRoles : [],
      createdBy: req.user?._id || null,
      updatedBy: req.user?._id || null,
    });

    await program.save();

    res.status(201).json({
      success: true,
      message: "Program created successfully",
      program,
    });
  } catch (error) {
    console.error("Error creating program:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to create program" });
  }
};

/**
 * GET /api/admin/programs/:programId
 * Get a single program by ID with populated attachment sections
 */
export const getProgramById = async (req, res) => {
  try {
    const { programId } = req.params;

    await expireAllActiveBatches();
    await syncProgramEnrollmentsForProgram({ programId });

    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ success: false, message: "Invalid program ID format" });
    }

    const program = await Program.findById(programId)
      .populate("batchIds", ENTITY_CONFIG.batches.selectFields)
      .populate({
        path: "studentIds",
        select: ENTITY_CONFIG.students.selectFields,
        populate: {
          path: "batchId",
          select: "_id name startDate expiryDate releaseTime",
        },
      })
      .populate("courseIds", ENTITY_CONFIG.courses.selectFields)
      .populate("roadmapIds", ENTITY_CONFIG.roadmaps.selectFields)
      .populate("trackTemplateIds", ENTITY_CONFIG["track-templates"].selectFields)
      .populate("certificateTemplateIds", ENTITY_CONFIG.certificates.selectFields)
      .populate("projectIds", ENTITY_CONFIG.projects.selectFields)
      .lean();

    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    // Keep the program's learning path separate from its optional cohort
    // schedule. The enrollment record is the source of truth for the
    // student's access tier, individual start date, and selected batch.
    const [enrollments, blueprintCount] = await Promise.all([
      ProgramEnrollment.find({ programId })
        .sort({ assignedAt: -1, createdAt: -1 })
        .populate("batchId", "_id name startDate expiryDate releaseTime")
        .lean(),
      Blueprint.countDocuments({ programId }),
    ]);

    const enrollmentByStudentId = new Map();
    enrollments.forEach((enrollment) => {
      const studentId = enrollment.studentId?.toString();
      if (studentId && !enrollmentByStudentId.has(studentId)) {
        enrollmentByStudentId.set(studentId, enrollment);
      }
    });

    const baseStudents = (program.studentIds || []).map((student) => ({
      ...student,
      enrollment: enrollmentByStudentId.get(student._id?.toString()) || null,
    }));
    const monitoringData = await buildProgramMonitoringData({
      program,
      enrollments,
      students: baseStudents,
    });
    const programWithEnrollments = {
      ...program,
      studentIds: monitoringData.students,
      studentCount: monitoringData.stats.totalEnrolled,
      programStats: monitoringData.stats,
      programReports: monitoringData.reports,
      blueprintCount,
    };

    res.json({
      success: true,
      program: programWithEnrollments,
    });
  } catch (error) {
    console.error("Error getting program detail:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch program detail" });
  }
};

/**
 * PATCH /api/admin/programs/:programId
 * Update program metadata and pricing
 */
export const updateProgram = async (req, res) => {
  try {
    const { programId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ success: false, message: "Invalid program ID format" });
    }

    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    const {
      name,
      description,
      programType,
      duration,
      durationDays,
      phases,
      status,
      visibility,
      pricingType,
      programFee,
      learningGoals,
      placementCategories,
      targetCompanies,
      skillTags,
      targetRoles,
    } = req.body;

    const nextProgramType = programType === undefined
      ? program.programType
      : String(programType).trim();
    if (!PROGRAM_TYPES.includes(nextProgramType)) {
      return res.status(400).json({
        success: false,
        message: "Program type must be Placement or Skill",
      });
    }

    const nextDurationDays = resolveProgramDurationDays({
      durationDays: durationDays === undefined ? program.durationDays : durationDays,
      duration: duration === undefined ? program.duration : duration,
    });
    if (!nextDurationDays) {
      return res.status(400).json({
        success: false,
        message: "Duration must be a whole number of days or a value such as 30 Days.",
      });
    }

    const isStructureChanging = programType !== undefined
      || duration !== undefined
      || durationDays !== undefined
      || phases !== undefined
      || !Array.isArray(program.phases)
      || program.phases.length === 0;
    const phaseValidation = validateAndNormalizeProgramPhases({
      programType: nextProgramType,
      durationDays: nextDurationDays,
      phases: isStructureChanging ? phases : program.phases,
    });
    if (phaseValidation.error) {
      return res.status(400).json({ success: false, message: phaseValidation.error });
    }

    if (name !== undefined) program.name = String(name).trim();
    if (description !== undefined) program.description = String(description).trim();
    program.programType = nextProgramType;
    program.duration = `${nextDurationDays} Days`;
    program.durationDays = nextDurationDays;
    program.phases = phaseValidation.phases;
    if (status !== undefined) program.status = status;
    if (visibility !== undefined) program.visibility = visibility;
    if (learningGoals !== undefined) program.learningGoals = Array.isArray(learningGoals) ? learningGoals : [];
    if (placementCategories !== undefined) {
      const placementCategoryResult = normalizePlacementCategories(placementCategories);
      if (placementCategoryResult.error) {
        return res.status(400).json({ success: false, message: placementCategoryResult.error });
      }
      program.placementCategories = nextProgramType === "Placement"
        ? placementCategoryResult.categories
        : [];
    } else {
      const legacyPlacementCategoryResult = normalizePlacementCategories(program.placementCategories, { allowLegacyFallback: true });
      program.placementCategories = nextProgramType === "Placement"
        ? legacyPlacementCategoryResult.categories
        : [];
    }
    if (targetCompanies !== undefined) program.targetCompanies = Array.isArray(targetCompanies) ? targetCompanies : [];
    if (skillTags !== undefined) program.skillTags = Array.isArray(skillTags) ? skillTags : [];
    if (targetRoles !== undefined) program.targetRoles = Array.isArray(targetRoles) ? targetRoles : [];
    if (pricingType !== undefined) {
      program.pricingType = pricingType;
      if (pricingType === "Paid") {
        const parsedFee = Number(programFee);
        if (isNaN(parsedFee) || parsedFee < 0) {
          return res.status(400).json({
            success: false,
            message: "Program fee must be a non-negative number for Paid programs",
          });
        }
        program.programFee = parsedFee;
      } else {
        program.programFee = 0;
      }
    } else if (program.pricingType === "Paid" && programFee !== undefined) {
      const parsedFee = Number(programFee);
      if (isNaN(parsedFee) || parsedFee < 0) {
        return res.status(400).json({
          success: false,
          message: "Program fee must be a non-negative number for Paid programs",
        });
      }
      program.programFee = parsedFee;
    }

    program.updatedBy = req.user?._id || program.updatedBy;
    await program.save();

    res.json({
      success: true,
      message: "Program updated successfully",
      program,
    });
  } catch (error) {
    console.error("Error updating program:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to update program" });
  }
};

/**
 * DELETE /api/admin/programs/:programId
 * Delete Program (never deletes attached entities)
 */
export const deleteProgram = async (req, res) => {
  try {
    const { programId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ success: false, message: "Invalid program ID format" });
    }

    const program = await Program.findByIdAndDelete(programId);
    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    await Blueprint.deleteMany({ programId });
    await deleteProgramPerformance(programId);

    res.json({
      success: true,
      message: "Program deleted successfully (attached resources were preserved)",
    });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to delete program" });
  }
};

/**
 * GET /api/admin/programs/:programId/available/:entityType
 * Search and paginate attachable entities for a Program
 */
export const getAvailableEntities = async (req, res) => {
  try {
    const { programId, entityType } = req.params;
    const { search = "", page = 1, limit = 20 } = req.query;

    if (!ENTITY_CONFIG[entityType]) {
      return res.status(400).json({
        success: false,
        message: `Unsupported entity type '${entityType}'. Supported: ${Object.keys(ENTITY_CONFIG).join(", ")}`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ success: false, message: "Invalid program ID format" });
    }

    const program = await Program.findById(programId).lean();
    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    const config = ENTITY_CONFIG[entityType];
    const attachedIds = (program[config.fieldKey] || []).map((id) => id.toString());

    const searchQuery = {};
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (entityType === "students") {
        searchQuery.$or = [{ name: searchRegex }, { email: searchRegex }, { rollNo: searchRegex }];
      } else {
        searchQuery[config.labelField] = searchRegex;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await config.model.countDocuments(searchQuery);
    const items = await config.model
      .find(searchQuery)
      .select(config.selectFields)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const formattedItems = items.map((item) => ({
      ...item,
      isAttached: attachedIds.includes(item._id.toString()),
    }));

    res.json({
      success: true,
      items: formattedItems,
      attachedIds,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Error fetching available entities:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch available entities" });
  }
};

/**
 * POST /api/admin/programs/:programId/attachments/:entityType
 * Attach one or multiple existing entities to a Program
 */
export const attachEntities = async (req, res) => {
  try {
    const { programId, entityType } = req.params;
    const { ids } = req.body;

    if (!ENTITY_CONFIG[entityType]) {
      return res.status(400).json({
        success: false,
        message: `Unsupported entity type '${entityType}'`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ success: false, message: "Invalid program ID format" });
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "ids array is required and cannot be empty" });
    }

    const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Every id in ids must be a valid ObjectId",
        invalidIds,
      });
    }

    const validIds = [...new Set(ids.map((id) => id.toString()))];

    const config = ENTITY_CONFIG[entityType];

    const program = await Program.findById(programId).lean();
    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    // Verify target entities exist
    const existingEntities = await config.model.find({ _id: { $in: validIds } }).select("_id").lean();
    const existingEntityIds = existingEntities.map((e) => e._id);

    if (existingEntityIds.length === 0) {
      return res.status(404).json({ success: false, message: "None of the specified target entities were found" });
    }

    if (entityType === "students") {
      const rawBatchId = req.body?.batchId;
      let selectedBatch = null;
      if (rawBatchId && rawBatchId !== "null") {
        if (!mongoose.Types.ObjectId.isValid(rawBatchId)) {
          return res.status(400).json({ success: false, message: "Invalid batch ID format" });
        }
        selectedBatch = await Batch.findById(rawBatchId).lean();
        if (!selectedBatch) {
          return res.status(404).json({ success: false, message: "Batch not found" });
        }
      }

      const students = await Student.find({ _id: { $in: existingEntityIds } }).lean();
      for (const student of students) {
        if (selectedBatch && student.collegeId && selectedBatch.collegeId && String(student.collegeId) !== String(selectedBatch.collegeId)) {
          return res.status(400).json({
            success: false,
            message: `Selected batch does not belong to ${student.name || "one of the selected students"}.`,
          });
        }

        // Keep the legacy Student.batchId only as a compatibility pointer.
        // The enrollment created below is the authoritative program schedule.
        await Student.updateOne(
          { _id: student._id },
          {
            $set: {
              programId,
              ...(selectedBatch ? { batchId: selectedBatch._id } : {}),
            },
          }
        );

        const user = await User.findOne({
          $or: [
            ...(student.userId ? [{ _id: student.userId }] : []),
            ...(student.email ? [{ email: String(student.email).trim().toLowerCase() }] : []),
          ],
        }).select("_id").lean();

        if (user) {
          await User.updateOne(
            { _id: user._id },
            {
              $set: {
                programId,
                ...(selectedBatch ? { batchId: selectedBatch._id, startDate: selectedBatch.startDate } : {}),
              },
            }
          );
          await upsertProgramEnrollment({
            user,
            student,
            program,
            batchId: selectedBatch?._id || null,
            source: "admin",
          });
        }
      }

      const updatedProgram = await Program.findByIdAndUpdate(
        programId,
        {
          $addToSet: {
            studentIds: { $each: existingEntityIds },
            ...(selectedBatch ? { batchIds: selectedBatch._id } : {}),
          },
          $set: { updatedBy: req.user?._id || null },
        },
        { new: true, runValidators: true }
      )
        .populate(config.fieldKey, config.selectFields)
        .lean();

      return res.json({
        success: true,
        message: `Successfully enrolled ${existingEntityIds.length} student${existingEntityIds.length === 1 ? "" : "s"} ${selectedBatch ? "on the selected batch schedule" : "on individual program schedules"}.`,
        program: updatedProgram,
        attachedEntities: updatedProgram[config.fieldKey],
      });
    }

    const updateQuery = {};
    updateQuery[config.fieldKey] = { $each: existingEntityIds };

    const updatedProgram = await Program.findByIdAndUpdate(
      programId,
      {
        $addToSet: updateQuery,
        $set: { updatedBy: req.user?._id || null },
      },
      { new: true, runValidators: true }
    )
      .populate(config.fieldKey, config.selectFields)
      .lean();

    if (!updatedProgram) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    res.json({
      success: true,
      message: `Successfully attached ${existingEntityIds.length} ${entityType}`,
      program: updatedProgram,
      attachedEntities: updatedProgram[config.fieldKey],
    });
  } catch (error) {
    console.error("Error attaching entities:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to attach entities" });
  }
};

/**
 * DELETE /api/admin/programs/:programId/attachments/:entityType/:entityId
 * Detach an existing entity from a Program (without deleting the entity itself)
 */
export const detachEntity = async (req, res) => {
  try {
    const { programId, entityType, entityId } = req.params;

    if (!ENTITY_CONFIG[entityType]) {
      return res.status(400).json({
        success: false,
        message: `Unsupported entity type '${entityType}'`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(programId) || !mongoose.Types.ObjectId.isValid(entityId)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    const config = ENTITY_CONFIG[entityType];

    if (entityType === "students") {
      const student = await Student.findById(entityId).lean();
      if (student) {
        const user = await User.findOne({
          $or: [
            ...(student.userId ? [{ _id: student.userId }] : []),
            ...(student.email ? [{ email: String(student.email).trim().toLowerCase() }] : []),
          ],
        }).select("_id").lean();
        await pauseProgramEnrollment({ student, user, programId });
        await syncPrimaryProgramPointers({ student, user });
      }
    }

    const updateQuery = {};
    updateQuery[config.fieldKey] = entityId;

    const updatedProgram = await Program.findByIdAndUpdate(
      programId,
      {
        $pull: updateQuery,
        $set: { updatedBy: req.user?._id || null },
      },
      { new: true, runValidators: true }
    )
      .populate(config.fieldKey, config.selectFields)
      .lean();

    if (!updatedProgram) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    res.json({
      success: true,
      message: `Successfully detached entity from ${entityType}`,
      program: updatedProgram,
    });
  } catch (error) {
    console.error("Error detaching entity:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to detach entity" });
  }
};
