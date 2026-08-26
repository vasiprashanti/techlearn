import assert from "node:assert/strict";
import mongoose from "mongoose";
import Program from "../models/Program.js";
import Blueprint from "../models/Blueprint.js";
import ProgramAssignment from "../models/ProgramAssignment.js";
import ProgramWaitlistLead from "../models/ProgramWaitlistLead.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Question from "../models/Questions.js";
import {
  getPublicPrograms,
  getReadinessOptions,
  joinProgramWaitlist,
  startFreeAssessment,
} from "../controllers/programController.js";
import { normalizeBlueprintType, BLUEPRINT_TYPE_LABELS } from "../utils/blueprintTypes.js";

const mockRes = () => {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
};

async function runTests() {
  console.log("=================================================");
  console.log("🧪 TESTING DAY 1 FEATURES & EDGE CASES");
  console.log("=================================================");

  // --- Test 1: Blueprint Taxonomy & Aliases ---
  console.log("\n[Test 1] Blueprint Taxonomy & Label Mappings");
  assert.equal(normalizeBlueprintType("free_assessment"), "day_0_readiness");
  assert.equal(normalizeBlueprintType("Free Assessment"), "day_0_readiness");
  assert.equal(normalizeBlueprintType("day_0_readiness"), "day_0_readiness");
  assert.equal(normalizeBlueprintType("Day 0 Placement Readiness"), "day_0_readiness");
  assert.equal(BLUEPRINT_TYPE_LABELS.day_0_readiness, "Free Assessment");
  assert.equal(BLUEPRINT_TYPE_LABELS.free_assessment, "Free Assessment");
  console.log("✅ Blueprint taxonomy aliases & Free Assessment labels verified.");

  // --- Test 2: In-Memory Controller Tests ---
  console.log("\n[Test 2] Public Programs API (getPublicPrograms)");
  const mockProgramId1 = new mongoose.Types.ObjectId();
  const mockProgramId2 = new mongoose.Types.ObjectId();
  const mockDraftId = new mongoose.Types.ObjectId();

  const originalProgramFind = Program.find;
  const originalBlueprintFind = Blueprint.find;

  // Mock Program.find
  Program.find = function (query) {
    const all = [
      {
        _id: mockProgramId1,
        name: "Placement Sprint",
        programType: "Placement",
        status: "Active",
        visibility: "Public",
        duration: "30 Days",
      },
      {
        _id: mockProgramId2,
        name: "React Mastery",
        programType: "Skill",
        status: "Active",
        visibility: "Public",
        duration: "15 Days",
      },
      {
        _id: mockDraftId,
        name: "Draft Program",
        programType: "Skill",
        status: "Draft",
        visibility: "Private",
      },
    ];

    const filtered = all.filter((p) => {
      if (query.status && p.status !== query.status) return false;
      if (query.visibility && p.visibility !== query.visibility) return false;
      return true;
    });

    return {
      select: () => ({
        populate: () => ({
          populate: () => ({
            sort: () => ({
              lean: async () => filtered,
            }),
          }),
        }),
      }),
    };
  };

  // Mock Blueprint.find
  Blueprint.find = function () {
    return {
      distinct: async () => [mockProgramId1],
    };
  };

  const req1 = {};
  const res1 = mockRes();
  await getPublicPrograms(req1, res1);

  assert.equal(res1.statusCode, 200);
  assert.equal(res1.data.success, true);
  assert.equal(res1.data.programs.length, 2);
  assert.equal(res1.data.programs[0].hasFreeAssessment, true);
  assert.equal(res1.data.programs[1].hasFreeAssessment, false);
  console.log("✅ getPublicPrograms correctly formats public programs and detects Free Assessment capability.");

  // --- Test 3: Join Waitlist Lead API ---
  console.log("\n[Test 3] Waitlist Lead Submission (joinProgramWaitlist)");
  
  // Edge Case A: Missing email
  const reqWaitlistNoEmail = {
    params: { programId: mockProgramId1.toString() },
    body: { name: "John Doe" },
  };
  const resWaitlistNoEmail = mockRes();
  await joinProgramWaitlist(reqWaitlistNoEmail, resWaitlistNoEmail);
  assert.equal(resWaitlistNoEmail.statusCode, 400);
  assert.match(resWaitlistNoEmail.data.message, /email is required/i);
  console.log("✅ Waitlist rejects missing email.");

  // Edge Case B: Invalid Program ID
  const reqWaitlistInvalidId = {
    params: { programId: "invalid-id" },
    body: { email: "test@example.com" },
  };
  const resWaitlistInvalidId = mockRes();
  await joinProgramWaitlist(reqWaitlistInvalidId, resWaitlistInvalidId);
  assert.equal(resWaitlistInvalidId.statusCode, 400);
  assert.match(resWaitlistInvalidId.data.message, /invalid program id/i);
  console.log("✅ Waitlist rejects invalid program ID.");

  // Edge Case C: Program not found
  const originalProgramFindById = Program.findById;
  Program.findById = function () {
    return {
      lean: async () => null,
    };
  };
  const reqWaitlistNotFound = {
    params: { programId: mockProgramId1.toString() },
    body: { email: "test@example.com" },
  };
  const resWaitlistNotFound = mockRes();
  await joinProgramWaitlist(reqWaitlistNotFound, resWaitlistNotFound);
  assert.equal(resWaitlistNotFound.statusCode, 404);
  console.log("✅ Waitlist handles non-existent program.");

  // Edge Case D: Successful Guest waitlist submission
  Program.findById = function () {
    return {
      lean: async () => ({ _id: mockProgramId1, name: "Placement Sprint" }),
    };
  };
  const originalWaitlistUpsert = ProgramWaitlistLead.findOneAndUpdate;
  let savedLead = null;
  ProgramWaitlistLead.findOneAndUpdate = async function (filter, update) {
    savedLead = {
      _id: new mongoose.Types.ObjectId(),
      ...filter,
      ...update.$set,
    };
    return savedLead;
  };

  const reqWaitlistSuccess = {
    params: { programId: mockProgramId1.toString() },
    body: {
      email: "learner@test.com",
      name: "Alex",
      phone: "9876543210",
      targetRole: "Full Stack",
      targetCompany: "TCS",
    },
    user: null, // Guest
  };
  const resWaitlistSuccess = mockRes();
  await joinProgramWaitlist(reqWaitlistSuccess, resWaitlistSuccess);
  assert.equal(resWaitlistSuccess.statusCode, 200);
  assert.equal(resWaitlistSuccess.data.success, true);
  assert.equal(savedLead.email, "learner@test.com");
  assert.equal(savedLead.targetCompany, "TCS");
  assert.equal(savedLead.userId, null);
  console.log("✅ Guest waitlist submission saved cleanly.");

  // Edge Case E: Authenticated user waitlist submission
  const mockUserId = new mongoose.Types.ObjectId();
  const reqWaitlistAuth = {
    params: { programId: mockProgramId1.toString() },
    body: {
      email: "auth@test.com",
      name: "Auth User",
    },
    user: { _id: mockUserId },
  };
  const resWaitlistAuth = mockRes();
  await joinProgramWaitlist(reqWaitlistAuth, resWaitlistAuth);
  assert.equal(resWaitlistAuth.statusCode, 200);
  assert.equal(savedLead.userId, mockUserId);
  console.log("✅ Authenticated user waitlist records userId.");

  // Restore mocks
  Program.find = originalProgramFind;
  Blueprint.find = originalBlueprintFind;
  Program.findById = originalProgramFindById;
  ProgramWaitlistLead.findOneAndUpdate = originalWaitlistUpsert;

  console.log("\n=================================================");
  console.log("🎉 ALL DAY 1 AUTOMATED FEATURE TESTS PASSED!");
  console.log("=================================================");
}

runTests().catch((err) => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
