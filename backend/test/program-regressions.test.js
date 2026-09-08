import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { calculateCurrentDayNumber } from "../utils/trackAssignmentSchedule.js";
import { getTopicDayNumber } from "../utils/courseTopicSchedule.js";
import { resolveProgramPrimaryCourseId, isProgramPrimaryCourseMappingValid } from "../utils/programPrimaryCourse.js";
import { getProgramTypeQueryValues, normalizeProgramType } from "../utils/programTypeNormalization.js";
import { upsertProgramEnrollment } from "../utils/programEnrollment.js";
import { isProgramAccessibleToLearner } from "../utils/programVisibility.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const id = () => new mongoose.Types.ObjectId();

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

test("individual enrollment with an explicit start date does not duplicate its source update", async () => {
  const originalFindOne = (await import("../models/ProgramEnrollment.js")).default.findOne;
  const originalFindOneAndUpdate = (await import("../models/ProgramEnrollment.js")).default.findOneAndUpdate;
  const originalProgramUpdateOne = (await import("../models/Program.js")).default.updateOne;
  const originalLeadUpdateOne = (await import("../models/ProgramReadinessLead.js")).default.updateOne;
  const enrollmentModel = (await import("../models/ProgramEnrollment.js")).default;
  const programModel = (await import("../models/Program.js")).default;
  const leadModel = (await import("../models/ProgramReadinessLead.js")).default;
  let capturedUpdate;

  enrollmentModel.findOne = () => ({ lean: async () => null });
  const originalFind = enrollmentModel.find;
  enrollmentModel.find = () => ({
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
