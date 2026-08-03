import dotenv from "dotenv";
import mongoose from "mongoose";
import Program from "../models/Program.js";
import { ENTITY_CONFIG } from "../controllers/admin/adminProgramController.js";

dotenv.config();

function runValidation() {
  console.log("⚡ Starting Program Entity In-Memory Schema & Validation Checks...");

  try {
    // 1. Validation Test: Free Pricing Schema Validation
    console.log("1. Testing Program Schema (Free Pricing)...");
    const freeProgram = new Program({
      name: "Test Placement Sprint",
      description: "Automated test program",
      programType: "Placement Sprint",
      duration: "30 Days",
      status: "Draft",
      visibility: "Public",
      pricingType: "Free",
    });

    const freeErr = freeProgram.validateSync();
    if (freeErr) {
      console.error("❌ Free Program validation failed:", freeErr.message);
      process.exit(1);
    }
    console.log("✅ Free Program schema validation passed");

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

    // 3. Validation Test: Paid Pricing with valid fee
    console.log("3. Testing Program Schema (Paid with Valid Fee)...");
    const validPaid = new Program({
      name: "Test Paid Skill Program",
      description: "Paid program test",
      programType: "Full Stack Project Program",
      duration: "60 Days",
      status: "Active",
      visibility: "Public",
      pricingType: "Paid",
      programFee: 4999,
    });
    const validPaidErr = validPaid.validateSync();
    if (validPaidErr) {
      console.error("❌ Valid paid program failed validation:", validPaidErr.message);
      process.exit(1);
    }
    console.log("✅ Paid Program with fee schema validation passed");

    // 4. Test Schema Fields & Relationship Arrays
    console.log("4. Testing Relationship Array Definitions...");
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

    const dummyId = new mongoose.Types.ObjectId();
    const fullProgram = new Program({
      name: "Full Relationship Program",
      programType: "AI & Machine Learning Program",
      duration: "90 Days",
      batchIds: [dummyId],
      studentIds: [dummyId],
      courseIds: [dummyId],
      roadmapIds: [dummyId],
      trackTemplateIds: [dummyId],
      certificateTemplateIds: [dummyId],
      projectIds: [dummyId],
    });

    const relErr = fullProgram.validateSync();
    if (relErr) {
      console.error("❌ Relationship program validation failed:", relErr.message);
      process.exit(1);
    }
    if (
      fullProgram.batchIds.length === 1 &&
      fullProgram.studentIds.length === 1 &&
      fullProgram.courseIds.length === 1 &&
      fullProgram.roadmapIds.length === 1 &&
      fullProgram.trackTemplateIds.length === 1 &&
      fullProgram.certificateTemplateIds.length === 1 &&
      fullProgram.projectIds.length === 1
    ) {
      console.log("✅ All 7 relationship array fields validated successfully");
    } else {
      console.error("❌ Relationship array verification failed");
      process.exit(1);
    }

    console.log("\n🎉 ALL PROGRAM ENTITY SCHEMA, RELATIONSHIP & VALIDATION CHECKS PASSED!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Validation Failed:", error);
    process.exit(1);
  }
}

runValidation();
