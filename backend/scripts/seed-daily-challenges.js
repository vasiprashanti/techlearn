import mongoose from "mongoose";
import dotenv from "dotenv";
import Batch from "../models/Batch.js";
import Track from "../models/Track.js";
import Question from "../models/Questions.js";
import { BATCH_STATUS } from "../models/Batch.js";

dotenv.config();

const seedTracksWithQuestions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get all questions
    const allQuestions = await Question.find().lean();
    if (allQuestions.length === 0) {
      console.log("⚠️  No questions found in database. Cannot seed tracks.");
      await mongoose.disconnect();
      return;
    }

    console.log(`📚 Found ${allQuestions.length} questions in database\n`);

    // Get all active batches
    const activeBatches = await Batch.find({ status: BATCH_STATUS.ACTIVE }).lean();
    console.log(`🏫 Found ${activeBatches.length} active batches\n`);

    let tracksUpdated = 0;
    let questionsAssigned = 0;

    // For each active batch
    for (const batch of activeBatches) {
      // Get all tracks for this batch
      const tracks = await Track.find({ batchId: batch._id });

      for (const track of tracks) {
        // If track has no questions, populate it
        if (!track.orderedQuestionIds || track.orderedQuestionIds.length === 0) {
          console.log(`\n📌 Batch: ${batch.name} (${batch._id})`);
          console.log(`   Track: ${track.trackType}`);
          console.log(`   Status: Empty ❌ → Populating...`);

          // Create a cycling array of questions for the track
          // This ensures Day 1, Day 2, Day 3, etc all have questions
          const questionIds = [];
          for (let day = 1; day <= 30; day++) {
            // Cycle through questions to create a 30-day schedule
            const questionIndex = (day - 1) % allQuestions.length;
            questionIds.push(allQuestions[questionIndex]._id);
          }

          // Update the track
          track.orderedQuestionIds = questionIds;
          await track.save();

          console.log(`   ✅ Assigned ${questionIds.length} questions (Day 1-30)`);
          console.log(`   Question cycle: ${allQuestions.slice(0, Math.min(3, allQuestions.length)).map(q => q.title).join(", ")}...`);

          tracksUpdated++;
          questionsAssigned += questionIds.length;
        } else {
          console.log(`\n📌 Batch: ${batch.name}`);
          console.log(`   Track: ${track.trackType}`);
          console.log(`   Status: Already configured (${track.orderedQuestionIds.length} questions) ✅`);
        }
      }
    }

    console.log(`\n\n${"=".repeat(60)}`);
    console.log(`✅ SEED COMPLETE`);
    console.log(`${"=".repeat(60)}`);
    console.log(`📊 Summary:`);
    console.log(`   Tracks updated: ${tracksUpdated}`);
    console.log(`   Total questions assigned: ${questionsAssigned}`);
    console.log(`   Questions available: ${allQuestions.length}`);
    console.log(`\n✨ All active batches now have daily challenges configured!\n`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

seedTracksWithQuestions();
