import mongoose from "mongoose";
import DailyTaskAttempt from "../models/DailyTaskAttempt.js";
import DailyChallengeAttempt from "../models/DailyChallengeAttempt.js";
import StudentCodingSubmission from "../models/StudentCodingSubmission.js";
import Question from "../models/Questions.js";
import ProgramPerformanceRecord from "../models/ProgramPerformanceRecord.js";
import ProgramPerformanceSummary from "../models/ProgramPerformanceSummary.js";

export const PERFORMANCE_THRESHOLDS = Object.freeze({
  weakBelow: 60,
  strongFrom: 80,
});

export const classifyAccuracy = (accuracy) => {
  if (accuracy === null || accuracy === undefined || String(accuracy).trim() === "") {
    return "Unclassified";
  }
  const value = Number(accuracy);
  if (!Number.isFinite(value)) return "Unclassified";
  if (value < PERFORMANCE_THRESHOLDS.weakBelow) return "Weak";
  if (value >= PERFORMANCE_THRESHOLDS.strongFrom) return "Strong";
  return "Average";
};

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

const getId = (value) => {
  if (!value) return null;
  return value && typeof value === "object" && value._id ? value._id : value;
};

const getIdString = (value) => {
  const id = getId(value);
  return id ? String(id) : "";
};

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toPercent = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(Math.min(100, Math.max(0, parsed)) * 100) / 100;
};

const firstText = (...values) => {
  for (const value of values) {
    if (Array.isArray(value)) {
      const nested = firstText(...value);
      if (nested) return nested;
      continue;
    }
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
};

const mapToObject = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value.entries());
  if (typeof value.toObject === "function") return value.toObject();
  return typeof value === "object" ? value : {};
};

const isTaskAttempted = (task) => Boolean(
  task?.attempted === true
  || ["In Progress", "Completed"].includes(task?.status)
  || task?.completedAt
  || task?.selectedOption
  || task?.code
);

const getTaskAccuracy = (task) => {
  const storedAccuracy = toPercent(task?.accuracy);
  if (storedAccuracy !== null) return storedAccuracy;
  if (task?.isCorrect === true) return 100;
  if (task?.isCorrect === false) return 0;
  return null;
};

const getTaskCorrectness = (task, accuracy) => {
  if (typeof task?.isCorrect === "boolean") return task.isCorrect;
  return accuracy === null ? null : accuracy >= 100;
};

const buildParticipantContext = ({ students = [], enrollments = [] }) => {
  const studentsById = new Map(
    students
      .map((student) => [getIdString(student?._id), student])
      .filter(([id]) => id)
  );
  const enrollmentsByStudentId = new Map();
  for (const enrollment of enrollments) {
    const studentId = getIdString(enrollment?.studentId);
    if (studentId && !enrollmentsByStudentId.has(studentId)) {
      enrollmentsByStudentId.set(studentId, enrollment);
    }
  }

  const participantsByStudentId = new Map();
  const participantsByKey = new Map();

  const register = ({ studentId, userId, email, student = null, enrollment = null }) => {
    if (!studentId) return;

    const existing = participantsByStudentId.get(studentId) || {
      studentId,
      userId: null,
      email: "",
      student: null,
      enrollment: null,
    };

    existing.userId = existing.userId || userId || null;
    existing.email = existing.email || normalizeEmail(email);
    existing.student = existing.student || student || studentsById.get(studentId) || null;
    existing.enrollment = existing.enrollment || enrollment || enrollmentsByStudentId.get(studentId) || null;
    participantsByStudentId.set(studentId, existing);

    const keys = [
      existing.studentId ? `student:${existing.studentId}` : null,
      existing.userId ? `user:${existing.userId}` : null,
      existing.email ? `email:${existing.email}` : null,
    ].filter(Boolean);
    keys.forEach((key) => participantsByKey.set(key, existing));
  };

  for (const enrollment of enrollments) {
    const studentId = getIdString(enrollment?.studentId);
    if (!studentId) continue;
    register({
      studentId,
      userId: getIdString(enrollment?.userId),
      email: studentsById.get(studentId)?.email,
      student: studentsById.get(studentId) || null,
      enrollment,
    });
  }

  for (const student of students) {
    const studentId = getIdString(student?._id);
    if (!studentId) continue;
    register({
      studentId,
      userId: getIdString(student?.userId),
      email: student?.email,
      student,
      enrollment: enrollmentsByStudentId.get(studentId) || null,
    });
  }

  return {
    participants: [...participantsByStudentId.values()],
    resolve: ({ studentId, userId, email }) => {
      const keys = [
        studentId ? `student:${getIdString(studentId)}` : null,
        userId ? `user:${getIdString(userId)}` : null,
        email ? `email:${normalizeEmail(email)}` : null,
      ].filter(Boolean);
      return keys.map((key) => participantsByKey.get(key)).find(Boolean) || null;
    },
  };
};

const getQuestionDimensions = ({ question = null, fallback = {}, taskType = "" }) => {
  const content = question?.content || {};
  const categoryType = firstText(question?.categoryType, fallback.categoryType, taskType);
  const subject = firstText(
    question?.subject,
    content.subject,
    fallback.subject,
    question?.categoryTitle,
    fallback.categoryTitle,
    question?.trackType,
    fallback.trackType,
    categoryType,
    taskType,
    "General"
  );
  const topic = firstText(
    question?.topic,
    content.topic,
    fallback.topic,
    question?.categoryTitle,
    fallback.categoryTitle,
    question?.categorySlug,
    fallback.categorySlug,
    question?.trackType,
    fallback.trackType,
    question?.title,
    subject
  );
  const subtopic = firstText(
    question?.subtopic,
    content.subtopic,
    fallback.subtopic,
    question?.tags?.[0],
    fallback.tags?.[0],
    "General"
  );

  return {
    categoryId: getId(question?.categoryId) || getId(fallback.categoryId) || null,
    categoryType,
    subject,
    topic,
    subtopic,
    difficulty: firstText(question?.difficulty, fallback.difficulty),
  };
};

const buildSourceQuery = ({ programId, batchIds }) => ({
  $or: [
    { programId },
    ...batchIds.map((batchId) => ({ batchId })),
  ],
});

const getRoundProblems = (round, attempt) => {
  if (Array.isArray(round?.problems) && round.problems.length > 0) return round.problems;
  const questionId = getId(round?.questionId) || getId(attempt?.questionId);
  return questionId ? [{ questionId, categoryType: "Coding" }] : [];
};

const isChallengeSubmitted = (attempt) => Boolean(
  ["submitted", "ended", "auto_submitted"].includes(attempt?.status)
  || attempt?.codingSubmissionId
  || attempt?.finalSubmissionId
);

const getMapEntries = (value) => Object.entries(mapToObject(value));

const roundToPercent = (sum, count) => (count > 0 ? Math.round((sum / count) * 100) / 100 : null);

const buildSummaryKey = ({ studentId, programDay, subject, topic, subtopic }) =>
  [studentId, programDay, subject, topic, subtopic].join("::");

const buildPerformanceReport = ({ program, context, records, summaries, includeRecords }) => {
  const recordsByStudent = new Map();
  records.forEach((record) => {
    const key = getIdString(record.studentId);
    const list = recordsByStudent.get(key) || [];
    list.push(record);
    recordsByStudent.set(key, list);
  });

  const summariesByStudent = new Map();
  summaries.forEach((summary) => {
    const key = getIdString(summary.studentId);
    const list = summariesByStudent.get(key) || [];
    list.push(summary);
    summariesByStudent.set(key, list);
  });

  const students = context.participants.map((participant) => {
    const studentId = participant.studentId;
    const studentRecords = recordsByStudent.get(studentId) || [];
    const studentSummaries = summariesByStudent.get(studentId) || [];
    const scoredRecords = studentRecords
      .map((record) => Number(record.accuracy))
      .filter((accuracy) => Number.isFinite(accuracy));
    const accuracy = roundToPercent(
      scoredRecords.reduce((sum, value) => sum + value, 0),
      scoredRecords.length
    );
    const days = new Map();
    studentSummaries.forEach((summary) => {
      const key = String(summary.programDay);
      const day = days.get(key) || {
        programDay: summary.programDay,
        questionsAttempted: 0,
        scoredQuestions: 0,
        correctAnswers: 0,
        accuracyTotal: 0,
        topics: [],
      };
      day.questionsAttempted += Number(summary.questionsAttempted || 0);
      day.scoredQuestions += Number(summary.scoredQuestions || 0);
      day.correctAnswers += Number(summary.correctAnswers || 0);
      if (Number.isFinite(Number(summary.accuracy))) {
        day.accuracyTotal += Number(summary.accuracy) * Number(summary.scoredQuestions || 0);
      }
      day.topics.push({
        subject: summary.subject,
        topic: summary.topic,
        subtopic: summary.subtopic,
        accuracy: summary.accuracy,
        classification: summary.classification,
        questionsAttempted: summary.questionsAttempted,
        correctAnswers: summary.correctAnswers,
      });
      days.set(key, day);
    });

    return {
      studentId,
      userId: participant.userId || null,
      name: participant.student?.name || participant.email || "Unnamed Student",
      email: participant.student?.email || participant.email || "",
      programDay: studentRecords.reduce(
        (max, record) => Math.max(max, Number(record.programDay) || 0),
        0
      ) || null,
      questionsAttempted: studentRecords.length,
      scoredQuestions: scoredRecords.length,
      correctAnswers: studentRecords.filter((record) => record.correct === true).length,
      accuracy,
      classification: classifyAccuracy(accuracy),
      days: [...days.values()]
        .sort((first, second) => first.programDay - second.programDay)
        .map((day) => ({
          ...day,
          accuracy: roundToPercent(day.accuracyTotal, day.scoredQuestions),
          classification: classifyAccuracy(roundToPercent(day.accuracyTotal, day.scoredQuestions)),
          topics: day.topics.sort((first, second) => first.topic.localeCompare(second.topic)),
        })),
    };
  });

  const scoredRecords = records
    .map((record) => Number(record.accuracy))
    .filter((accuracy) => Number.isFinite(accuracy));
  const classificationCounts = summaries.reduce((counts, summary) => {
    const key = summary.classification || "Unclassified";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, { Weak: 0, Average: 0, Strong: 0, Unclassified: 0 });
  const sourceCounts = records.reduce((counts, record) => {
    const key = record.source === "Daily Challenge" ? "dailyChallenge" : "dailyTask";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, { dailyTask: 0, dailyChallenge: 0 });

  return {
    generatedAt: new Date(),
    thresholds: PERFORMANCE_THRESHOLDS,
    program: {
      id: program._id,
      name: program.name,
      programType: program.programType,
      durationDays: Number(program.durationDays) || null,
    },
    stats: {
      questionsAttempted: records.length,
      scoredQuestions: scoredRecords.length,
      correctAnswers: records.filter((record) => record.correct === true).length,
      accuracy: roundToPercent(
        scoredRecords.reduce((sum, value) => sum + value, 0),
        scoredRecords.length
      ),
      classificationCounts,
      sourceCounts,
    },
    students,
    topics: summaries.map((summary) => ({
      studentId: summary.studentId,
      programDay: summary.programDay,
      subject: summary.subject,
      topic: summary.topic,
      subtopic: summary.subtopic,
      questionsAttempted: summary.questionsAttempted,
      scoredQuestions: summary.scoredQuestions,
      correctAnswers: summary.correctAnswers,
      accuracy: summary.accuracy,
      classification: summary.classification,
      sources: summary.sources,
      firstAttemptedAt: summary.firstAttemptedAt,
      lastAttemptedAt: summary.lastAttemptedAt,
    })),
    ...(includeRecords
      ? {
          records: records.map((record) => ({
            id: record._id,
            studentId: record.studentId,
            userId: record.userId,
            programDay: record.programDay,
            source: record.source,
            taskType: record.taskType,
            questionId: record.questionId,
            categoryId: record.categoryId,
            categoryType: record.categoryType,
            subject: record.subject,
            topic: record.topic,
            subtopic: record.subtopic,
            difficulty: record.difficulty,
            attempted: record.attempted,
            correct: record.correct,
            score: record.score,
            accuracy: record.accuracy,
            timeSpentMs: record.timeSpentMs,
            attemptedAt: record.attemptedAt,
          })),
        }
      : {}),
  };
};

export const syncProgramPerformance = async ({
  program,
  enrollments = [],
  students = [],
  includeRecords = false,
}) => {
  const programId = getId(program?._id || program?.id);
  if (!programId || !mongoose.Types.ObjectId.isValid(programId)) {
    throw new Error("A valid program is required to generate performance data.");
  }

  const context = buildParticipantContext({ students, enrollments });
  const participantUserIds = context.participants.map((participant) => participant.userId).filter(Boolean);
  const batchIds = (program.batchIds || [])
    .map((batch) => getId(batch))
    .filter((batchId) => batchId && mongoose.Types.ObjectId.isValid(batchId));
  const sourceQuery = buildSourceQuery({ programId, batchIds });

  const [taskAttempts, challengeAttempts, codingSubmissions] = await Promise.all([
    DailyTaskAttempt.find({
      ...sourceQuery,
      ...(participantUserIds.length ? { userId: { $in: participantUserIds } } : {}),
    })
      .select("userId programId batchId dayNumber tasksProgress updatedAt createdAt")
      .lean(),
    DailyChallengeAttempt.find(sourceQuery)
      .select("codingRoundId studentId batchId programId questionId studentEmail status submittedAt endedAt lastActiveAt updatedAt createdAt codingSubmissionId finalSubmissionId")
      .populate({
        path: "codingRoundId",
        select: "_id dayNumber programId batchId problems questionId trackType",
      })
      .lean(),
    StudentCodingSubmission.find(sourceQuery)
      .select("_id codingRoundId studentId batchId programId questionId attemptId studentEmail problemScores problemSubmitted totalScore lastSubmissionAt submittedAt updatedAt createdAt isRoundEnded")
      .populate({
        path: "codingRoundId",
        select: "_id dayNumber programId batchId problems questionId trackType",
      })
      .lean(),
  ]);

  const questionIds = new Set();
  taskAttempts.forEach((attempt) => {
    (attempt.tasksProgress || []).forEach((task) => {
      const questionId = getIdString(task.questionId);
      if (questionId) questionIds.add(questionId);
    });
  });
  const collectRoundQuestions = (round, attempt = null) => {
    getRoundProblems(round, attempt).forEach((problem) => {
      const questionId = getIdString(problem?.questionId);
      if (questionId) questionIds.add(questionId);
    });
  };
  challengeAttempts.forEach((attempt) => collectRoundQuestions(attempt.codingRoundId, attempt));
  codingSubmissions.forEach((submission) => collectRoundQuestions(submission.codingRoundId));

  const validQuestionIds = [...questionIds].filter((id) => mongoose.Types.ObjectId.isValid(id));
  const questions = validQuestionIds.length
    ? await Question.find({ _id: { $in: validQuestionIds } })
      .select("_id categoryId categoryType categoryTitle categorySlug trackType tags difficulty title subject topic subtopic content")
      .lean()
    : [];
  const questionById = new Map(questions.map((question) => [getIdString(question._id), question]));
  const recordsByKey = new Map();

  const addRecord = ({
    participant,
    source,
    sourceKey,
    sourceRecordId,
    programDay,
    taskType,
    questionId,
    question,
    fallback = {},
    attempted = true,
    correct = null,
    accuracy = null,
    score = accuracy,
    timeSpentMs = null,
    attemptedAt = null,
    sourceUpdatedAt = null,
  }) => {
    const normalizedDay = Number(programDay);
    if (!participant || !sourceKey || !Number.isInteger(normalizedDay) || normalizedDay < 1) return;

    const dimensions = getQuestionDimensions({ question, fallback, taskType });
    const candidate = {
      programId,
      studentId: participant.studentId,
      userId: participant.userId || null,
      programDay: normalizedDay,
      source,
      sourceKey,
      sourceRecordId: getId(sourceRecordId),
      taskType: firstText(taskType, "Unknown"),
      questionId: getId(questionId) || null,
      categoryId: dimensions.categoryId,
      categoryType: dimensions.categoryType,
      subject: dimensions.subject,
      topic: dimensions.topic,
      subtopic: dimensions.subtopic,
      difficulty: dimensions.difficulty,
      attempted: Boolean(attempted),
      correct: typeof correct === "boolean" ? correct : null,
      score: toPercent(score),
      accuracy: toPercent(accuracy),
      timeSpentMs: Number.isFinite(Number(timeSpentMs)) ? Number(timeSpentMs) : null,
      attemptedAt: toDate(attemptedAt),
      sourceUpdatedAt: toDate(sourceUpdatedAt),
    };

    const existing = recordsByKey.get(sourceKey);
    const candidateIsRicher = existing && existing.accuracy === null && candidate.accuracy !== null;
    if (!existing || candidateIsRicher) recordsByKey.set(sourceKey, candidate);
  };

  for (const attempt of taskAttempts) {
    const participant = context.resolve({ userId: attempt.userId });
    if (!participant) continue;

    for (const task of attempt.tasksProgress || []) {
      if (!isTaskAttempted(task)) continue;
      const questionId = getId(task.questionId);
      const question = questionById.get(getIdString(questionId)) || null;
      const accuracy = getTaskAccuracy(task);
      addRecord({
        participant,
        source: "Daily Task",
        sourceKey: `daily-task:${getIdString(attempt._id)}:${getIdString(questionId)}:${task.taskType || "Unknown"}`,
        sourceRecordId: attempt._id,
        programDay: attempt.dayNumber,
        taskType: task.taskType,
        questionId,
        question,
        fallback: { categoryType: task.taskType },
        correct: getTaskCorrectness(task, accuracy),
        accuracy,
        score: accuracy,
        timeSpentMs: task.timeSpentMs || task.timeSpent,
        attemptedAt: task.completedAt || attempt.updatedAt || attempt.createdAt,
        sourceUpdatedAt: attempt.updatedAt || attempt.createdAt,
      });
    }
  }

  const challengeAttemptsById = new Map(
    challengeAttempts.map((attempt) => [getIdString(attempt._id), attempt])
  );

  for (const submission of codingSubmissions) {
    const linkedAttempt = challengeAttemptsById.get(getIdString(submission.attemptId)) || null;
    const participant = context.resolve({
      studentId: submission.studentId || linkedAttempt?.studentId,
      email: submission.studentEmail || linkedAttempt?.studentEmail,
    });
    if (!participant) continue;

    const round = submission.codingRoundId || linkedAttempt?.codingRoundId;
    const problems = getRoundProblems(round, linkedAttempt);
    const scores = mapToObject(submission.problemScores);
    const submitted = mapToObject(submission.problemSubmitted);
    const problemIndexes = new Set([
      ...Object.keys(scores),
      ...Object.keys(submitted),
    ]);
    if (!problemIndexes.size && submission.isRoundEnded && problems.length === 1) {
      problemIndexes.add("0");
    }

    const attemptKey = getIdString(submission.attemptId) || getIdString(linkedAttempt?._id) || getIdString(submission._id);
    for (const index of problemIndexes) {
      const problem = problems[Number(index)] || problems[0] || {};
      const wasSubmitted = submitted[index] === true || Object.prototype.hasOwnProperty.call(scores, index);
      if (!wasSubmitted) continue;

      const rawScore = Object.prototype.hasOwnProperty.call(scores, index)
        ? scores[index]
        : null;
      const accuracy = toPercent(rawScore);
      const questionId = getId(problem.questionId);
      addRecord({
        participant,
        source: "Daily Challenge",
        sourceKey: `daily-challenge:${attemptKey}:${index}`,
        sourceRecordId: submission._id,
        programDay: round?.dayNumber || linkedAttempt?.dayNumber,
        taskType: problem.categoryType || "Coding",
        questionId,
        question: questionById.get(getIdString(questionId)) || null,
        fallback: problem,
        correct: accuracy === null ? null : accuracy >= 100,
        accuracy,
        score: accuracy,
        attemptedAt: submission.lastSubmissionAt || submission.submittedAt || submission.updatedAt || submission.createdAt,
        sourceUpdatedAt: submission.updatedAt || submission.createdAt,
      });
    }
  }

  for (const attempt of challengeAttempts) {
    if (!isChallengeSubmitted(attempt)) continue;
    const participant = context.resolve({
      studentId: attempt.studentId,
      email: attempt.studentEmail,
    });
    if (!participant) continue;

    const round = attempt.codingRoundId;
    const problems = getRoundProblems(round, attempt);
    if (!problems.length) continue;
    const attemptKey = getIdString(attempt._id);
    const questionId = getId(problems[0]?.questionId);
    const sourceKey = `daily-challenge:${attemptKey}:0`;
    if (recordsByKey.has(sourceKey)) continue;

    addRecord({
      participant,
      source: "Daily Challenge",
      sourceKey,
      sourceRecordId: attempt._id,
      programDay: round?.dayNumber || attempt.dayNumber,
      taskType: problems[0]?.categoryType || "Coding",
      questionId,
      question: questionById.get(getIdString(questionId)) || null,
      fallback: problems[0],
      correct: null,
      accuracy: null,
      score: null,
      attemptedAt: attempt.submittedAt || attempt.endedAt || attempt.lastActiveAt || attempt.updatedAt || attempt.createdAt,
      sourceUpdatedAt: attempt.updatedAt || attempt.createdAt,
    });
  }

  const recordsToPersist = [...recordsByKey.values()];
  if (recordsToPersist.length > 0) {
    await ProgramPerformanceRecord.bulkWrite(
      recordsToPersist.map((record) => ({
        updateOne: {
          filter: { programId, sourceKey: record.sourceKey },
          update: { $set: record },
          upsert: true,
        },
      })),
      { ordered: false }
    );
    await ProgramPerformanceRecord.deleteMany({
      programId,
      sourceKey: { $nin: recordsToPersist.map((record) => record.sourceKey) },
    });
  } else {
    await ProgramPerformanceRecord.deleteMany({ programId });
  }

  const persistedRecords = await ProgramPerformanceRecord.find({ programId }).lean();
  const summaryGroups = new Map();
  persistedRecords.forEach((record) => {
    const key = buildSummaryKey({
      studentId: getIdString(record.studentId),
      programDay: record.programDay,
      subject: record.subject,
      topic: record.topic,
      subtopic: record.subtopic,
    });
    const group = summaryGroups.get(key) || {
      programId,
      studentId: record.studentId,
      programDay: record.programDay,
      subject: record.subject,
      topic: record.topic,
      subtopic: record.subtopic,
      summaryKey: key,
      questionsAttempted: 0,
      scoredQuestions: 0,
      correctAnswers: 0,
      accuracyTotal: 0,
      sources: new Set(),
      firstAttemptedAt: null,
      lastAttemptedAt: null,
    };
    group.questionsAttempted += record.attempted === false ? 0 : 1;
    group.scoredQuestions += Number.isFinite(Number(record.accuracy)) ? 1 : 0;
    group.correctAnswers += record.correct === true ? 1 : 0;
    if (Number.isFinite(Number(record.accuracy))) group.accuracyTotal += Number(record.accuracy);
    if (record.source) group.sources.add(record.source);
    const attemptedAt = toDate(record.attemptedAt);
    if (attemptedAt && (!group.firstAttemptedAt || attemptedAt < group.firstAttemptedAt)) group.firstAttemptedAt = attemptedAt;
    if (attemptedAt && (!group.lastAttemptedAt || attemptedAt > group.lastAttemptedAt)) group.lastAttemptedAt = attemptedAt;
    summaryGroups.set(key, group);
  });

  const summariesToPersist = [...summaryGroups.values()].map((group) => {
    const accuracy = roundToPercent(group.accuracyTotal, group.scoredQuestions);
    return {
      programId: group.programId,
      studentId: group.studentId,
      programDay: group.programDay,
      subject: group.subject,
      topic: group.topic,
      subtopic: group.subtopic,
      summaryKey: group.summaryKey,
      questionsAttempted: group.questionsAttempted,
      scoredQuestions: group.scoredQuestions,
      correctAnswers: group.correctAnswers,
      accuracy,
      classification: classifyAccuracy(accuracy),
      sources: [...group.sources],
      firstAttemptedAt: group.firstAttemptedAt,
      lastAttemptedAt: group.lastAttemptedAt,
    };
  });

  if (summariesToPersist.length > 0) {
    await ProgramPerformanceSummary.bulkWrite(
      summariesToPersist.map((summary) => ({
        updateOne: {
          filter: { programId, summaryKey: summary.summaryKey },
          update: { $set: summary },
          upsert: true,
        },
      })),
      { ordered: false }
    );
    await ProgramPerformanceSummary.deleteMany({
      programId,
      summaryKey: { $nin: summariesToPersist.map((summary) => summary.summaryKey) },
    });
  } else {
    await ProgramPerformanceSummary.deleteMany({ programId });
  }

  const persistedSummaries = await ProgramPerformanceSummary.find({ programId })
    .sort({ programDay: 1, subject: 1, topic: 1, subtopic: 1 })
    .lean();

  return buildPerformanceReport({
    program,
    context,
    records: persistedRecords,
    summaries: persistedSummaries,
    includeRecords,
  });
};

export const deleteProgramPerformance = async (programId) => {
  if (!programId) return;
  await Promise.all([
    ProgramPerformanceRecord.deleteMany({ programId }),
    ProgramPerformanceSummary.deleteMany({ programId }),
  ]);
};

export { DAY_IN_MILLISECONDS };
