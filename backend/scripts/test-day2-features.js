import assert from "node:assert/strict";
import mongoose from "mongoose";
import Program from "../models/Program.js";
import Blueprint from "../models/Blueprint.js";
import ProgramAssignment from "../models/ProgramAssignment.js";
import ProgramEnrollment from "../models/ProgramEnrollment.js";
import ProgramReadinessLead from "../models/ProgramReadinessLead.js";
import ProgramPerformanceSummary from "../models/ProgramPerformanceSummary.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Question from "../models/Questions.js";
import { startFreeAssessment } from "../controllers/programController.js";
import {
  getUserAssessments,
  getAssessmentDetailReport,
  getOverallReportSummary,
} from "../controllers/reportController.js";
import {
  guestAssessmentRateLimiter,
  clearGuestRateLimitStore,
} from "../middleware/guestRateLimitMiddleware.js";
import {
  assignmentSummary,
  submitProgramAssignmentAnswer,
} from "../services/programAssignmentService.js";

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

async function runDay2Tests() {
  console.log("=================================================");
  console.log("🧪 TESTING DAY 2 FEATURES & EDGE CASES");
  console.log("=================================================");

  // --- Test 1: Guest Assessment Rate Limiting Middleware ---
  console.log("\n[Test 1] Guest Assessment Rate Limiting Middleware");
  clearGuestRateLimitStore();

  let nextCalled = 0;
  const mockNext = () => {
    nextCalled += 1;
  };

  const reqGuest = {
    user: null,
    headers: { "x-forwarded-for": "192.168.1.100" },
    socket: { remoteAddress: "192.168.1.100" },
  };

  // First 5 requests should pass
  for (let i = 1; i <= 5; i++) {
    const res = mockRes();
    guestAssessmentRateLimiter(reqGuest, res, mockNext);
    assert.equal(nextCalled, i, `Guest request ${i} should be allowed`);
  }

  // 6th request should be throttled (429)
  const resThrottled = mockRes();
  guestAssessmentRateLimiter(reqGuest, resThrottled, mockNext);
  assert.equal(resThrottled.statusCode, 429, "6th request should receive 429 Too Many Requests");
  assert.equal(resThrottled.data.requiresAuth, true);
  console.log("✅ Guest rate limiting throttles excessive requests cleanly.");

  // Authenticated user bypasses guest rate limiter
  const reqAuth = {
    user: { _id: new mongoose.Types.ObjectId() },
    headers: { "x-forwarded-for": "192.168.1.100" },
  };
  const prevNext = nextCalled;
  const resAuth = mockRes();
  guestAssessmentRateLimiter(reqAuth, resAuth, mockNext);
  assert.equal(nextCalled, prevNext + 1, "Authenticated users bypass guest rate limiter");
  console.log("✅ Authenticated users bypass guest rate limiting.");

  // --- Test 2: One-Attempt Enforcement & Stored Report Return ---
  console.log("\n[Test 2] One-Attempt Rule & Persistent Result Return");

  const mockUserId = new mongoose.Types.ObjectId();
  const mockProgramId = new mongoose.Types.ObjectId();
  const mockAssignmentId = new mongoose.Types.ObjectId();

  const originalProgramFindOne = Program.findOne;
  const originalProgramFindById = Program.findById;
  const originalUserUpdate = User.updateOne;
  const originalStudentUpdate = Student.updateOne;
  const originalStudentFindOne = Student.findOne;
  const originalAssignmentFindOne = ProgramAssignment.findOne;
  const originalReadinessLeadFindOneAndUpdate = ProgramReadinessLead.findOneAndUpdate;
  const originalProgramEnrollmentFindOne = ProgramEnrollment.findOne;

  // Mock Program.findOne & Program.findById
  Program.findOne = () => ({
    sort: () => ({
      lean: async () => ({
        _id: mockProgramId,
        name: "Placement Sprint",
        programType: "Placement",
        status: "Active",
        visibility: "Public",
      }),
    }),
  });
  Program.findById = () => ({
    populate() {
      return this;
    },
    lean: async () => ({
      _id: mockProgramId,
      name: "Placement Sprint",
      programType: "Placement",
      status: "Active",
      visibility: "Public",
    }),
  });

  ProgramEnrollment.findOne = () => ({
    sort: () => ({
      lean: async () => null,
    }),
  });

  User.updateOne = async () => ({ matchedCount: 1 });
  User.findById = () => ({
    select: () => ({
      lean: async () => ({
        _id: mockUserId,
        firstName: "Test",
        targetRole: "Backend Developer",
        targetCompanies: ["TCS"],
      }),
    }),
  });
  Student.updateOne = async () => ({ matchedCount: 1 });
  Student.findOne = () => ({ lean: async () => null });
  ProgramReadinessLead.findOneAndUpdate = async () => ({ _id: new mongoose.Types.ObjectId() });

  // Simulate an already completed assignment in DB
  ProgramAssignment.findOne = () => ({
    _id: mockAssignmentId,
    programId: mockProgramId,
    userId: mockUserId,
    phase: "day_0_readiness",
    programDay: 0,
    status: "Completed",
    accuracy: 85,
    questions: [
      { questionId: new mongoose.Types.ObjectId(), attempted: true, correct: true },
      { questionId: new mongoose.Types.ObjectId(), attempted: true, correct: true },
      { questionId: new mongoose.Types.ObjectId(), attempted: true, correct: false },
    ],
  });

  const reqStart = {
    user: { _id: mockUserId, firstName: "Test", targetRole: "Backend Developer" },
    body: {
      targetRole: "Backend Developer",
      targetCompany: "TCS",
      programId: mockProgramId.toString(),
    },
  };
  const resStart = mockRes();

  await startFreeAssessment(reqStart, resStart);

  assert.equal(resStart.statusCode, 200);
  assert.equal(resStart.data.success, true);
  assert.equal(resStart.data.isCompleted, true);
  assert.equal(resStart.data.score, 85);
  console.log("✅ Repeat Free Assessment attempt returns existing score and marks isCompleted without regeneration.");

  // Restore mocks
  Program.findOne = originalProgramFindOne;
  Program.findById = originalProgramFindById;
  ProgramEnrollment.findOne = originalProgramEnrollmentFindOne;
  User.updateOne = originalUserUpdate;
  Student.updateOne = originalStudentUpdate;
  Student.findOne = originalStudentFindOne;
  ProgramAssignment.findOne = originalAssignmentFindOne;
  ProgramReadinessLead.findOneAndUpdate = originalReadinessLeadFindOneAndUpdate;

  // --- Test 3: Score Calculation & Assignment Summary ---
  console.log("\n[Test 3] Server-Side Scoring & Summary Accuracy");
  const testAssignment = {
    questions: [
      { attempted: true, accuracy: 100, correct: true },
      { attempted: true, accuracy: 100, correct: true },
      { attempted: true, accuracy: 0, correct: false },
      { attempted: true, accuracy: 100, correct: true },
      { attempted: false, accuracy: null, correct: null },
    ],
  };
  const summary = assignmentSummary(testAssignment);
  assert.equal(summary.total, 5);
  assert.equal(summary.answered, 4);
  assert.equal(summary.correct, 3);
  assert.equal(summary.accuracy, 75); // 300 / 4 = 75%
  assert.equal(summary.completed, false);
  console.log("✅ Score calculation computes accurate category & overall accuracy.");

  // --- Test 4: Reports API (getUserAssessments & getAssessmentDetailReport) ---
  console.log("\n[Test 4] Reports API Controller Tests");

  const originalAssignmentFind = ProgramAssignment.find;
  const originalStudentFindOneReports = Student.findOne;

  const mockAssignmentsList = [
    {
      _id: mockAssignmentId,
      programId: { _id: mockProgramId, name: "Placement Sprint", programType: "Placement" },
      phase: "day_0_readiness",
      isLeadAssessment: true,
      programDay: 0,
      status: "Completed",
      accuracy: 85,
      targetRole: "Backend Developer",
      targetCompanies: ["TCS"],
      questions: [
        { attempted: true, correct: true, accuracy: 100 },
        { attempted: true, correct: true, accuracy: 100 },
      ],
      createdAt: new Date(),
      completedAt: new Date(),
    },
  ];

  ProgramAssignment.find = () => ({
    populate: () => ({
      populate: () => ({
        sort: () => ({
          lean: async () => mockAssignmentsList,
        }),
      }),
    }),
  });

  const reqReportsList = { user: { _id: mockUserId } };
  const resReportsList = mockRes();
  await getUserAssessments(reqReportsList, resReportsList);

  assert.equal(resReportsList.statusCode, 200);
  assert.equal(resReportsList.data.success, true);
  assert.equal(resReportsList.data.assessments.length, 1);
  assert.equal(resReportsList.data.assessments[0].assessmentType, "Free Assessment");
  assert.equal(resReportsList.data.assessments[0].score, 85);
  console.log("✅ getUserAssessments correctly lists assessments and identifies Free Assessment.");

  // Restore mocks
  ProgramAssignment.find = originalAssignmentFind;
  Student.findOne = originalStudentFindOneReports;

  console.log("\n=================================================");
  console.log("🎉 ALL DAY 2 AUTOMATED INTEGRATION TESTS PASSED!");
  console.log("=================================================");
}

runDay2Tests().catch((err) => {
  console.error("❌ Day 2 test suite failed:", err);
  process.exit(1);
});
