import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import StudentCodingSubmission from "../models/StudentCodingSubmission.js";
import StudentMcqSubmission from "../models/StudentMcqSubmission.js";
import Booking from "../models/Booking.js";

dotenv.config();

const testIndexes = async () => {
  try {
    await connectDB();

    console.log("\n--- Syncing Indexes ---");
    // Ensure indexes are built in the DB based on the current schemas
    await StudentCodingSubmission.syncIndexes();
    await StudentMcqSubmission.syncIndexes();
    await Booking.syncIndexes();
    console.log("Indexes synchronized.");

    console.log("\n--- StudentCodingSubmission Indexes ---");
    const codingIndexes = await StudentCodingSubmission.listIndexes();
    console.log(codingIndexes);

    console.log("\n--- StudentMcqSubmission Indexes ---");
    const mcqIndexes = await StudentMcqSubmission.listIndexes();
    console.log(mcqIndexes);

    console.log("\n--- Booking Indexes ---");
    const bookingIndexes = await Booking.listIndexes();
    console.log(bookingIndexes);

    console.log("\n--- Testing Unique Constraint ---");
    // We can simulate an insert to check if the exact combination is blocked.
    // However, simulating requires mocking an ObjectId for codingRoundId and an email.
    const mockCodingRoundId = new mongoose.Types.ObjectId();
    const mockEmail = "test_duplicate@exam.com";

    // 1. Insert a mock submission
    const sub1 = new StudentCodingSubmission({
      codingRoundId: mockCodingRoundId,
      studentEmail: mockEmail,
      totalScore: 50,
      isRoundEnded: true,
      submittedAt: new Date(),
    });

    console.log("Saving first submission...");
    await sub1.save();
    console.log("Successfully saved the first submission.");

    // 2. Attempt to insert a duplicate with the SAME codingRoundId and studentEmail
    const duplicateSub = new StudentCodingSubmission({
      codingRoundId: mockCodingRoundId,
      studentEmail: mockEmail,
      totalScore: 90,
      isRoundEnded: false,
      submittedAt: new Date(),
    });

    try {
      console.log("Attempting to save duplicate submission...");
      await duplicateSub.save();
      console.error("❌ FAILED: Duplicate submission should have been blocked by the unique index!");
    } catch (error) {
      if (error.code === 11000) {
        console.log("✅ SUCCESS: Duplicate submission blocked as expected (E11000 duplicate key error).");
      } else {
        console.error("❌ FAILED: Unexpected error caught:", error);
      }
    }

    // 3. Cleanup test documents
    console.log("Cleaning up test documents...");
    await StudentCodingSubmission.deleteOne({ _id: sub1._id });

  } catch (error) {
    console.error("Fatal Error:", error);
  } finally {
    console.log("\n--- Disconnecting ---");
    await mongoose.connection.close();
  }
};

testIndexes();
