import mongoose from "mongoose";
import dotenv from "dotenv";
import Batch from "../models/Batch.js";
import Track from "../models/Track.js";
import Student from "../models/Student.js";
import Question from "../models/Questions.js";
import College from "../models/College.js";

dotenv.config();

const debugDailyChallenge = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 1. Check Colleges
    const colleges = await College.find().lean();
    console.log("\n=== COLLEGES ===");
    console.log(`Total colleges: ${colleges.length}`);
    colleges.forEach((c) => {
      console.log(`- ${c.name} (${c._id})`);
    });

    // 2. Check Batches
    const batches = await Batch.find().lean();
    console.log("\n=== BATCHES ===");
    console.log(`Total batches: ${batches.length}`);
    batches.forEach((b) => {
      console.log(`- ${b.name} (${b._id})`);
      console.log(`  College: ${b.collegeId}, Status: ${b.status}, Track: ${b.assignedTrack}`);
      console.log(`  Start: ${b.startDate}, Expiry: ${b.expiryDate}`);
    });

    // 3. Check Tracks for each Batch
    const tracks = await Track.find().populate("orderedQuestionIds").lean();
    console.log("\n=== TRACKS ===");
    console.log(`Total tracks: ${tracks.length}`);
    tracks.forEach((t) => {
      console.log(`- Track ${t.trackType} for Batch ${t.batchId}`);
      console.log(`  Questions in track: ${t.orderedQuestionIds?.length || 0}`);
      if (t.orderedQuestionIds && t.orderedQuestionIds.length > 0) {
        t.orderedQuestionIds.forEach((q, idx) => {
          console.log(`    [Day ${idx + 1}] ${q?.title || q} (${q?._id || q})`);
        });
      } else {
        console.log(`  ⚠️  NO QUESTIONS CONFIGURED!`);
      }
    });

    // 4. Check Questions
    const questions = await Question.find().lean();
    console.log("\n=== QUESTIONS ===");
    console.log(`Total questions: ${questions.length}`);
    questions.slice(0, 5).forEach((q) => {
      console.log(`- ${q.title} (${q._id})`);
    });

    // 5. Check Students
    const students = await Student.find().lean();
    console.log("\n=== STUDENTS ===");
    console.log(`Total students: ${students.length}`);
    students.slice(0, 5).forEach((s) => {
      console.log(`- ${s.name} (${s.email})`);
      console.log(`  Batch: ${s.batchId}, College: ${s.collegeId}, Primary Track: ${s.primaryTrack}`);
    });

    // 6. Check if there's a demo batch
    const demoBatch = await Batch.findOne({ name: "Public Demo Batch" }).lean();
    if (demoBatch) {
      console.log("\n=== DEMO BATCH DETAILS ===");
      console.log(`Name: ${demoBatch.name} (${demoBatch._id})`);
      console.log(`Status: ${demoBatch.status}`);
      const demoTracks = await Track.find({ batchId: demoBatch._id }).populate("orderedQuestionIds").lean();
      console.log(`Tracks: ${demoTracks.length}`);
      demoTracks.forEach((t) => {
        console.log(`  - ${t.trackType}: ${t.orderedQuestionIds?.length || 0} questions`);
      });
    }

    await mongoose.disconnect();
    console.log("\n✅ Diagnostic complete");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

debugDailyChallenge();
