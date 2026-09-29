import test from "node:test";
import assert from "node:assert/strict";
import Program from "../models/Program.js";
import {
  buildProgramPricing,
  normalizeProgramSelections,
  resolveConfiguredProgramPricingPlan,
} from "../utils/programPricing.js";
import { matchProgramsForUser } from "../utils/programMatching.js";

test("program pricing creates checkout plans from availability-specific fees", () => {
  const pricing = buildProgramPricing({
    programType: "Skill",
    pricingType: "Paid",
    availability: "Both",
    structuredFee: "499",
    trainerLedFee: "1299",
  });

  assert.equal(pricing.error, undefined);
  assert.equal(pricing.programFee, 499);
  assert.deepEqual(pricing.pricingPlans.map(({ key, price }) => ({ key, price })), [
    { key: "skill-basic", price: 499 },
    { key: "skill-pro", price: 1299 },
  ]);
  assert.equal(resolveConfiguredProgramPricingPlan({ pricingPlans: pricing.pricingPlans }, "skill-pro").price, 1299);
});

test("program pricing requires positive fees only for selected paid availabilities", () => {
  assert.match(buildProgramPricing({
    programType: "Placement",
    pricingType: "Paid",
    availability: "Both",
    structuredFee: 500,
  }).error, /Trainer-Led Fee/);

  const structured = buildProgramPricing({
    programType: "Placement",
    pricingType: "Paid",
    availability: "Structured",
    structuredFee: 500,
  });
  assert.equal(structured.trainerLedFee, null);
  assert.equal(structured.pricingPlans.length, 1);

  const free = buildProgramPricing({
    programType: "Placement",
    pricingType: "Free",
    availability: "Trainer-Led",
    trainerLedFee: 999,
  });
  assert.equal(free.programFee, 0);
  assert.equal(free.trainerLedFee, null);
  assert.deepEqual(free.pricingPlans, []);
});

test("program matching maps both onboarding labels to Program Type", async () => {
  const originalFind = Program.find;
  const catalog = [
    { _id: "placement-id", name: "Career Track Alpha", programType: "Placement", status: "Active", visibility: "Public", pricingType: "Free", durationDays: 30, courseIds: [{ title: "Interview Skills" }] },
    { _id: "skill-id", name: "Skill Track Beta", programType: "Skill", status: "Active", visibility: "Public", pricingType: "Free", durationDays: 30, courseIds: [{ title: "Java" }] },
  ];
  const query = {
    populate() { return this; },
    lean: async () => catalog,
  };
  Program.find = () => query;

  try {
    const placementPrograms = await matchProgramsForUser({ learningGoal: "Get Job-Ready", learningPath: "Paid" });
    const skillPrograms = await matchProgramsForUser({ learningGoal: "Learn a Skill", learningPath: "Paid" });
    assert.deepEqual(placementPrograms.map((program) => program._id), ["placement-id"]);
    assert.deepEqual(skillPrograms.map((program) => program._id), ["skill-id"]);
  } finally {
    Program.find = originalFind;
  }
});

test("Program matching selections trim and deduplicate values case-insensitively", () => {
  assert.deepEqual(normalizeProgramSelections([" Java ", "java", "React", "", null]), ["Java", "React"]);
});
