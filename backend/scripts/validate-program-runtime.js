import assert from "node:assert/strict";
import mongoose from "mongoose";
import Program from "../models/Program.js";
import Blueprint from "../models/Blueprint.js";
import ProgramAssignment from "../models/ProgramAssignment.js";
import ProgramReadinessLead from "../models/ProgramReadinessLead.js";
import ProgramPerformanceRecord from "../models/ProgramPerformanceRecord.js";
import { BLUEPRINT_TYPES_BY_PROGRAM_TYPE } from "../utils/blueprintTypes.js";
import { buildDefaultProgramPhases, validateAndNormalizeProgramPhases } from "../utils/programPhases.js";
import {
  phaseForDay,
  phaseLabel,
  scoreQuestion,
  selectFreshQuestions,
} from "../services/programQuestionEngineService.js";
import { classifyAccuracy } from "../services/programPerformanceService.js";
import { calculateProgramDayNumber } from "../utils/programSchedule.js";
import {
  getEffectiveEnrollmentBatchId,
  orderAccessibleProgramEnrollments,
} from "../utils/dashboardProgramAccess.js";

const id = () => new mongoose.Types.ObjectId();

const run = () => {
  const placementPhases = buildDefaultProgramPhases("Placement", 30);
  const skillPhases = buildDefaultProgramPhases("Skill", 30);

  assert.equal(placementPhases.length, 5);
  assert.equal(skillPhases.length, 2);
  assert.deepEqual(
    placementPhases.map((phase) => phase.phase),
    ["learning", "revision", "company_preparation", "mock_interview", "final_assessment"]
  );
  assert.deepEqual(
    skillPhases.map((phase) => phase.phase),
    ["learning", "final_assessment"]
  );
  assert.equal(phaseForDay({ durationDays: 30, phases: placementPhases }, 1), "learning");
  assert.equal(phaseForDay({ durationDays: 30, phases: placementPhases }, 23), "revision");
  assert.equal(phaseForDay({ durationDays: 30, phases: placementPhases }, 25), "company_preparation");
  assert.equal(phaseForDay({ durationDays: 30, phases: placementPhases }, 29), "mock_interview");
  assert.equal(phaseForDay({ durationDays: 30, phases: placementPhases }, 30), "final_assessment");
  assert.equal(phaseForDay({ durationDays: 30, phases: placementPhases }, 31), "completed");
  assert.equal(phaseForDay({ durationDays: 30, phases: skillPhases }, 29), "learning");
  assert.equal(phaseForDay({ durationDays: 30, phases: skillPhases }, 30), "final_assessment");
  assert.equal(phaseLabel("company_preparation"), "Company Preparation");

  const individualStartDate = new Date("2026-08-10T00:00:00.000Z");
  assert.equal(
    calculateProgramDayNumber({
      batch: null,
      individualStartDate,
      now: new Date("2026-08-10T12:00:00.000Z"),
    }),
    1
  );
  assert.equal(
    calculateProgramDayNumber({
      batch: null,
      individualStartDate,
      now: new Date("2026-08-11T12:00:00.000Z"),
    }),
    2
  );

  const individualEnrollment = { programId: id(), batchId: null };
  assert.equal(
    getEffectiveEnrollmentBatchId({
      enrollment: individualEnrollment,
      studentBatchId: id(),
      userBatchId: id(),
    }),
    null,
    "An explicit null batch must keep the learner on an individual schedule"
  );

  const legacyEnrollment = { programId: id() };
  const legacyBatchId = id();
  assert.equal(
    String(getEffectiveEnrollmentBatchId({ enrollment: legacyEnrollment, studentBatchId: legacyBatchId })),
    String(legacyBatchId),
    "Old enrollments without batchId should retain their legacy batch fallback"
  );

  const preferredProgramId = id();
  const newestProgramId = id();
  const staleProgramId = id();
  const orderedEnrollments = orderAccessibleProgramEnrollments({
    preferredProgramId,
    accessibleProgramIds: [preferredProgramId, newestProgramId],
    enrollments: [
      { programId: newestProgramId, assignedAt: new Date("2026-08-19T00:00:00.000Z") },
      { programId: staleProgramId, assignedAt: new Date("2026-08-20T00:00:00.000Z") },
      { programId: preferredProgramId, assignedAt: new Date("2026-08-01T00:00:00.000Z") },
    ],
  });
  assert.equal(String(orderedEnrollments[0].programId), String(preferredProgramId));
  assert.equal(orderedEnrollments.some((enrollment) => String(enrollment.programId) === String(staleProgramId)), false);

  assert.equal(classifyAccuracy(59), "Weak");
  assert.equal(classifyAccuracy(60), "Average");
  assert.equal(classifyAccuracy(79), "Average");
  assert.equal(classifyAccuracy(80), "Strong");
  assert.equal(classifyAccuracy(null), "Unclassified");

  const invalidPhases = validateAndNormalizeProgramPhases({
    programType: "Placement",
    durationDays: 30,
    phases: [
      { phase: "learning", startDay: 1, endDay: 20 },
      { phase: "revision", startDay: 22, endDay: 24 },
      { phase: "company_preparation", startDay: 25, endDay: 28 },
      { phase: "mock_interview", startDay: 29, endDay: 29 },
      { phase: "final_assessment", startDay: 30, endDay: 30 },
    ],
  });
  assert.match(invalidPhases.error, /contiguous|gaps|overlaps/i);

  assert.deepEqual(BLUEPRINT_TYPES_BY_PROGRAM_TYPE.Placement, [
    "day_0_readiness",
    "revision",
    "company_preparation",
    "final_assessment",
  ]);
  assert.deepEqual(BLUEPRINT_TYPES_BY_PROGRAM_TYPE.Skill, ["day_0_readiness", "final_assessment"]);

  const questionA = { _id: id(), roles: ["Frontend Developer"], companies: ["Accenture"], subject: "DSA", topic: "Arrays", subtopic: "Sliding Window", usage: "Both" };
  const questionB = { _id: id(), roles: ["Backend Developer"], companies: ["TCS"], subject: "DSA", topic: "Arrays", subtopic: "Two Pointer", usage: "Assessment" };
  const scored = scoreQuestion({
    question: questionA,
    profile: { targetRole: "Frontend Developer", targetCompanies: ["Accenture"] },
    summaries: [{ subject: "DSA", topic: "Arrays", subtopic: "Sliding Window", classification: "Weak" }],
    phase: "company_preparation",
  });
  assert.ok(scored.score > 0);
  assert.equal(scored.reason, "Weak topic match");

  const fresh = selectFreshQuestions({
    candidates: [{ question: questionA }, { question: questionA }, { question: questionB }],
    requested: 5,
    excludedIds: [questionB._id],
  });
  assert.equal(fresh.length, 1);
  assert.equal(String(fresh[0].question._id), String(questionA._id));

  assert.equal(Program.schema.path("programType").isRequired, true);
  assert.equal(Blueprint.schema.path("configurations").isRequired, true);
  assert.equal(ProgramAssignment.schema.path("phase").isRequired, true);
  assert.equal(ProgramReadinessLead.schema.path("status").enumValues.includes("Converted"), true);
  assert.equal(ProgramPerformanceRecord.schema.path("source").enumValues.includes("Program Assignment"), true);

  console.log("Program runtime validation passed: phases, blueprint taxonomy, matching priority, fallback-safe duplicate prevention, performance classification, and schema wiring.");
};

run();
