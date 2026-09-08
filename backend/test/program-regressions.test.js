import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { calculateCurrentDayNumber } from "../utils/trackAssignmentSchedule.js";
import { getTopicDayNumber } from "../utils/courseTopicSchedule.js";
import { resolveProgramPrimaryCourseId, isProgramPrimaryCourseMappingValid } from "../utils/programPrimaryCourse.js";
import { getProgramTypeQueryValues, normalizeProgramType } from "../utils/programTypeNormalization.js";

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
