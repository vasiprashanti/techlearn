import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/techlearn";

async function run() {
  const emailArg = process.argv[2];
  if (!emailArg) {
    console.error("Error: Please provide a student email as an argument.");
    console.error("Usage: node scripts/reset-daily-challenge.js <student_email>");
    process.exit(1);
  }

  const targetEmail = String(emailArg).trim().toLowerCase();

  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const DailyChallengeAttempt = mongoose.model(
      "DailyChallengeAttempt",
      new mongoose.Schema({}, { strict: false })
    );
    const Submission = mongoose.model(
      "Submission",
      new mongoose.Schema({}, { strict: false })
    );

    const StudentCodingSubmission = mongoose.model(
      "StudentCodingSubmission",
      new mongoose.Schema({}, { strict: false })
    );

    const CodingRound = mongoose.model(
      "CodingRound",
      new mongoose.Schema({}, { strict: false })
    );

    // Find attempts to get their IDs
    const attempts = await DailyChallengeAttempt.find({ studentEmail: targetEmail }).lean();
    const attemptIds = attempts.map(att => att._id);
    const codingRoundIds = attempts.map(att => att.codingRoundId).filter(Boolean);
    if (attempts.length > 0) {
      console.log(`Found ${attempts.length} Daily Challenge attempts for ${targetEmail}.`);
      const deletedAttempts = await DailyChallengeAttempt.deleteMany({ studentEmail: targetEmail });
      console.log(`Deleted ${deletedAttempts.deletedCount} Daily Challenge attempt records.`);
      const deletedSubmissions = await Submission.deleteMany({ attemptId: { $in: attemptIds } });
      console.log(`Deleted ${deletedSubmissions.deletedCount} associated submissions.`);
      const deletedCodingRounds = await CodingRound.deleteMany({ _id: { $in: codingRoundIds } });
      console.log(`Deleted ${deletedCodingRounds.deletedCount} coding round documents.`);
    } else {
      console.log(`No Daily Challenge attempts found for student: ${targetEmail}`);
    }

    // Delete student coding submissions
    const deletedCodingSubmissions = await StudentCodingSubmission.deleteMany({ studentEmail: targetEmail });
    console.log(`Deleted ${deletedCodingSubmissions.deletedCount} student coding submissions.`);

    console.log(`\nSuccessfully reset Daily Challenge state for ${targetEmail}!`);
  } catch (error) {
    console.error("Error during reset execution:", error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
