import Program from "../models/Program.js";
import ProgramEnrollment from "../models/ProgramEnrollment.js";
import ProgramAssignment from "../models/ProgramAssignment.js";
import ProgramPerformanceRecord from "../models/ProgramPerformanceRecord.js";
import ProgramPerformanceSummary from "../models/ProgramPerformanceSummary.js";
import PracticeSubmission from "../models/PracticeSubmission.js";
import DailyTaskAttempt from "../models/DailyTaskAttempt.js";
import DailyChallengeAttempt from "../models/DailyChallengeAttempt.js";
import Batch from "../models/Batch.js";
import LearnerReport from "../models/LearnerReport.js";
import { findStudentForUser } from "../utils/userProfile.js";
import { resolveProgramSchedule, calculateProgramDayNumber } from "../utils/programSchedule.js";

const getId = (value) => value?._id || value?.id || value || null;

const round = (value, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
};

const average = (values) => {
  const numbers = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  return numbers.length ? round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length) : null;
};

const activityFromRecords = (records = []) => {
  const attempted = records.filter((record) => record.attempted !== false);
  const correct = attempted.filter((record) => record.correct === true).length;
  const scores = attempted.map((record) => record.accuracy ?? record.score);
  return {
    attempted: attempted.length,
    correct,
    accuracy: average(scores),
    score: average(scores),
    completed: attempted.length > 0,
    lastAttemptedAt: attempted
      .map((record) => record.attemptedAt || record.sourceUpdatedAt || record.updatedAt)
      .filter(Boolean)
      .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] || null,
  };
};

const assignmentMetrics = (assignment) => {
  const questions = Array.isArray(assignment?.questions) ? assignment.questions : [];
  const answered = questions.filter((question) => question.attempted);
  const correct = answered.filter((question) => question.correct === true).length;
  const scores = answered.map((question) => question.accuracy ?? question.score);
  const score = average(scores);
  return {
    attempted: answered.length,
    total: questions.length,
    correct,
    score,
    completed: assignment?.status === "Completed",
    completedAt: assignment?.completedAt || null,
  };
};

const buildAssessmentTitle = (assignment) => {
  if (assignment.phase === "day_0_readiness") {
    return assignment.isLeadAssessment ? "Free Assessment" : "Readiness Assessment";
  }
  if (assignment.phase === "final_assessment") return "Final Assessment";
  return `Day ${Math.max(1, Number(assignment.programDay || 1))} Assessment`;
};

const upsertReport = async (fields) => LearnerReport.findOneAndUpdate(
  {
    userId: fields.userId,
    kind: fields.kind,
    reportKey: fields.reportKey,
  },
  {
    $set: fields,
  },
  {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  }
).lean();

const loadProgramEnrollment = async ({ userId, programId }) => ProgramEnrollment.findOne({
  userId,
  programId,
  status: { $in: ["Active", "Completed"] },
})
  .sort({ assignedAt: -1, createdAt: -1 })
  .populate("programId", "name description programType duration durationDays status visibility")
  .populate("batchId", "name startDate expiryDate status releaseTime")
  .lean();

export const buildProgramLearnerReport = async ({ user, programId }) => {
  const enrollment = await loadProgramEnrollment({ userId: user?._id, programId });
  if (!enrollment) return null;

  const program = enrollment.programId?._id
    ? enrollment.programId
    : await Program.findById(programId).select("name description programType duration durationDays status visibility").lean();
  if (!program) return null;

  const student = await findStudentForUser({ userId: user._id, email: user.email });
  const schedule = await resolveProgramSchedule({ user, student, programId });
  const batch = schedule.batchId
    ? (enrollment.batchId?._id ? enrollment.batchId : await Batch.findById(schedule.batchId).select("name startDate expiryDate status releaseTime").lean())
    : null;
  const durationDays = Math.max(1, Math.min(730, Number(program.durationDays || program.duration || 30)));
  const currentDay = Math.min(
    durationDays,
    calculateProgramDayNumber({
      batch,
      individualStartDate: schedule.individualStartDate,
    })
  );

  const [records, summaries, assignments, taskAttempts, challengeAttempts] = await Promise.all([
    student?._id
      ? ProgramPerformanceRecord.find({ programId, studentId: student._id }).sort({ programDay: 1, attemptedAt: 1 }).lean()
      : [],
    student?._id
      ? ProgramPerformanceSummary.find({ programId, studentId: student._id }).sort({ programDay: 1, subject: 1, topic: 1, subtopic: 1 }).lean()
      : [],
    ProgramAssignment.find({
      programId,
      userId: user._id,
      status: { $in: ["Generated", "In Progress", "Completed"] },
    }).sort({ programDay: 1, createdAt: 1 }).lean(),
    DailyTaskAttempt.find({ userId: user._id, programId }).select("dayNumber tasksProgress updatedAt createdAt").lean(),
    student?._id
      ? DailyChallengeAttempt.find({ studentId: student._id, programId }).select("status submittedAt endedAt updatedAt createdAt").lean()
      : [],
  ]);

  const recordsByDay = new Map();
  records.forEach((record) => {
    const day = Number(record.programDay);
    if (!Number.isInteger(day) || day < 1) return;
    const entry = recordsByDay.get(day) || { tasks: [], challenges: [], assignments: [] };
    if (record.source === "Daily Task") entry.tasks.push(record);
    else if (record.source === "Daily Challenge") entry.challenges.push(record);
    else entry.assignments.push(record);
    recordsByDay.set(day, entry);
  });

  const assignmentsByDay = new Map();
  assignments.forEach((assignment) => {
    const day = Number(assignment.programDay);
    if (!Number.isInteger(day) || day < 1) return;
    const list = assignmentsByDay.get(day) || [];
    list.push(assignment);
    assignmentsByDay.set(day, list);
  });

  const taskFallbackByDay = new Map(taskAttempts.map((attempt) => [Number(attempt.dayNumber), attempt]));
  const challengeFallback = challengeAttempts.some((attempt) => ["submitted", "ended", "auto_submitted"].includes(attempt.status));
  const days = Array.from({ length: durationDays }, (_, index) => {
    const dayNumber = index + 1;
    const source = recordsByDay.get(dayNumber) || { tasks: [], challenges: [], assignments: [] };
    const task = activityFromRecords(source.tasks);
    const fallbackTask = taskFallbackByDay.get(dayNumber);
    if (!task.completed && fallbackTask) {
      const progress = fallbackTask.tasksProgress || [];
      task.attempted = progress.filter((item) => item.attempted || item.status === "Completed").length;
      task.correct = progress.filter((item) => item.isCorrect === true).length;
      task.completed = Boolean(fallbackTask.isFullyCompleted || progress.some((item) => item.status === "Completed"));
      task.accuracy = average(progress.map((item) => item.accuracy).filter((value) => value !== null && value !== undefined));
      task.score = task.accuracy;
      task.lastAttemptedAt = fallbackTask.updatedAt || fallbackTask.createdAt || null;
    }

    const challenge = activityFromRecords(source.challenges);
    if (!challenge.completed && challengeFallback && dayNumber <= currentDay) {
      challenge.completed = source.challenges.length > 0;
    }

    const dayAssignments = assignmentsByDay.get(dayNumber) || [];
    const completedAssignment = dayAssignments.find((assignment) => assignment.status === "Completed");
    const assignment = completedAssignment ? assignmentMetrics(completedAssignment) : null;
    const scores = [task.score, challenge.score, assignment?.score].filter((value) => value !== null && value !== undefined);
    const completed = Boolean(task.completed || challenge.completed || assignment?.completed);

    return {
      day: dayNumber,
      available: dayNumber <= currentDay,
      completed,
      task,
      challenge,
      assessment: assignment
        ? {
            title: buildAssessmentTitle(completedAssignment),
            ...assignment,
          }
        : null,
      score: average(scores),
    };
  });

  const completedDays = days.filter((day) => day.completed).length;
  const scoredRecords = records.map((record) => record.accuracy ?? record.score);
  const topicPerformance = summaries.map((summary) => ({
    programDay: summary.programDay,
    subject: summary.subject,
    topic: summary.topic,
    subtopic: summary.subtopic,
    attempts: summary.questionsAttempted,
    correct: summary.correctAnswers,
    accuracy: summary.accuracy,
    classification: summary.classification,
  }));
  const snapshot = {
    program: {
      id: program._id,
      name: program.name,
      programType: program.programType,
      durationDays,
    },
    schedule: {
      type: schedule.scheduleType,
      batchId: schedule.batchId || null,
      batchName: batch?.name || null,
      startDate: schedule.scheduleType === "batch" ? batch?.startDate || null : schedule.individualStartDate,
    },
    currentDay,
    completedDays,
    progressPercent: round((completedDays / durationDays) * 100),
    score: average(scoredRecords),
    days,
    topicPerformance,
  };

  return upsertReport({
    userId: user._id,
    studentId: student?._id || null,
    kind: "program",
    reportKey: String(program._id),
    programId: program._id,
    title: program.name,
    type: program.programType || "Program",
    status: enrollment.status,
    score: snapshot.score,
    generatedAt: new Date(),
    sourceUpdatedAt: records
      .map((record) => record.sourceUpdatedAt || record.updatedAt)
      .filter(Boolean)
      .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] || null,
    snapshot,
  });
};

export const buildPracticeLearnerReport = async ({ user }) => {
  const submissions = await PracticeSubmission.find({ userId: user._id }).sort({ submittedAt: -1 }).lean();
  const byTrack = new Map();
  submissions.forEach((submission) => {
    const track = submission.track || "Other";
    const entry = byTrack.get(track) || { practice: track, attempts: 0, correct: 0, score: 0, lastAttemptedAt: null };
    entry.attempts += 1;
    entry.correct += submission.isCorrect ? 1 : 0;
    entry.score += Number(submission.score || 0);
    entry.lastAttemptedAt = entry.lastAttemptedAt || submission.submittedAt || submission.createdAt || null;
    byTrack.set(track, entry);
  });
  const tracks = [...byTrack.values()].map((entry) => ({
    ...entry,
    accuracy: entry.attempts ? round((entry.correct / entry.attempts) * 100) : 0,
  }));
  const snapshot = {
    totalAttempts: submissions.length,
    totalCorrect: submissions.filter((submission) => submission.isCorrect).length,
    totalScore: submissions.reduce((sum, submission) => sum + Number(submission.score || 0), 0),
    accuracy: submissions.length
      ? round((submissions.filter((submission) => submission.isCorrect).length / submissions.length) * 100)
      : 0,
    tracks,
  };
  return upsertReport({
    userId: user._id,
    kind: "practice",
    reportKey: "practice-summary",
    title: "Practice Report",
    type: "Practice",
    status: "Available",
    score: snapshot.accuracy,
    generatedAt: new Date(),
    sourceUpdatedAt: submissions[0]?.submittedAt || submissions[0]?.updatedAt || null,
    snapshot,
  });
};

export const persistAssessmentLearnerReport = async ({ assignment }) => {
  if (!assignment?._id || !assignment.userId || assignment.status !== "Completed") return null;

  const metrics = assignmentMetrics(assignment);
  const programId = getId(assignment.programId);
  const program = assignment.programId?.name
    ? assignment.programId
    : (programId ? await Program.findById(programId).select("name programType").lean() : null);
  const completedAt = assignment.completedAt || assignment.updatedAt || assignment.createdAt || new Date();
  const snapshot = {
    assessmentId: assignment._id,
    programId,
    programName: program?.name || "",
    phase: assignment.phase,
    programDay: assignment.programDay,
    attemptedAt: completedAt,
    totalQuestions: metrics.total,
    answeredQuestions: metrics.attempted,
    correctAnswers: metrics.correct,
    score: metrics.score,
    status: assignment.status,
  };

  return upsertReport({
    userId: assignment.userId,
    studentId: assignment.studentId || null,
    kind: "assessment",
    reportKey: String(assignment._id),
    assessmentId: assignment._id,
    programId,
    title: buildAssessmentTitle(assignment),
    type: assignment.isLeadAssessment ? "Free" : "Program",
    status: assignment.status,
    score: metrics.score,
    generatedAt: completedAt,
    sourceUpdatedAt: assignment.updatedAt || assignment.completedAt || null,
    snapshot,
  });
};

export const buildAssessmentLearnerReports = async ({ user }) => {
  const assignments = await ProgramAssignment.find({
    userId: user._id,
    status: "Completed",
  })
    .populate("programId", "name programType")
    .sort({ completedAt: -1, updatedAt: -1 })
    .lean();

  return Promise.all(assignments.map((assignment) => persistAssessmentLearnerReport({ assignment })));
};

export const getLearnerReports = async ({ user }) => {
  const enrollments = await ProgramEnrollment.find({
    userId: user._id,
    status: { $in: ["Active", "Completed"] },
  })
    .select("programId")
    .lean();
  const programIds = [...new Set(enrollments.map((item) => getId(item.programId)).filter(Boolean).map((id) => String(id)))];
  const [program, practice, assessments] = await Promise.all([
    Promise.all(programIds.map((programId) => buildProgramLearnerReport({ user, programId }))).then((items) => items.filter(Boolean)),
    buildPracticeLearnerReport({ user }),
    buildAssessmentLearnerReports({ user }),
  ]);
  return {
    program,
    practice,
    assessments,
    generatedAt: new Date(),
  };
};

export const getLearnerReport = async ({ user, kind, reportKey }) => {
  if (kind === "program") return buildProgramLearnerReport({ user, programId: reportKey });
  if (kind === "practice") return buildPracticeLearnerReport({ user });
  const report = await LearnerReport.findOne({ userId: user._id, kind, reportKey }).lean();
  return report || null;
};
