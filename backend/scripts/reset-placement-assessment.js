import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/techlearn";

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const StudentMcqSubmission = mongoose.model(
      "StudentMcqSubmission",
      new mongoose.Schema({}, { strict: false })
    );

    const StudentCodingSubmission = mongoose.model(
      "StudentCodingSubmission",
      new mongoose.Schema({}, { strict: false })
    );

    const Submission = mongoose.model(
      "Submission",
      new mongoose.Schema({}, { strict: false })
    );

    const UserProgress = mongoose.model(
      "UserProgress",
      new mongoose.Schema({}, { strict: false })
    );

    // Delete all student MCQ submissions
    const mcqRes = await StudentMcqSubmission.deleteMany({});
    console.log(`Deleted ${mcqRes.deletedCount} Student MCQ submissions (Placement Readiness Assessment scores).`);

    // Delete all student coding submissions
    const codingRes = await StudentCodingSubmission.deleteMany({});
    console.log(`Deleted ${codingRes.deletedCount} Student Coding submissions.`);

    // Delete all general student submissions associated with coding rounds
    const subRes = await Submission.deleteMany({ categoryType: "Coding" });
    console.log(`Deleted ${subRes.deletedCount} individual coding question submissions.`);

    // Reset UserProgress XP records
    const progressRes = await UserProgress.updateMany(
      {},
      {
        $set: {
          courseXP: {},
          exerciseXP: {},
          projectXP: {},
          totalCourseXP: {},
          totalExerciseXP: {},
        },
      }
    );
    console.log(`Reset XP maps to zero/empty in ${progressRes.modifiedCount} UserProgress profiles.`);

    console.log("\nPlacement Readiness Assessment leaderboard scores and XP successfully reset to zero!");
  } catch (error) {
    console.error("Error during reset execution:", error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
