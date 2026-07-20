import mongoose from "mongoose";
import dotenv from "dotenv";
import readline from "readline";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI or MONGO_URI not found in environment variables.");
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log("=== RESET DAILY TASKS UTILITY ===");
  const emailInput = await askQuestion("Enter the student email address: ");
  const email = String(emailInput || "").trim().toLowerCase();

  if (!email) {
    console.error("Error: Email is required.");
    rl.close();
    process.exit(1);
  }

  console.log(`Connecting to MongoDB to reset daily tasks for: ${email}...`);
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  try {
    const User = (await import("../models/User.js")).default;
    const DailyTaskAttempt = (await import("../models/DailyTaskAttempt.js")).default;
    const PracticeSubmission = (await import("../models/PracticeSubmission.js")).default;

    const user = await User.findOne({ email });
    if (!user) {
      console.warn(`Warning: No User found with email '${email}'. Attempting direct collections cleanup...`);
    }

    const userId = user ? user._id : null;

    // Delete DailyTaskAttempt records
    let dtCount = 0;
    if (userId) {
      const dtRes = await DailyTaskAttempt.deleteMany({ userId });
      dtCount = dtRes.deletedCount;
    }
    console.log(`- Deleted ${dtCount} DailyTaskAttempt documents.`);

    // Delete PracticeSubmissions (source: "track_template")
    let psCount = 0;
    if (userId) {
      const psRes = await PracticeSubmission.deleteMany({ userId, source: "track_template" });
      psCount = psRes.deletedCount;
    }
    console.log(`- Deleted ${psCount} PracticeSubmission (source: 'track_template') documents.`);

    console.log("\nSuccess: Daily tasks have been reset!");
  } catch (error) {
    console.error("An error occurred during reset operation:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    rl.close();
  }
}

main().catch((err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});
