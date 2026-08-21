import mongoose from "mongoose";
import Program from "../models/Program.js";
import ProgramEnrollment from "../models/ProgramEnrollment.js";
import ProgramAssignment from "../models/ProgramAssignment.js";
import ProgramPerformanceSummary from "../models/ProgramPerformanceSummary.js";
import Blueprint from "../models/Blueprint.js";
import Question from "../models/Questions.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import Batch from "../models/Batch.js";
import {
  BLUEPRINT_TYPES_BY_PROGRAM_TYPE,
  normalizeBlueprintType,
} from "../utils/blueprintTypes.js";
import { calculateProgramDayNumber, resolveProgramSchedule } from "../utils/programSchedule.js";

const PHASE_BLUEPRINT_TYPES = Object.freeze({
  revision: "revision",
  company_preparation: "company_preparation",
  final_assessment: "final_assessment",
  day_0_readiness: "day_0_readiness",
});

const PRIORITY_BY_CLASSIFICATION = Object.freeze({
  Weak: 300,
  Average: 200,
  Strong: 100,
  Unclassified: 0,
});

const getId = (value) => value?._id || value?.id || value || null;
const getIdString = (value) => {
  const id = getId(value);
  return id ? String(id) : "";
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const uniqueStrings = (values = []) => [
  ...new Set(
    (Array.isArray(values) ? values : [values])
      .map((value) => String(value || "").trim())
      .filter(Boolean)
  ),
];

const escapeRegex = (value) => String(value || "").replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");

const isValidId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));

const phaseForDay = (program, dayNumber) => {
  const day = Number(dayNumber);
  if (!Number.isInteger(day) || day < 1) return "day_0_readiness";
  if (Number(program?.durationDays) > 0 && day > Number(program.durationDays)) return "completed";

  const phase = (program?.phases || []).find(
    (item) => day >= Number(item.startDay) && day <= Number(item.endDay)
  );
  return phase?.phase || "learning";
};

const phaseLabel = (phase) => ({
  day_0_readiness: "Day 0 Placement Readiness",
  learning: "Structured Learning",
  revision: "Revision",
  company_preparation: "Company Preparation",
  mock_interview: "Mock Interview",
  final_assessment: "Final Assessment",
  completed: "Completed",
}[phase] || phase);

const getLearnerRecord = async ({ user, student = null }) => {
  if (student) return student;
  const identifiers = [
    user?._id ? { userId: user._id } : null,
    user?.email ? { email: String(user.email).trim().toLowerCase() } : null,
  ].filter(Boolean);
  if (!identifiers.length) return null;
  return Student.findOne({ $or: identifiers }).lean();
};

const getUserRecord = async (user) => {
  if (!user) return null;
  if (user._id && user.firstName !== undefined) return user;
  return User.findById(getId(user)).select("-password").lean();
};

const buildProfile = ({ user, student }) => ({
  targetRole: String(student?.targetRole || user?.targetRole || student?.otherTargetRole || user?.otherTargetRole || "").trim(),
  targetCompanies: uniqueStrings(student?.targetCompanies?.length ? student.targetCompanies : user?.targetCompanies || []),
  learningGoal: String(student?.learningGoal || user?.learningGoal || "").trim(),
  skills: uniqueStrings(student?.skills?.length ? student.skills : user?.skills || []),
  placementCategory: String(student?.placementCategory || user?.placementCategory || "").trim(),
});

export const getProgramLearningContext = async ({
  user,
  programId,
  student: providedStudent = null,
  allowUnenrolled = false,
  now = new Date(),
}) => {
  if (!isValidId(programId)) {
    const error = new Error("A valid programId is required.");
    error.statusCode = 400;
    throw error;
  }

  const [program, userRecord, student] = await Promise.all([
    Program.findById(programId)
      .populate("courseIds", "_id title description level courseType numTopics")
      .populate("roadmapIds", "_id title description status")
      .populate("trackTemplateIds", "_id name trackType description totalDays status")
      .populate("projectIds", "_id title description category duration_days status")
      .lean(),
    getUserRecord(user),
    getLearnerRecord({ user, student: providedStudent }),
  ]);

  if (!program) {
    const error = new Error("Program not found.");
    error.statusCode = 404;
    throw error;
  }

  const isAdmin = userRecord?.role === "admin";
  if (!isAdmin && (program.status !== "Active" || program.visibility !== "Public")) {
    const error = new Error("Program is not available.");
    error.statusCode = 404;
    throw error;
  }

  const enrollment = await ProgramEnrollment.findOne({
    userId: getId(userRecord || user),
    programId,
    status: { $in: ["Active", "Completed"] },
  })
    .sort({ assignedAt: -1, createdAt: -1 })
    .lean();

  const legacyEnrollment =
    !enrollment &&
    (getIdString(userRecord?.programId) === String(programId) || getIdString(student?.programId) === String(programId));
  const isEnrolled = Boolean(enrollment || legacyEnrollment);

  if (!isEnrolled && !allowUnenrolled && !isAdmin) {
    const error = new Error("You do not have an active enrollment in this program.");
    error.statusCode = 403;
    throw error;
  }

  const canAccessFreeReadiness = allowUnenrolled
    && !enrollment
    && program.programType === "Placement";
  if (!isAdmin && program.pricingType === "Paid" && !canAccessFreeReadiness && (!enrollment || enrollment.accessTier !== "Member")) {
    const error = new Error("Paid program access requires a verified enrollment.");
    error.statusCode = 403;
    throw error;
  }

  let schedule = null;
  let batch = null;
  let programDay = 0;
  let phase = "day_0_readiness";

  if (isEnrolled) {
    schedule = await resolveProgramSchedule({
      user: userRecord || user,
      student,
      programId,
    });
    if (schedule.batchId) {
      batch = await Batch.findById(schedule.batchId).lean();
    }

    if (schedule.batchExpired || (batch && batch.status !== "Active")) {
      const error = new Error("This batch has ended and program access has been revoked.");
      error.statusCode = 403;
      throw error;
    }

    programDay = calculateProgramDayNumber({
      batch,
      individualStartDate: schedule.individualStartDate,
      now,
    });
    phase = phaseForDay(program, programDay);
  }

  return {
    program,
    user: userRecord || user,
    student,
    enrollment,
    schedule,
    batch,
    isEnrolled,
    programDay,
    phase,
    phaseLabel: phaseLabel(phase),
    profile: buildProfile({ user: userRecord || user, student }),
  };
};

const buildCategoryQuery = (configuration) => {
  const categoryId = getIdString(configuration?.categoryId);
  if (isValidId(categoryId)) return { categoryId };

  const category = String(configuration?.category || "").trim();
  if (!category) return {};

  const pattern = new RegExp(escapeRegex(category), "i");
  return {
    $or: [
      { categoryTitle: pattern },
      { categorySlug: pattern },
      { trackType: pattern },
      { tags: pattern },
    ],
  };
};

const normalizeQuestionList = (question) => [
  ...uniqueStrings(question?.roles || []),
  ...uniqueStrings(question?.companies || []),
  ...uniqueStrings(question?.tags || []),
  String(question?.role || "").trim(),
  String(question?.company || "").trim(),
].filter(Boolean).map(normalizeText);

const hasTokenMatch = (values, target) => {
  const normalizedTarget = normalizeText(target);
  if (!normalizedTarget) return false;
  return values.some((value) => value === normalizedTarget || value.includes(normalizedTarget) || normalizedTarget.includes(value));
};

const getPerformanceMatch = (question, summaries = []) => {
  const subject = normalizeText(question?.subject);
  const topic = normalizeText(question?.topic);
  const subtopic = normalizeText(question?.subtopic);
  if (!subject && !topic && !subtopic) return null;

  const exact = summaries.find((summary) =>
    normalizeText(summary.subject) === subject &&
    normalizeText(summary.topic) === topic &&
    normalizeText(summary.subtopic) === subtopic
  );
  if (exact) return exact;

  const topicMatch = summaries.find((summary) =>
    topic &&
    normalizeText(summary.topic) === topic &&
    (!subject || normalizeText(summary.subject) === subject)
  );
  return topicMatch || null;
};

export const scoreQuestion = ({ question, profile, summaries, phase, configuration = {} }) => {
  const performance = getPerformanceMatch(question, summaries);
  const questionDimensions = normalizeQuestionList(question);
  const roleMatch = hasTokenMatch(questionDimensions, profile.targetRole);
  const companyMatch = profile.targetCompanies.some((company) => hasTokenMatch(questionDimensions, company));
  const subjectMatch = summaries.some((summary) =>
    normalizeText(summary.subject) &&
    normalizeText(summary.subject) === normalizeText(question.subject)
  );
  const exactTopicMatch = Boolean(performance && normalizeText(performance.topic) === normalizeText(question.topic));

  let score = 0;
  if (roleMatch) score += 90;
  if (companyMatch) score += phase === "company_preparation" ? 140 : 45;
  if (subjectMatch) score += 25;
  if (exactTopicMatch) score += 75;
  const performancePriority = phase === "revision"
    ? { Weak: 1000, Average: 600, Strong: 300, Unclassified: 0 }
    : PRIORITY_BY_CLASSIFICATION;
  if (performance) score += performancePriority[performance.classification] || 0;
  if (question.usage === "Assessment") score += 30;
  if (question.usage === "Both") score += 20;

  const configuredDifficulty = String(configuration.difficulty || "Any");
  if (configuredDifficulty !== "Any" && question.difficulty === configuredDifficulty) score += 35;
  const configuredPattern = normalizeText(configuration.pattern);
  if (configuredPattern && normalizeText(question.pattern).includes(configuredPattern)) score += 35;

  return {
    score,
    performance,
    reason: performance?.classification
      ? performance.classification + " topic match"
      : companyMatch
        ? "Target company match"
        : roleMatch
          ? "Target role match"
          : "Category fallback",
  };
};

export const selectFreshQuestions = ({
  candidates = [],
  requested = 0,
  excludedIds = [],
  selectedIds = [],
}) => {
  const excluded = new Set([...excludedIds, ...selectedIds].map((id) => String(id)));
  const selected = [];
  for (const candidate of candidates) {
    const id = getIdString(candidate?.question?._id || candidate?._id);
    if (!id || excluded.has(id)) continue;
    excluded.add(id);
    selected.push(candidate);
    if (selected.length >= Math.max(0, Number(requested) || 0)) break;
  }
  return selected;
};

const questionProjection = [
  "_id",
  "title",
  "description",
  "difficulty",
  "categoryId",
  "categoryType",
  "categorySlug",
  "categoryTitle",
  "trackType",
  "tags",
  "roles",
  "companies",
  "pattern",
  "usage",
  "subject",
  "topic",
  "subtopic",
  "content",
].join(" ");

const loadCandidates = async (configuration) => {
  const categoryQuery = buildCategoryQuery(configuration);
  const query = {
    status: "Active",
    isActive: { $ne: false },
    ...categoryQuery,
  };

  // Dynamic assignments are assessments. Practice-only questions stay in the
  // regular practice flow and cannot leak into readiness/revision/company/
  // final assignments. Missing usage on legacy records is treated as Both.
  query.$and = [
    {
      $or: [
        { usage: { $in: ["Assessment", "Both"] } },
        { usage: { $exists: false } },
      ],
    },
    ...(Array.isArray(categoryQuery.$or) ? [{ $or: categoryQuery.$or }] : []),
  ];
  delete query.$or;

  if (configuration?.difficulty && configuration.difficulty !== "Any") {
    query.difficulty = configuration.difficulty;
  }
  if (configuration?.pattern) {
    query.pattern = new RegExp(escapeRegex(configuration.pattern), "i");
  }

  return Question.find(query)
    .select(questionProjection)
    .populate("categoryId", "title slug categoryType")
    .limit(500)
    .lean();
};

const getPreviouslyUsedQuestionIds = async ({ programId, userId }) => {
  const previous = await ProgramAssignment.find({
    programId,
    userId,
  })
    .select("questions.questionId")
    .lean();

  return new Set(
    previous.flatMap((assignment) => assignment.questions || [])
      .map((question) => getIdString(question.questionId))
      .filter(Boolean)
  );
};

export const getRuntimeBlueprint = async ({ program, blueprintType, allowDraft = false }) => {
  const normalizedType = normalizeBlueprintType(blueprintType);
  const allowedTypes = BLUEPRINT_TYPES_BY_PROGRAM_TYPE[program?.programType] || [];
  if (!normalizedType || !allowedTypes.includes(normalizedType)) {
    const error = new Error("Blueprint type " + (blueprintType || "unknown") + " is not available for this program.");
    error.statusCode = 400;
    throw error;
  }

  const statuses = allowDraft ? ["Active", "Draft"] : ["Active"];
  const blueprint = await Blueprint.findOne({
    programId: program._id,
    blueprintType: normalizedType,
    status: { $in: statuses },
  })
    .sort({ status: 1, updatedAt: -1 })
    .lean();

  if (!blueprint) {
    const error = new Error("No active " + normalizedType.replace(/_/g, " ") + " Blueprint is configured for this program.");
    error.statusCode = 409;
    throw error;
  }

  return blueprint;
};

export const selectQuestionsForBlueprint = async ({
  program,
  blueprint,
  profile,
  summaries = [],
  userId,
  phase,
}) => {
  const previouslyUsed = await getPreviouslyUsedQuestionIds({
    programId: program._id,
    userId,
  });
  const selectedIds = new Set();
  const questions = [];
  const shortfalls = [];
  let requestedQuestionCount = 0;

  for (const configuration of blueprint.configurations || []) {
    const requested = Math.max(0, Number(configuration.questionCount || 0));
    requestedQuestionCount += requested;
    if (!requested) continue;

    const candidates = (await loadCandidates(configuration))
      .map((question) => ({
        question,
        ...scoreQuestion({ question, profile, summaries, phase, configuration }),
      }))
      .sort((left, right) => right.score - left.score || String(left.question._id).localeCompare(String(right.question._id)));

    const selected = selectFreshQuestions({
      candidates,
      requested,
      excludedIds: previouslyUsed,
      selectedIds,
    });

    selected.forEach(({ question, reason }) => {
      const id = getIdString(question._id);
      selectedIds.add(id);
      questions.push({
        questionId: question._id,
        categoryId: getId(question.categoryId),
        category: question.categoryId?.title || question.categoryTitle || configuration.category || "",
        categoryType: question.categoryType || question.categoryId?.categoryType || "",
        subject: question.subject || "",
        topic: question.topic || "",
        subtopic: question.subtopic || "",
        difficulty: question.difficulty || "Easy",
        selectionReason: reason,
      });
    });

    if (selected.length < requested) {
      shortfalls.push({
        categoryId: getId(configuration.categoryId),
        category: configuration.category || "",
        requested,
        assigned: selected.length,
      });
    }
  }

  return {
    questions: questions.map((question, index) => ({ ...question, order: index + 1 })),
    requestedQuestionCount,
    generatedQuestionCount: questions.length,
    shortfalls,
  };
};

const serializeQuestion = (question) => {
  const content = question?.content || {};
  const category = question?.categoryId && typeof question.categoryId === "object" ? question.categoryId : null;

  return {
    id: String(question._id),
    title: question.title || "Untitled question",
    description: question.description || "",
    difficulty: question.difficulty || "Easy",
    category: category?.title || question.categoryTitle || question.trackType || "",
    categoryType: question.categoryType || category?.categoryType || "Coding",
    trackType: question.trackType || "",
    categorySlug: category?.slug || question.categorySlug || "",
    subject: question.subject || "",
    topic: question.topic || "",
    subtopic: question.subtopic || "",
    roles: question.roles || [],
    companies: question.companies || [],
    pattern: question.pattern || "",
    options: content.options || [],
    visibleTestCases: content.visibleTestCases || question.visibleTestCases || [],
    starterCode: content.starterCode || {},
    markdownBody: content.markdownBody || "",
    editorial: question.editorial || content.solutionNotes || content.explanation || "",
  };
};

export const serializeAssignment = async (assignment, { includeQuestionContent = true } = {}) => {
  if (!assignment) return null;

  const questionIds = (assignment.questions || []).map((item) => item.questionId).filter(Boolean);
  const questionDocs = includeQuestionContent && questionIds.length
    ? await Question.find({ _id: { $in: questionIds } })
      .select(questionProjection)
      .populate("categoryId", "title slug categoryType")
      .lean()
    : [];
  const questionById = new Map(questionDocs.map((question) => [getIdString(question._id), question]));

  return {
    id: assignment._id,
    programId: assignment.programId,
    userId: assignment.userId,
    studentId: assignment.studentId,
    blueprintId: assignment.blueprintId,
    phase: assignment.phase,
    programDay: assignment.programDay,
    status: assignment.status,
    isLeadAssessment: assignment.isLeadAssessment,
    targetRole: assignment.targetRole,
    targetCompanies: assignment.targetCompanies || [],
    requestedQuestionCount: assignment.requestedQuestionCount,
    generatedQuestionCount: assignment.generatedQuestionCount,
    shortfalls: assignment.shortfalls || [],
    completedAt: assignment.completedAt,
    questions: (assignment.questions || []).map((item) => ({
      id: item._id,
      order: item.order,
      questionId: item.questionId,
      category: item.category,
      categoryType: item.categoryType,
      subject: item.subject,
      topic: item.topic,
      subtopic: item.subtopic,
      difficulty: item.difficulty,
      selectionReason: item.selectionReason,
      attempted: item.attempted,
      correct: item.correct,
      score: item.score,
      accuracy: item.accuracy,
      attemptedAt: item.attemptedAt,
      completedAt: item.completedAt,
      question: includeQuestionContent ? serializeQuestion(questionById.get(getIdString(item.questionId)) || {
        _id: item.questionId,
        title: "Question unavailable",
        categoryTitle: item.category,
        categoryType: item.categoryType,
        subject: item.subject,
        topic: item.topic,
        subtopic: item.subtopic,
        difficulty: item.difficulty,
      }) : undefined,
    })),
  };
};

export const getOrCreateProgramAssignment = async ({
  context,
  phase,
  programDay,
  force = false,
  allowDraft = false,
}) => {
  const normalizedPhase = normalizeBlueprintType(phase);
  const blueprintType = PHASE_BLUEPRINT_TYPES[normalizedPhase];
  if (!blueprintType) {
    const error = new Error("Phase " + phase + " does not have a dynamic Blueprint assignment.");
    error.statusCode = 400;
    throw error;
  }

  const userId = getId(context.user);
  if (!userId) {
    const error = new Error("Authenticated user is required.");
    error.statusCode = 401;
    throw error;
  }

  const existing = await ProgramAssignment.findOne({
    programId: context.program._id,
    userId,
    phase: normalizedPhase,
    programDay: Number(programDay),
  });
  if (existing && !force) return existing;

  const blueprint = await getRuntimeBlueprint({
    program: context.program,
    blueprintType,
    allowDraft,
  });
  const summaries = context.student?._id
    ? await ProgramPerformanceSummary.find({
      programId: context.program._id,
      studentId: context.student._id,
    }).lean()
    : [];
  const selected = await selectQuestionsForBlueprint({
    program: context.program,
    blueprint,
    profile: context.profile,
    summaries,
    userId,
    phase: normalizedPhase,
  });

  const payload = {
    programId: context.program._id,
    userId,
    studentId: context.student?._id || null,
    enrollmentId: context.enrollment?._id || null,
    blueprintId: blueprint._id,
    phase: normalizedPhase,
    programDay: Number(programDay),
    status: existing?.status === "Completed" ? "Completed" : "Generated",
    isLeadAssessment: normalizedPhase === "day_0_readiness",
    targetRole: context.profile.targetRole,
    targetCompanies: context.profile.targetCompanies,
    learningGoal: context.profile.learningGoal,
    questions: selected.questions,
    requestedQuestionCount: selected.requestedQuestionCount,
    generatedQuestionCount: selected.generatedQuestionCount,
    shortfalls: selected.shortfalls,
    metadata: {
      programType: context.program.programType,
      blueprintType,
      generatedAt: new Date(),
    },
  };

  return ProgramAssignment.findOneAndUpdate(
    {
      programId: context.program._id,
      userId,
      phase: normalizedPhase,
      programDay: Number(programDay),
    },
    { $set: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export const getOwnedAssignment = async ({ assignmentId, userId, programId }) => {
  if (!isValidId(assignmentId) || !isValidId(programId)) return null;
  return ProgramAssignment.findOne({
    _id: assignmentId,
    programId,
    userId,
  });
};

export const getCurrentProgramAssignment = async (context, { allowDraft = false } = {}) => {
  if (!context.isEnrolled) {
    if (context.program.programType !== "Placement") return null;
    return getOrCreateProgramAssignment({
      context,
      phase: "day_0_readiness",
      programDay: 0,
      allowDraft,
    });
  }

  if (!["revision", "company_preparation", "final_assessment"].includes(context.phase)) {
    return null;
  }

  return getOrCreateProgramAssignment({
    context,
    phase: context.phase,
    programDay: context.programDay,
    allowDraft,
  });
};

export const getRevisionMaterials = async ({ context, limit = 8 }) => {
  if (!context?.student?._id) return [];
  const summaries = await ProgramPerformanceSummary.find({
    programId: context.program._id,
    studentId: context.student._id,
    classification: "Weak",
  })
    .sort({ accuracy: 1, questionsAttempted: -1 })
    .limit(limit)
    .lean();

  if (!summaries.length) return [];
  const clauses = summaries.flatMap((summary) => {
    const values = [summary.subject, summary.topic, summary.subtopic]
      .filter(Boolean)
      .map((value) => new RegExp(escapeRegex(value), "i"));
    return values.flatMap((pattern) => [
      { subject: pattern },
      { topic: pattern },
      { subtopic: pattern },
      { tags: pattern },
    ]);
  });

  const notes = clauses.length
    ? await Question.find({
      status: "Active",
      isActive: { $ne: false },
      categoryType: "Notes",
      $or: clauses,
    })
      .select(questionProjection)
      .populate("categoryId", "title slug categoryType")
      .limit(limit)
      .lean()
    : [];

  return summaries.map((summary) => ({
    subject: summary.subject,
    topic: summary.topic,
    subtopic: summary.subtopic,
    accuracy: summary.accuracy,
    classification: summary.classification,
    resources: notes
      .filter((note) => [note.subject, note.topic, note.subtopic, ...(note.tags || [])]
        .some((value) => [summary.subject, summary.topic, summary.subtopic]
          .filter(Boolean)
          .some((target) => normalizeText(value) === normalizeText(target))))
      .slice(0, 3)
      .map(serializeQuestion),
  }));
};

export const getProgramAssignmentQuestion = async ({ assignment, questionId }) => {
  const item = (assignment?.questions || []).find(
    (question) => getIdString(question.questionId) === String(questionId)
  );
  return item || null;
};

export { PHASE_BLUEPRINT_TYPES, phaseForDay, phaseLabel, getIdString };
