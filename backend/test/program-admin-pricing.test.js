import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Program from "../models/Program.js";
import {
  buildProgramPricing,
  normalizeProgramSelections,
  resolveConfiguredProgramPricingPlan,
} from "../utils/programPricing.js";
import { matchProgramsForUser } from "../utils/programMatching.js";
import {
  buildDefaultProgramPhases,
  validateAndNormalizeProgramPhases,
} from "../utils/programPhases.js";

test("new Skill Programs use all five fixed phases and preserve the 30-day layout", () => {
  const phases = buildDefaultProgramPhases("Skill", 30);
  assert.deepEqual(phases, [
    { phase: "learning", startDay: 1, endDay: 22 },
    { phase: "revision", startDay: 23, endDay: 24 },
    { phase: "company_preparation", startDay: 25, endDay: 28 },
    { phase: "mock_interview", startDay: 29, endDay: 29 },
    { phase: "final_assessment", startDay: 30, endDay: 30 },
  ]);
  assert.equal(validateAndNormalizeProgramPhases({
    programType: "Skill",
    durationDays: 30,
    phases,
  }).error, undefined);
});

test("legacy two-phase Skill Programs remain valid until upgraded in the admin form", () => {
  const result = validateAndNormalizeProgramPhases({
    programType: "Skill",
    durationDays: 30,
    phases: [
      { phase: "learning", startDay: 1, endDay: 29 },
      { phase: "final_assessment", startDay: 30, endDay: 30 },
    ],
  });
  assert.equal(result.error, undefined);
  assert.equal(result.phases.length, 2);
});

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

test("program pricing supports Monthly and Annual billing for both delivery modes", () => {
  const pricing = buildProgramPricing({
    programType: "Placement",
    pricingType: "Paid",
    availability: "Both",
    billingOptions: ["Annual", "Monthly"],
    monthlyStructuredFee: "499",
    monthlyTrainerLedFee: "899",
    annualStructuredFee: "4999",
    annualTrainerLedFee: "8999",
  });

  assert.equal(pricing.error, undefined);
  assert.deepEqual(pricing.billingOptions, ["Monthly", "Annual"]);
  assert.deepEqual(pricing.pricingPlans.map(({ key, price, billingPeriod, availability }) => ({
    key,
    price,
    billingPeriod,
    availability,
  })), [
    { key: "placement-monthly-structured", price: 499, billingPeriod: "Monthly", availability: "Structured" },
    { key: "placement-monthly-trainer-led", price: 899, billingPeriod: "Monthly", availability: "Trainer-Led" },
    { key: "placement-basic", price: 4999, billingPeriod: "Annual", availability: "Structured" },
    { key: "placement-pro", price: 8999, billingPeriod: "Annual", availability: "Trainer-Led" },
  ]);
  assert.equal(pricing.programFee, 499);
  assert.equal(pricing.structuredFee, 4999);
  assert.equal(pricing.trainerLedFee, 8999);
});

test("paid program pricing requires a positive fee for every selected billing combination", () => {
  assert.match(buildProgramPricing({
    programType: "Skill",
    pricingType: "Paid",
    availability: "Structured",
    billingOptions: [],
  }).error, /at least one billing option/i);

  assert.match(buildProgramPricing({
    programType: "Skill",
    pricingType: "Paid",
    availability: "Both",
    billingOptions: ["Monthly", "Annual"],
    monthlyStructuredFee: 100,
    monthlyTrainerLedFee: 200,
    annualStructuredFee: 1000,
  }).error, /Annual Trainer-Led Fee/);
});

test("Program schema persists selected billing terms and all conditional fees", async () => {
  const pricing = buildProgramPricing({
    programType: "Skill",
    pricingType: "Paid",
    availability: "Both",
    billingOptions: ["Monthly", "Annual"],
    monthlyStructuredFee: 100,
    monthlyTrainerLedFee: 200,
    annualStructuredFee: 1000,
    annualTrainerLedFee: 2000,
  });
  const program = new Program({
    name: "Pricing Schema Test",
    programType: "Skill",
    duration: "30 Days",
    durationDays: 30,
    status: "Active",
    company: "Acme Robotics",
    courseIds: [new mongoose.Types.ObjectId()],
    ...pricing,
  });

  await program.validate();
  assert.deepEqual(program.phases.map(({ phase }) => phase), [
    "learning",
    "revision",
    "company_preparation",
    "mock_interview",
    "final_assessment",
  ]);
  assert.deepEqual(program.billingOptions, ["Monthly", "Annual"]);
  assert.equal(program.monthlyStructuredFee, 100);
  assert.equal(program.monthlyTrainerLedFee, 200);
  assert.equal(program.annualStructuredFee, 1000);
  assert.equal(program.annualTrainerLedFee, 2000);
  assert.equal(program.pricingPlans[2].billingPeriod, "Annual");
  assert.equal(program.company, "Acme Robotics");
  assert.equal(program.courseIds.length, 1);
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

test("Program matching includes the separately configured manual company field", async () => {
  const originalFind = Program.find;
  const catalog = [{
    _id: "manual-company-id",
    name: "Campus Preparation",
    programType: "Placement",
    status: "Active",
    visibility: "Public",
    pricingType: "Free",
    durationDays: 30,
    company: "Acme Robotics",
  }];
  const query = {
    populate() { return this; },
    lean: async () => catalog,
  };
  Program.find = () => query;

  try {
    const matched = await matchProgramsForUser({
      learningGoal: "Get Job-Ready",
      targetCompanies: ["Acme Robotics"],
      learningPath: "Paid",
    });
    assert.deepEqual(matched.map((program) => program._id), ["manual-company-id"]);
  } finally {
    Program.find = originalFind;
  }
});

test("Program matching selections trim and deduplicate values case-insensitively", () => {
  assert.deepEqual(normalizeProgramSelections([" Java ", "java", "React", "", null]), ["Java", "React"]);
});
