import { connectDB } from "../config/db.js";
import DailyChallengeAttempt from "../models/DailyChallengeAttempt.js";
import StudentCodingSubmission from "../models/StudentCodingSubmission.js";
import Submission from "../models/Submission.js";
import Student from "../models/Student.js";
import mongoose from "mongoose";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => {
  return new Promise((resolve) => rl.question(query, resolve));
};

const run = async () => {
  try {
    await connectDB();

    const emailInput = await askQuestion("Enter the student email to reset daily challenge: ");
    const email = emailInput.trim().toLowerCase();

    if (!email) {
      console.log("No email provided. Exiting.");
      rl.close();
      mongoose.connection.close();
      return;
    }

    console.log(`\n==================================================`);
    console.log(`Starting reset sequence for: ${email}`);
    console.log(`==================================================\n`);

    // 1. Delete DailyChallengeAttempt
    const attemptDeleteResult = await DailyChallengeAttempt.deleteMany({
      studentEmail: email
    });
    console.log(`- Deleted ${attemptDeleteResult.deletedCount} DailyChallengeAttempt documents.`);

    // 2. Delete StudentCodingSubmission
    const codingSubDeleteResult = await StudentCodingSubmission.deleteMany({
      studentEmail: email
    });
    console.log(`- Deleted ${codingSubDeleteResult.deletedCount} StudentCodingSubmission documents.`);

    // 3. Lookup Student to delete by studentId
    const student = await Student.findOne({ email });
    if (student) {
      console.log(`- Found student matching email (ID: ${student._id}).`);
      
      // 4. Delete Submissions matching studentId or attemptId / daily challenge type
      const submissionDeleteResult = await Submission.deleteMany({
        $or: [
          { studentId: student._id },
          { challengeType: "daily_challenge" }
        ]
      });
      console.log(`- Deleted ${submissionDeleteResult.deletedCount} Submission documents associated with student/daily challenges.`);
    } else {
      console.log(`- No student record found for ${email} in Student collection.`);
      // Delete any submissions matching the daily challenge fields if any
      const submissionDeleteResult = await Submission.deleteMany({
        challengeType: "daily_challenge"
      });
      console.log(`- Deleted ${submissionDeleteResult.deletedCount} general daily challenge Submission documents.`);
    }

    console.log(`\n==================================================`);
    console.log(`Reset completed successfully for: ${email}`);
    console.log(`==================================================\n`);

  } catch (err) {
    console.error("Error during reset process: ", err);
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
};

run().catch(err => {
  console.error("Initialization failed: ", err);
  process.exit(1);
});
