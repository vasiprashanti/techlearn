import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Student from "../models/Student.js";
import ProgramEnrollment from "../models/ProgramEnrollment.js";
import Batch from "../models/Batch.js";
import { expireBatchIfNeeded } from "../utils/batchLifecycle.js";
import { calculateCurrentDayNumber } from "../utils/trackAssignmentSchedule.js";
import { getTopicDayNumber } from "../utils/courseTopicSchedule.js";
import { resolveProgramPrimaryCourseId, isProgramPrimaryCourseMappingValid } from "../utils/programPrimaryCourse.js";
import { getProgramTypeQueryValues, normalizeProgramType } from "../utils/programTypeNormalization.js";
import { upsertProgramEnrollment } from "../utils/programEnrollment.js";
import { getProgramAccessExpiryDate, resolveProgramAccessDurationDays } from "../utils/programPricing.js";
import { resolveSafeLegacyIndividualStartDate } from "../utils/programEnrollmentDate.js";
import { isProgramAccessibleToLearner, isUserVisibleProgram } from "../utils/programVisibility.js";
import {
  buildPublicCourseConditions,
  hasPublicFreeProgramLink,
} from "../utils/courseVisibility.js";
import {
  chooseProgramScheduleEnrollment,
  isCompletedProgramSchedule,
  isProgramResourceLocked,
} from "../utils/programSchedule.js";
import { isProgramLearningSelection } from "../utils/programTypeNormalization.js";
import { requireProgramLearning } from "../middleware/authMiddleware.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const id = () => new mongoose.Types.ObjectId();

test("batch lifecycle resolves ObjectIds as IDs, not populated Batch documents", async () => {
  const batchId = id();
  const originalFindById = Batch.findById;
  let requestedId;
  Batch.findById = (value) => {
    requestedId = value;
    return { select() { return this; }, lean: async () => ({
      _id: batchId, status: "Active", expiryDate: new Date(Date.now() + 86400000),
    }) };
  };
  try {
    const result = await expireBatchIfNeeded(batchId);
    assert.equal(String(requestedId), String(batchId));
    assert.equal(result.batch.status, "Active");
    assert.equal(result.expired, false);
  } finally {
    Batch.findById = originalFindById;
  }
});

test("daily tracks use Program duration instead of a malformed one-day template", () => {
  const start = new Date("2026-08-01T00:00:00.000Z");
  const currentDay = calculateCurrentDayNumber(
    null,
    { totalDays: 1, defaultReleaseTime: "00:00", dayAssignments: [{ dayNumber: 1 }] },
    "Daily Task",
    start,
    { programDurationDays: 30, now: new Date(start.getTime() + (12 * DAY_MS) + (6 * 60 * 60 * 1000)) },
  );
  assert.equal(currentDay, 13);
});

test("batch schedule bounds a daily track even when the template has extra days", () => {
  const currentDay = calculateCurrentDayNumber(
    { startDate: "2026-08-01T00:00:00.000Z", expiryDate: "2026-08-05T00:00:00.000Z", releaseTime: "00:00" },
    { totalDays: 1, defaultReleaseTime: "00:00", dayAssignments: [{ dayNumber: 1 }] },
    "Daily Challenge",
    null,
    { programDurationDays: 30, now: new Date("2026-08-10T12:00:00.000Z") },
  );
  assert.equal(currentDay, 5);
});

test("explicit primary course remains stable when course order changes", () => {
  const primary = id();
  const supporting = id();
  const program = { primaryCourseId: primary, courseIds: [supporting, primary] };
  assert.equal(String(resolveProgramPrimaryCourseId(program)), String(primary));
  assert.equal(isProgramPrimaryCourseMappingValid(program), true);
});

test("topic day gaps do not renumber later persisted topics", () => {
  assert.equal(getTopicDayNumber({ index: 1 }, 0), 1);
  assert.equal(getTopicDayNumber({ index: 3 }, 1), 3);
  assert.equal(getTopicDayNumber({}, 3), 4);
});

test("legacy Program types normalize to canonical values and query aliases", () => {
  assert.equal(normalizeProgramType("Placement Sprint"), "Placement");
  assert.equal(normalizeProgramType("Full Stack Project Program"), "Skill");
  assert.deepEqual(getProgramTypeQueryValues("Placement"), ["Placement", "Placement Sprint", "Placement Program", "placement", "placement sprint", "placement program"]);
});

test("onboarding Program selections authorize the corresponding learning type", () => {
  assert.equal(isProgramLearningSelection("Get Job-Ready"), true);
  assert.equal(isProgramLearningSelection("Learn a Skill"), true);
  assert.equal(isProgramLearningSelection("Both"), true);
  assert.equal(isProgramLearningSelection("Unassigned"), false);
});

test("an active Skill Program enrollment passes the shared daily-learning guard", async () => {
  const originalFindOne = Student.findOne;
  const originalExists = ProgramEnrollment.exists;
  Student.findOne = () => ({
    select() { return this; },
    lean: async () => ({ _id: id() }),
  });
  ProgramEnrollment.exists = async (query) => query.status === "Active" ? { _id: id() } : null;
  const req = { user: { _id: id(), email: "learner@example.com", role: "student", programSelection: "Learn a Skill" } };
  const res = {
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
  let proceeded = false;

  try {
    await requireProgramLearning(req, res, () => { proceeded = true; });
    assert.equal(proceeded, true);
    assert.equal(res.statusCode, undefined);
  } finally {
    Student.findOne = originalFindOne;
    ProgramEnrollment.exists = originalExists;
  }
});

test("schedule resolution prefers an active enrollment over a stale completed pointer", () => {
  const activeProgramId = id();
  const oldCompletedProgramId = id();
  const selected = chooseProgramScheduleEnrollment({
    preferredProgramId: oldCompletedProgramId,
    enrollments: [
      { programId: oldCompletedProgramId, status: "Completed", assignedAt: new Date("2026-09-20") },
      { programId: activeProgramId, status: "Active", assignedAt: new Date("2026-08-20") },
    ],
  });

  assert.equal(String(selected.programId), String(activeProgramId));
});

test("schedule resolution chooses only the newest active Program when legacy data has duplicates", () => {
  const olderProgramId = id();
  const newestProgramId = id();
  const selected = chooseProgramScheduleEnrollment({
    preferredProgramId: olderProgramId,
    enrollments: [
      { _id: id(), programId: olderProgramId, status: "Active", assignedAt: new Date("2026-08-01") },
      { _id: id(), programId: newestProgramId, status: "Active", assignedAt: new Date("2026-09-01") },
    ],
  });

  assert.equal(String(selected.programId), String(newestProgramId));
});

test("access expiry is calculated from the selected plan duration, not Program learning duration", () => {
  const enrollmentStart = new Date("2026-10-05T00:00:00.000Z");
  const monthlyExpiry = getProgramAccessExpiryDate(enrollmentStart, 30);
  const annualExpiry = getProgramAccessExpiryDate(enrollmentStart, 365);

  assert.equal(monthlyExpiry.toISOString(), "2026-11-04T00:00:00.000Z");
  assert.equal(annualExpiry.toISOString(), "2027-10-05T00:00:00.000Z");
  assert.equal(getProgramAccessExpiryDate(enrollmentStart, 0), null);
});

test("changing an enrollment start date keeps its purchased access duration", () => {
  const originalStart = new Date("2026-10-05T00:00:00.000Z");
  const originalExpiry = getProgramAccessExpiryDate(originalStart, 30);
  const enrollment = {
    individualStartDate: originalStart,
    accessExpiresAt: originalExpiry,
    pricingPlanSnapshot: { billingPeriod: "Monthly", accessDurationDays: 30 },
  };

  assert.equal(resolveProgramAccessDurationDays(enrollment), 30);
  assert.equal(
    getProgramAccessExpiryDate(new Date("2026-10-24T00:00:00.000Z"), resolveProgramAccessDurationDays(enrollment)).toISOString(),
    "2026-11-23T00:00:00.000Z",
  );
  assert.equal(resolveProgramAccessDurationDays({
    individualStartDate: originalStart,
    accessExpiresAt: getProgramAccessExpiryDate(originalStart, 365),
  }), 365);
});

test("legacy date repair never substitutes the Student account creation date", async () => {
  const accountCreated = new Date("2026-07-01T00:00:00.000Z");
  const enrollmentCreated = new Date("2026-10-05T00:00:00.000Z");
  const result = await resolveSafeLegacyIndividualStartDate({
    enrollment: {
      individualStartDate: enrollmentCreated,
      individualStartDateSource: "legacy_inferred",
      createdAt: enrollmentCreated,
      assignedAt: enrollmentCreated,
    },
    user: {},
    student: { createdAt: accountCreated },
  });

  assert.equal(result.reconciled, false);
  assert.equal(result.reason, "no_authoritative_candidate");
  assert.equal(result.date.toISOString(), enrollmentCreated.toISOString());
});

test("specific completed Program resources still resolve when a Program ID is requested", () => {
  const activeProgramId = id();
  const completedProgramId = id();
  const selected = chooseProgramScheduleEnrollment({
    preferredProgramId: activeProgramId,
    requestedProgramId: completedProgramId,
    enrollments: [
      { programId: activeProgramId, status: "Active" },
      { programId: completedProgramId, status: "Completed" },
    ],
  });

  assert.equal(String(selected.programId), String(completedProgramId));
});

test("individual enrollment with an explicit start date does not duplicate its source update", async () => {
  const originalFindOne = (await import("../models/ProgramEnrollment.js")).default.findOne;
  const originalFindOneAndUpdate = (await import("../models/ProgramEnrollment.js")).default.findOneAndUpdate;
  const originalProgramUpdateOne = (await import("../models/Program.js")).default.updateOne;
  const originalLeadUpdateOne = (await import("../models/ProgramReadinessLead.js")).default.updateOne;
  const enrollmentModel = (await import("../models/ProgramEnrollment.js")).default;
  const programModel = (await import("../models/Program.js")).default;
  const leadModel = (await import("../models/ProgramReadinessLead.js")).default;
  let capturedUpdate;

  enrollmentModel.findOne = () => ({ session() { return this; }, lean: async () => null });
  const originalFind = enrollmentModel.find;
  enrollmentModel.find = () => ({
    session() { return this; },
    select() {
      return this;
    },
    lean: async () => [],
  });
  enrollmentModel.findOneAndUpdate = async (_query, update) => {
    capturedUpdate = update;
    return update;
  };
  programModel.updateOne = async () => ({});
  leadModel.updateOne = async () => ({});

  try {
    await upsertProgramEnrollment({
      user: { _id: id() },
      student: { _id: id() },
      program: { _id: id(), pricingType: "Free" },
      session: {},
      batchId: null,
      individualStartDate: "2026-08-07T00:00:00.000Z",
      source: "admin",
    });

    assert.equal(capturedUpdate.$set.individualStartDateSource, "explicit_admin");
    assert.equal(Object.prototype.hasOwnProperty.call(capturedUpdate.$setOnInsert, "individualStartDateSource"), false);
  } finally {
    enrollmentModel.findOne = originalFindOne;
    enrollmentModel.find = originalFind;
    enrollmentModel.findOneAndUpdate = originalFindOneAndUpdate;
    programModel.updateOne = originalProgramUpdateOne;
    leadModel.updateOne = originalLeadUpdateOne;
  }
});

test("an explicit individual enrollment grants access to a private Program", () => {
  assert.equal(isProgramAccessibleToLearner({
    program: { status: "Active", visibility: "Private" },
    enrollment: { status: "Active", batchId: null },
  }), true);
});

test("public Programs remain discoverable when resources are not Courses", () => {
  assert.equal(isUserVisibleProgram({
    name: "Placement Learning Path",
    durationDays: 30,
    pricingType: "Free",
    courseIds: [],
    roadmapIds: [id()],
  }), true);
});

test("paid public Program visibility requires a configured positive price", () => {
  const baseProgram = {
    name: "Placement Learning Path",
    durationDays: 30,
    pricingType: "Paid",
    programFee: 0,
    courseIds: [],
  };

  assert.equal(isUserVisibleProgram(baseProgram), false);
  assert.equal(isUserVisibleProgram({
    ...baseProgram,
    pricingPlans: [{ price: 999, active: true }],
  }), true);
  assert.equal(isUserVisibleProgram({
    ...baseProgram,
    pricingPlans: [{ price: 999, active: false }],
  }), false);
});

test("courses linked from a public free Program remain discoverable with legacy batch references", () => {
  const publicCourseId = id();
  const conditions = buildPublicCourseConditions([publicCourseId]);

  assert.equal(conditions.length, 3);
  assert.deepEqual(conditions[2], { _id: { $in: [publicCourseId] } });
  assert.equal(hasPublicFreeProgramLink([
    { visibility: "Public", pricingType: "Free" },
  ]), true);
});

test("completed program resources bypass the active day lock", () => {
  const completedSchedule = {
    isCompleted: true,
    enrollment: { status: "Completed" },
  };

  assert.equal(isCompletedProgramSchedule(completedSchedule), true);
  assert.equal(isProgramResourceLocked({
    resourceDay: 30,
    currentDay: 1,
    schedule: completedSchedule,
  }), false);
  assert.equal(isProgramResourceLocked({
    resourceDay: 2,
    currentDay: 1,
    schedule: { isCompleted: false },
  }), true);
});
