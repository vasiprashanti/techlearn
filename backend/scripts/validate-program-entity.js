import dotenv from "dotenv";
import mongoose from "mongoose";
import Program from "../models/Program.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import ProgramEnrollment from "../models/ProgramEnrollment.js";
import { ENTITY_CONFIG } from "../controllers/admin/adminProgramController.js";

dotenv.config();

function runValidation() {
  console.log("⚡ Starting Program Entity & Onboarding In-Memory Schema Checks...");

  try {
    // 1. Validation Test: Free Pricing & Matching Metadata Schema
    console.log("1. Testing Program Schema (Free Pricing & Matching Metadata)...");
    const freeProgram = new Program({
      name: "Test Placement Sprint",
      description: "Automated test program",
      programType: "Placement Sprint",
      duration: "30 Days",
      status: "Draft",
      visibility: "Public",
      pricingType: "Free",
      learningGoals: ["Get Placed"],
      placementCategories: ["Product Based"],
      targetCompanies: ["Google", "Amazon"],
      skillTags: ["Java", "DSA"],
      targetRoles: ["Software Engineer"],
      accessTier: "Both",
    });

    const freeErr = freeProgram.validateSync();
    if (freeErr) {
      console.error("❌ Free Program validation failed:", freeErr.message);
      process.exit(1);
    }
    console.log("✅ Free Program schema & matching metadata validation passed");

    // 2. Validation Test: Paid Pricing without fee should fail validation
    console.log("2. Testing Program Schema (Paid without Fee - Should Fail)...");
    const invalidPaid = new Program({
      name: "Invalid Paid Program",
      programType: "Placement Sprint",
      duration: "30 Days",
      pricingType: "Paid",
      programFee: -10,
    });
    const paidErr = invalidPaid.validateSync();
    if (!paidErr) {
      console.error("❌ ERROR: Invalid paid program unexpectedly passed validation!");
      process.exit(1);
    }
    console.log("✅ Paid Program validation successfully caught invalid fee:", paidErr.errors.programFee?.message || paidErr.message);

    // 3. Validation Test: ProgramEnrollment schema
    console.log("3. Testing ProgramEnrollment Schema...");
    const dummyUserId = new mongoose.Types.ObjectId();
    const dummyStudentId = new mongoose.Types.ObjectId();
    const dummyProgramId = new mongoose.Types.ObjectId();

    const enrollment = new ProgramEnrollment({
      userId: dummyUserId,
      studentId: dummyStudentId,
      programId: dummyProgramId,
      status: "Active",
      accessTier: "Free",
      source: "onboarding",
    });

    const enrollErr = enrollment.validateSync();
    if (enrollErr) {
      console.error("❌ ProgramEnrollment schema validation failed:", enrollErr.message);
      process.exit(1);
    }
    console.log("✅ ProgramEnrollment schema validation passed");

    // 4. Validation Test: User and Student onboarding fields
    console.log("4. Testing User and Student Onboarding Schemas...");
    const testUser = new User({
      firstName: "Test",
      lastName: "Student",
      email: "test.student@example.com",
      password: "Password123!",
      skills: ["Java", "Python"],
      targetRole: "Software Engineer",
      placementCategory: "Product Based",
      targetCompanies: ["Google", "Amazon"],
      placementTimeline: "3 Months",
      learningPath: "Free",
      learningGoal: "Get Placed",
    });

    const userErr = testUser.validateSync();
    if (userErr) {
      console.error("❌ User schema validation failed:", userErr.message);
      process.exit(1);
    }

    const testStudent = new Student({
      collegeId: new mongoose.Types.ObjectId(),
      userId: testUser._id,
      name: "Test Student",
      email: "test.student@example.com",
      skills: ["Java", "Python"],
      targetRole: "Software Engineer",
      placementCategory: "Product Based",
      targetCompanies: ["Google", "Amazon"],
      placementTimeline: "3 Months",
      learningPath: "Free",
      learningGoal: "Get Placed",
    });

    const studentErr = testStudent.validateSync();
    if (studentErr) {
      console.error("❌ Student schema validation failed:", studentErr.message);
      process.exit(1);
    }
    console.log("✅ User and Student onboarding schema validation passed");

    // 5. Test Schema Fields & Relationship Arrays
    console.log("5. Testing Relationship Array Definitions...");
    const expectedRelationships = {
      batches: { field: "batchIds", model: "Batch", label: "name" },
      students: { field: "studentIds", model: "Student", label: "name" },
      courses: { field: "courseIds", model: "Course", label: "title" },
      roadmaps: { field: "roadmapIds", model: "Roadmap", label: "title" },
      "track-templates": { field: "trackTemplateIds", model: "TrackTemplate", label: "name" },
      certificates: { field: "certificateTemplateIds", model: "CertificateTemplate", label: "name" },
      projects: { field: "projectIds", model: "Project", label: "title" },
    };

    const configuredTypes = Object.keys(ENTITY_CONFIG);
    const expectedTypes = Object.keys(expectedRelationships);
    if (configuredTypes.length !== expectedTypes.length || expectedTypes.some((type) => !ENTITY_CONFIG[type])) {
      console.error("❌ Program controller relationship configuration is incomplete");
      process.exit(1);
    }

    for (const [type, relationship] of Object.entries(expectedRelationships)) {
      const config = ENTITY_CONFIG[type];
      const schemaPath = Program.schema.path(relationship.field);
      const configuredRef = schemaPath?.caster?.options?.ref;

      if (!schemaPath || configuredRef !== relationship.model || config.fieldKey !== relationship.field) {
        console.error(`❌ ${type} relationship is not aligned between Program schema and admin API`);
        process.exit(1);
      }

      if (config.model.modelName !== relationship.model || config.labelField !== relationship.label) {
        console.error(`❌ ${type} attachment mapping points to the wrong model or label field`);
        process.exit(1);
      }
    }
    console.log("✅ All 7 Program relationship mappings match the schema and admin attachment API");

    console.log("\n🎉 ALL PROGRAM ENTITY & ONBOARDING SCHEMA CHECKS PASSED SUCCESSFULLY!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Validation Failed:", error);
    process.exit(1);
  }
}

runValidation();
